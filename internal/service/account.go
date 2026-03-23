package service

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
)

type AccountService struct {
	accountRepo *mysql.AccountRepository
}

func NewAccountService(accountRepo *mysql.AccountRepository) *AccountService {
	return &AccountService{accountRepo: accountRepo}
}

func (s *AccountService) GetAccount(userID string) (*domain.Account, error) {
	return s.accountRepo.FindByUserID(userID)
}

func (s *AccountService) GetHoldings(userID string) ([]*domain.Holding, error) {
	return s.accountRepo.GetHoldings(userID)
}

func (s *AccountService) GetHolding(userID, characterID string) (*domain.Holding, error) {
	return s.accountRepo.GetHolding(userID, characterID)
}

func (s *AccountService) DailyLogin(userID string) (int64, error) {
	// Get account
	account, err := s.accountRepo.FindByUserID(userID)
	if err != nil {
		return 0, err
	}
	if account == nil {
		return 0, errors.New("account not found")
	}

	// Check if already claimed today
	// TODO: Implement daily login check with Redis or database

	// Add reward
	reward := int64(100)
	newBalance := account.Balance + reward

	if err := s.accountRepo.UpdateBalance(userID, newBalance); err != nil {
		return 0, err
	}

	// Create ledger entry
	ledger := &domain.Ledger{
		ID:        uuid.New().String()[:8],
		UserID:    userID,
		Type:      domain.LedgerLoginReward,
		Amount:    reward,
		Balance:   newBalance,
		Remark:    "每日签到奖励",
		CreatedAt: time.Now(),
	}
	if err := s.accountRepo.CreateLedger(ledger); err != nil {
		return 0, err
	}

	return reward, nil
}

func (s *AccountService) AddMiningReward(userID, characterID string, reward int64) error {
	// Get account
	account, err := s.accountRepo.FindByUserID(userID)
	if err != nil {
		return err
	}
	if account == nil {
		return errors.New("account not found")
	}

	// Update balance
	newBalance := account.Balance + reward
	if err := s.accountRepo.UpdateBalance(userID, newBalance); err != nil {
		return err
	}

	// Create ledger entry
	ledger := &domain.Ledger{
		ID:        uuid.New().String()[:8],
		UserID:    userID,
		Type:      domain.LedgerMiningReward,
		Amount:    reward,
		Balance:   newBalance,
		RefID:     characterID,
		Remark:    "应援挖矿奖励",
		CreatedAt: time.Now(),
	}
	return s.accountRepo.CreateLedger(ledger)
}
