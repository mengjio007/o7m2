package engine

import (
	"math/rand"
	"sort"
	"testing"
)

func TestRBTree_InsertAndTraverseSorted(t *testing.T) {
	t.Parallel()

	tree := newRBTree()

	keys := make([]int64, 0, 200)
	seen := make(map[int64]struct{})
	r := rand.New(rand.NewSource(42))
	for len(keys) < 200 {
		k := int64(r.Intn(5000))
		if _, ok := seen[k]; ok {
			continue
		}
		seen[k] = struct{}{}
		keys = append(keys, k)
		tree.getOrInsert(k, func() *priceLevel { return &priceLevel{price: k} })
	}

	sorted := append([]int64(nil), keys...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })

	got := make([]int64, 0, len(sorted))
	for n := tree.min(); n != nil; n = tree.successor(n) {
		got = append(got, n.key)
	}

	if len(got) != len(sorted) {
		t.Fatalf("len mismatch: got=%d want=%d", len(got), len(sorted))
	}
	for i := range got {
		if got[i] != sorted[i] {
			t.Fatalf("at %d: got=%d want=%d", i, got[i], sorted[i])
		}
	}
}

func TestRBTree_DeleteKeys(t *testing.T) {
	t.Parallel()

	tree := newRBTree()
	for _, k := range []int64{5, 3, 7, 2, 4, 6, 8} {
		tree.getOrInsert(k, func() *priceLevel { return &priceLevel{price: k} })
	}

	if min := tree.min(); min == nil || min.key != 2 {
		t.Fatalf("min: got=%v want=2", min)
	}
	if max := tree.max(); max == nil || max.key != 8 {
		t.Fatalf("max: got=%v want=8", max)
	}

	for _, k := range []int64{2, 5, 8, 6, 3, 4, 7} {
		if !tree.deleteKey(k) {
			t.Fatalf("expected deleteKey(%d) true", k)
		}
	}

	if !tree.isEmpty() {
		t.Fatalf("expected empty tree")
	}
	if tree.min() != nil || tree.max() != nil {
		t.Fatalf("expected nil min/max on empty tree")
	}
}

