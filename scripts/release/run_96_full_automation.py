#!/usr/bin/env python3
"""
96 full automation orchestration (v2 JSON): no MANUAL_REQUIRED — only
PASS | FAIL | N_A | ACCEPTED_RISK | SKIP | NOT_RUN.

- Merges legacy 96-15 Tier A/B/C machine steps (import run_96_15_orchestration._build_steps).
- Appends registry gates from scripts/release/data/96_full_automation_registry.v1.json.

Scope N_A:
  TT_96_SCOPE_BOOKLETS=comma list (e.g. "96-13,96-16") => booklets not listed => N_A.

External evidence (96-02 .. 96-14 etc.):
  TT_96_EVIDENCE_<BOOKLET> = repo-relative or absolute path to file/dir; must exist and meet min_bytes (files) or any for dir.

Accepted risk:
  TT_96_ACCEPTED_RISK_<BOOKLET> = path to JSON {"kind":"accepted_risk","risk_id","rationale"} => ACCEPTED_RISK.

Usage (repo root):
  python scripts/release/run_96_full_automation.py --out-dir evidence/GO_96_fullauto_20260425 \\
    --tier-a1-readme path --tier-a2-markdown path [--require-tier-a-semiauto]
"""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from datetime import datetime, timezone
from importlib import util as importlib_util
from pathlib import Path
from typing import Any

_release_dir = str(Path(__file__).resolve().parent)
if _release_dir not in sys.path:
    sys.path.insert(0, _release_dir)
from win_bash import bash_exe  # noqa: E402


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _tail(s: str, max_chars: int = 4000) -> str:
    if len(s) <= max_chars:
        return s
    return s[-max_chars:]


def _load_orch15_module(repo_root: Path):
    path = repo_root / "scripts" / "release" / "run_96_15_orchestration.py"
    name = "traveltrust_release_orch15_dynamic"
    spec = importlib_util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load run_96_15_orchestration")
    m = importlib_util.module_from_spec(spec)
    sys.modules[name] = m
    spec.loader.exec_module(m)
    return m


def _scope_na(booklet: str) -> tuple[bool, str]:
    raw = os.environ.get("TT_96_SCOPE_BOOKLETS", "").strip()
    if not raw:
        return False, ""
    allowed = {x.strip() for x in raw.split(",") if x.strip()}
    if booklet in allowed:
        return False, ""
    return True, f"booklet {booklet} not in TT_96_SCOPE_BOOKLETS={raw!r}"


def _path_bytes(p: Path) -> int:
    if p.is_file():
        return p.stat().st_size
    if p.is_dir():
        total = 0
        for c in p.rglob("*"):
            if c.is_file():
                total += c.stat().st_size
                if total > 10_000_000:
                    break
        return max(total, 1)
    return 0


def _load_f_row_align(repo_root: Path) -> dict[str, list[str]]:
    p = repo_root / "scripts" / "release" / "data" / "95_f_row_alignment.v1.json"
    if not p.is_file():
        return {}
    try:
        o = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}
    raw = o.get("by_step_id") if isinstance(o, dict) else None
    if not isinstance(raw, dict):
        return {}
    out: dict[str, list[str]] = {}
    for k, v in raw.items():
        if isinstance(v, list):
            out[str(k)] = [str(x) for x in v if isinstance(x, str)]
        elif isinstance(v, str):
            out[str(k)] = [v]
    return out


def _merge_align_hints(sid: str, extra: list[str] | None, f_align: dict[str, list[str]]) -> list[str]:
    a = list(extra or [])
    b = f_align.get(sid, [])
    return list(dict.fromkeys(a + b))


def _validate_accepted_risk_json(p: Path) -> tuple[bool, str]:
    try:
        o = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        return False, f"invalid json: {e}"
    if not isinstance(o, dict):
        return False, "not an object"
    if o.get("kind") != "accepted_risk":
        return False, "kind must be accepted_risk"
    if not isinstance(o.get("risk_id"), str) or not o["risk_id"].strip():
        return False, "risk_id required"
    if not isinstance(o.get("rationale"), str) or len(o["rationale"].strip()) < 8:
        return False, "rationale too short"
    return True, "ok"


