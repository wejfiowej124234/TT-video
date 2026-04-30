#!/usr/bin/env python3
"""
96-15 Tier orchestration — P0 loop: Tier A (A1/A2 semiauto + A3 B-421).
Tier B/C default **machine** gates (tier_bc_machine_gates.py); pass --manual-tier-bc for legacy manual placeholders.
By default `TT_96_V1_MAP_MANUAL_TO_FAIL=1` rewrites emitted `MANUAL_REQUIRED` to `FAIL` so v1 JSON stays machine-decidable;
set `TT_96_V1_MAP_MANUAL_TO_FAIL=0` to preserve `MANUAL_REQUIRED` in the file (not recommended for production gates).

Semiauto A1/A2: evidence file must exist under repo root and meet minimum byte size (human-produced bundle).

Usage (repo root):
  python scripts/release/run_96_15_orchestration.py --out-dir evidence/GO_96_15_machine_20260425 \\
    --tier-a1-readme evidence/GO_96_bundle_20260425/README.md \\
    --tier-a2-markdown evidence/GO_96_15_deep_20260425/59_p0_table.md

CI strict (fail if Tier-A semiauto inputs missing):
  python scripts/release/run_96_15_orchestration.py --out-dir ... --require-tier-a-semiauto \\
    --tier-a1-readme path/to/README.md --tier-a2-markdown path/to/59_p0_table.md

Env fallback (if CLI omitted): TT_TIER_A1_README, TT_TIER_A2_MARKDOWN (repo-relative paths).

See scripts/release/run_96_tier_a_p0_full_chain.sh for a one-shot local chain.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

_release_dir = str(Path(__file__).resolve().parent)


def _spec_rel(name: str) -> str:
    return (Path("docs") / "spec" / name).as_posix()
if _release_dir not in sys.path:
    sys.path.insert(0, _release_dir)
import tier_bc_machine_gates as _tbc  # noqa: E402


MIN_SEMIAUTO_FILE_BYTES = 64


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _tail(s: str, max_chars: int = 4000) -> str:
    if len(s) <= max_chars:
        return s
    return s[-max_chars:]


def _resolve_repo_path(repo_root: Path, p: Path | None) -> Path | None:
    if p is None:
        return None
    if p.is_absolute():
        return p
    return repo_root / p


def _semiauto_file_gate(repo_root: Path, path: Path | None, *, require: bool) -> tuple[str, bool, str, list[str], int | None]:
    """
    Returns (status, machine_runnable, detail, commands, exit_code_like).
    status: PASS | FAIL | MANUAL_REQUIRED
    """
    cmd = ["semiauto:evidence-file"]
    if path is None:
        if require:
            return "FAIL", True, "missing path (--require-tier-a-semiauto or env)", cmd, 1
        return "MANUAL_REQUIRED", False, "no --tier-a1-readme / TT_TIER_A1_README (or A2) provided", [], None
    rp = _resolve_repo_path(repo_root, path)
    if not rp.is_file():
        return "FAIL", True, f"not a file or missing: {rp}", cmd + [str(rp)], 1
    sz = rp.stat().st_size
    if sz < MIN_SEMIAUTO_FILE_BYTES:
        return (
            "FAIL",
            True,
            f"file too small ({sz} < {MIN_SEMIAUTO_FILE_BYTES} bytes): {rp}",
            cmd + [str(rp)],
            1,
        )
    return "PASS", True, f"ok {sz} bytes: {rp}", cmd + [str(rp)], 0


@dataclass
class TierAOptions:
    tier_a1_readme: Path | None
    tier_a2_markdown: Path | None
    require_semiauto: bool


def _build_steps(
    repo_root: Path,
    b421_log_rel: str,
    a_opts: TierAOptions,
    *,
    automate_tier_bc: bool,
) -> tuple[list[dict[str, object]], dict[str, object]]:
    tiers_data: list[dict[str, object]] = []

    def step(
        sid: str,
        tier: str,
        seq: int,
        title: str,
        *,
        machine: bool,
        status: str,
        commands: list[str],
        exit_code: int | None,
        out: str,
        err: str,
        booklet: str,
        attr: str,
        f_hints: list[str],
        ev_paths: list[str],
        semiauto_detail: str = "",
    ) -> dict[str, object]:
        o: dict[str, object] = {
            "id": sid,
            "seq": seq,
            "title": title,
            "machine_runnable": machine,
            "status": status,
            "primary_attribution_if_fail": attr,
            "commands": commands,
            "observed_exit_code": exit_code,
            "stdout_tail": _tail(out),
            "stderr_tail": _tail(err),
            "evidence_paths_expected": ev_paths,
            "f_row_hints": f_hints,
            "96_booklet": booklet,
        }
        if semiauto_detail:
            o["semiauto_detail"] = semiauto_detail
        return o

    req = a_opts.require_semiauto
    a1_path = a_opts.tier_a1_readme or (
        Path(os.environ["TT_TIER_A1_README"]) if os.environ.get("TT_TIER_A1_README") else None
    )
    a2_path = a_opts.tier_a2_markdown or (
        Path(os.environ["TT_TIER_A2_MARKDOWN"]) if os.environ.get("TT_TIER_A2_MARKDOWN") else None
    )

    st1, m1, d1, c1, e1 = _semiauto_file_gate(repo_root, a1_path, require=req)
    st2, m2, d2, c2, e2 = _semiauto_file_gate(repo_root, a2_path, require=req)

    a_steps: list[dict[str, object]] = [
        step(
            "TIER-A-1",
            "A",
            1,
            "15 appendix + gap table P0 twelve / signoff bundle (semiauto: README evidence)",
            machine=m1,
            status=st1,
            commands=c1,
            exit_code=e1,
            out=d1,
            err="",
            booklet="96-11",
            attr="96",
            f_hints=[],
            ev_paths=[str(p) for p in [a1_path] if p is not None],
            semiauto_detail=d1,
        ),
        step(
            "TIER-A-2",
            "A",
            2,
            "59 nine-dimension P0 table snapshot (semiauto: markdown evidence)",
            machine=m2,
            status=st2,
            commands=c2,
            exit_code=e2,
            out=d2,
            err="",
            booklet="96-15",
            attr="96",
            f_hints=[],
            ev_paths=[str(p) for p in [a2_path] if p is not None],
            semiauto_detail=d2,
        ),
    ]

    cmd = [
        sys.executable,
        str(repo_root / "scripts/release/b421_doclink_gate.py"),
        "--repo-root",
        str(repo_root),
    ]
    proc = subprocess.run(
        cmd,
        cwd=repo_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=120,
    )
    ok = proc.returncode == 0
    a_steps.append(
        step(
            "TIER-A-3",
            "A",
            3,
            "B-421 runbook/go-live doclink gate",
            machine=True,
            status="PASS" if ok else "FAIL",
            commands=cmd,
            exit_code=proc.returncode,
            out=proc.stdout or "",
            err=proc.stderr or "",
            booklet="96-11",
            attr="GATE",
            f_hints=[],
            ev_paths=[b421_log_rel],
        )
    )
    tiers_data.append({"tier": "A", "steps": a_steps})

    if automate_tier_bc:
        r4 = _tbc.gate_b4(repo_root)
        r5 = _tbc.gate_b5(repo_root)
        r6 = _tbc.gate_c6(repo_root)
        r7 = _tbc.gate_c7(repo_root)
        tiers_data.append(
            {
                "tier": "B",
                "steps": [
                    step(
                        "TIER-B-4",
                        "B",
                        4,
                        "66/51/53 anchors present (machine)",
                        machine=True,
                        status=r4.status,
                        commands=r4.commands,
                        exit_code=r4.exit_code,
                        out=r4.stdout,
                        err=r4.stderr,
                        booklet="96-12",
                        attr="96",
                        f_hints=[],
                        ev_paths=[
                            _spec_rel("66-深度检查-缺口与遗留问题.md"),
                            _spec_rel("51-阶段开发技术文档.md"),
                            _spec_rel("53-阶段开发技术文档.md"),
                        ],
                    ),
                    step(
                        "TIER-B-5",
                        "B",
                        5,
                        "27-P0..P50 checklist present + min size (machine)",
                        machine=True,
                        status=r5.status,
                        commands=r5.commands,
                        exit_code=r5.exit_code,
                        out=r5.stdout,
                        err=r5.stderr,
                        booklet="96-12",
                        attr="96",
                        f_hints=[],
                        ev_paths=[_spec_rel("27-P0至P50开发流程勾选清单.md")],
                    ),
                ],
            }
        )
        tiers_data.append(
            {
                "tier": "C",
                "steps": [
                    step(
                        "TIER-C-6",
                        "C",
                        6,
                        "frontend/app page.tsx smoke count (machine)",
                        machine=True,
                        status=r6.status,
                        commands=r6.commands,
                        exit_code=r6.exit_code,
                        out=r6.stdout,
                        err=r6.stderr,
                        booklet="96-13",
                        attr="96",
                        f_hints=["F-010", "F-008", "F-021"],
                        ev_paths=["frontend/app/**/page.tsx"],
                    ),
                    step(
                        "TIER-C-7",
                        "C",
                        7,
                        "04 routes gate: scripts/run-check-04-routes.sh (machine)",
                        machine=True,
                        status=r7.status,
                        commands=r7.commands,
                        exit_code=r7.exit_code,
                        out=r7.stdout,
                        err=r7.stderr,
                        booklet="96-12",
                        attr="GATE",
                        f_hints=["F-033"],
                        ev_paths=["scripts/run-check-04-routes.sh"],
                    ),
                ],
            }
        )
    else:
        tiers_data.append(
            {
                "tier": "B",
                "steps": [
                    step(
                        "TIER-B-4",
                        "B",
                        4,
                        "66/51/53 deep gap read for release scope",
                        machine=False,
                        status="MANUAL_REQUIRED",
                        commands=[],
                        exit_code=None,
                        out="",
                        err="",
                        booklet="96-12",
                        attr="96",
                        f_hints=[],
                        ev_paths=["evidence/GO_96_15_deep_<DATE>/tier_b_read_notes.md"],
                    ),
                    step(
                        "TIER-B-5",
                        "B",
                        5,
                        "27-P0..P50 intersecting rows",
                        machine=False,
                        status="MANUAL_REQUIRED",
                        commands=[],
                        exit_code=None,
                        out="",
                        err="",
                        booklet="96-12",
                        attr="96",
                        f_hints=[],
                        ev_paths=["evidence/GO_96_15_deep_<DATE>/README.md"],
                    ),
                ],
            }
        )

        tiers_data.append(
            {
                "tier": "C",
                "steps": [
                    step(
                        "TIER-C-6",
                        "C",
                        6,
                        "96-13 + 96-16 D1-D12 sample matrix (F-zone)",
                        machine=False,
                        status="MANUAL_REQUIRED",
                        commands=[],
                        exit_code=None,
                        out="",
                        err="",
                        booklet="96-13",
                        attr="96",
                        f_hints=["F-010", "F-008", "F-021"],
                        ev_paths=["evidence/GO_96_15_deep_<DATE>/d_matrix.md"],
                    ),
                    step(
                        "TIER-C-7",
                        "C",
                        7,
                        "code-maps/snapshots vs 04 drift register",
                        machine=False,
                        status="MANUAL_REQUIRED",
                        commands=[],
                        exit_code=None,
                        out="",
                        err="",
                        booklet="96-12",
                        attr="96",
                        f_hints=["F-033"],
                        ev_paths=["evidence/GO_96_15_deep_<DATE>/04_drift_register.md"],
                    ),
                ],
            }
        )

    flat: list[dict[str, object]] = []
    for t in tiers_data:
        flat.extend(t["steps"])  # type: ignore[arg-type]
    a_flat = [s for s in flat if str(s["id"]).startswith("TIER-A-")]  # type: ignore[index]
    tier_a_all_pass = len(a_flat) == 3 and all(s["status"] == "PASS" for s in a_flat)
    bc_flat = [s for s in flat if str(s["id"]).startswith(("TIER-B-", "TIER-C-"))]  # type: ignore[index]
    tier_bc_all_pass = bool(bc_flat) and all(s["status"] == "PASS" for s in bc_flat)
    tier_bc_scope_manual_only = any(s["status"] == "MANUAL_REQUIRED" for s in bc_flat)

    summary: dict[str, object] = {
        "steps_total": len(flat),
        "steps_pass": sum(1 for s in flat if s["status"] == "PASS"),
        "steps_fail": sum(1 for s in flat if s["status"] == "FAIL"),
        "steps_manual": sum(1 for s in flat if s["status"] == "MANUAL_REQUIRED"),
        "machine_steps_executed": sum(1 for s in flat if s["machine_runnable"] and s["status"] in ("PASS", "FAIL")),
        "tier_a_all_pass": tier_a_all_pass,
        "tier_bc_all_pass": tier_bc_all_pass,
        "tier_bc_scope_manual_only": tier_bc_scope_manual_only,
    }
    return tiers_data, summary


def _apply_v1_manual_to_fail(tiers: list[dict[str, object]]) -> None:
    """
    Default-on: v1 JSON must not ship MANUAL_REQUIRED when consumers expect machine verdicts.
    Set TT_96_V1_MAP_MANUAL_TO_FAIL=0 to preserve legacy MANUAL_REQUIRED rows (--manual-tier-bc).
    """
    if os.environ.get("TT_96_V1_MAP_MANUAL_TO_FAIL", "1").strip() in ("0", "false", "no"):
        return
    for t in tiers:
        for s in t.get("steps", []):  # type: ignore[assignment]
            if not isinstance(s, dict):
                continue
            if s.get("status") != "MANUAL_REQUIRED":
                continue
            s["status"] = "FAIL"
            s["machine_runnable"] = True
            prev = str(s.get("stderr_tail") or "")
            note = (
                "[v1-deny-manual] MANUAL_REQUIRED→FAIL "
                "(TT_96_V1_MAP_MANUAL_TO_FAIL default=1; set 0 to preserve MANUAL_REQUIRED)"
            )
            s["stderr_tail"] = (prev + "\n" + note) if prev else note


def _recompute_summary_v1(tiers: list[dict[str, object]]) -> dict[str, object]:
    flat: list[dict[str, object]] = []
    for t in tiers:
        flat.extend(t["steps"])  # type: ignore[arg-type]
    a_flat = [s for s in flat if str(s["id"]).startswith("TIER-A-")]  # type: ignore[index]
    tier_a_all_pass = len(a_flat) == 3 and all(s["status"] == "PASS" for s in a_flat)
    bc_flat = [s for s in flat if str(s["id"]).startswith(("TIER-B-", "TIER-C-"))]  # type: ignore[index]
    tier_bc_all_pass = bool(bc_flat) and all(s["status"] == "PASS" for s in bc_flat)
    tier_bc_scope_manual_only = any(s["status"] == "MANUAL_REQUIRED" for s in bc_flat)
    return {
        "steps_total": len(flat),
        "steps_pass": sum(1 for s in flat if s["status"] == "PASS"),
        "steps_fail": sum(1 for s in flat if s["status"] == "FAIL"),
        "steps_manual": sum(1 for s in flat if s["status"] == "MANUAL_REQUIRED"),
        "machine_steps_executed": sum(
            1 for s in flat if s["machine_runnable"] and s["status"] in ("PASS", "FAIL")
        ),
        "tier_a_all_pass": tier_a_all_pass,
        "tier_bc_all_pass": tier_bc_all_pass,
        "tier_bc_scope_manual_only": tier_bc_scope_manual_only,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--out-dir",
        type=Path,
        required=True,
        help="Evidence directory (created if missing)",
    )
    ap.add_argument("--executor", default="local", help="Recorded executor label")
    ap.add_argument(
        "--tier-a1-readme",
        type=Path,
        default=None,
        help="Path to bundle README (15 appendix / P0 twelve / signoff pointer); repo-relative ok",
    )
    ap.add_argument(
        "--tier-a2-markdown",
        type=Path,
        default=None,
        help="Path to 59 P0 snapshot markdown under evidence/",
    )
    ap.add_argument(
        "--require-tier-a-semiauto",
        action="store_true",
        help="Fail A1/A2 if evidence paths not provided (CI P0 min loop)",
    )
    ap.add_argument(
        "--require-tier-a-all-pass",
        action="store_true",
        help="Exit non-zero unless tier_a_all_pass (A1+A2+A3 all PASS)",
    )
    ap.add_argument(
        "--manual-tier-bc",
        action="store_true",
        help="Keep Tier B/C steps as MANUAL_REQUIRED (no machine gates). Default: run tier_bc_machine_gates.py",
    )
    ap.add_argument(
        "--require-tier-bc-all-pass",
        action="store_true",
        help="Exit non-zero unless every Tier B/C step is PASS",
    )
    args = ap.parse_args()
    automate_tier_bc = not args.manual_tier_bc

    repo_root = Path(__file__).resolve().parents[2]
    out_dir: Path = args.out_dir
    if not out_dir.is_absolute():
        out_dir = repo_root / out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    started = _utc_now()
    b421_log = out_dir / "b421.log"
    b421_rel = str(b421_log.relative_to(repo_root))

    a_opts = TierAOptions(
        tier_a1_readme=args.tier_a1_readme,
        tier_a2_markdown=args.tier_a2_markdown,
        require_semiauto=args.require_tier_a_semiauto,
    )
    tiers, _summary_before = _build_steps(
        repo_root,
        b421_rel,
        a_opts,
        automate_tier_bc=automate_tier_bc,
    )
    _apply_v1_manual_to_fail(tiers)
    summary = _recompute_summary_v1(tiers)

    for t in tiers:
        for s in t["steps"]:  # type: ignore[assignment]
            if s["id"] == "TIER-A-3":  # type: ignore[index]
                log_body = (
                    f"exit={s['observed_exit_code']}\n=== stdout ===\n{s['stdout_tail']}\n"
                    f"=== stderr ===\n{s['stderr_tail']}\n"
                )
                b421_log.write_text(log_body, encoding="utf-8")

    finished = _utc_now()
    run_id = out_dir.name

    doc = {
        "schema_version": "1",
        "kind": "traveltrust.release_orchestration.v1",
        "source_spec": "96-15",
        "run_id": run_id,
        "started_at": started,
        "finished_at": finished,
        "executor": args.executor,
        "tiers": tiers,
        "summary": summary,
    }

    out_json = out_dir / "release_orchestration.json"
    out_json.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    readme = out_dir / "README.md"
    bc_note = (
        "Tier **B/C** = `MANUAL_REQUIRED` only (`--manual-tier-bc`).\n\n"
        if args.manual_tier_bc
        else "Tier **B/C** machine gates (default).\n\n"
    )
    readme.write_text(
        f"# {run_id}\n\n"
        "Tier **A** P0 minimal loop: **A1/A2** semiauto (evidence file + min bytes), **A3** B-421.\n\n"
        f"{bc_note}"
        f"- `tier_a_all_pass` = **{summary['tier_a_all_pass']}**\n"
        f"- `tier_bc_all_pass` = **{summary['tier_bc_all_pass']}**\n"
        f"- `tier_bc_scope_manual_only` = **{summary['tier_bc_scope_manual_only']}**\n"
        "- `release_orchestration.json`\n"
        "- `b421.log`\n",
        encoding="utf-8",
    )

    print(f"Wrote {out_json.relative_to(repo_root)} summary={summary}")
    rc = 0
    if summary["steps_fail"]:
        rc = 1
    if args.require_tier_a_all_pass and not summary["tier_a_all_pass"]:
        print("ERROR: tier_a_all_pass is false (--require-tier-a-all-pass)", file=sys.stderr)
        rc = 1
    if args.require_tier_bc_all_pass and not summary["tier_bc_all_pass"]:
        print("ERROR: tier_bc_all_pass is false (--require-tier-bc-all-pass)", file=sys.stderr)
        rc = 1
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
