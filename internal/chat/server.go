package chat

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"

	"o7m2/internal/repository/mysql"
	"o7m2/internal/service"
)

type ServerDeps struct {
	Auth    *service.AuthService
	Redis   *redis.Client
	Chars   *mysql.CharacterRepository
	Orders  *mysql.OrderRepository
	Clock   Clock
	Options Options
}

type Server struct {
	auth   *service.AuthService
	store  *SessionStore
	lease  *LeaseManager
	queue  *AdmissionQueue
	trends *TrendBuilder
	infer  *InferPool
	chars  *mysql.CharacterRepository
	clock  Clock
	opt    Options

	upgrader websocket.Upgrader
}

func NewServer(deps ServerDeps) (*Server, error) {
	engine, err := NewEngineFromOptions(deps.Options)
	if err != nil {
		return nil, err
	}

	s := &Server{
		auth:   deps.Auth,
		store:  NewSessionStore(deps.Redis),
		lease:  NewLeaseManager(deps.Redis, deps.Options.MaxSessions, deps.Options.LeaseTTL),
		clock:  deps.Clock,
		opt:    deps.Options,
		chars:  deps.Chars,
		trends: NewTrendBuilder(deps.Redis, deps.Chars, deps.Orders, deps.Clock, deps.Options.TrendCacheTTL),
		infer:  NewInferPool(engine, deps.Options.MaxInferConcurrency, deps.Options.InferTimeout),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  4096,
			WriteBufferSize: 4096,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
	}
	// AdmissionQueue 会在循环里调用 LeaseManager.Acquire。
	s.queue = NewAdmissionQueue(s.lease, deps.Clock, deps.Options.QueueRetryInterval, deps.Options.MaxWait)
	return s, nil
}

type wsInit struct {
	Type        string `json:"type"`
	Token       string `json:"token"`
	CharacterID string `json:"character_id"`
	SessionID   string `json:"session_id"`
}

type wsUserMessage struct {
	Type        string `json:"type"`
	Text        string `json:"text"`
	ClientMsgID string `json:"client_msg_id"`
}

type wsEnvelope struct {
	Type string `json:"type"`
}

