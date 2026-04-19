#!/usr/bin/env python3
"""
跑 TT-B486 / 证据链前：检查 staging 交付所需 R003_* 是否已脱占位、可连 staging。

数据源：
  默认：--env-file（KEY=VAL）
  --from-os-environ：当前进程的 os.environ 中所有 R003_*（CI Secrets 注入 + load_env 合并后由证据链调用）

exit 0 = 可尝试跑链；exit 2 = 缺参或仍为文档占位 / 误开 LOCAL_CHAIN（staging 交付口径）。
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Mapping


def _load_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        out[key] = val
    return out


def _placeholder_api_base(base: str) -> str | None:
    b = base.lower()
    needles = (
        "your-staging",
        "your_staging",
        "replace-me",
        "replace_me",
        "changeme",
        "api.staging.example",
        "staging-api.example",
    )
    for n in needles:
        if n in b:
            return n
    return None


def verify_staging_delivery_env(env: Mapping[str, str], source_label: str) -> int:
    def get(k: str) -> str:
        return (env.get(k) or "").strip()

    if get("R003_LOCAL_CHAIN").lower() in ("1", "true", "yes", "on"):
        print(
            "ERROR: R003_LOCAL_CHAIN is enabled — not valid for TT-B486 staging delivery "
            "(use evidence/R003_local_evidence_chain for smoke only).",
            file=sys.stderr,
        )
        return 2

    base = get("R003_API_BASE") or get("R003_STAGING_API_BASE")
    if not base:
        print(f"ERROR: missing R003_API_BASE (or R003_STAGING_API_BASE) in {source_label}", file=sys.stderr)
        return 2
    ph = _placeholder_api_base(base)
    if ph:
        print(
            f"ERROR: R003_API_BASE still looks like a placeholder in {source_label} (matched {ph!r}).",
            file=sys.stderr,
        )
        return 2

    pw = get("R003_A_PASSWORD")
    if not pw:
        print(f"ERROR: missing R003_A_PASSWORD in {source_label}", file=sys.stderr)
        return 2

    ex = get("R003_EXECUTOR")
    if not ex or "replace" in ex.lower():
        print(f"ERROR: set R003_EXECUTOR to a real sign-off identity in {source_label}", file=sys.stderr)
        return 2

    out = get("R003_OUT") or "evidence/GO_20260418"
    if "local_evidence" in out.lower() and "go_" not in out.lower():
        print(
            f"WARN: R003_OUT={out!r} looks like local smoke path; TT-B486 expects evidence/GO_20260418 or GO_YYYYMMDD.",
            file=sys.stderr,
        )

    print(f"OK: {source_label} looks ready for staging chain (R003_OUT={out}).")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Pre-flight for R-003 staging evidence chain")
    ap.add_argument(
        "--from-os-environ",
        action="store_true",
        help="Validate R003_* from process environment (use after env file merge / CI Secrets).",
    )
    ap.add_argument(
        "--env-file",
        type=Path,
        default=Path("scripts/dev/.env.r003.local"),
        help="KEY=VAL file (default when not using --from-os-environ)",
    )
    args = ap.parse_args()

    if args.from_os_environ:
        env = {k: v for k, v in os.environ.items() if k.startswith("R003_")}
        return verify_staging_delivery_env(env, "process environment (R003_*)")

    path = args.env_file.resolve()
    return verify_staging_delivery_env(_load_env_file(path), str(path))


if __name__ == "__main__":
    raise SystemExit(main())
