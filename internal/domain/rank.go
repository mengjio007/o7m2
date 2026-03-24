package domain

type Rank string

const (
	RankLa   Rank = "拉"   // < rank_la
	RankNPC  Rank = "NPC" // rank_la ~ rank_npc
	RankRen  Rank = "人上人" // rank_npc ~ rank_ren
	RankDing Rank = "顶级"  // rank_ren ~ rank_ding
	RankHang Rank = "夯"   // > rank_ding
)

type RankConfig struct {
	La   int64 `json:"la"`   // 拉最大值
	NPC  int64 `json:"npc"`  // NPC最大值
	Ren  int64 `json:"ren"`  // 人上人最大值
	Ding int64 `json:"ding"` // 顶级最大值
}

type RankInfo struct {
	Rank  Rank   `json:"rank"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

func GetRank(value int64, config *RankConfig) RankInfo {
	if config == nil {
		config = &RankConfig{
			La:   1000,
			NPC:  5000,
			Ren:  15000,
			Ding: 50000,
		}
	}

	switch {
	case value < config.La:
		return RankInfo{Rank: RankLa, Label: "拉", Icon: "💀", Color: "text-gray-400"}
	case value < config.NPC:
		return RankInfo{Rank: RankNPC, Label: "NPC", Icon: "😐", Color: "text-blue-400"}
	case value < config.Ren:
		return RankInfo{Rank: RankRen, Label: "人上人", Icon: "😎", Color: "text-green-400"}
	case value < config.Ding:
		return RankInfo{Rank: RankDing, Label: "顶级", Icon: "🔥", Color: "text-orange-400"}
	default:
		return RankInfo{Rank: RankHang, Label: "夯", Icon: "💎", Color: "text-purple-400"}
	}
}