func (s *Server) HandleWebSocket(c *gin.Context) {
	conn, err := s.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 10 秒内必须 init
	_ = conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, initBytes, err := conn.ReadMessage()
	if err != nil {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_INIT", "message": "init required"})
		return
	}
	var init wsInit
	if err := json.Unmarshal(initBytes, &init); err != nil || init.Type != "init" {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_INIT", "message": "init required"})
		return
	}
	if init.CharacterID == "" {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "CHAR_NOT_FOUND", "message": "character_id required"})
		return
	}

	userID, err := s.authUserID(init.Token)
	if err != nil {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "AUTH", "message": "unauthorized"})
		return
	}

	char, err := s.chars.FindByID(init.CharacterID)
	if err != nil || char == nil {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "CHAR_NOT_FOUND", "message": "character not found"})
		return
	}

	sessionID := init.SessionID
	if sessionID == "" {
		sessionID = DefaultSessionID(userID, init.CharacterID)
	}

	sess, err := s.store.Get(ctx, sessionID)
	if err != nil {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "INTERNAL", "message": "session load failed"})
		return
	}
	if sess != nil {
		if sess.UserID != userID || sess.CharacterID != init.CharacterID {
			_ = conn.WriteJSON(gin.H{"type": "error", "code": "AUTH", "message": "session mismatch"})
			return
		}
	} else {
		now := s.clock.Now()
		sess = &Session{ID: sessionID, UserID: userID, CharacterID: init.CharacterID, CreatedAt: now, LastActive: now}
		_ = s.store.Put(ctx, sess, s.opt.SessionTTL)
	}

	// admission
	if ok, err := s.lease.Acquire(ctx, sessionID, s.clock.Now()); err != nil {
		_ = conn.WriteJSON(gin.H{"type": "error", "code": "INTERNAL", "message": "admission failed"})
		return
	} else if !ok {
		pos, resCh := s.queue.Enqueue(sessionID)
		_ = conn.WriteJSON(gin.H{"type": "queued", "position": pos, "retry_in_ms": s.opt.QueueRetryInterval.Milliseconds(), "max_wait_ms": s.opt.MaxWait.Milliseconds()})
		granted, ok := <-resCh
		if !ok || !granted {
			s.queue.Remove(sessionID)
			_ = conn.WriteJSON(gin.H{"type": "error", "code": "BUSY", "message": "queue timeout"})
			return
		}
	}
	defer func() { _ = s.lease.Release(context.Background(), sessionID) }()

	trend, _ := s.trends.GetTrend(ctx, init.CharacterID)
	_ = conn.WriteJSON(gin.H{
		"type":       "ready",
		"session_id": sessionID,
		"character":  char,
		"limits": gin.H{
			"idle_timeout_sec":  s.opt.IdleTimeout.Seconds(),
			"max_history_turns": s.opt.MaxHistoryTurns,
		},
		"trend": trend,
	})

	_ = conn.SetReadDeadline(time.Time{})

	idleTimer := time.NewTimer(s.opt.IdleTimeout)
	defer idleTimer.Stop()

	keepaliveStop := make(chan struct{})
	go s.keepaliveLoop(sessionID, keepaliveStop)
	defer close(keepaliveStop)

	for {
		select {
		case <-idleTimer.C:
			_ = conn.WriteJSON(gin.H{"type": "close_soon", "reason": "idle_timeout"})
			_ = conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "idle"))
			return
		default:
		}

		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		idleTimer.Reset(s.opt.IdleTimeout)

		var env wsEnvelope
		if err := json.Unmarshal(data, &env); err != nil {
			_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_MESSAGE", "message": "invalid json"})
			continue
		}

		sess.LastActive = s.clock.Now()

		switch env.Type {
		case "ping":
			_ = conn.WriteJSON(gin.H{"type": "pong"})
			_ = s.store.Put(ctx, sess, s.opt.SessionTTL)
			continue
		case "user_message":
			var msg wsUserMessage
			if err := json.Unmarshal(data, &msg); err != nil {
				_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_MESSAGE", "message": "invalid user_message"})
				continue
			}

			text := strings.TrimSpace(msg.Text)
			if text == "" {
				_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_MESSAGE", "message": "text required"})
				continue
			}
			if s.opt.MaxMessageChars > 0 && len([]rune(text)) > s.opt.MaxMessageChars {
				_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_MESSAGE", "message": "text too long"})
				continue
			}

			now := s.clock.Now()
			sess = appendUser(sess, text, now)
			sess = trimHistory(sess, s.opt.MaxHistoryTurns)

			trend, _ := s.trends.GetTrend(ctx, init.CharacterID)
			prompt := BuildPrompt(char, trend, sess.History, text)

			resp, err := s.infer.Generate(ctx, prompt)
			if err != nil {
				if errors.Is(err, ErrInferBusy) {
					_ = conn.WriteJSON(gin.H{"type": "error", "code": "BUSY", "message": "inference busy"})
					continue
				}
				_ = conn.WriteJSON(gin.H{"type": "error", "code": "INTERNAL", "message": "inference failed"})
				continue
			}

			_ = conn.WriteJSON(gin.H{"type": "assistant_delta", "text": resp})
			_ = conn.WriteJSON(gin.H{"type": "assistant_done"})

			sess = appendAssistant(sess, resp, s.clock.Now())
			sess = trimHistory(sess, s.opt.MaxHistoryTurns)
			_ = s.store.Put(ctx, sess, s.opt.SessionTTL)
			continue
		default:
			_ = conn.WriteJSON(gin.H{"type": "error", "code": "BAD_MESSAGE", "message": "unknown type"})
			continue
		}
	}
}

