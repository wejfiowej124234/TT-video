#!/usr/bin/env python3
# B-296: structured operator run metadata (who / when / git_sha) on operator_run_evidence.json + append-only JSONL audit.
from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

STRUCTURED_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-OPERATOR-RUN-STRUCTURED-V1"
STRUCTURED_RULE_VERSION = "region_vault_claim_broadcast_operator_run_structured_v1"
IMPLEMENTATION_TT = "TT-B296-OPERATOR-RUN-STRUCTURED-JSONL-001"
MOTHER_TABLE = "B-296"

OPERATOR_RUN_EVIDENCE_FILENAME = "operator_run_evidence.json"
OPERATOR_RUN_STRUCTURED_JSONL = "operator_run_structured.jsonl"

GIT_REPO_ROOT_ENV = "TRAVELTRUST_GIT_REPO_ROOT"
OPERATOR_PRINCIPAL_ENV = "TRAVELTRUST_OPERATOR_PRINCIPAL"


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _find_git_root(start: Path) -> Path | None:
    cur = start.resolve()
    for _ in range(40):
        if (cur / ".git").exists():
            return cur
        if cur.parent == cur:
            break
        cur = cur.parent
    return None


def _resolve_git_root(repo_search_start: Path | None) -> Path | None:
    env = os.environ.get(GIT_REPO_ROOT_ENV, "").strip()
    if env:
        p = Path(env).resolve()
        return p if (p / ".git").exists() else None
    if repo_search_start is not None:
        hit = _find_git_root(repo_search_start)
        if hit:
            return hit
    hit2 = _find_git_root(Path.cwd())
    return hit2


def _git_rev_parse_head(repo: Path) -> tuple[str | None, str | None]:
    try:
        cp = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "HEAD"],
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if cp.returncode != 0:
            tail = (cp.stderr or cp.stdout or "").strip()[-500:]
            return None, tail or "git_rev_parse_nonzero"
        sha = cp.stdout.strip()
        if len(sha) < 7:
            return None, "git_rev_parse_short_output"
        return sha, None
    except (OSError, subprocess.SubprocessError) as e:
        return None, str(e)


def _git_worktree_dirty(repo: Path) -> tuple[bool | None, str | None]:
    try:
        cp = subprocess.run(
            ["git", "-C", str(repo), "status", "--porcelain"],
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if cp.returncode != 0:
            return None, (cp.stderr or "").strip()[-500:] or "git_status_nonzero"
        dirty = bool((cp.stdout or "").strip())
        return dirty, None
    except (OSError, subprocess.SubprocessError) as e:
        return None, str(e)


def _operator_principal() -> str:
    for key in (OPERATOR_PRINCIPAL_ENV, "USER", "USERNAME"):
        v = os.environ.get(key, "").strip()
        if v:
            return v
    return "unknown"


def capture_operator_run_context(*, repo_search_start: Path | None = None) -> dict[str, Any]:
    """Portable facts for evidence (no secrets)."""
    recorded_at = _utc_now()
    host = socket.gethostname()
    principal = _operator_principal()
    root = _resolve_git_root(repo_search_start)
    sha: str | None = None
    dirty: bool | None = None
    git_notes: list[str] = []
    if root is None:
        git_notes.append("git_root_not_resolved")
    else:
        sha, err = _git_rev_parse_head(root)
        if err:
            git_notes.append(f"rev_parse:{err}")
        d, err2 = _git_worktree_dirty(root)
        dirty = d
        if err2:
            git_notes.append(f"status:{err2}")
    return {
        "recorded_at_utc": recorded_at,
        "operator_principal": principal,
        "hostname": host,
        "git_repo_root": str(root) if root else None,
        "git_commit_sha": sha,
        "git_worktree_dirty": dirty,
        "git_capture_notes": git_notes,
    }


def build_b296_operator_run_context_block(*, repo_search_start: Path | None = None) -> dict[str, Any]:
    snap = capture_operator_run_context(repo_search_start=repo_search_start)
    return {
        "anchor": STRUCTURED_ANCHOR,
        "rule_version": STRUCTURED_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        **snap,
    }


def append_structured_event_jsonl(
    out_dir: Path,
    *,
    event_type: str,
    payload: dict[str, Any],
    repo_search_start: Path | None = None,
) -> Path:
    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / OPERATOR_RUN_STRUCTURED_JSONL
    ctx = capture_operator_run_context(repo_search_start=repo_search_start or out_dir)
    line_obj: dict[str, Any] = {
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "event_type": event_type,
        "recorded_at_utc": ctx["recorded_at_utc"],
        "operator_principal": ctx["operator_principal"],
        "hostname": ctx["hostname"],
        "git_commit_sha": ctx.get("git_commit_sha"),
        "git_worktree_dirty": ctx.get("git_worktree_dirty"),
        "git_repo_root": ctx.get("git_repo_root"),
        "payload": payload,
    }
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line_obj, ensure_ascii=False, separators=(",", ":")) + "\n")
    return path


