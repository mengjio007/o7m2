package chat

import (
	"strings"
	"unicode"
	"unicode/utf8"
)

// SanitizeAssistantReply strips common prompt/role echoes from model output so we
// don't persist degenerate "user:/assistant:" transcripts back into history.
func SanitizeAssistantReply(prompt, resp string) string {
	r := strings.TrimSpace(normalizeNewlines(resp))
	if r == "" {
		return ""
	}

	p := strings.TrimSpace(normalizeNewlines(prompt))
	if p != "" && strings.HasPrefix(r, p) {
		r = strings.TrimSpace(r[len(p):])
	}

	r = strings.TrimSpace(trimLeadingAssistantLabel(r))

	if extracted, ok := extractAssistantFromTranscript(r); ok && strings.TrimSpace(extracted) != "" {
		r = strings.TrimSpace(extracted)
	}

	r = strings.TrimSpace(removeKnownPromptLines(r))
	r = strings.TrimSpace(collapseDuplicateLines(r, 2))

	return strings.TrimSpace(r)
}

// IsDegenerateAssistantReply detects outputs that are likely prompt echoes or
// copies of the user input (e.g. repeating short greetings).
func IsDegenerateAssistantReply(userText, reply string) bool {
	userText = strings.TrimSpace(normalizeNewlines(userText))
	reply = strings.TrimSpace(normalizeNewlines(reply))
	if reply == "" {
		return true
	}

	// Echoing prompt section headers is almost always wrong for UI display.
	if containsKnownPromptHeader(reply) {
		return true
	}

	// Repeating the same short pattern is a common generation failure mode.
	if looksLikeLoopingLines(reply) {
		return true
	}

	if userText == "" {
		return false
	}
	if reply == userText {
		return true
	}

	lines := nonEmptyLines(reply)
	if len(lines) >= 2 {
		eq := 0
		for _, ln := range lines {
			if strings.TrimSpace(ln) == userText {
				eq++
			}
		}
		ratio := float64(eq) / float64(len(lines))
		if len(lines) >= 3 && ratio >= 0.60 {
			return true
		}
		// Very short user inputs (e.g. "你好") repeated back is not useful.
		if len([]rune(userText)) <= 6 && ratio >= 0.80 {
			return true
		}
	}

	return false
}

func normalizeNewlines(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	return s
}

func nonEmptyLines(s string) []string {
	raw := strings.Split(normalizeNewlines(s), "\n")
	out := make([]string, 0, len(raw))
	for _, ln := range raw {
		ln = strings.TrimSpace(ln)
		if ln == "" {
			continue
		}
		out = append(out, ln)
	}
	return out
}

func containsKnownPromptHeader(s string) bool {
	low := strings.ToLower(s)
	known := []string{
		"[system]",
		"[角色设定]",
		"[行情快照]",
		"[最近对话]",
		"[用户问题]",
	}
	for _, k := range known {
		if strings.Contains(low, strings.ToLower(k)) {
			return true
		}
	}
	return false
}

func removeKnownPromptLines(s string) string {
	lines := strings.Split(normalizeNewlines(s), "\n")
	if len(lines) == 0 {
		return s
	}
	keep := make([]string, 0, len(lines))
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		if t == "" {
			continue
		}
		switch t {
		case "[SYSTEM]", "[角色设定]", "[行情快照]", "[最近对话]", "[用户问题]":
			continue
		default:
			keep = append(keep, ln)
		}
	}
	return strings.Join(keep, "\n")
}

func collapseDuplicateLines(s string, maxRun int) string {
	if maxRun <= 0 {
		return s
	}
	lines := strings.Split(normalizeNewlines(s), "\n")
	out := make([]string, 0, len(lines))
	prev := ""
	run := 0
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		if t == "" {
			continue
		}
		if t == prev {
			run++
			if run > maxRun {
				continue
			}
		} else {
			prev = t
			run = 1
		}
		out = append(out, t)
	}
	return strings.Join(out, "\n")
}

