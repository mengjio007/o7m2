package chat

import (
	"os"
	"strconv"
	"time"
)

type Options struct {
	MaxSessions         int64
	LeaseTTL            time.Duration
	MaxWait             time.Duration
	QueueRetryInterval  time.Duration
	IdleTimeout         time.Duration
	SessionTTL          time.Duration
	TrendCacheTTL       time.Duration
	MaxHistoryTurns     int
	MaxMessageChars     int
	MaxInferConcurrency int
	InferTimeout        time.Duration

	ModelPath             string
	OnnxSharedLibraryPath string
	OnnxPromptInput       string
	OnnxResponseOutput    string

	// ONNX tokenizer/model wiring.
	// - "auto": if ModelPath is a directory containing HF-style exports, use GPT2 BPE.
	// - "byte": use the simple byte-token engine (prompt->tokens).
	// - "gpt2": force GPT2 BPE (vocab.json + merges.txt).
	OnnxTokenizer        string
	OnnxVocabJSONPath    string
	OnnxMergesPath       string
	OnnxEmbedModelPath   string
	OnnxDecoderModelPath string

	OnnxMaxInputTokens    int
	OnnxMaxOutputTokens   int
	OnnxEosTokenID        int64
	OnnxPadTokenID        int64
	OnnxTokenOffset       int64
	OnnxReturnFullOutput  bool
	OnnxOutputLogitsVocab int
	OnnxLogitsAreFloat32  bool
}

func LoadOptionsFromEnv() Options {
	maxSessions := envInt64("CHAT_MAX_SESSIONS", 200)
	leaseTTL := envDurationSeconds("CHAT_LEASE_TTL_SEC", 45)
	maxWait := envDurationMillis("CHAT_MAX_WAIT_MS", 120_000)
	queueRetry := envDurationMillis("CHAT_QUEUE_RETRY_MS", 1_000)
	idleTimeout := envDurationSeconds("CHAT_IDLE_TIMEOUT_SEC", 15*60)
	sessionTTL := envDurationSeconds("CHAT_SESSION_TTL_SEC", 2*60*60)
	trendTTL := envDurationMillis("CHAT_TREND_CACHE_TTL_MS", 20_000)

	maxTurns := int(envInt64("CHAT_MAX_HISTORY_TURNS", 20))
	maxMsgChars := int(envInt64("CHAT_MAX_MESSAGE_CHARS", 2000))
	maxInferConc := int(envInt64("CHAT_MAX_INFER_CONCURRENCY", 4))
	inferTimeout := envDurationMillis("CHAT_INFER_TIMEOUT_MS", 120_000)

	return Options{
		MaxSessions:         maxSessions,
		LeaseTTL:            leaseTTL,
		MaxWait:             maxWait,
		QueueRetryInterval:  queueRetry,
		IdleTimeout:         idleTimeout,
		SessionTTL:          sessionTTL,
		TrendCacheTTL:       trendTTL,
		MaxHistoryTurns:     maxTurns,
		MaxMessageChars:     maxMsgChars,
		MaxInferConcurrency: maxInferConc,
		InferTimeout:        inferTimeout,

		ModelPath:             os.Getenv("CHAT_MODEL_PATH"),
		OnnxSharedLibraryPath: os.Getenv("CHAT_ONNXRUNTIME_SHARED_LIBRARY_PATH"),
		OnnxPromptInput:       envString("CHAT_ONNX_PROMPT_INPUT", "prompt"),
		OnnxResponseOutput:    envString("CHAT_ONNX_RESPONSE_OUTPUT", "response"),

		OnnxTokenizer:        envString("CHAT_ONNX_TOKENIZER", "auto"),
		OnnxVocabJSONPath:    os.Getenv("CHAT_ONNX_VOCAB_JSON"),
		OnnxMergesPath:       os.Getenv("CHAT_ONNX_MERGES_TXT"),
		OnnxEmbedModelPath:   os.Getenv("CHAT_ONNX_EMBED_MODEL_PATH"),
		OnnxDecoderModelPath: os.Getenv("CHAT_ONNX_DECODER_MODEL_PATH"),

		OnnxMaxInputTokens:   int(envInt64("CHAT_ONNX_MAX_INPUT_TOKENS", 1024)),
		OnnxMaxOutputTokens:  int(envInt64("CHAT_ONNX_MAX_OUTPUT_TOKENS", 128)),
		OnnxEosTokenID:       envInt64("CHAT_ONNX_EOS_TOKEN_ID", 0),
		OnnxPadTokenID:       envInt64("CHAT_ONNX_PAD_TOKEN_ID", 0),
		OnnxTokenOffset:      envInt64("CHAT_ONNX_TOKEN_OFFSET", 1),
		OnnxReturnFullOutput: envBool("CHAT_ONNX_RETURN_FULL_OUTPUT", false),

		OnnxOutputLogitsVocab: int(envInt64("CHAT_ONNX_OUTPUT_LOGITS_VOCAB", 0)),
		OnnxLogitsAreFloat32:  envBool("CHAT_ONNX_LOGITS_FLOAT32", true),
	}
}

func envString(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}

func envBool(key string, def bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	switch v {
	case "1", "true", "TRUE", "True", "yes", "YES", "on", "ON":
		return true
	case "0", "false", "FALSE", "False", "no", "NO", "off", "OFF":
		return false
	default:
		return def
	}
}

func envInt64(key string, def int64) int64 {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return def
	}
	return n
}

func envDurationSeconds(key string, defSeconds int64) time.Duration {
	return time.Duration(envInt64(key, defSeconds)) * time.Second
}

func envDurationMillis(key string, defMillis int64) time.Duration {
	return time.Duration(envInt64(key, defMillis)) * time.Millisecond
}
