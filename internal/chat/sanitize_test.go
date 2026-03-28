package chat

import "testing"

func TestSanitizeAssistantReply_StripsPromptPrefix(t *testing.T) {
	prompt := "[SYSTEM]\nfoo\n[USER]\nbar"
	resp := prompt + "\n\nAssistant: hello"
	got := SanitizeAssistantReply(prompt, resp)
	if got != "hello" {
		t.Fatalf("got %q", got)
	}
}

func TestSanitizeAssistantReply_StripsAssistantLabel(t *testing.T) {
	got := SanitizeAssistantReply("p", "Assistant: hi")
	if got != "hi" {
		t.Fatalf("got %q", got)
	}
}

func TestSanitizeAssistantReply_ExtractsLastAssistantBlock(t *testing.T) {
	resp := "user:\nhello\nassistant你好，有什么可以和我分享的吗？\nuser:\n再问一次\nassistant: 最后答案\nuser:\nok"
	got := SanitizeAssistantReply("p", resp)
	if got != "最后答案" {
		t.Fatalf("got %q", got)
	}
}

func TestSanitizeAssistantReply_LeavesNormalText(t *testing.T) {
	got := SanitizeAssistantReply("p", "正常回复")
	if got != "正常回复" {
		t.Fatalf("got %q", got)
	}
}

func TestIsDegenerateAssistantReply_RepeatedShortUserText(t *testing.T) {
	if !IsDegenerateAssistantReply("你好", "你好\n你好") {
		t.Fatalf("expected degenerate")
	}
}

func TestIsDegenerateAssistantReply_LoopingTwoLinePattern(t *testing.T) {
	reply := ": 我觉得股票市场是一个充满机会的市场。\n: 你有什么看法？\n: 我觉得股票市场是一个充满机会的市场。\n: 你有什么看法？\n: 我觉得股票市场是一个充满机会的市场。"
	if !IsDegenerateAssistantReply("你说说你的看法", reply) {
		t.Fatalf("expected degenerate")
	}
}
