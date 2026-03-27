package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
)

type TrendSnapshot struct {
	CharacterID  string  `json:"character_id"`
	AsOf         int64   `json:"as_of"`
	LastPrice    int64   `json:"last_price"`
	Change1hPct  float64 `json:"change_1h_pct"`
	Change24hPct float64 `json:"change_24h_pct"`
	High1h       int64   `json:"high_1h"`
	Low1h        int64   `json:"low_1h"`
	Vol1h        int64   `json:"vol_1h"`
	MA5          float64 `json:"ma5"`
	MA20         float64 `json:"ma20"`
	TrendLabel   string  `json:"trend"`
	Summary      string  `json:"summary"`
}

type TrendBuilder struct {
	rdb      *redis.Client
	chars    *mysql.CharacterRepository
	orders   *mysql.OrderRepository
	clock    Clock
	cacheTTL time.Duration
}

func NewTrendBuilder(rdb *redis.Client, chars *mysql.CharacterRepository, orders *mysql.OrderRepository, clock Clock, cacheTTL time.Duration) *TrendBuilder {
	return &TrendBuilder{rdb: rdb, chars: chars, orders: orders, clock: clock, cacheTTL: cacheTTL}
}

func (b *TrendBuilder) GetTrend(ctx context.Context, characterID string) (*TrendSnapshot, error) {
	cacheKey := "chat:trend:" + characterID
	if bs, err := b.rdb.Get(ctx, cacheKey).Bytes(); err == nil {
		var snap TrendSnapshot
		if json.Unmarshal(bs, &snap) == nil {
			return &snap, nil
		}
	}

	char, err := b.chars.FindByID(characterID)
	if err != nil {
		return nil, err
	}
	if char == nil {
		return nil, fmt.Errorf("character not found")
	}

	now := b.clock.Now()

	k1h, _ := b.findKLinesBestEffort(ctx, characterID, 60)
	k24h, _ := b.findKLinesBestEffort(ctx, characterID, 240)

	lastPrice := char.InitialPrice
	if len(k1h) > 0 {
		lastPrice = k1h[0].ClosePrice
	}

	change1h := pctChange(openPrice(k1h, lastPrice), lastPrice)
	change24h := pctChange(openPrice(k24h, lastPrice), lastPrice)

	high1h, low1h, vol1h := hiLoVol(k1h, lastPrice)

	closes := closeSeries(k24h)
	ma5 := movingAverage(closes, 5)
	ma20 := movingAverage(closes, 20)

	trendLabel := labelTrend(change1h, change24h)

	summary := buildSummary(char, now, lastPrice, change1h, change24h, high1h, low1h, vol1h, ma5, ma20, trendLabel)

	snap := &TrendSnapshot{
		CharacterID:  characterID,
		AsOf:         now.Unix(),
		LastPrice:    lastPrice,
		Change1hPct:  change1h,
		Change24hPct: change24h,
		High1h:       high1h,
		Low1h:        low1h,
		Vol1h:        vol1h,
		MA5:          ma5,
		MA20:         ma20,
		TrendLabel:   trendLabel,
		Summary:      summary,
	}

	if bs, err := json.Marshal(snap); err == nil {
		_ = b.rdb.Set(ctx, cacheKey, bs, b.cacheTTL).Err()
	}

	return snap, nil
}

func (b *TrendBuilder) findKLinesBestEffort(ctx context.Context, characterID string, target int) ([]domain.KLine, error) {
	periods := []struct {
		period string
		limit  int
	}{
		{"1m", target},
		{"5m", int(math.Ceil(float64(target) / 5.0))},
		{"1h", int(math.Ceil(float64(target) / 60.0))},
	}

	for _, p := range periods {
		if p.limit <= 0 {
			continue
		}
		kl, err := b.orders.FindKLines(characterID, p.period, p.limit)
		if err != nil {
			continue
		}
		if len(kl) > 0 {
			sort.Slice(kl, func(i, j int) bool { return kl[i].OpenTime.After(kl[j].OpenTime) })
			return kl, nil
		}
	}
	return nil, nil
}

func openPrice(kl []domain.KLine, fallback int64) int64 {
	if len(kl) == 0 {
		return fallback
	}
	oldest := kl[len(kl)-1]
	if oldest.OpenPrice > 0 {
		return oldest.OpenPrice
	}
	return fallback
}

func hiLoVol(kl []domain.KLine, fallback int64) (high int64, low int64, vol int64) {
	if len(kl) == 0 {
		return fallback, fallback, 0
	}
	high = kl[0].HighPrice
	low = kl[0].LowPrice
	for _, k := range kl {
		if k.HighPrice > high {
			high = k.HighPrice
		}
		if k.LowPrice > 0 && k.LowPrice < low {
			low = k.LowPrice
		}
		vol += k.Volume
	}
	if low == 0 {
		low = fallback
	}
	return high, low, vol
}

func closeSeries(kl []domain.KLine) []float64 {
	if len(kl) == 0 {
		return nil
	}
	s := make([]float64, 0, len(kl))
	for i := len(kl) - 1; i >= 0; i-- {
		s = append(s, float64(kl[i].ClosePrice))
	}
	return s
}

func movingAverage(series []float64, n int) float64 {
	if len(series) == 0 || n <= 0 {
		return 0
	}
	if len(series) < n {
		n = len(series)
	}
	sum := 0.0
	for i := len(series) - n; i < len(series); i++ {
		sum += series[i]
	}
	return sum / float64(n)
}

func pctChange(open, last int64) float64 {
	if open <= 0 {
		return 0
	}
	return (float64(last-open) / float64(open)) * 100.0
}

func labelTrend(change1h, change24h float64) string {
	if change1h > 1.0 && change24h > 1.0 {
		return "上行"
	}
	if change1h < -1.0 && change24h < -1.0 {
		return "下行"
	}
	return "震荡"
}

func buildSummary(char *domain.Character, now time.Time, last int64, c1h, c24h float64, high1h, low1h, vol1h int64, ma5, ma20 float64, trend string) string {
	lines := []string{
		fmt.Sprintf("角色: %s (%s)", char.Name, char.Category),
		fmt.Sprintf("时间: %s", now.Format("2006-01-02 15:04:05")),
		fmt.Sprintf("最新价: %d", last),
		fmt.Sprintf("1h涨跌: %.2f%%  24h涨跌: %.2f%%", c1h, c24h),
		fmt.Sprintf("1h高/低: %d / %d  1h量: %d", high1h, low1h, vol1h),
		fmt.Sprintf("MA5: %.2f  MA20: %.2f", ma5, ma20),
		fmt.Sprintf("趋势: %s", trend),
	}
	return strings.Join(lines, "\n")
}
