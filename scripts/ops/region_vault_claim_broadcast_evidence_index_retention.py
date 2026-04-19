#!/usr/bin/env python3
# B-298: evidence/…/INDEX.md template + retention metadata; scan subdirs for review (no auto-delete).
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

INDEX_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-EVIDENCE-INDEX-V1"
INDEX_RULE_VERSION = "region_vault_claim_broadcast_evidence_index_retention_v1"
IMPLEMENTATION_TT = "TT-B298-EVIDENCE-RETENTION-AND-INDEX-001"
MOTHER_TABLE = "B-298"

INDEX_FILENAME = "INDEX.md"
RETENTION_DAYS_ENV = "TRAVELTRUST_EVIDENCE_RETENTION_POLICY_DAYS"
DEFAULT_RETENTION_DAYS = 365

BROADCAST_EVIDENCE_FILENAMES: tuple[str, ...] = (
    "broadcast_request_stub.json",
    "execution_report.json",
    "nonce_preflight_report.json",
    "signing_order_static.json",
    "receipt_archive.json",
    "onchain_reconcile.json",
    "production_go_report.json",
    "operator_run_evidence.json",
    "operator_run_structured.jsonl",
    "out_dir_evidence_bundle_b295_manifest.json",
    "out_dir_evidence_bundle_b295.tar",
    "README.md",
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _retention_days(cli: int | None) -> int:
    if cli is not None and cli > 0:
        return int(cli)
    raw = os.environ.get(RETENTION_DAYS_ENV, "").strip()
    if raw:
        try:
            n = int(raw, 10)
        except ValueError as e:
            raise ValueError(f"{RETENTION_DAYS_ENV} must be a positive integer (got {raw!r})") from e
        if n < 1:
            raise ValueError(f"{RETENTION_DAYS_ENV} must be >= 1 (got {n})")
        return n
    return DEFAULT_RETENTION_DAYS


def _path_under_or_equal(parent: Path, child: Path) -> bool:
    try:
        child.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _resolve_evidence_dir(path: Path, *, repo_root: Path, allow_outside: bool) -> Path:
    d = path.resolve()
    if not d.is_dir():
        raise ValueError(f"not a directory: {d}")
    evidence_root = (repo_root / "evidence").resolve()
    try:
        d.relative_to(evidence_root)
    except ValueError:
        if not allow_outside:
            raise ValueError(
                f"evidence-dir must be under {evidence_root} (got {d}); "
                "use --allow-outside-evidence for smoke dirs only"
            )
    return d


def _parse_meta_json_from_index(text: str) -> dict[str, Any] | None:
    prefix = "<!-- b298_evidence_index_meta:"
    start = text.find(prefix)
    if start < 0:
        return None
    rest = text[start + len(prefix) :]
    end = rest.find("-->")
    if end < 0:
        return None
    raw = rest[:end].strip()
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return obj if isinstance(obj, dict) else None


def build_index_markdown(
    *,
    evidence_dir: Path,
    repo_root: Path,
    retention_days: int,
    tt_id: str | None,
) -> str:
    ev = evidence_dir.resolve()
    rel = str(ev.relative_to(repo_root)) if _path_under_or_equal(repo_root, ev) else str(ev)
    generated = _utc_now()
    rows: list[str] = []
    for name in BROADCAST_EVIDENCE_FILENAMES:
        p = ev / name
        mark = "yes" if p.is_file() else "—"
        rows.append(f"| `{name}` | {mark} |")
    meta: dict[str, Any] = {
        "anchor": INDEX_ANCHOR,
        "rule_version": INDEX_RULE_VERSION,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": generated,
        "evidence_dir_relative": rel,
        "retention_policy_days": retention_days,
        "retention_note": (
            "Retention is policy-only in B-298: operators review and delete stale dirs; "
            "this script never deletes files."
        ),
        "tt_id_operator": tt_id,
    }
    meta_line = "<!-- b298_evidence_index_meta:" + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + " -->"
    tt_line = tt_id or "(set by operator / TRAVELTRUST_TESTNET_RUN_TT_ID when applicable)"
    return (
        f"# Evidence run index (B-298)\n\n"
        f"**Machine id**: `{IMPLEMENTATION_TT}`  \n"
        f"**Anchor**: `{INDEX_ANCHOR}` · **rule_version**: `{INDEX_RULE_VERSION}`  \n"
        f"**Generated (UTC)**: {generated}  \n"
        f"**Evidence directory (repo-relative when under repo)**: `{rel}`  \n"
        f"**Operator TT / run id (free text)**: {tt_line}  \n\n"
        f"## Retention (policy)\n\n"
        f"| Field | Value |\n"
        f"|-------|-------|\n"
        f"| retention_policy_days | {retention_days} |\n"
        f"| env override | `{RETENTION_DAYS_ENV}` |\n"
        f"| cleanup | **Manual** — use `scan-retention` JSON for review; no auto-delete in B-298. |\n\n"
        f"## Broadcast-chain artifacts (presence at emit time)\n\n"
        f"| File | Present |\n"
        f"|------|---------|\n"
        + "\n".join(rows)
        + "\n\n"
        f"## Related ops (broadcast chain)\n\n"
        f"- B-295 bundle: `python scripts/ops/region_vault_claim_broadcast_out_dir_evidence_bundle.py pack --out-dir …`  \n"
        f"- B-296 structured log: `operator_run_structured.jsonl` + `b296_operator_run_context` in `operator_run_evidence.json`  \n\n"
        f"{meta_line}\n"
    )


def emit_index(
    *,
    evidence_dir: Path,
    repo_root: Path,
    retention_days: int,
    tt_id: str | None,
    allow_outside: bool,
) -> Path:
    d = _resolve_evidence_dir(evidence_dir, repo_root=repo_root, allow_outside=allow_outside)
    body = build_index_markdown(evidence_dir=d, repo_root=repo_root, retention_days=retention_days, tt_id=tt_id)
    outp = d / INDEX_FILENAME
    outp.write_text(body, encoding="utf-8")
    return outp


def validate_index(*, evidence_dir: Path, repo_root: Path, allow_outside: bool) -> dict[str, Any]:
    d = _resolve_evidence_dir(evidence_dir, repo_root=repo_root, allow_outside=allow_outside)
    p = d / INDEX_FILENAME
    if not p.is_file():
        raise ValueError(f"missing {INDEX_FILENAME} under {d}")
    text = p.read_text(encoding="utf-8")
    if IMPLEMENTATION_TT not in text:
        raise ValueError(f"{INDEX_FILENAME} missing implementation_tt marker")
    if INDEX_ANCHOR not in text:
        raise ValueError(f"{INDEX_FILENAME} missing anchor marker")
    meta = _parse_meta_json_from_index(text)
    if meta is None:
        raise ValueError("missing or invalid b298_evidence_index_meta HTML comment")
    if str(meta.get("implementation_tt") or "") != IMPLEMENTATION_TT:
        raise ValueError("meta.implementation_tt mismatch")
    if int(meta.get("retention_policy_days") or 0) < 1:
        raise ValueError("meta.retention_policy_days invalid")
    return {"validate": "OK", "index_path": str(p), "implementation_tt": IMPLEMENTATION_TT}


def scan_retention(*, evidence_root: Path, retention_days: int) -> dict[str, Any]:
    root = evidence_root.resolve()
    if not root.is_dir():
        raise ValueError(f"not a directory: {root}")
    entries: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc)
    for child in sorted(root.iterdir(), key=lambda p: p.name.lower()):
        if not child.is_dir():
            continue
        has_index = (child / INDEX_FILENAME).is_file()
        mtimes: list[float] = []
        try:
            for p in child.rglob("*"):
                if p.is_file():
                    mtimes.append(p.stat().st_mtime)
        except OSError:
            mtimes.append(child.stat().st_mtime)
        newest = max(mtimes) if mtimes else child.stat().st_mtime
        age_days = (now.timestamp() - newest) / 86400.0
        entries.append(
            {
                "child_name": child.name,
                "path": str(child),
                "has_index_md": has_index,
                "newest_file_mtime_utc": datetime.fromtimestamp(newest, tz=timezone.utc).strftime(
                    "%Y-%m-%dT%H:%M:%SZ"
                ),
                "age_days_approx": round(age_days, 3),
                "retention_review_due": age_days > float(retention_days),
            }
        )
    return {
        "anchor": INDEX_ANCHOR,
        "mother_table": MOTHER_TABLE,
        "implementation_tt": IMPLEMENTATION_TT,
        "generated_at_utc": _utc_now(),
        "evidence_root": str(root),
        "retention_policy_days": retention_days,
        "child_directories": entries,
    }


