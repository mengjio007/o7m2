package engine

import (
	"context"
	"sync"

	"o7m2/internal/domain"
)

type TickerEvent struct {
	CharacterID string  `json:"character_id"`
	LastPrice   int64   `json:"last_price"`
	OpenPrice   int64   `json:"open_price"`
	HighPrice   int64   `json:"high_price"`
	LowPrice    int64   `json:"low_price"`
	Volume      int64   `json:"volume"`
	ChangeRate  float64 `json:"change_rate"`
	Timestamp   int64   `json:"timestamp"`
}

type Engine struct {
	books      map[string]*OrderBook
	matchChans map[string]chan *domain.Order
	tickerChan chan TickerEvent
	tradeChan  chan *domain.Trade
	mu         sync.RWMutex
	ctx        context.Context
	cancel     context.CancelFunc
}

func NewEngine() *Engine {
	ctx, cancel := context.WithCancel(context.Background())
	return &Engine{
		books:      make(map[string]*OrderBook),
		matchChans: make(map[string]chan *domain.Order),
		tickerChan: make(chan TickerEvent, 10000),
		tradeChan:  make(chan *domain.Trade, 10000),
		ctx:        ctx,
		cancel:     cancel,
	}
}

func (e *Engine) AddCharacter(characterID string) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if _, exists := e.books[characterID]; exists {
		return
	}

	book := NewOrderBook(characterID)
	e.books[characterID] = book

	ch := make(chan *domain.Order, 1000)
	e.matchChans[characterID] = ch

	go e.runMatcher(characterID, book, ch)
}

func (e *Engine) SubmitOrder(order *domain.Order) error {
	e.mu.RLock()
	ch, exists := e.matchChans[order.CharacterID]
	e.mu.RUnlock()

	if !exists {
		return ErrCharacterNotFound
	}

	ch <- order
	return nil
}

func (e *Engine) CancelOrder(characterID, orderID string) error {
	e.mu.RLock()
	book, exists := e.books[characterID]
	e.mu.RUnlock()

	if !exists {
		return ErrCharacterNotFound
	}

	book.mu.Lock()
	defer book.mu.Unlock()

	for i, order := range book.Bids.orders {
		if order.ID == orderID {
			order.Status = domain.OrderStatusCancelled
			book.Bids.orders = append(book.Bids.orders[:i], book.Bids.orders[i+1:]...)
			return nil
		}
	}

	for i, order := range book.Asks.orders {
		if order.ID == orderID {
			order.Status = domain.OrderStatusCancelled
			book.Asks.orders = append(book.Asks.orders[:i], book.Asks.orders[i+1:]...)
			return nil
		}
	}

	return ErrOrderNotFound
}

func (e *Engine) GetOrderBook(characterID string, depth int) ([]PriceLevel, []PriceLevel, error) {
	e.mu.RLock()
	book, exists := e.books[characterID]
	e.mu.RUnlock()

	if !exists {
		return nil, nil, ErrCharacterNotFound
	}

	bids, asks := book.GetOrderBook(depth)
	return bids, asks, nil
}

func (e *Engine) SubscribeTicker() <-chan TickerEvent {
	return e.tickerChan
}

func (e *Engine) SubscribeTrades() <-chan *domain.Trade {
	return e.tradeChan
}

func (e *Engine) Stop() {
	e.cancel()
}

func (e *Engine) runMatcher(characterID string, book *OrderBook, ch <-chan *domain.Order) {
	for {
		select {
		case <-e.ctx.Done():
			return
		case order := <-ch:
			trades := book.Match(order)

			for _, trade := range trades {
				e.tradeChan <- trade

				e.tickerChan <- TickerEvent{
					CharacterID: characterID,
					LastPrice:   trade.Price,
					Volume:      trade.Quantity,
				}
			}
		}
	}
}

var (
	ErrCharacterNotFound = &EngineError{"character not found"}
	ErrOrderNotFound     = &EngineError{"order not found"}
)

type EngineError struct {
	msg string
}

func (e *EngineError) Error() string {
	return e.msg
}