func (s *Server) keepaliveLoop(sessionID string, stop <-chan struct{}) {
	interval := s.opt.LeaseTTL / 3
	if interval < time.Second {
		interval = time.Second
	}
	t := time.NewTicker(interval)
	defer t.Stop()

	for {
		select {
		case <-t.C:
			_ = s.lease.Refresh(context.Background(), sessionID, s.clock.Now())
		case <-stop:
			return
		}
	}
}

func (s *Server) HandleHTTPChat(c *gin.Context) {
	var req struct {
		Token       string `json:"token"`
		CharacterID string `json:"character_id"`
		SessionID   string `json:"session_id"`
		Text        string `json:"text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}
	userID, err := s.authUserID(req.Token)
	if err != nil {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}
	if req.CharacterID == "" {
		c.JSON(400, gin.H{"error": "invalid_request", "message": "character_id required"})
		return
	}

	char, err := s.chars.FindByID(req.CharacterID)
	if err != nil || char == nil {
		c.JSON(404, gin.H{"error": "not_found", "message": "character not found"})
		return
	}

	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = DefaultSessionID(userID, req.CharacterID)
	}

	ctx := c.Request.Context()
	if ok, err := s.lease.Acquire(ctx, sessionID, s.clock.Now()); err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": "admission failed"})
		return
	} else if !ok {
		c.JSON(429, gin.H{"error": "busy", "message": "server busy"})
		return
	}
	defer func() { _ = s.lease.Release(context.Background(), sessionID) }()

	sess, _ := s.store.Get(ctx, sessionID)
	if sess == nil {
		now := s.clock.Now()
		sess = &Session{ID: sessionID, UserID: userID, CharacterID: req.CharacterID, CreatedAt: now, LastActive: now}
	}

	text := strings.TrimSpace(req.Text)
	if text == "" {
		c.JSON(400, gin.H{"error": "invalid_request", "message": "text required"})
		return
	}
	if s.opt.MaxMessageChars > 0 && len([]rune(text)) > s.opt.MaxMessageChars {
		c.JSON(400, gin.H{"error": "invalid_request", "message": "text too long"})
		return
	}

	sess = appendUser(sess, text, s.clock.Now())
	sess = trimHistory(sess, s.opt.MaxHistoryTurns)

	trend, _ := s.trends.GetTrend(ctx, req.CharacterID)
	prompt := BuildPrompt(char, trend, sess.History, text)

	resp, err := s.infer.Generate(ctx, prompt)
	if err != nil {
		if errors.Is(err, ErrInferBusy) {
			c.JSON(429, gin.H{"error": "busy", "message": "inference busy"})
			return
		}
		c.JSON(500, gin.H{"error": "internal_error", "message": "inference failed"})
		return
	}

	sess = appendAssistant(sess, resp, s.clock.Now())
	_ = s.store.Put(ctx, sess, s.opt.SessionTTL)

	c.JSON(200, gin.H{"session_id": sessionID, "reply": resp, "trend": trend})
}

func (s *Server) authUserID(token string) (string, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return "", errors.New("missing token")
	}
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimSpace(strings.TrimPrefix(token, "Bearer "))
	}
	user, err := s.auth.ValidateToken(token)
	if err != nil || user == nil {
		return "", errors.New("unauthorized")
	}
	return user.ID, nil
}

func appendUser(sess *Session, text string, now time.Time) *Session {
	sess.History = append(sess.History, Message{Role: RoleUser, Text: text, Timestamp: now})
	sess.LastActive = now
	return sess
}

func appendAssistant(sess *Session, text string, now time.Time) *Session {
	sess.History = append(sess.History, Message{Role: RoleAssistant, Text: text, Timestamp: now})
	sess.LastActive = now
	return sess
}

func trimHistory(sess *Session, maxTurns int) *Session {
	if maxTurns <= 0 {
		return sess
	}
	maxMsgs := maxTurns * 2
	if len(sess.History) <= maxMsgs {
		return sess
	}
	sess.History = sess.History[len(sess.History)-maxMsgs:]
	return sess
}