def _cmd_emit(args: argparse.Namespace) -> int:
    repo = Path(args.repo_root).resolve() if args.repo_root else _repo_root()
    outp = emit_index(
        evidence_dir=Path(args.evidence_dir),
        repo_root=repo,
        retention_days=_retention_days(args.retention_days),
        tt_id=str(args.tt_id).strip() if args.tt_id else None,
        allow_outside=bool(args.allow_outside_evidence),
    )
    print(str(outp), file=sys.stdout)
    print(f"evidence_index_retention: wrote {outp}", file=sys.stderr)
    return 0


def _cmd_validate(args: argparse.Namespace) -> int:
    repo = Path(args.repo_root).resolve() if args.repo_root else _repo_root()
    rep = validate_index(
        evidence_dir=Path(args.evidence_dir),
        repo_root=repo,
        allow_outside=bool(args.allow_outside_evidence),
    )
    print(json.dumps(rep, indent=2, ensure_ascii=False), file=sys.stdout)
    print("evidence_index_retention: validate OK", file=sys.stderr)
    return 0


def _cmd_scan(args: argparse.Namespace) -> int:
    rep = scan_retention(
        evidence_root=Path(args.evidence_root),
        retention_days=_retention_days(args.retention_days),
    )
    out = args.output
    if out:
        Path(str(out)).write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(rep, indent=2, ensure_ascii=False), file=sys.stdout)
    print("evidence_index_retention: scan OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    repo = _repo_root()
    td = Path(tempfile.mkdtemp(prefix="b298_smoke_", dir=str(repo / "evidence")))
    run = td / "run_tt_b298_smoke"
    try:
        run.mkdir(parents=True)
        (run / "execution_report.json").write_text("{}\n", encoding="utf-8")
        emit_index(
            evidence_dir=run,
            repo_root=repo,
            retention_days=30,
            tt_id="TT-B298-SELFTEST-001",
            allow_outside=False,
        )
        validate_index(evidence_dir=run, repo_root=repo, allow_outside=False)
        rep = scan_retention(evidence_root=td, retention_days=0)
        kids = rep.get("child_directories")
        assert isinstance(kids, list)
        names = {str(x.get("child_name")) for x in kids if isinstance(x, dict)}
        assert "run_tt_b298_smoke" in names
        row = next(x for x in kids if isinstance(x, dict) and x.get("child_name") == "run_tt_b298_smoke")
        assert row.get("has_index_md") is True
        assert row.get("retention_review_due") is True
    finally:
        shutil.rmtree(td, ignore_errors=True)

    print(f"region_vault_claim_broadcast_evidence_index_retention self-test OK ({IMPLEMENTATION_TT})", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=f"{MOTHER_TABLE}: {INDEX_FILENAME} emit/validate + retention scan ({IMPLEMENTATION_TT})."
    )
    ap.add_argument(
        "--repo-root",
        metavar="PATH",
        help="repo root (default: parent of scripts/)",
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    em = sub.add_parser("emit-index", help=f"write {INDEX_FILENAME} under an evidence run directory")
    em.add_argument("--evidence-dir", required=True, metavar="DIR", help=f"directory under <repo>/evidence/… (run folder)")
    em.add_argument(
        "--retention-days",
        type=int,
        default=None,
        metavar="N",
        help=f"retention policy in days (default: env {RETENTION_DAYS_ENV} or {DEFAULT_RETENTION_DAYS})",
    )
    em.add_argument("--tt-id", metavar="TEXT", help="optional operator TT / run id line in INDEX body")
    em.add_argument(
        "--allow-outside-evidence",
        action="store_true",
        help="unsafe: allow --evidence-dir outside <repo>/evidence (for ad-hoc dirs only)",
    )
    em.set_defaults(func=_cmd_emit)

    va = sub.add_parser("validate-index", help=f"check {INDEX_FILENAME} markers + HTML meta JSON")
    va.add_argument("--evidence-dir", required=True, metavar="DIR")
    va.add_argument(
        "--allow-outside-evidence",
        action="store_true",
        help="unsafe: allow directory outside <repo>/evidence",
    )
    va.set_defaults(func=_cmd_validate)

    sc = sub.add_parser(
        "scan-retention",
        help="list immediate child dirs under evidence-root with age / INDEX presence (no deletes)",
    )
    sc.add_argument(
        "--evidence-root",
        required=True,
        metavar="DIR",
        help="e.g. evidence/testnet_real_run_validation",
    )
    sc.add_argument("--retention-days", type=int, default=None, metavar="N")
    sc.add_argument("-o", "--output", metavar="PATH", help="optional JSON report path")
    sc.set_defaults(func=_cmd_scan)

    st = sub.add_parser("self-test", help="temp dir under repo evidence/ emit+validate+scan")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    try:
        return int(args.func(args))
    except ValueError as e:
        print(f"evidence_index_retention: FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
