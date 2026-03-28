package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type modelInfo struct {
	Siblings []struct {
		RFilename string `json:"rfilename"`
	} `json:"siblings"`
}

func main() {
	var repo string
	var out string
	var revision string
	var includeConfig bool
	var timeoutSec int

	flag.StringVar(&repo, "repo", "luisresende13/llava-interleave-qwen-0.5b-hf", "Hugging Face repo id")
	flag.StringVar(&out, "out", "models/llava-interleave-qwen-0.5b-hf", "Output directory")
	flag.StringVar(&revision, "revision", "main", "Revision/branch/tag (default: main)")
	flag.BoolVar(&includeConfig, "include-config", false, "Also download basic HF config/tokenizer/processor files")
	flag.IntVar(&timeoutSec, "timeout-sec", 600, "HTTP timeout seconds per request")
	flag.Parse()

	token := strings.TrimSpace(os.Getenv("HF_TOKEN"))
	if token == "" {
		token = strings.TrimSpace(os.Getenv("HUGGINGFACE_HUB_TOKEN"))
	}

	if err := os.MkdirAll(out, 0o755); err != nil {
		fatalf("mkdir %s: %v", out, err)
	}

	client := &http.Client{Timeout: time.Duration(timeoutSec) * time.Second}
	files, err := listRepoFiles(client, repo, token)
	if err != nil {
		fatalf("list files: %v", err)
	}

	allowed := make(map[string]bool)
	for _, f := range files {
		if strings.HasPrefix(f, "onnx/") || strings.HasSuffix(strings.ToLower(f), ".onnx") {
			allowed[f] = true
		}
	}
	if includeConfig {
		for _, f := range []string{
			"config.json",
			"generation_config.json",
			"tokenizer.json",
			"tokenizer_config.json",
			"special_tokens_map.json",
			"added_tokens.json",
			"preprocessor_config.json",
			"processor_config.json",
			"chat_template.json",
			"merges.txt",
			"vocab.json",
			"README.md",
			"LICENSE",
			"requirements.txt",
		} {
			allowed[f] = true
		}
	}

	if len(allowed) == 0 {
		fatalf("no files matched (repo has no onnx/*?)")
	}

	var selected []string
	for f := range allowed {
		selected = append(selected, f)
	}
	sortStrings(selected)

	for _, rel := range selected {
		dst := filepath.Join(out, filepath.FromSlash(rel))
		if err := downloadOne(client, repo, revision, rel, dst, token); err != nil {
			fatalf("download %s: %v", rel, err)
		}
	}

	fmt.Printf("Downloaded %s -> %s\n", repo, out)
	fmt.Printf("ONNX folder: %s\n", filepath.Join(out, "onnx"))
}

func listRepoFiles(client *http.Client, repo string, token string) ([]string, error) {
	u := fmt.Sprintf("https://huggingface.co/api/models/%s", repo)
	req, err := http.NewRequest("GET", u, nil)
	if err != nil {
		return nil, err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return nil, fmt.Errorf("status %s: %s", resp.Status, strings.TrimSpace(string(b)))
	}
	var mi modelInfo
	if err := json.NewDecoder(resp.Body).Decode(&mi); err != nil {
		return nil, err
	}
	out := make([]string, 0, len(mi.Siblings))
	for _, s := range mi.Siblings {
		if s.RFilename != "" {
			out = append(out, s.RFilename)
		}
	}
	return out, nil
}

func downloadOne(client *http.Client, repo, revision, rel, dst, token string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}

	url := fmt.Sprintf("https://huggingface.co/%s/resolve/%s/%s", repo, revision, rel)

	// Best-effort skip if size matches.
	if ok, _ := sameSize(client, url, dst, token); ok {
		fmt.Printf("skip %s (already exists)\n", rel)
		return nil
	}

	tmp := dst + ".part"
	_ = os.Remove(tmp)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("status %s: %s", resp.Status, strings.TrimSpace(string(b)))
	}

	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(f, resp.Body)
	closeErr := f.Close()
	if copyErr != nil {
		_ = os.Remove(tmp)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}
	if err := os.Rename(tmp, dst); err != nil {
		_ = os.Remove(tmp)
		return err
	}

	fmt.Printf("done %s\n", rel)
	return nil
}

func sameSize(client *http.Client, url, dst, token string) (bool, error) {
	st, err := os.Stat(dst)
	if err != nil {
		return false, err
	}
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return false, err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return false, fmt.Errorf("head status %s", resp.Status)
	}
	cl := resp.Header.Get("Content-Length")
	if cl == "" {
		return false, nil
	}
	var remote int64
	_, _ = fmt.Sscanf(cl, "%d", &remote)
	if remote <= 0 {
		return false, nil
	}
	return st.Size() == remote, nil
}

func sortStrings(a []string) {
	// Small local sort to avoid pulling extra deps.
	for i := 0; i < len(a); i++ {
		for j := i + 1; j < len(a); j++ {
			if a[j] < a[i] {
				a[i], a[j] = a[j], a[i]
			}
		}
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
