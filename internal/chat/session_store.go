package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionStore struct {
	rdb       *redis.Client
	keyPrefix string
}

func NewSessionStore(rdb *redis.Client) *SessionStore {
	return &SessionStore{rdb: rdb, keyPrefix: "chat:session:"}
}

func (s *SessionStore) Get(ctx context.Context, sessionID string) (*Session, error) {
	b, err := s.rdb.Get(ctx, s.keyPrefix+sessionID).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var sess Session
	if err := json.Unmarshal(b, &sess); err != nil {
		return nil, fmt.Errorf("unmarshal session: %w", err)
	}
	return &sess, nil
}

func (s *SessionStore) Put(ctx context.Context, sess *Session, ttl time.Duration) error {
	b, err := json.Marshal(sess)
	if err != nil {
		return err
	}
	return s.rdb.Set(ctx, s.keyPrefix+sess.ID, b, ttl).Err()
}
