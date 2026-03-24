package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
)

type TradingService struct {
	orderRepo   *mysql.OrderRepository
	accountRepo *mysql.AccountRepository
	charRepo    *mysql.CharacterRepository
}

func NewTradingService(orderRepo *mysql.OrderRepository, accountRepo *mysql.AccountRepository, charRepo *mysql.CharacterRepository) *TradingService {
	return &TradingService{
		orderRepo:   orderRepo,
		accountRepo: accountRepo,
		charRepo:    charRepo,
	}
}

type CreateOrderRequest struct {
	ClientOrderID string `json:"client_order_id"`
	CharacterID   string `json:"character_id" binding:"required"`
	Side          string `json:"side" binding:"required,oneof=buy sell"`
	Type          string `json:"type" binding:"required,oneof=limit market"`
	Price         int64  `json:"price" binding:"required,min=1"`
	Quantity      int64  `json:"quantity" binding:"required,min=1"`
}

func (s *TradingService) CreateOrder(userID string, req *CreateOrderRequest) (*domain.Order, error) {
	char, err := s.charRepo.FindByID(req.CharacterID)
	if err != nil {
		return nil, err
	}
	if char == nil {
		return nil, errors.New("character not found")
	}

	account, err := s.accountRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	orderType := domain.OrderTypeLimit
	if req.Type == "market" {
		orderType = domain.OrderTypeMarket
	}

	order := &domain.Order{
		ID:            uuid.New().String()[:8],
		ClientOrderID: req.ClientOrderID,
		UserID:        userID,
		CharacterID:   req.CharacterID,
		Side:          domain.OrderSide(req.Side),
		Type:          orderType,
		Price:         req.Price,
		Quantity:      req.Quantity,
		FilledQty:     0,
		Status:        domain.OrderStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if req.Side == "buy" {
		totalCost := req.Price * req.Quantity
		if account.Balance < totalCost {
			return nil, errors.New("insufficient balance")
		}
		if err := s.accountRepo.UpdateBalance(userID, account.Balance-totalCost); err != nil {
			return nil, err
		}
	} else {
		holding, err := s.accountRepo.GetHolding(userID, req.CharacterID)
		if err != nil || holding.Quantity < req.Quantity {
			return nil, errors.New("insufficient holdings")
		}
	}

	if err := s.orderRepo.Create(order); err != nil {
		return nil, err
	}

	if err := s.matchOrders(req.CharacterID); err != nil {
		return nil, err
	}

	return order, nil
}

func (s *TradingService) CancelOrder(userID, orderID string) error {
	order, err := s.orderRepo.FindByID(orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}
	if order.UserID != userID {
		return errors.New("unauthorized")
	}
	if order.Status != domain.OrderStatusPending && order.Status != domain.OrderStatusPartial {
		return errors.New("order cannot be cancelled")
	}

	account, err := s.accountRepo.FindByUserID(userID)
	if err != nil {
		return err
	}

	if order.Side == domain.OrderSideBuy {
		refund := (order.Quantity - order.FilledQty) * order.Price
		s.accountRepo.UpdateBalance(userID, account.Balance+refund)
	}

	return s.orderRepo.UpdateStatus(orderID, domain.OrderStatusCancelled, order.FilledQty)
}

func (s *TradingService) GetUserOrders(userID string) ([]domain.Order, error) {
	return s.orderRepo.FindByUserID(userID)
}

func (s *TradingService) GetUserPositions(userID string) ([]*domain.Holding, error) {
	return s.accountRepo.GetHoldings(userID)
}

func (s *TradingService) GetOrderBook(characterID string) ([]domain.Order, error) {
	return s.orderRepo.FindPendingByCharacter(characterID)
}

func (s *TradingService) GetTradesByCharacter(characterID string, limit int) ([]domain.Trade, error) {
	return s.orderRepo.FindTradesByCharacter(characterID, limit)
}

func (s *TradingService) GetKLines(characterID, period string, limit int) ([]domain.KLine, error) {
	return s.orderRepo.FindKLines(characterID, period, limit)
}

func (s *TradingService) matchOrders(characterID string) error {
	orders, err := s.orderRepo.FindPendingByCharacter(characterID)
	if err != nil {
		return err
	}

	var buyOrders, sellOrders []domain.Order
	for _, o := range orders {
		if o.Side == domain.OrderSideBuy {
			buyOrders = append(buyOrders, o)
		} else {
			sellOrders = append(sellOrders, o)
		}
	}

	for _, buy := range buyOrders {
		for _, sell := range sellOrders {
			if sell.Price <= buy.Price {
				matchQty := min(buy.Quantity-buy.FilledQty, sell.Quantity-sell.FilledQty)
				if matchQty <= 0 {
					continue
				}

				tradePrice := sell.Price
				tradeTax := int64(float64(tradePrice*matchQty) * 0.001)

				sellAccount, _ := s.accountRepo.FindByUserID(sell.UserID)

				s.accountRepo.AddHolding(buy.UserID, characterID, matchQty, tradePrice)
				s.accountRepo.UpdateBalance(sell.UserID, sellAccount.Balance+tradePrice*matchQty-tradeTax)

				newFilledBuy := buy.FilledQty + matchQty
				newFilledSell := sell.FilledQty + matchQty

				if newFilledBuy >= buy.Quantity {
					s.orderRepo.UpdateStatus(buy.ID, domain.OrderStatusFilled, newFilledBuy)
				} else {
					s.orderRepo.UpdateStatus(buy.ID, domain.OrderStatusPartial, newFilledBuy)
				}

				if newFilledSell >= sell.Quantity {
					s.orderRepo.UpdateStatus(sell.ID, domain.OrderStatusFilled, newFilledSell)
				} else {
					s.orderRepo.UpdateStatus(sell.ID, domain.OrderStatusPartial, newFilledSell)
				}

				fmt.Printf("Trade: %s @ %d x %d\n", characterID, tradePrice, matchQty)
			}
		}
	}

	return nil
}
