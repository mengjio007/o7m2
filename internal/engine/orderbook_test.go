package engine

import (
	"testing"

	"o7m2/internal/domain"
)

func TestOrderBook_MatchBuy_FIFOAndLevels(t *testing.T) {
	t.Parallel()

	ob := NewOrderBook("char001")

	ask1 := &domain.Order{ID: "s1", UserID: "u2", CharacterID: "char001", Side: domain.OrderSideSell, Type: domain.OrderTypeLimit, Price: 100, Quantity: 5, Status: domain.OrderStatusPending}
	ask2 := &domain.Order{ID: "s2", UserID: "u3", CharacterID: "char001", Side: domain.OrderSideSell, Type: domain.OrderTypeLimit, Price: 101, Quantity: 3, Status: domain.OrderStatusPending}
	ask3 := &domain.Order{ID: "s3", UserID: "u4", CharacterID: "char001", Side: domain.OrderSideSell, Type: domain.OrderTypeLimit, Price: 100, Quantity: 2, Status: domain.OrderStatusPending}

	ob.AddOrder(ask1)
	ob.AddOrder(ask2)
	ob.AddOrder(ask3)

	buy := &domain.Order{ID: "b1", UserID: "u1", CharacterID: "char001", Side: domain.OrderSideBuy, Type: domain.OrderTypeLimit, Price: 100, Quantity: 6, Status: domain.OrderStatusPending}
	trades := ob.Match(buy)

	if len(trades) != 2 {
		t.Fatalf("trades: got=%d want=2", len(trades))
	}
	if trades[0].SellOrderID != "s1" || trades[0].Price != 100 || trades[0].Quantity != 5 {
		t.Fatalf("trade0 mismatch: %+v", trades[0])
	}
	if trades[1].SellOrderID != "s3" || trades[1].Price != 100 || trades[1].Quantity != 1 {
		t.Fatalf("trade1 mismatch: %+v", trades[1])
	}

	if ask1.Status != domain.OrderStatusFilled || ask1.Quantity != 0 {
		t.Fatalf("ask1: status=%s qty=%d", ask1.Status, ask1.Quantity)
	}
	if ask3.Status != domain.OrderStatusPartial || ask3.Quantity != 1 {
		t.Fatalf("ask3: status=%s qty=%d", ask3.Status, ask3.Quantity)
	}
	if buy.Status != domain.OrderStatusFilled || buy.Quantity != 0 {
		t.Fatalf("buy: status=%s qty=%d", buy.Status, buy.Quantity)
	}

	bids, asks := ob.GetOrderBook(10)
	if len(bids) != 0 {
		t.Fatalf("bids: got=%d want=0", len(bids))
	}
	if len(asks) != 2 {
		t.Fatalf("asks: got=%d want=2", len(asks))
	}
	if asks[0].Price != 100 || asks[0].Quantity != 1 {
		t.Fatalf("asks[0]: price=%d qty=%d", asks[0].Price, asks[0].Quantity)
	}
	if asks[1].Price != 101 || asks[1].Quantity != 3 {
		t.Fatalf("asks[1]: price=%d qty=%d", asks[1].Price, asks[1].Quantity)
	}
}

func TestOrderBook_CancelOrder_RemovesLevelWhenEmpty(t *testing.T) {
	t.Parallel()

	ob := NewOrderBook("char001")
	ask := &domain.Order{ID: "s1", UserID: "u2", CharacterID: "char001", Side: domain.OrderSideSell, Type: domain.OrderTypeLimit, Price: 100, Quantity: 2, Status: domain.OrderStatusPending}
	ob.AddOrder(ask)

	if err := ob.CancelOrder("s1"); err != nil {
		t.Fatalf("cancel: %v", err)
	}
	if ask.Status != domain.OrderStatusCancelled {
		t.Fatalf("status: got=%s want=%s", ask.Status, domain.OrderStatusCancelled)
	}

	_, asks := ob.GetOrderBook(10)
	if len(asks) != 0 {
		t.Fatalf("asks: got=%d want=0", len(asks))
	}
}

