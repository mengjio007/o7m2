package chat

import (
	"context"
	"fmt"
	"strings"
)

type StubEngine struct{}

func NewStubEngine() *StubEngine { return &StubEngine{} }

func (e *StubEngine) Generate(ctx context.Context, prompt string) (string, error) {
	_ = ctx
	// 简单兜底：抽取“用户问题”最后一段，做角色化回复。
	userText := prompt
	if i := strings.LastIndex(prompt, "[用户问题]"); i >= 0 {
		userText = strings.TrimSpace(prompt[i+len("[用户问题]"):])
	}

	if j := strings.LastIndex(userText, "\n\nAssistant:"); j >= 0 {
		userText = strings.TrimSpace(userText[:j])
	}

	if looksOffTopic(userText) {
		return "我先不聊那些啦。我们还是回到我这只“股票”的状态：你更关心我接下来是继续上冲、横盘，还是回踩？", nil
	}

	return fmt.Sprintf("我听到了：%s\n\n从我现在的走势和情绪来看，我更愿意用“节奏”来回答你：别急着一口气冲，先看我能不能站稳关键区间。你想让我用更偏‘短线’还是‘中线’的视角聊？", strings.TrimSpace(userText)), nil
}

func looksOffTopic(s string) bool {
	s = strings.ToLower(strings.TrimSpace(s))
	bad := []string{"天气", "写代码", "做饭", "旅游", "电影", "歌词", "翻译", "数学", "物理", "历史"}
	for _, k := range bad {
		if strings.Contains(s, k) {
			return true
		}
	}
	return false
}
