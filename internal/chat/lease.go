package chat

import (
	"context"
	_ "embed"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

//go:embed scripts/lease_acquire.lua
var leaseAcquireLua string

//go:embed scripts/lease_refresh.lua
var leaseRefreshLua string

//go:embed scripts/lease_release.lua
var leaseReleaseLua string

type LeaseManager struct {
	rdb         *redis.Client
	key         string
	maxSessions int64
	leaseTTL    time.Duration

	acquireScript *redis.Script
	refreshScript *redis.Script
	releaseScript *redis.Script
}

func NewLeaseManager(rdb *redis.Client, maxSessions int64, leaseTTL time.Duration) *LeaseManager {
	return &LeaseManager{
		rdb:           rdb,
		key:           "chat:leases",
		maxSessions:   maxSessions,
		leaseTTL:      leaseTTL,
		acquireScript: redis.NewScript(leaseAcquireLua),
		refreshScript: redis.NewScript(leaseRefreshLua),
		releaseScript: redis.NewScript(leaseReleaseLua),
	}
}

func (m *LeaseManager) Acquire(ctx context.Context, sessionID string, now time.Time) (bool, error) {
	nowMs := now.UnixMilli()
	expireMs := now.Add(m.leaseTTL).UnixMilli()
	res, err := m.acquireScript.Run(ctx, m.rdb, []string{m.key}, nowMs, m.maxSessions, expireMs, sessionID).Int()
	if err != nil {
		return false, err
	}
	return res == 1, nil
}

func (m *LeaseManager) Refresh(ctx context.Context, sessionID string, now time.Time) error {
	nowMs := now.UnixMilli()
	expireMs := now.Add(m.leaseTTL).UnixMilli()
	res, err := m.refreshScript.Run(ctx, m.rdb, []string{m.key}, nowMs, expireMs, sessionID).Int()
	if err != nil {
		return err
	}
	if res != 1 {
		return fmt.Errorf("lease not held")
	}
	return nil
}

func (m *LeaseManager) Release(ctx context.Context, sessionID string) error {
	_, err := m.releaseScript.Run(ctx, m.rdb, []string{m.key}, sessionID).Int()
	return err
}
