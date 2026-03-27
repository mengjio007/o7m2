import argparse
import os
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download ONNX exports from a Hugging Face repo (onnx/ folder)."
    )
    parser.add_argument(
        "--repo",
        default="luisresende13/llava-interleave-qwen-0.5b-hf",
        help="Hugging Face repo id (default: %(default)s)",
    )
    parser.add_argument(
        "--out",
        default="models/llava-interleave-qwen-0.5b-hf",
        help="Output directory (default: %(default)s)",
    )
    parser.add_argument(
        "--revision",
        default=None,
        help="Optional git revision/branch/tag (default: main)",
    )
    parser.add_argument(
        "--include-config",
        action="store_true",
        help="Also download basic HF config/tokenizer/processor files.",
    )
    args = parser.parse_args()

    try:
        from huggingface_hub import snapshot_download
    except Exception as e:  # pragma: no cover
        raise SystemExit(
            "Missing dependency huggingface_hub. Install with: pip install huggingface_hub"
        ) from e

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    allow_patterns = ["onnx/*"]
    if args.include_config:
        allow_patterns += [
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
        ]

    # Respect the standard HF token env var if present.
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")

    snapshot_download(
        repo_id=args.repo,
        revision=args.revision,
        local_dir=str(out_dir),
        local_dir_use_symlinks=False,
        allow_patterns=allow_patterns,
        token=token,
    )

    print(f"Downloaded {args.repo} -> {out_dir}")
    print(f"ONNX folder: {out_dir / 'onnx'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

