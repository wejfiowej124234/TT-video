#!/usr/bin/env python3
# B-327: scripts-only dev stack port defaults (8080 API / 3012 frontend) vs start_dev/stop_dev + anti :3000 API literal.
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ANCHOR = "DEV-STACK-PORT-DEFAULTS-PREFLIGHT-V1"
IMPLEMENTATION_TT = "TT-B327-DEV-START-STOP-PORT-MATRIX-AUDIT-001"
MOTHER_TABLE = "B-327"

_BACKEND_DEFAULT = 'BACKEND_PORT="${API_PORT:-8080}"'
_FRONTEND_DEFAULT = 'FRONTEND_PORT="${FRONTEND_PORT:-3012}"'
_RE_LEGACY_API_3000 = re.compile(
    r"(127\.0\.0\.1|localhost):3000\b",
    re.IGNORECASE,
)


def repo_root_from_here() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def _scan_scripts_for_legacy_api_3000(repo: Path) -> list[str]:
    """Flag shell/PowerShell under scripts/ that still point API base to :3000."""
    bad: list[str] = []
    root = repo / "scripts"
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".sh", ".ps1"}:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            stripped = line.lstrip()
            if stripped.startswith("#"):
                continue
            if _RE_LEGACY_API_3000.search(line):
                rel = path.relative_to(repo).as_posix()
                bad.append(f"{rel}:{i}:{stripped[:120]}")
    return bad


def verify(repo: Path) -> tuple[bool, str]:
    start = repo / "scripts" / "dev" / "start_dev.sh"
    stop = repo / "scripts" / "dev" / "stop_dev.sh"
    wrap_start = repo / "scripts" / "start_dev.sh"
    wrap_stop = repo / "scripts" / "stop_dev.sh"
    for p in (start, stop, wrap_start, wrap_stop):
        if not p.is_file():
            return False, f"missing {p.relative_to(repo)}"
    st = _read(start)
    sp = _read(stop)
    for needle, label in (
        (_BACKEND_DEFAULT, "scripts/dev/start_dev.sh backend default"),
        (_FRONTEND_DEFAULT, "scripts/dev/start_dev.sh frontend default"),
    ):
        if needle not in st:
            return False, f"{label}: expected substring {needle!r}"
    for needle, label in (
        (_BACKEND_DEFAULT, "scripts/dev/stop_dev.sh backend default"),
        (_FRONTEND_DEFAULT, "scripts/dev/stop_dev.sh frontend default"),
    ):
        if needle not in sp:
            return False, f"{label}: expected substring {needle!r}"
    ws = _read(wrap_start)
    wp = _read(wrap_stop)
    if 'exec bash "$_here/dev/start_dev.sh"' not in ws.replace("\r", ""):
        return False, "scripts/start_dev.sh must delegate to dev/start_dev.sh"
    if 'exec bash "$_here/dev/stop_dev.sh"' not in wp.replace("\r", ""):
        return False, "scripts/stop_dev.sh must delegate to dev/stop_dev.sh"
    hits = _scan_scripts_for_legacy_api_3000(repo)
    if hits:
        return False, "legacy API :3000 literals in scripts: " + "; ".join(hits[:12])
    return True, f"OK ({ANCHOR}; 8080/3012; {IMPLEMENTATION_TT})"


def cmd_verify(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    if not ok:
        print(f"dev_stack_port_defaults_preflight: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"dev_stack_port_defaults_preflight: {msg}", file=sys.stderr)
    return 0


def cmd_self_test(_: argparse.Namespace) -> int:
    ok, msg = verify(repo_root_from_here())
    assert ok, msg
    # synthetic: legacy detector fires on a bad line
    assert _RE_LEGACY_API_3000.search('curl "http://127.0.0.1:3000/health"')
    print("dev_stack_port_defaults_preflight self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-327: verify dev start/stop scripts keep API 8080 + frontend 3012 defaults.",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("verify", help="check scripts/dev start+stop + wrappers + no :3000 API in scripts")
    v.set_defaults(func=cmd_verify)
    st = sub.add_parser("self-test", help="verify + regex sanity")
    st.set_defaults(func=cmd_self_test)
    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
