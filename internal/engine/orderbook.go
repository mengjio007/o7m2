package engine

import (
	"sync"

	"o7m2/internal/domain"
)

type PriceLevel struct {
	Price    int64
	Quantity int64
	Orders   []*domain.Order
}

type orderNode struct {
	order *domain.Order
	prev  *orderNode
	next  *orderNode
}

type priceLevel struct {
	price    int64
	totalQty int64
	head     *orderNode
	tail     *orderNode
}

type OrderBook struct {
	CharacterID string
	bids        *rbTree // key: price, max is best bid
	asks        *rbTree // key: price, min is best ask
	index       map[string]*orderIndex
	mu          sync.RWMutex
}

type orderIndex struct {
	side  domain.OrderSide
	level *priceLevel
	node  *orderNode
}

func NewOrderBook(characterID string) *OrderBook {
	return &OrderBook{
		CharacterID: characterID,
		bids:        newRBTree(),
		asks:        newRBTree(),
		index:       make(map[string]*orderIndex, 4096),
	}
}

func (ob *OrderBook) AddOrder(order *domain.Order) {
	ob.mu.Lock()
	defer ob.mu.Unlock()

	ob.addRestingOrderLocked(order)
}

func (ob *OrderBook) CancelOrder(orderID string) error {
	ob.mu.Lock()
	defer ob.mu.Unlock()

	idx, ok := ob.index[orderID]
	if !ok {
		return ErrOrderNotFound
	}

	order := idx.node.order
	order.Status = domain.OrderStatusCancelled

	idx.level.totalQty -= order.Quantity
	ob.removeOrderNodeLocked(idx.level, idx.node)
	delete(ob.index, orderID)

	if idx.level.head == nil {
		if idx.side == domain.OrderSideBuy {
			ob.bids.deleteKey(idx.level.price)
		} else {
			ob.asks.deleteKey(idx.level.price)
		}
	}

	return nil
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

	for taker.Quantity > 0 {
		bestAsk := ob.asks.min()
		if bestAsk == nil {
			break
		}
		if taker.Type == domain.OrderTypeLimit && bestAsk.key > taker.Price {
			break
		}

		level := bestAsk.value
		makerNode := level.head
		if makerNode == nil {
			ob.asks.deleteNode(bestAsk)
			continue
		}
		maker := makerNode.order

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
		level.totalQty -= tradeQty

		if maker.Quantity == 0 {
			maker.Status = domain.OrderStatusFilled
			ob.removeOrderNodeLocked(level, makerNode)
			delete(ob.index, maker.ID)
			if level.head == nil {
				ob.asks.deleteNode(bestAsk)
			}
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
		ob.addRestingOrderLocked(taker)
	}

	return trades
}

func (ob *OrderBook) matchSell(taker *domain.Order) []*domain.Trade {
	var trades []*domain.Trade

	for taker.Quantity > 0 {
		bestBid := ob.bids.max()
		if bestBid == nil {
			break
		}
		if taker.Type == domain.OrderTypeLimit && bestBid.key < taker.Price {
			break
		}

		level := bestBid.value
		makerNode := level.head
		if makerNode == nil {
			ob.bids.deleteNode(bestBid)
			continue
		}
		maker := makerNode.order

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
		level.totalQty -= tradeQty

		if maker.Quantity == 0 {
			maker.Status = domain.OrderStatusFilled
			ob.removeOrderNodeLocked(level, makerNode)
			delete(ob.index, maker.ID)
			if level.head == nil {
				ob.bids.deleteNode(bestBid)
			}
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
		ob.addRestingOrderLocked(taker)
	}

	return trades
}

func (ob *OrderBook) GetOrderBook(depth int) (bids, asks []PriceLevel) {
	ob.mu.RLock()
	defer ob.mu.RUnlock()

	if depth <= 0 {
		return nil, nil
	}

	bids = ob.getBidLevelsLocked(depth)
	asks = ob.getAskLevelsLocked(depth)
	return
}

func (ob *OrderBook) getBidLevelsLocked(depth int) []PriceLevel {
	levels := make([]PriceLevel, 0, depth)
	for n, i := ob.bids.max(), 0; n != nil && i < depth; n, i = ob.bids.predecessor(n), i+1 {
		lv := n.value
		levels = append(levels, PriceLevel{
			Price:    lv.price,
			Quantity: lv.totalQty,
			Orders:   lv.ordersSnapshot(),
		})
	}
	return levels
}

func (ob *OrderBook) getAskLevelsLocked(depth int) []PriceLevel {
	levels := make([]PriceLevel, 0, depth)
	for n, i := ob.asks.min(), 0; n != nil && i < depth; n, i = ob.asks.successor(n), i+1 {
		lv := n.value
		levels = append(levels, PriceLevel{
			Price:    lv.price,
			Quantity: lv.totalQty,
			Orders:   lv.ordersSnapshot(),
		})
	}
	return levels
}

func (ob *OrderBook) addRestingOrderLocked(order *domain.Order) {
	var tree *rbTree
	if order.Side == domain.OrderSideBuy {
		tree = ob.bids
	} else {
		tree = ob.asks
	}

	n := tree.getOrInsert(order.Price, func() *priceLevel {
		return &priceLevel{price: order.Price}
	})
	lv := n.value

	node := &orderNode{order: order}
	if lv.tail == nil {
		lv.head = node
		lv.tail = node
	} else {
		node.prev = lv.tail
		lv.tail.next = node
		lv.tail = node
	}
	lv.totalQty += order.Quantity

	ob.index[order.ID] = &orderIndex{
		side:  order.Side,
		level: lv,
		node:  node,
	}
}

func (ob *OrderBook) removeOrderNodeLocked(lv *priceLevel, node *orderNode) {
	if node.prev != nil {
		node.prev.next = node.next
	} else {
		lv.head = node.next
	}
	if node.next != nil {
		node.next.prev = node.prev
	} else {
		lv.tail = node.prev
	}
	node.prev = nil
	node.next = nil
}

func (lv *priceLevel) ordersSnapshot() []*domain.Order {
	orders := make([]*domain.Order, 0)
	for n := lv.head; n != nil; n = n.next {
		orders = append(orders, n.order)
	}
	return orders
}

func min(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}
