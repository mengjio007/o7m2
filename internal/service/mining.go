package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"

	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
)

type MiningService struct {
	accountRepo *mysql.AccountRepository
	difficulty  int
}

func NewMiningService(accountRepo *mysql.AccountRepository) *MiningService {
	return &MiningService{
		accountRepo: accountRepo,
		difficulty:  4, // Base difficulty
	}
}

type MiningSession struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	CharacterID string `json:"character_id"`
	Challenge   string `json:"challenge"`
	Difficulty  int    `json:"difficulty"`
	TargetHash  string `json:"target_hash"`
	ExpiresAt   int64  `json:"expires_at"`
}

type SubmitNonceRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	Nonce     string `json:"nonce" binding:"required"`
	HashRate  int64  `json:"hash_rate"`
}

type MiningResult struct {
	Reward      int64   `json:"reward"`
	BaseReward  int64   `json:"base_reward"`
	BonusRate   float64 `json:"bonus_rate"`
	TotalReward int64   `json:"total_reward"`
}

func (s *MiningService) CreateSession(userID, characterID string) (*MiningSession, error) {
	// Check if user holds this character
	holding, err := s.accountRepo.GetHolding(userID, characterID)
	if err != nil {
		return nil, err
	}
	if holding.Quantity <= 0 {
		return nil, errors.New("you must hold this character to mine")
	}

	// Generate challenge
	challenge := s.generateChallenge()
	targetHash := strings.Repeat("0", s.difficulty)

	session := &MiningSession{
		ID:          uuid.New().String()[:8],
		UserID:      userID,
		CharacterID: characterID,
		Challenge:   challenge,
		Difficulty:  s.difficulty,
		TargetHash:  targetHash,
		ExpiresAt:   time.Now().Add(10 * time.Minute).Unix(),
	}

	// TODO: Store session in Redis with expiration

	return session, nil
}

func (s *MiningService) SubmitNonce(userID string, req *SubmitNonceRequest) (*MiningResult, error) {
	// TODO: Validate session from Redis
	// For now, we'll just validate the hash

	// Calculate hash
	hash := sha256.Sum256([]byte(req.SessionID + req.Nonce))
	hashStr := hex.EncodeToString(hash[:])

	// Check if hash meets difficulty
	targetHash := strings.Repeat("0", 4) // Should come from session
	if !strings.HasPrefix(hashStr, targetHash) {
		return nil, errors.New("invalid nonce")
	}

	// Get user's holding for bonus calculation
	// For demo, we'll use a fixed character ID
	characterID := "char_v001"
	holding, _ := s.accountRepo.GetHolding(userID, characterID)

	// Calculate bonus based on holding
	bonusRate := domain.GetHoldingBonus(holding.Quantity)

	// Calculate rewards
	baseReward := s.calculateBaseReward(4) // difficulty
	bonusReward := int64(float64(baseReward) * bonusRate)
	totalReward := baseReward + bonusReward

	// Add reward to account
	account, err := s.accountRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	newBalance := account.Balance + totalReward
	if err := s.accountRepo.UpdateBalance(userID, newBalance); err != nil {
		return nil, err
	}

	// Create ledger entry
	ledger := &domain.Ledger{
		ID:        uuid.New().String()[:8],
		UserID:    userID,
		Type:      domain.LedgerMiningReward,
		Amount:    totalReward,
		Balance:   newBalance,
		RefID:     characterID,
		Remark:    fmt.Sprintf("应援挖矿奖励 (基础:%d, 加成:%.0f%%)", baseReward, bonusRate*100),
		CreatedAt: time.Now(),
	}
	s.accountRepo.CreateLedger(ledger)

	return &MiningResult{
		Reward:      baseReward,
		BaseReward:  baseReward,
		BonusRate:   bonusRate,
		TotalReward: totalReward,
	}, nil
}

func (s *MiningService) generateChallenge() string {
	rand.Seed(time.Now().UnixNano())
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func (s *MiningService) calculateBaseReward(difficulty int) int64 {
	rewards := map[int]int64{
		4: 50,
		5: 75,
		6: 110,
		7: 160,
		8: 230,
	}
	if reward, ok := rewards[difficulty]; ok {
		return reward
	}
	return 50
}