def merge_context_into_operator_run_evidence(
    out_dir: Path,
    *,
    repo_search_start: Path | None = None,
) -> dict[str, Any]:
    out_dir = out_dir.resolve()
    ore_path = out_dir / OPERATOR_RUN_EVIDENCE_FILENAME
    if ore_path.is_file():
        ore: dict[str, Any] = json.loads(ore_path.read_text(encoding="utf-8"))
        if not isinstance(ore, dict):
            raise ValueError(f"{ore_path.name}: root must be JSON object")
    else:
        ore = {
            "tt_id": "TT-B296-OPERATOR-RUN-EVIDENCE-PLACEHOLDER-001",
            "generated_at_utc": _utc_now(),
            "notes": "B-296: operator_run_evidence initialized by merge-context; replace tt_id as appropriate.",
        }
    ore["b296_operator_run_context"] = build_b296_operator_run_context_block(
        repo_search_start=repo_search_start or out_dir
    )
    ore_path.write_text(json.dumps(ore, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"operator_run_evidence_path": str(ore_path), "implementation_tt": IMPLEMENTATION_TT}


def verify_structured_jsonl(path: Path) -> tuple[bool, str]:
    if not path.is_file():
        return False, f"missing {path}"
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as e:
            return False, f"line {i}: invalid JSON ({e})"
        if not isinstance(obj, dict):
            return False, f"line {i}: must be object"
        if str(obj.get("implementation_tt") or "") != IMPLEMENTATION_TT:
            return False, f"line {i}: implementation_tt mismatch"
        if str(obj.get("mother_table") or "") != MOTHER_TABLE:
            return False, f"line {i}: mother_table mismatch"
    return True, ""


def _cmd_print_context(args: argparse.Namespace) -> int:
    start = Path(args.repo_root).resolve() if args.repo_root else None
    block = build_b296_operator_run_context_block(repo_search_start=start)
    print(json.dumps(block, indent=2, ensure_ascii=False), file=sys.stdout)
    return 0


def _cmd_merge(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    start = Path(args.repo_root).resolve() if args.repo_root else None
    summary = merge_context_into_operator_run_evidence(root, repo_search_start=start)
    print(json.dumps(summary, indent=2, ensure_ascii=False), file=sys.stdout)
    print("operator_run_structured: merge OK", file=sys.stderr)
    return 0


def _cmd_append_event(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    start = Path(args.repo_root).resolve() if args.repo_root else None
    raw = str(args.payload_json or "").strip()
    if raw:
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("--payload-json must be a JSON object")
    else:
        payload = {}
    p = append_structured_event_jsonl(
        root,
        event_type=str(args.event_type),
        payload=payload,
        repo_search_start=start,
    )
    print(str(p), file=sys.stdout)
    print("operator_run_structured: append-event OK", file=sys.stderr)
    return 0


def _cmd_verify_jsonl(args: argparse.Namespace) -> int:
    root = Path(args.out_dir).resolve()
    path = root / OPERATOR_RUN_STRUCTURED_JSONL
    ok, msg = verify_structured_jsonl(path)
    if not ok:
        print(f"verify-jsonl: FAIL: {msg}", file=sys.stderr)
        return 1
    print(f"verify-jsonl: OK {path} ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        merge_context_into_operator_run_evidence(root, repo_search_start=root)
        ore = json.loads((root / OPERATOR_RUN_EVIDENCE_FILENAME).read_text(encoding="utf-8"))
        b296 = ore.get("b296_operator_run_context")
        assert isinstance(b296, dict), b296
        assert b296.get("implementation_tt") == IMPLEMENTATION_TT
        assert b296.get("operator_principal")

        append_structured_event_jsonl(
            root,
            event_type="self_test_ping",
            payload={"k": 1},
            repo_search_start=root,
        )
        append_structured_event_jsonl(
            root,
            event_type="self_test_pong",
            payload={"k": 2},
            repo_search_start=root,
        )
        ok, msg = verify_structured_jsonl(root / OPERATOR_RUN_STRUCTURED_JSONL)
        assert ok, msg
        lines = [ln for ln in (root / OPERATOR_RUN_STRUCTURED_JSONL).read_text(encoding="utf-8").splitlines() if ln.strip()]
        assert len(lines) == 2

    print(f"region_vault_claim_broadcast_operator_run_structured self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: operator_run_evidence context + {OPERATOR_RUN_STRUCTURED_JSONL} ({IMPLEMENTATION_TT})."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    pc = sub.add_parser("print-context", help="print b296_operator_run_context-shaped JSON to stdout")
    pc.add_argument(
        "--repo-root",
        metavar="PATH",
        help=f"optional git repo root (else {GIT_REPO_ROOT_ENV} or walk from cwd)",
    )
    pc.set_defaults(func=_cmd_print_context)

    mg = sub.add_parser(
        "merge-context",
        help=f"set b296_operator_run_context on {OPERATOR_RUN_EVIDENCE_FILENAME} (create minimal stub if missing)",
    )
    mg.add_argument("--out-dir", required=True, metavar="OUT_DIR", help="operator evidence directory")
    mg.add_argument("--repo-root", metavar="PATH", help="optional git repo root for sha/dirty capture")
    mg.set_defaults(func=_cmd_merge)

    ap_ev = sub.add_parser("append-event", help=f"append one NDJSON line to {OPERATOR_RUN_STRUCTURED_JSONL}")
    ap_ev.add_argument("--out-dir", required=True, metavar="OUT_DIR")
    ap_ev.add_argument("--event-type", required=True, metavar="NAME", help="e.g. b285_quarantine_snapshot")
    ap_ev.add_argument(
        "--payload-json",
        metavar="JSON",
        default="",
        help='optional JSON object string (default "{}")',
    )
    ap_ev.add_argument("--repo-root", metavar="PATH", help="optional git repo root for capture on this line")
    ap_ev.set_defaults(func=_cmd_append_event)

    vj = sub.add_parser("verify-jsonl", help=f"parse-check {OPERATOR_RUN_STRUCTURED_JSONL} under OUT_DIR")
    vj.add_argument("--out-dir", required=True, metavar="OUT_DIR")
    vj.set_defaults(func=_cmd_verify_jsonl)

    st = sub.add_parser("self-test", help="offline merge + append + verify-jsonl")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except (ValueError, OSError, json.JSONDecodeError) as e:
        print(f"operator_run_structured: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