func looksLikeLoopingLines(s string) bool {
	lines := nonEmptyLines(s)
	if len(lines) < 4 {
		return false
	}

	norm := make([]string, 0, len(lines))
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		t = strings.TrimPrefix(t, ":")
		t = strings.TrimPrefix(t, "：")
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		norm = append(norm, t)
	}
	if len(norm) < 4 {
		return false
	}

	// Exact repeated pattern like A,B,A,B,A,B...
	maxPattern := 3
	if len(norm)/2 < maxPattern {
		maxPattern = len(norm) / 2
	}
	for plen := 1; plen <= maxPattern; plen++ {
		ok := true
		for i := plen; i < len(norm); i++ {
			if norm[i] != norm[i%plen] {
				ok = false
				break
			}
		}
		if ok {
			return true
		}
	}

	// Low diversity (few unique lines) across many lines.
	counts := make(map[string]int, len(norm))
	maxC := 0
	for _, t := range norm {
		counts[t]++
		if counts[t] > maxC {
			maxC = counts[t]
		}
	}
	if len(norm) >= 6 && (len(counts) <= 3 || float64(maxC)/float64(len(norm)) >= 0.60) {
		return true
	}

	return false
}

func trimLeadingAssistantLabel(s string) string {
	s = strings.TrimLeft(s, " \t\n")
	if s == "" {
		return s
	}

	type prefix struct {
		raw string
		len int
	}
	prefixes := []prefix{
		{raw: "assistant", len: len("assistant")},
		{raw: "Assistant", len: len("Assistant")},
		{raw: "助手", len: len("助手")},
	}

	for _, p := range prefixes {
		if !strings.HasPrefix(s, p.raw) {
			continue
		}
		rest := s[p.len:]
		rest = strings.TrimLeft(rest, " \t")
		if strings.HasPrefix(rest, ":") || strings.HasPrefix(rest, "：") {
			rest = rest[1:]
		}
		rest = strings.TrimLeft(rest, " \t")
		if rest != "" {
			return rest
		}
	}
	return s
}

func extractAssistantFromTranscript(s string) (string, bool) {
	lines := strings.Split(normalizeNewlines(s), "\n")
	hasUser := false
	hasAssistant := false
	for _, line := range lines {
		role, _, ok := parseRoleMarker(line)
		if !ok {
			continue
		}
		if role == "user" {
			hasUser = true
		}
		if role == "assistant" {
			hasAssistant = true
		}
	}
	if !hasUser || !hasAssistant {
		return "", false
	}

	var cur strings.Builder
	inAssistant := false
	last := ""

	flush := func() {
		if !inAssistant {
			return
		}
		txt := strings.TrimSpace(cur.String())
		if txt != "" {
			last = txt
		}
		cur.Reset()
	}

	for _, line := range lines {
		role, content, ok := parseRoleMarker(line)
		if ok {
			switch role {
			case "assistant":
				flush()
				inAssistant = true
				if content != "" {
					cur.WriteString(content)
				}
				continue
			case "user", "system":
				flush()
				inAssistant = false
				continue
			}
		}

		if inAssistant {
			if cur.Len() > 0 {
				cur.WriteString("\n")
			}
			cur.WriteString(line)
		}
	}
	flush()

	if strings.TrimSpace(last) == "" {
		return "", false
	}
	return strings.TrimSpace(trimLeadingAssistantLabel(last)), true
}

func parseRoleMarker(line string) (role string, content string, ok bool) {
	s := strings.TrimLeft(line, " \t")
	if s == "" {
		return "", "", false
	}
	low := strings.ToLower(s)

	for _, r := range []string{"assistant", "user", "system"} {
		if !strings.HasPrefix(low, r) {
			continue
		}

		rest := s[len(r):]
		if rest == "" {
			return r, "", true
		}

		rest = strings.TrimLeft(rest, " \t")
		if strings.HasPrefix(rest, ":") || strings.HasPrefix(rest, "：") {
			rest = strings.TrimLeft(rest[1:], " \t")
			return r, rest, true
		}

		// Accept "assistant你好..." (no separator) when it looks like a transcript.
		// Be stricter for user/system to avoid false positives.
		first, _ := utf8.DecodeRuneInString(rest)
		if first == utf8.RuneError || first > unicode.MaxASCII || unicode.IsPunct(first) {
			if r == "assistant" {
				return r, rest, true
			}
		}
		if r == "assistant" {
			return r, rest, true
		}
		return "", "", false
	}
	return "", "", false
}
