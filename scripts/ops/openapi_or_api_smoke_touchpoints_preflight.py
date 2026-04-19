#!/usr/bin/env python3
# B-357: read-only registry of scripts that combine an HTTP client + /api (or API_BASE_URL) — smoke / SSOT ops touchpoints.
# Does not parse OpenAPI artifacts (none in scripts/ today); index is for operator discoverability + drift pins.
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ANCHOR = "SCRIPTS-API-SMOKE-TOUCHPOINTS-PREFLIGHT-V1"
IMPLEMENTATION_TT = "TT-B357-OPENAPI-OR-SSOT-EXPORT-SMOKE-COMMAND-001"
MOTHER_TABLE = "B-357"

_RE_HTTP_CLIENT = re.compile(
    r"\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod)\b",
    re.IGNORECASE,
)

_SCRIPT_SUFFIXES = frozenset({".sh", ".ps1", ".bat", ".py"})

# Core gates + indexer/finance smoke entrypoints; extend when new first-class smoke scripts land.
_REQUIRED_TOUCHPOINTS = frozenset(
    {
        "scripts/gates/smoke-api-public-routes.sh",
        "scripts/gates/smoke-api-public-routes.ps1",
        "scripts/ops/indexer-reconcile-probe.sh",
        "scripts/ops/indexer-public-snapshot.sh",
        "scripts/ops/internal-indexer-ops.sh",
        "scripts/ops/orders-deadline-ssot-ops-check.sh",
    }
)

# Floor on total matches; bump when adding substantial new smoke scripts.
_MIN_TOTAL_TOUCHPOINTS = 20


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _is_touchpoint(text: str) -> bool:
    if not _RE_HTTP_CLIENT.search(text):
        return False
    if "/api" not in text and "API_BASE_URL" not in text:
        return False
    return True


def collect_touchpoints(repo: Path) -> list[str]:
    root = repo / "scripts"
    out: list[str] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in _SCRIPT_SUFFIXES:
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if _is_touchpoint(raw):
            out.append(path.relative_to(repo).as_posix())
    return out


def build_digest(repo: Path) -> dict[str, Any]:
    hits = collect_touchpoints(repo)
    return {
        "anchor": ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "touchpoints": hits,
        "count": len(hits),
        "required_touchpoints": sorted(_REQUIRED_TOUCHPOINTS),
    }


def verify(repo: Path) -> tuple[bool, str]:
    hits = set(collect_touchpoints(repo))
    missing = sorted(_REQUIRED_TOUCHPOINTS - hits)
    if missing:
        return False, "missing required smoke touchpoints: " + "; ".join(missing)
    if len(hits) < _MIN_TOTAL_TOUCHPOINTS:
        return (
            False,
            f"expected at least {_MIN_TOTAL_TOUCHPOINTS} touchpoint scripts, got {len(hits)}",
        )
    return True, f"OK ({ANCHOR}; count={len(hits)}; {IMPLEMENTATION_TT})"


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
        print(f"openapi_or_api_smoke_touchpoints_preflight: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"openapi_or_api_smoke_touchpoints_preflight: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    assert verify(repo_root_from_here())[0]
    sample = "curl -sS ${BASE}/api/v1/foo\nAPI_BASE_URL=x\n"
    assert _is_touchpoint(sample)
    assert not _is_touchpoint("only curl here\n")
    print("openapi_or_api_smoke_touchpoints_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-357: list scripts under scripts/ that use HTTP client + /api (read-only).",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("dump", help="print JSON digest to stdout")
    d.add_argument("--pretty", action="store_true")
    d.set_defaults(func=cmd_dump)
    v = sub.add_parser("verify", help="required touchpoints + minimum count")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + heuristic checks")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
