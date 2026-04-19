#!/usr/bin/env python3
# B-358: scripts-side touchpoints for GET /health (and future /ready) without reading spec/04/110 or crates.
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ANCHOR = "HEALTH-HTTP-PROBE-SCRIPTS-TOUCHPOINTS-V1"
IMPLEMENTATION_TT = "TT-B358-HEALTH-READY-SLO-AND-PROBE-CONTRACT-001"
MOTHER_TABLE = "B-358"

# Baseline scripts that must keep a /health probe reference (ops + gates + dev smoke).
_REQUIRED_FILES_WITH_HEALTH = frozenset(
    {
        "scripts/gates/smoke-api-public-routes.sh",
        "scripts/gates/smoke-api-public-routes.ps1",
        "scripts/dev/check-55-quick-verify.sh",
        "scripts/dev/check-55-quick-verify.ps1",
        "scripts/dev/start_dev.sh",
        "scripts/ops/indexer-public-snapshot.sh",
    }
)

_SCRIPT_SUFFIXES = frozenset({".sh", ".ps1", ".bat"})


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _scripts_touching_health(repo: Path) -> list[str]:
    out: list[str] = []
    root = repo / "scripts"
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in _SCRIPT_SUFFIXES:
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if "/health" in raw:
            out.append(path.relative_to(repo).as_posix())
    return out


def build_digest(repo: Path) -> dict[str, Any]:
    hits = _scripts_touching_health(repo)
    ready_hits = []
    root = repo / "scripts"
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in _SCRIPT_SUFFIXES:
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if "/ready" in raw:
            ready_hits.append(path.relative_to(repo).as_posix())
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "scripts_with_health_substring": hits,
        "scripts_with_ready_substring": ready_hits,
        "counts": {"health": len(hits), "ready": len(ready_hits)},
    }


def verify(repo: Path) -> tuple[bool, str]:
    hits = set(_scripts_touching_health(repo))
    missing = sorted(_REQUIRED_FILES_WITH_HEALTH - hits)
    if missing:
        return False, "scripts missing /health reference: " + "; ".join(missing)
    return True, f"OK ({ANCHOR}; health_hits={len(hits)}; {IMPLEMENTATION_TT})"


def cmd_dump(args: argparse.Namespace) -> int:
    body = build_digest(repo_root_from_here())
    if args.pretty:
        print(json.dumps(body, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(body, ensure_ascii=False, separators=(",", ":")))
    return 0


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"health_http_probe_scripts_touchpoints_preflight: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"health_http_probe_scripts_touchpoints_preflight: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert verify(repo_root_from_here())[0]
    assert "scripts/ops/indexer-public-snapshot.sh" in _scripts_touching_health(repo_root_from_here())
    print("health_http_probe_scripts_touchpoints_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-358: list scripts that reference /health; verify core smoke paths stay wired.",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="JSON digest of scripts touching /health or /ready")
    d.add_argument("--pretty", action="store_true")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="required smoke/dev/ops scripts still mention /health")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + sanity")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
