package engine

import (
	"container/heap"
	"sync"

	"o7m2/internal/domain"
)

type PriceLevel struct {
	Price    int64
	Quantity int64
	Orders   []*domain.Order
}

type OrderHeap struct {
	orders []*domain.Order
	isBuy  bool
}

func (h OrderHeap) Len() int { return len(h.orders) }

func (h OrderHeap) Less(i, j int) bool {
	if h.isBuy {
		return h.orders[i].Price > h.orders[j].Price
	}
	return h.orders[i].Price < h.orders[j].Price
}

func (h OrderHeap) Swap(i, j int) {
	h.orders[i], h.orders[j] = h.orders[j], h.orders[i]
}

func (h *OrderHeap) Push(x interface{}) {
	h.orders = append(h.orders, x.(*domain.Order))
}

func (h *OrderHeap) Pop() interface{} {
	old := h.orders
	n := len(old)
	item := old[n-1]
	h.orders = old[0 : n-1]
	return item
}

type OrderBook struct {
	CharacterID string
	Bids        *OrderHeap
	Asks        *OrderHeap
	mu          sync.RWMutex
	matchChan   chan *domain.Order
	tradeChan   chan *domain.Trade
}

func NewOrderBook(characterID string) *OrderBook {
	bids := &OrderHeap{isBuy: true}
	asks := &OrderHeap{isBuy: false}
	heap.Init(bids)
	heap.Init(asks)

	return &OrderBook{
		CharacterID: characterID,
		Bids:        bids,
		Asks:        asks,
		matchChan:   make(chan *domain.Order, 1000),
		tradeChan:   make(chan *domain.Trade, 1000),
	}
}

func (ob *OrderBook) AddOrder(order *domain.Order) {
	ob.mu.Lock()
	defer ob.mu.Unlock()

	if order.Side == domain.OrderSideBuy {
		heap.Push(ob.Bids, order)
	} else {
		heap.Push(ob.Asks, order)
	}
}

func (ob *OrderBook) Match(taker *domain.Order) []*domain.Trade {
	ob.mu.Lock()
	defer ob.mu.Unlock()

	var trades []*domain.Trade

	if taker.Side == domain.OrderSideBuy {
		trades = ob.matchBuy(taker)
	} else {
		trades = ob.matchSell(taker)
	}

	return trades
}

func (ob *OrderBook) matchBuy(taker *domain.Order) []*domain.Trade {
	var trades []*domain.Trade

	for taker.Quantity > 0 && ob.Asks.Len() > 0 {
		maker := ob.Asks.orders[0]

		if maker.Price > taker.Price && taker.Type == domain.OrderTypeLimit {
			break
		}

		tradeQty := min(taker.Quantity, maker.Quantity)
		tradePrice := maker.Price

		trade := &domain.Trade{
			CharacterID: ob.CharacterID,
			BuyOrderID:  taker.ID,
			SellOrderID: maker.ID,
			BuyUserID:   taker.UserID,
			SellUserID:  maker.UserID,
			Price:       tradePrice,
			Quantity:    tradeQty,
		}
		trades = append(trades, trade)

		taker.Quantity -= tradeQty
		taker.FilledQty += tradeQty
		maker.Quantity -= tradeQty
		maker.FilledQty += tradeQty

		if maker.Quantity == 0 {
			maker.Status = domain.OrderStatusFilled
			heap.Pop(ob.Asks)
		} else {
			maker.Status = domain.OrderStatusPartial
		}
	}

	if taker.Quantity == 0 {
		taker.Status = domain.OrderStatusFilled
	} else if taker.FilledQty > 0 {
		taker.Status = domain.OrderStatusPartial
	}

	if taker.Quantity > 0 && taker.Type == domain.OrderTypeLimit {
		heap.Push(ob.Bids, taker)
	}

	return trades
}

func (ob *OrderBook) matchSell(taker *domain.Order) []*domain.Trade {
	var trades []*domain.Trade

	for taker.Quantity > 0 && ob.Bids.Len() > 0 {
		maker := ob.Bids.orders[0]

		if maker.Price < taker.Price && taker.Type == domain.OrderTypeLimit {
			break
		}

		tradeQty := min(taker.Quantity, maker.Quantity)
		tradePrice := maker.Price

		trade := &domain.Trade{
			CharacterID: ob.CharacterID,
			BuyOrderID:  maker.ID,
			SellOrderID: taker.ID,
			BuyUserID:   maker.UserID,
			SellUserID:  taker.UserID,
			Price:       tradePrice,
			Quantity:    tradeQty,
		}
		trades = append(trades, trade)

		taker.Quantity -= tradeQty
		taker.FilledQty += tradeQty
		maker.Quantity -= tradeQty
		maker.FilledQty += tradeQty

		if maker.Quantity == 0 {
			maker.Status = domain.OrderStatusFilled
			heap.Pop(ob.Bids)
		} else {
			maker.Status = domain.OrderStatusPartial
		}
	}

	if taker.Quantity == 0 {
		taker.Status = domain.OrderStatusFilled
	} else if taker.FilledQty > 0 {
		taker.Status = domain.OrderStatusPartial
	}

	if taker.Quantity > 0 && taker.Type == domain.OrderTypeLimit {
		heap.Push(ob.Asks, taker)
	}

	return trades
}

func (ob *OrderBook) GetOrderBook(depth int) (bids, asks []PriceLevel) {
	ob.mu.RLock()
	defer ob.mu.RUnlock()

	bids = ob.getPriceLevels(ob.Bids, depth)
	asks = ob.getPriceLevels(ob.Asks, depth)
	return
}

func (ob *OrderBook) getPriceLevels(orders *OrderHeap, depth int) []PriceLevel {
	levels := make([]PriceLevel, 0)
	priceMap := make(map[int64]*PriceLevel)

	for _, order := range orders.orders {
		if level, ok := priceMap[order.Price]; ok {
			level.Quantity += order.Quantity
		} else {
			priceMap[order.Price] = &PriceLevel{
				Price:    order.Price,
				Quantity: order.Quantity,
			}
		}
	}

	for _, level := range priceMap {
		levels = append(levels, *level)
	}

	if len(levels) > depth {
		levels = levels[:depth]
	}

	return levels
}

func min(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}