def _run_registry_gate(
    repo_root: Path, g: dict[str, Any], evidence_dir: Path, f_align: dict[str, list[str]]
) -> dict[str, Any]:
    bid = str(g.get("booklet", ""))
    gid = str(g["id"])
    title = str(g["title"])
    refs = list(g.get("control_framework_refs") or [])
    gate_class = str(g.get("gate_class", ""))
    _light = os.environ.get("TT_96_LIGHT", "").strip() in ("1", "true", "yes")
    _light_skip = ("subprocess", "page_count", "env_path_or_fail", "r002_report_validate")
    if _light and gate_class in _light_skip:
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            "N_A",
            "96",
            input_source="env:TT_96_LIGHT",
            expected_outcome="heavy gate skipped in light smoke mode",
            refs=refs,
            commands=["env:TT_96_LIGHT"],
            exit_code=None,
            out="",
            err="",
            ev_expected=[],
            booklet=bid,
            n_a_reason="TT_96_LIGHT",
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )
    na, na_reason = _scope_na(bid)
    if na:
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            "N_A",
            "96",
            input_source="env:TT_96_SCOPE_BOOKLETS",
            expected_outcome="booklet excluded from release scope",
            refs=refs,
            commands=["scope:TT_96_SCOPE_BOOKLETS"],
            exit_code=None,
            out="",
            err="",
            ev_expected=[],
            booklet=bid,
            n_a_reason=na_reason,
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    if gate_class == "env_path_or_fail":
        evn = str(g.get("env_var", ""))
        ar_env = str(g.get("accepted_risk_env", ""))
        min_b = int(g.get("min_bytes", 64))
        raw = os.environ.get(evn, "").strip()
        raw_ar = os.environ.get(ar_env, "").strip() if ar_env else ""
        if raw_ar:
            arp = Path(raw_ar)
            if not arp.is_file():
                return _fail_step(
                    gid,
                    g["seq"],
                    title,
                    bid,
                    refs,
                    [f"python:{gid}"],
                    f"{ar_env} not a file: {arp}",
                    evn,
                    f_align=f_align,
                )
            ok, msg = _validate_accepted_risk_json(arp)
            if not ok:
                return _fail_step(
                    gid, g["seq"], title, bid, refs, [f"python:{gid}"], msg, ar_env, f_align=f_align
                )
            return _step_v2(
                gid,
                g["seq"],
                "F",
                title,
                "ACCEPTED_RISK",
                "96",
                input_source=f"env:{ar_env}",
                expected_outcome="accepted_risk JSON valid",
                refs=refs,
                commands=[f"cat:{arp}"],
                exit_code=0,
                out=msg,
                err="",
                ev_expected=[str(arp)],
                booklet=bid,
                accepted_risk_record_path=str(arp),
                f_row_hints=_merge_align_hints(gid, [], f_align),
            )
        if not raw:
            return _fail_step(
                gid,
                g["seq"],
                title,
                bid,
                refs,
                [f"test:{evn}"],
                f"MISSING_EXTERNAL_INPUT: set {evn} or {ar_env}",
                evn,
                f_align=f_align,
            )
        p = Path(raw)
        if not p.is_absolute():
            p = repo_root / p
        if not p.exists():
            return _fail_step(
                gid, g["seq"], title, bid, refs, [f"test:{evn}"], f"missing path: {p}", evn, f_align=f_align
            )
        sz = _path_bytes(p)
        if sz < min_b:
            return _fail_step(
                gid,
                g["seq"],
                title,
                bid,
                refs,
                [f"test:{evn}"],
                f"path too small bytes={sz} < {min_b}",
                evn,
                f_align=f_align,
            )
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            "PASS",
            "96",
            input_source=f"env:{evn}",
            expected_outcome=f"path exists bytes>={min_b}",
            refs=refs,
            commands=[f"stat:{p}"],
            exit_code=0,
            out=f"ok bytes={sz} path={p}",
            err="",
            ev_expected=[str(p.relative_to(repo_root)) if p.is_relative_to(repo_root) else str(p)],
            booklet=bid,
            evidence_path_actual=str(p),
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    if gate_class == "subprocess":
        argv = [str(x) for x in g.get("argv") or []]
        cwd = (repo_root / str(g.get("cwd", "."))).resolve()
        timeout = int(g.get("timeout_sec", 600))
        rel = cwd.relative_to(repo_root) if cwd.is_relative_to(repo_root) else cwd
        inner = f"cd {shlex.quote(str(rel))} && " + " ".join(shlex.quote(a) for a in argv)
        bx = bash_exe()
        cmd_run = [bx, "-lc", inner]
        try:
            proc = subprocess.run(
                cmd_run,
                cwd=repo_root,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                shell=False,
            )
        except Exception as e:
            return _fail_step(
                gid, g["seq"], title, bid, refs, cmd_run + [f"cwd={cwd}"], str(e), str(rel), f_align=f_align
            )
        st = "PASS" if proc.returncode == 0 else "FAIL"
        attr = "96"
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            st,
            attr,
            input_source=f"cwd:{g.get('cwd')}",
            expected_outcome="process exit code 0",
            refs=refs,
            commands=cmd_run,
            exit_code=proc.returncode,
            out=_tail(proc.stdout or ""),
            err=_tail(proc.stderr or ""),
            ev_expected=[],
            booklet=bid,
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    if gate_class == "page_count":
        glob_pat = str(g.get("glob", "frontend/app/**/page.tsx"))
        exp = int(g.get("expected_count", 119))
        pages = list((repo_root / "frontend" / "app").rglob("page.tsx"))
        n = len(pages)
        ok = n == exp
        st = "PASS" if ok else "FAIL"
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            st,
            "96",
            input_source=glob_pat,
            expected_outcome=f"count=={exp}",
            refs=refs,
            commands=["python:rglob(page.tsx)"],
            exit_code=0 if ok else 1,
            out=f"count={n} expected={exp}",
            err="" if ok else "route count mismatch",
            ev_expected=[glob_pat],
            booklet=bid,
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    if gate_class == "booklets_registry":
        out_json = evidence_dir / "96_booklets_registry.json"
        cmd = [
            sys.executable,
            str(repo_root / "scripts" / "release" / "verify_96_booklets_registry.py"),
            "--repo-root",
            str(repo_root),
            "--out",
            str(out_json),
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
        st = "PASS" if proc.returncode == 0 else "FAIL"
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            st,
            "95" if st == "FAIL" else "96",
            input_source="96-*.md read-only size gate (spec tree; see docs/handbook/README.md)",
            expected_outcome="verify_96_booklets_registry exit 0",
            refs=refs,
            commands=cmd,
            exit_code=proc.returncode,
            out=_tail(proc.stdout or ""),
            err=_tail(proc.stderr or ""),
            ev_expected=[str(out_json.relative_to(repo_root))],
            booklet=bid,
            evidence_path_actual=str(out_json) if out_json.is_file() else "",
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    if gate_class == "r002_report_validate":
        evn = str(g.get("report_env", "TT_96_REPORT_JSON"))
        ar_env = str(g.get("accepted_risk_env", ""))
        raw_ar = os.environ.get(ar_env, "").strip() if ar_env else ""
        if raw_ar:
            arp = Path(raw_ar)
            if not arp.is_file():
                return _fail_step(
                    gid,
                    g["seq"],
                    title,
                    bid,
                    refs,
                    [f"python:{gid}"],
                    f"{ar_env} not a file: {arp}",
                    ar_env,
                    f_align=f_align,
                )
            ok, msg = _validate_accepted_risk_json(arp)
            if not ok:
                return _fail_step(
                    gid, g["seq"], title, bid, refs, [f"python:{gid}"], msg, ar_env, f_align=f_align
                )
            return _step_v2(
                gid,
                g["seq"],
                "F",
                title,
                "ACCEPTED_RISK",
                "96",
                input_source=f"env:{ar_env}",
                expected_outcome="accepted_risk JSON valid (R002/report validation waived)",
                refs=refs,
                commands=[f"cat:{arp}"],
                exit_code=0,
                out=msg,
                err="",
                ev_expected=[str(arp)],
                booklet=bid,
                accepted_risk_record_path=str(arp),
                f_row_hints=_merge_align_hints(gid, [], f_align),
            )
        raw = os.environ.get(evn, "").strip()
        if not raw:
            return _fail_step(
                gid,
                g["seq"],
                title,
                bid,
                refs,
                [f"python:{gid}"],
                f"MISSING_EXTERNAL_INPUT: set {evn} or accepted_risk {ar_env}",
                evn,
                f_align=f_align,
            )
        rp = Path(raw)
        if not rp.is_absolute():
            rp = repo_root / rp
        if not rp.is_file():
            return _fail_step(
                gid,
                g["seq"],
                title,
                bid,
                refs,
                [sys.executable, "scripts/validate-regression-report.py", str(rp)],
                f"report path not a file: {rp}",
                evn,
                f_align=f_align,
            )
        cmd = [
            sys.executable,
            str(repo_root / "scripts" / "validate-regression-report.py"),
            str(rp),
            "--validate-orchestration",
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
        st = "PASS" if proc.returncode == 0 else "FAIL"
        return _step_v2(
            gid,
            g["seq"],
            "F",
            title,
            st,
            "R002" if st == "FAIL" else "96",
            input_source=f"env:{evn}",
            expected_outcome="validate-regression-report.py exit 0 with --validate-orchestration",
            refs=refs,
            commands=cmd,
            exit_code=proc.returncode,
            out=_tail(proc.stdout or ""),
            err=_tail(proc.stderr or ""),
            ev_expected=[str(rp.relative_to(repo_root)) if rp.is_relative_to(repo_root) else str(rp)],
            booklet=bid,
            evidence_path_actual=str(rp),
            f_row_hints=_merge_align_hints(gid, [], f_align),
        )

    return _fail_step(
        gid,
        g["seq"],
        title,
        bid,
        refs,
        ["unknown_gate"],
        f"unknown gate_class {gate_class!r}",
        "",
        f_align=f_align,
    )


def _fail_step(
    gid: str,
    seq: int,
    title: str,
    booklet: str,
    refs: list[str],
    commands: list[str],
    msg: str,
    src: str,
    *,
    f_align: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    fa = f_align or {}
    return _step_v2(
        gid,
        seq,
        "F",
        title,
        "FAIL",
        "96",
        input_source=src,
        expected_outcome="machine gate satisfied",
        refs=refs,
        commands=commands,
        exit_code=1,
        out="",
        err=msg,
        ev_expected=[],
        booklet=booklet,
        f_row_hints=_merge_align_hints(gid, [], fa),
    )


def _step_v2(
    sid: str,
    seq: int,
    tier_letter: str,
    title: str,
    status: str,
    attr: str,
    *,
    input_source: str,
    expected_outcome: str,
    refs: list[str],
    commands: list[str],
    exit_code: int | None,
    out: str,
    err: str,
    ev_expected: list[str],
    booklet: str,
    evidence_path_actual: str = "",
    accepted_risk_record_path: str = "",
    n_a_reason: str = "",
    f_row_hints: list[str] | None = None,
) -> dict[str, Any]:
    hints = list(dict.fromkeys(f_row_hints or []))
    o: dict[str, Any] = {
        "id": sid,
        "seq": seq,
        "title": title,
        "tier_hint": tier_letter,
        "machine_runnable": True,
        "status": status,
        "primary_attribution_if_fail": attr,
        "input_source": input_source,
        "expected_outcome": expected_outcome,
        "control_framework_refs": refs,
        "commands": commands,
        "observed_exit_code": exit_code,
        "stdout_tail": _tail(out),
        "stderr_tail": _tail(err),
        "evidence_paths_expected": ev_expected,
        "f_row_hints": hints,
        "96_booklet": booklet,
    }
    if evidence_path_actual:
        o["evidence_path_actual"] = evidence_path_actual
    if accepted_risk_record_path:
        o["accepted_risk_record_path"] = accepted_risk_record_path
    if n_a_reason:
        o["n_a_reason"] = n_a_reason
    return o


def _legacy_to_v2_steps(
    tiers_legacy: list[dict[str, Any]], f_align: dict[str, list[str]]
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for t in tiers_legacy:
        tier = str(t.get("tier", "?"))
        for s in t.get("steps", []):
            if not isinstance(s, dict):
                continue
            st = str(s.get("status", "NOT_RUN"))
            if st == "MANUAL_REQUIRED":
                st = "FAIL"
                s = dict(s)
                s["stderr_tail"] = (s.get("stderr_tail") or "") + "\n[v2] MANUAL_REQUIRED remapped to FAIL"
            sid = str(s["id"])
            hints = _merge_align_hints(sid, [str(x) for x in s.get("f_row_hints") or []], f_align)
            refs = ["SOC2-CC8.1", "ISO27001-A.12"] if tier == "A" else ["ISO27001-A.16"] if tier == "B" else ["OWASP-ASVS-V1"]
            out.append(
                {
                    "id": sid,
                    "seq": int(s["seq"]),
                    "title": str(s["title"]),
                    "tier_hint": tier,
                    "machine_runnable": True,
                    "status": st,
                    "primary_attribution_if_fail": str(s.get("primary_attribution_if_fail") or "96"),
                    "input_source": "legacy_96_15_orchestration",
                    "expected_outcome": "Tier A/B/C contracts per 96-15 machine gates",
                    "control_framework_refs": refs,
                    "commands": [str(x) for x in s.get("commands") or []],
                    "observed_exit_code": s.get("observed_exit_code"),
                    "stdout_tail": _tail(str(s.get("stdout_tail", ""))),
                    "stderr_tail": _tail(str(s.get("stderr_tail", ""))),
                    "evidence_paths_expected": [str(x) for x in s.get("evidence_paths_expected") or []],
                    "f_row_hints": hints,
                    "96_booklet": str(s.get("96_booklet", "")),
                }
            )
    return out


def _regroup_by_tier_hint(flat: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = {}
    for s in flat:
        th = str(s.pop("tier_hint", "Z"))
        buckets.setdefault(th, []).append(s)
    tiers: list[dict[str, Any]] = []
    for letter in sorted(buckets.keys()):
        steps = sorted(buckets[letter], key=lambda x: (int(x["seq"]), x["id"]))
        tiers.append({"tier": letter, "steps": steps})
    return tiers


def _summary_v2(flat: list[dict[str, Any]], *, ack_risk: bool) -> dict[str, Any]:
    def cnt(x: str) -> int:
        return sum(1 for s in flat if s.get("status") == x)

    a_flat = [s for s in flat if str(s.get("id", "")).startswith("TIER-A-")]
    tier_a_all_pass = len(a_flat) == 3 and all(s.get("status") == "PASS" for s in a_flat)

    bc_flat = [s for s in flat if str(s.get("id", "")).startswith(("TIER-B-", "TIER-C-"))]
    tier_bc_all_pass = bool(bc_flat) and all(s.get("status") == "PASS" for s in bc_flat)
    tier_bc_manual = False

    return {
        "steps_total": len(flat),
        "steps_pass": cnt("PASS"),
        "steps_fail": cnt("FAIL"),
        "steps_na": cnt("N_A"),
        "steps_accepted_risk": cnt("ACCEPTED_RISK"),
        "steps_skip": cnt("SKIP"),
        "machine_steps_executed": sum(1 for s in flat if s.get("status") in ("PASS", "FAIL", "ACCEPTED_RISK")),
        "tier_a_all_pass": tier_a_all_pass,
        "tier_bc_all_pass": tier_bc_all_pass,
        "tier_bc_scope_manual_only": tier_bc_manual,
        "any_fail": cnt("FAIL") > 0,
        "any_accepted_risk": cnt("ACCEPTED_RISK") > 0,
        "accepted_risks_production_acknowledged": bool(ack_risk),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--executor", default="local")
    ap.add_argument("--tier-a1-readme", type=Path, default=None)
    ap.add_argument("--tier-a2-markdown", type=Path, default=None)
    ap.add_argument("--require-tier-a-semiauto", action="store_true")
    ap.add_argument("--manual-tier-bc", action="store_true")
    ap.add_argument(
        "--registry",
        type=Path,
        default=None,
        help="Path to 96_full_automation_registry.v1.json (default: scripts/release/data/...)",
    )
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    out_dir = args.out_dir if args.out_dir.is_absolute() else repo_root / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    orch15 = _load_orch15_module(repo_root)
    TierAOptions = orch15.TierAOptions
    a_opts = TierAOptions(
        tier_a1_readme=args.tier_a1_readme,
        tier_a2_markdown=args.tier_a2_markdown,
        require_semiauto=args.require_tier_a_semiauto,
    )
    b421_log = out_dir / "b421.log"
    b421_rel = str(b421_log.relative_to(repo_root))
    tiers_legacy, _leg_summ = orch15._build_steps(
        repo_root,
        b421_rel,
        a_opts,
        automate_tier_bc=not args.manual_tier_bc,
    )

    for t in tiers_legacy:
        for s in t.get("steps", []):
            if isinstance(s, dict) and s.get("id") == "TIER-A-3":
                log_body = (
                    f"exit={s.get('observed_exit_code')}\n=== stdout ===\n{s.get('stdout_tail', '')}\n"
                    f"=== stderr ===\n{s.get('stderr_tail', '')}\n"
                )
                b421_log.write_text(log_body, encoding="utf-8")

    reg_path = args.registry or (repo_root / "scripts" / "release" / "data" / "96_full_automation_registry.v1.json")
    reg = json.loads(reg_path.read_text(encoding="utf-8"))
    gates = reg.get("gates") if isinstance(reg, dict) else None
    if not isinstance(gates, list):
        print("ERROR: registry gates missing", file=sys.stderr)
        return 2

    f_align = _load_f_row_align(repo_root)
    flat = _legacy_to_v2_steps(tiers_legacy, f_align)
    for g in gates:
        if isinstance(g, dict):
            flat.append(_run_registry_gate(repo_root, g, out_dir, f_align))

    tiers_v2 = _regroup_by_tier_hint(flat)
    ack = os.environ.get("TT_96_ACK_ACCEPTED_RISKS_FOR_PRODUCTION", "").strip() in ("1", "true", "yes")
    summary = _summary_v2(flat, ack_risk=ack)

    started = _utc_now()
    finished = _utc_now()
    doc = {
        "schema_version": "2",
        "kind": "traveltrust.release_orchestration.v2",
        "source_spec": "96-automation-v2",
        "run_id": out_dir.name,
        "started_at": started,
        "finished_at": finished,
        "executor": args.executor,
        "control_taxonomy_note": str(reg.get("control_taxonomy_note", "")),
        "tiers": tiers_v2,
        "summary": summary,
    }
    out_json = out_dir / "release_orchestration.json"
    out_json.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out_json} summary={summary}")
    if summary["steps_fail"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
