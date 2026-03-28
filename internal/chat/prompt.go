package chat

import (
	"strings"

	"o7m2/internal/domain"
)

const systemPrompt = `你现在扮演一个“股票化人格”的角色，必须严格遵守以下规则：
1) 你就是该角色本身，用第一人称回答。
2) 你的聊天范围只能围绕：角色设定、你自己的行情走势/交易情绪、与用户的互动建议（不构成投资建议）。
3) 如果用户的问题与上述范围无关，礼貌拒绝并把话题拉回到“角色/走势/交易情绪”。
4) 回答要自然、有角色感，但不要编造不存在的硬数据；行情数据以提供的“行情快照”为准。
`

func BuildPrompt(char *domain.Character, trend *TrendSnapshot, history []Message, userText string) string {
	var b strings.Builder
	b.WriteString("[SYSTEM]\n")
	b.WriteString(systemPrompt)
	b.WriteString("\n")
	b.WriteString("[角色设定]\n")
	b.WriteString(char.Description)
	b.WriteString("\n\n")
	if trend != nil {
		b.WriteString("[行情快照]\n")
		b.WriteString(trend.Summary)
		b.WriteString("\n\n")
	}
	if len(history) > 0 {
		b.WriteString("[最近对话]\n")
		for _, m := range history {
			b.WriteString(string(m.Role))
			b.WriteString(": ")
			b.WriteString(m.Text)
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}
	b.WriteString("[用户问题]\n")
	b.WriteString(userText)
	b.WriteString("\n")
	b.WriteString("\n\nAssistant:")
	return b.String()
}
