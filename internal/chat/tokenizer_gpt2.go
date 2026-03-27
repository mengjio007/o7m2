package chat

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync"
)

// Minimal GPT-2 style byte-level BPE tokenizer, compatible with vocab.json + merges.txt.
// This is sufficient to run many HF "GPT2/BPE" tokenizers without pulling in rust tokenizers.

type GPT2Tokenizer struct {
	encoder map[string]int64
	decoder map[int64]string
	bpe     *bpeEncoder
	re      *regexp.Regexp
}

func NewGPT2TokenizerFromFiles(vocabJSONPath, mergesPath string) (*GPT2Tokenizer, error) {
	vocabBytes, err := os.ReadFile(vocabJSONPath)
	if err != nil {
		return nil, fmt.Errorf("read vocab.json: %w", err)
	}
	enc := map[string]int64{}
	if err := json.Unmarshal(vocabBytes, &enc); err != nil {
		return nil, fmt.Errorf("parse vocab.json: %w", err)
	}
	dec := make(map[int64]string, len(enc))
	for k, v := range enc {
		dec[v] = k
	}

	merges, err := readMerges(mergesPath)
	if err != nil {
		return nil, err
	}

	// GPT-2 token regex (Go-compatible, no lookahead)
	re := regexp.MustCompile(`'s|'t|'re|'ve|'m|'ll|'d| ?\pL+| ?\pN+| ?[^\s\pL\pN]+|\s+`)

	return &GPT2Tokenizer{
		encoder: enc,
		decoder: dec,
		bpe:     newBPEEncoder(merges),
		re:      re,
	}, nil
}

func (t *GPT2Tokenizer) Encode(text string) ([]int64, error) {
	var ids []int64
	matches := t.re.FindAllString(text, -1)
	for _, m := range matches {
		encoded := bytesToUnicodeEncode([]byte(m))
		pieces := t.bpe.Encode(encoded)
		for _, p := range pieces {
			id, ok := t.encoder[p]
			if !ok {
				continue
			}
			ids = append(ids, id)
		}
	}
	return ids, nil
}

func (t *GPT2Tokenizer) Decode(ids []int64) (string, error) {
	var b strings.Builder
	for _, id := range ids {
		s, ok := t.decoder[id]
		if !ok {
			continue
		}
		b.WriteString(s)
	}
	out := unicodeToBytesDecode(b.String())
	return string(out), nil
}

func readMerges(path string) ([][2]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read merges.txt: %w", err)
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	var merges [][2]string
	first := true
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			continue
		}
		if first {
			first = false
			if strings.HasPrefix(line, "#") {
				continue
			}
		}
		parts := strings.Split(line, " ")
		if len(parts) != 2 {
			continue
		}
		merges = append(merges, [2]string{parts[0], parts[1]})
	}
	if err := sc.Err(); err != nil {
		return nil, fmt.Errorf("scan merges.txt: %w", err)
	}
	return merges, nil
}

type bpeEncoder struct {
	ranks map[bpePair]int
	cache sync.Map // map[string][]string
}

type bpePair struct {
	a string
	b string
}

func newBPEEncoder(merges [][2]string) *bpeEncoder {
	ranks := make(map[bpePair]int, len(merges))
	for i, m := range merges {
		ranks[bpePair{a: m[0], b: m[1]}] = i
	}
	return &bpeEncoder{ranks: ranks}
}

func (b *bpeEncoder) Encode(token string) []string {
	if v, ok := b.cache.Load(token); ok {
		return v.([]string)
	}
	word := splitRunes(token)
	if len(word) == 1 {
		b.cache.Store(token, word)
		return word
	}

	maxInt := int(^uint(0) >> 1)
	for {
		pairs := getPairs(word)
		if len(pairs) == 0 {
			break
		}

		best := bpePair{}
		bestRank := maxInt
		for p := range pairs {
			if r, ok := b.ranks[p]; ok && r < bestRank {
				bestRank = r
				best = p
			}
		}
		if bestRank == maxInt {
			break
		}

		word = mergePair(word, best)
		if len(word) == 1 {
			break
		}
	}

	b.cache.Store(token, word)
	return word
}

func splitRunes(s string) []string {
	out := make([]string, 0, len(s))
	for _, r := range s {
		out = append(out, string(r))
	}
	return out
}

func getPairs(word []string) map[bpePair]struct{} {
	if len(word) < 2 {
		return nil
	}
	out := make(map[bpePair]struct{}, len(word)-1)
	for i := 0; i < len(word)-1; i++ {
		out[bpePair{a: word[i], b: word[i+1]}] = struct{}{}
	}
	return out
}

func mergePair(word []string, p bpePair) []string {
	out := make([]string, 0, len(word))
	for i := 0; i < len(word); {
		if i < len(word)-1 && word[i] == p.a && word[i+1] == p.b {
			out = append(out, p.a+p.b)
			i += 2
			continue
		}
		out = append(out, word[i])
		i++
	}
	return out
}

// --- GPT-2 byte/unicode tricks ---

var (
	byteToRune map[byte]rune
	runeToByte map[rune]byte
)

func init() {
	byteToRune = make(map[byte]rune, 256)
	runeToByte = make(map[rune]byte, 256)
	// From OpenAI GPT-2 encoder: bytes 33-126,161-172,174-255 plus rest mapped to 256+.
	var bs []int
	for i := 33; i <= 126; i++ {
		bs = append(bs, i)
	}
	for i := 161; i <= 172; i++ {
		bs = append(bs, i)
	}
	for i := 174; i <= 255; i++ {
		bs = append(bs, i)
	}
	cs := make([]int, len(bs))
	copy(cs, bs)

	n := 0
	for b := 0; b < 256; b++ {
		found := false
		for _, x := range bs {
			if x == b {
				found = true
				break
			}
		}
		if !found {
			bs = append(bs, b)
			cs = append(cs, 256+n)
			n++
		}
	}

	for i := range bs {
		bt := byte(bs[i])
		r := rune(cs[i])
		byteToRune[bt] = r
		runeToByte[r] = bt
	}
}

func bytesToUnicodeEncode(b []byte) string {
	var sb strings.Builder
	sb.Grow(len(b))
	for _, x := range b {
		sb.WriteRune(byteToRune[x])
	}
	return sb.String()
}

func unicodeToBytesDecode(s string) []byte {
	out := make([]byte, 0, len(s))
	for _, r := range s {
		if b, ok := runeToByte[r]; ok {
			out = append(out, b)
		}
	}
	return out
}
