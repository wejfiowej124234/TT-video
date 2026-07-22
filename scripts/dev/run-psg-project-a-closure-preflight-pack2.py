#!/usr/bin/env python3
"""Project A closure preflight pack-2 (read-only / prep-only).

1) S7 Input Source Checker — Candidate vs OLD_FCG (does NOT rewrite reader)
2) FG Capture Readiness Scanner
3) Settlement Final Capture Validator (script + dry readiness; NO finalize)
4) L1–L5 schema spot-check for Candidate pointer packs
5) Post-S7 result template (empty shell)
6) Evidence chain health + runtime freshness tick

Forbidden: Bridge execute · S7 · finalize · Freeze change · Project B

  python scripts/dev/run-psg-project-a-closure-preflight-pack2.py
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PIN = "PSG-REL-20260720-WEB3-CAND-V2"
BASELINE = "v311_fund_safety_candidate_v2"
ETA = "2026-07-21T18:10:48Z"
ELAPSED = "2026-07-21T18:06:48Z"
SEPOLIA = 11155111

CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
PENDING = ROOT / "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending"
FG_ROOT = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2/fg-cases"
CAND = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
OPS = CAND / "money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"

S7_PENDING = [
    "L1-PRODUCT-VALIDATION-LATEST.json",
    "L2-DATA-VALIDATION-HARDENED-LATEST.json",
    "L3-SECURITY-VALIDATION-HARDENED-LATEST.json",
    "L4-OPERATIONS-VALIDATION-LATEST.json",
    "L5-FG-WEB3-EMPIRICAL-LATEST.json",
]

CANDIDATE_POINTERS = {
    "L1": "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
    "L2": "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
    "L3": "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
    "L4": "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
    "L5": "evidence/GO_fg15_observation_48h_candidate_v2/L5-S7-FINAL-INPUT-LATEST.json",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256(path: Path) -> str | None:
    if not path.is_file():
        return None
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def classify_pending(doc: dict | None, name: str) -> str:
    if doc is None:
        return "MISSING"
    blob = json.dumps(doc, ensure_ascii=False).lower()
    baseline = str(doc.get("active_deploy_baseline") or doc.get("baseline_under_test") or "")
    pin = str(doc.get("psg_release_version") or "")
    if BASELINE in baseline or BASELINE in blob or PIN.lower() in blob or "candidate_v2" in blob or "fund_safety_candidate" in blob:
        # still may be mixed — require explicit candidate baseline when present
        if baseline and BASELINE not in baseline and "candidate" not in baseline.lower():
            return "OLD_FCG"
        if PIN in pin or BASELINE in baseline or "web3-candidate-v2" in blob or "cand-v2" in blob:
            return "CANDIDATE_V2"
        # Hardened / FCG historical language
        if "hardened" in blob or "fcg-v2" in blob or "phase2_fcg" in name.lower():
            if BASELINE not in baseline and PIN not in pin:
                return "OLD_FCG"
        if baseline == BASELINE or pin == PIN:
            return "CANDIDATE_V2"
        # default: pending under FCG tree without Candidate pin → OLD
        return "OLD_FCG"
    return "OLD_FCG"


def s7_input_source_check(recorded: str) -> dict[str, Any]:
    rows = []
    sources_actual = set()
    for name in S7_PENDING:
        p = PENDING / name
        doc = None
        if p.is_file():
            try:
                doc = json.loads(p.read_text(encoding="utf-8"))
            except Exception as e:
                rows.append(
                    {
                        "pending_file": name,
                        "exists": True,
                        "parse_ok": False,
                        "error": str(e),
                        "actual_source": "INVALID_JSON",
                    }
                )
                sources_actual.add("INVALID_JSON")
                continue
        actual = classify_pending(doc, name) if doc is not None else "MISSING"
        sources_actual.add(actual)
        rows.append(
            {
                "pending_file": name,
                "exists": p.is_file(),
                "parse_ok": doc is not None,
                "sha256": sha256(p),
                "active_deploy_baseline": (doc or {}).get("active_deploy_baseline")
                or (doc or {}).get("baseline_under_test"),
                "recorded_utc": (doc or {}).get("recorded_utc"),
                "verdict": (doc or {}).get("verdict") or (doc or {}).get("status"),
                "actual_source": actual,
                "expected_source": "CANDIDATE_V2",
                "match": actual == "CANDIDATE_V2",
            }
        )

    pointers = []
    for layer, rel in CANDIDATE_POINTERS.items():
        p = ROOT / rel
        pointers.append(
            {
                "layer": layer,
                "pointer": rel,
                "exists": p.is_file(),
                "sha256": sha256(p),
            }
        )

    all_candidate = sources_actual == {"CANDIDATE_V2"}
    any_old = "OLD_FCG" in sources_actual or "MISSING" in sources_actual or "INVALID_JSON" in sources_actual
    if all_candidate:
        status = "READY"
    else:
        status = "BLOCKED"

    doc = {
        "schema": "traveltrust.psg_s7_input_source_check.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "mode": "READ_ONLY",
        "fix_reader": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
        "expected": "CANDIDATE_V2",
        "actual_sources_seen": sorted(sources_actual),
        "status": status,
        "blocked_reason": None
        if status == "READY"
        else "S7 pending inputs are not exclusively Candidate v2 — blind Recalculate unsafe",
        "pending_rows": rows,
        "candidate_pointers": pointers,
        "s7_reader_path": "evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/",
        "deferred_bridge": "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-READER-BRIDGE-DEFERRED-LATEST.json",
        "note": "Checker only — WAIT_FOR_FINAL_WINDOW to bridge; do not rewrite S7 now",
    }
    write_json(CONSOL / "S7-INPUT-SOURCE-CHECK-LATEST.json", doc)
    return doc


def fg_capture_readiness(recorded: str) -> dict[str, Any]:
    required = [
        "dependency",
        "final_verification_command",
        "expected_output",
        "owner",
        "evidence_path",
        "capture",
        "blocking_classification",
    ]
    cases = []
    ready = 0
    missing_total = 0
    for n in range(1, 16):
        fid = f"FG-{n:02d}"
        tpath = FG_ROOT / fid / "FINAL-CAPTURE-TEMPLATE-LATEST.json"
        emap = FG_ROOT / fid / "EVIDENCE-MAP-LATEST.json"
        st = FG_ROOT / fid / "STATUS-LATEST.json"
        miss = []
        if not tpath.is_file():
            miss.append("template_file")
            j = {}
        else:
            j = json.loads(tpath.read_text(encoding="utf-8"))
            for k in required:
                if not j.get(k):
                    miss.append(k)
            # evidence_path string may point to future finalize dir — parent check
            ep = j.get("evidence_path") or ""
            if ep and "*" not in ep and not (ROOT / ep).exists() and not ep.endswith("/"):
                # allow missing final evidence file pre-ETA
                if "FINAL" in ep.upper() or "finalize" in ep:
                    pass
                elif not (ROOT / ep).exists():
                    miss.append("evidence_path_target")
        if not emap.is_file():
            miss.append("evidence_map_file")
        if not st.is_file():
            miss.append("status_file")
        ok = not miss
        if ok:
            ready += 1
        missing_total += len(miss)
        cases.append(
            {
                "id": fid,
                "ready": ok,
                "missing": miss,
                "dependency": j.get("dependency"),
                "owner": j.get("owner"),
                "blocking_classification": j.get("blocking_classification"),
                "command_present": bool(j.get("final_verification_command")),
            }
        )
    doc = {
        "schema": "traveltrust.psg_fg_capture_readiness.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "verdict": "READY" if ready == 15 else "NOT_READY",
        "ready": f"{ready}/15",
        "missing_field_count": missing_total,
        "empirical_pass_still": "0/15",
        "equals_l5_pass": False,
        "cases": cases,
        "note": "Template readiness only — not FGCASE PASS",
    }
    write_json(CONSOL / "FG-CAPTURE-READINESS-LATEST.json", doc)
    write_json(FG_ROOT / "CAPTURE-READINESS-LATEST.json", doc)
    return doc


def settlement_final_capture_validator_prep(recorded: str) -> dict[str, Any]:
    """Write validator script + readiness JSON. Does not run finalize."""
    script = ROOT / "scripts/dev/check-psg-settlement-final-capture.py"
    script.write_text(
        r'''#!/usr/bin/env python3
"""Post-Settlement-finalize capture validator (Project A).

Run ONLY after finalize has written money-path/finalize-*/ evidence.
Does NOT broadcast / does NOT flip gates.

  python scripts/dev/check-psg-settlement-final-capture.py
  python scripts/dev/check-psg-settlement-final-capture.py --finalize-dir PATH
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAND = ROOT / "evidence/GO_fg15_observation_48h_candidate_v2"
CONSOL = ROOT / "evidence/PSG-EVIDENCE-CONSOLIDATION"
OPS = CAND / "money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json"
OUT = CONSOL / "SETTLEMENT-FINAL-CAPTURE-READY-LATEST.json"
SEPOLIA = 11155111


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_rpc():
    for k in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
        if os.environ.get(k):
            return os.environ[k]
    envf = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
    if not envf.exists():
        return None
    for line in envf.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.split("#", 1)[0].strip()
        if "=" in line:
            k, v = line.split("=", 1)
            if k.strip() in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
                return v.strip().strip('"').strip("'")
    return None


def cast(*args, rpc=None):
    cmd = ["cast", *args]
    if rpc:
        cmd += ["--rpc-url", rpc]
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=90).strip()
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--finalize-dir", default="")
    args = ap.parse_args()
    recorded = utc_now()
    issues = []
    finalize_dir = Path(args.finalize_dir) if args.finalize_dir else None
    if not finalize_dir:
        cands = sorted((CAND / "money-path").glob("finalize-*"))
        finalize_dir = cands[-1] if cands else None

    ops = json.loads(OPS.read_text(encoding="utf-8")) if OPS.exists() else {}
    checks = {
        "finalize_dir_present": bool(finalize_dir and finalize_dir.is_dir()),
        "ops_standby_present": OPS.is_file(),
        "chain_id_ok": None,
        "receipts": [],
    }
    if not checks["finalize_dir_present"]:
        issues.append("no finalize-* directory yet — run after settlement finalize")

    rpc = load_rpc()
    if rpc:
        cid = cast("chain-id", rpc=rpc)
        try:
            checks["chain_id_ok"] = int(str(cid).strip()) == SEPOLIA
        except Exception:
            checks["chain_id_ok"] = False
            issues.append("chain_id probe failed")
    else:
        issues.append("RPC not configured")

    # Scan finalize dir for tx hashes / json
    if finalize_dir and finalize_dir.is_dir():
        for p in sorted(finalize_dir.rglob("*")):
            if p.suffix.lower() in (".json", ".log", ".txt"):
                text = p.read_text(encoding="utf-8", errors="replace")
                checks["receipts"].append(
                    {
                        "path": p.relative_to(ROOT).as_posix(),
                        "bytes": p.stat().st_size,
                        "mentions_tx": ("0x" in text and len(text) > 20),
                    }
                )
        if not checks["receipts"]:
            issues.append("finalize dir empty of json/log/txt")

    # Expected ops ids present in standby (precondition knowledge)
    ops_ok = bool(ops.get("ops") and ops.get("settlement_eta_unix"))
    if not ops_ok:
        issues.append("ops standby incomplete")

    ready = checks["finalize_dir_present"] and not issues
    # If no finalize yet, status is PREP_ARMED not READY
    if not checks["finalize_dir_present"]:
        status = "PREP_ARMED_WAIT_FINALIZE"
        ready = False
    elif issues:
        status = "BLOCKED"
    else:
        status = "READY"

    out = {
        "schema": "traveltrust.psg_settlement_final_capture_ready.v1",
        "recorded_utc": recorded,
        "status": status,
        "ready": ready,
        "equals_l5_pass": False,
        "executed_finalize": False,
        "finalize_dir": finalize_dir.relative_to(ROOT).as_posix() if finalize_dir and finalize_dir.exists() else None,
        "checks": checks,
        "issues": issues,
        "expected_post_finalize_fields": [
            "tx_hash_ready",
            "tx_hash_distable",
            "tx_hash_distribute",
            "block",
            "receipt_status",
            "events",
            "escrow_state",
            "settlement_state",
            "fee_route",
            "db_or_indexer_cite",
        ],
        "note": "Validator prep/runtime — does not broadcast",
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"status": status, "ready": ready, "issues": issues}, indent=2))
    print("TT_PSG_SETTLEMENT_FINAL_CAPTURE: " + status)
    return 0 if status in ("READY", "PREP_ARMED_WAIT_FINALIZE") else 2


if __name__ == "__main__":
    raise SystemExit(main())
''',
        encoding="utf-8",
    )
    # run prep mode now (no finalize dir → PREP_ARMED)
    subprocess.check_call(["python", str(script)], cwd=str(ROOT))
    ready_doc = json.loads((CONSOL / "SETTLEMENT-FINAL-CAPTURE-READY-LATEST.json").read_text(encoding="utf-8"))
    meta = {
        "schema": "traveltrust.psg_settlement_final_capture_validator_prep.v1",
        "recorded_utc": recorded,
        "validator_script": "scripts/dev/check-psg-settlement-final-capture.py",
        "prep_status": ready_doc.get("status"),
        "execute_finalize_now": False,
        "equals_l5_pass": False,
        "usage_after_eta": (
            "TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1 "
            "bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh && "
            "python scripts/dev/check-psg-settlement-final-capture.py"
        ),
    }
    write_json(CONSOL / "SETTLEMENT-FINAL-CAPTURE-VALIDATOR-PREP-LATEST.json", meta)
    return meta


def schema_spotcheck(recorded: str) -> dict[str, Any]:
    paths = [
        "evidence/PSG-L1-product/STATUS-LATEST.json",
        "evidence/PSG-L1-product/L1-S7-FINAL-INPUT-LATEST.json",
        "evidence/PSG-L2-data/PSG-L2-DATA-CERTIFICATION-BUNDLE-LATEST.json",
        "evidence/PSG-L2-data/L2-S7-FINAL-INPUT-LATEST.json",
        "evidence/PSG-L3-security/STATUS-LATEST.json",
        "evidence/PSG-L3-security/L3-S7-FINAL-INPUT-LATEST.json",
        "evidence/PSG-L4-operations/STATUS-LATEST.json",
        "evidence/PSG-L4-operations/L4-S7-FINAL-INPUT-LATEST.json",
        "evidence/GO_fg15_observation_48h_candidate_v2/L5-S7-FINAL-INPUT-LATEST.json",
        "evidence/GO_fg15_observation_48h_candidate_v2/FG15-CANDIDATE-V2-STATUS-LATEST.json",
    ]
    rows = []
    fail = 0
    for rel in paths:
        p = ROOT / rel
        row: dict[str, Any] = {"path": rel, "exists": p.is_file()}
        if not p.is_file():
            fail += 1
            row["ok"] = False
            rows.append(row)
            continue
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
            row["parse_ok"] = True
            row["schema"] = j.get("schema")
            row["recorded_utc"] = j.get("recorded_utc")
            row["psg_release_version"] = j.get("psg_release_version")
            row["ok"] = bool(j.get("schema"))
            if not row["ok"]:
                fail += 1
        except Exception as e:
            row["parse_ok"] = False
            row["error"] = str(e)
            row["ok"] = False
            fail += 1
        rows.append(row)
    doc = {
        "schema": "traveltrust.psg_s7_input_schema_spotcheck.v1",
        "recorded_utc": recorded,
        "verdict": "PASS" if fail == 0 else "FAIL",
        "fail_count": fail,
        "rows": rows,
        "equals_psg_complete": False,
        "note": "Candidate pointer/schema spot-check — L5 final evidence file still post-ETA",
    }
    write_json(CONSOL / "S7-INPUT-SCHEMA-SPOTCHECK-LATEST.json", doc)
    return doc


def post_s7_result_template(recorded: str) -> dict[str, Any]:
    doc = {
        "schema": "traveltrust.psg_recalculate_result_template.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "deploy_baseline": BASELINE,
        "status": "TEMPLATE_ONLY",
        "executed_s7": False,
        "equals_psg_complete": False,
        "layers": {
            "L1": {"result": None, "residual": None},
            "L2": {"result": None, "residual": None},
            "L3": {"result": None, "residual": None},
            "L4": {"result": None, "residual": None},
            "L5": {"result": None, "residual": None},
        },
        "recommendation": None,
        "recommendation_enum": ["FORMAL_BASELINE_READY", "BLOCKED", "NEEDS_OWNER"],
        "honesty": {
            "formal_baseline_ready_ne_psg_complete": True,
            "psg_complete_requires_all_five_pass": True,
        },
        "fill_after": "run-psg-completion-matrix-recalculate.sh",
        "note": "Empty shell — fill only after real S7",
    }
    write_json(CONSOL / "PSG-RECALCULATE-RESULT-TEMPLATE-LATEST.json", doc)
    return doc


def evidence_chain_health(recorded: str) -> dict[str, Any]:
    catalog_path = CONSOL / "EVIDENCE-CATALOG-LATEST.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    broken = []
    checked = 0
    for pack in catalog.get("packs", {}).values():
        for a in pack.get("artifacts", []):
            checked += 1
            if not (ROOT / a).exists():
                broken.append(a)
            if len(broken) > 25:
                break
        if len(broken) > 25:
            break
    # PCR refs
    pcr_issues = []
    for key in ("closure_preflight_pcr", "latest_maintain_pcr", "steady_state_since_pcr"):
        st = json.loads((CONSOL / "STATUS-LATEST.json").read_text(encoding="utf-8"))
        rel = st.get(key)
        if rel and not (ROOT / rel).exists():
            pcr_issues.append(rel)
    doc = {
        "schema": "traveltrust.psg_evidence_chain_health.v1",
        "recorded_utc": recorded,
        "verdict": "PASS" if not broken and not pcr_issues else "FAIL",
        "artifacts_checked": checked,
        "broken_links": broken,
        "pcr_ref_issues": pcr_issues,
        "catalog_totals": catalog.get("totals"),
        "equals_psg_complete": False,
    }
    write_json(CONSOL / "EVIDENCE-CHAIN-HEALTH-LATEST.json", doc)
    return doc


def runtime_freshness(recorded: str) -> dict[str, Any]:
    # reuse cast lightly
    def load_rpc():
        for k in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
            if os.environ.get(k):
                return os.environ[k]
        envf = ROOT / "scripts/dev/.env.phase2-chain-deploy.local"
        if not envf.exists():
            return None
        for line in envf.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.split("#", 1)[0].strip()
            if "=" in line:
                k, v = line.split("=", 1)
                if k.strip() in ("CHAIN_RPC_URL", "SEPOLIA_RPC_URL", "ETH_RPC_URL"):
                    return v.strip().strip('"').strip("'")
        return None

    def cast(*args, rpc=None):
        cmd = ["cast", *args]
        if rpc:
            cmd += ["--rpc-url", rpc]
        try:
            return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=60).strip()
        except Exception:
            return None

    rpc = load_rpc()
    out: dict[str, Any] = {
        "schema": "traveltrust.psg_runtime_freshness_tick.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "equals_l5_pass": False,
        "verdict": "SKIPPED",
    }
    if not rpc:
        write_json(CONSOL / "RUNTIME-FRESHNESS-TICK-LATEST.json", out)
        return out
    cid = cast("chain-id", rpc=rpc)
    block = cast("block-number", rpc=rpc)
    try:
        out["chain_id"] = int(str(cid).strip())
    except Exception:
        out["chain_id"] = None
        cid = cast("chain-id", rpc=rpc)
        try:
            out["chain_id"] = int(str(cid).strip())
        except Exception:
            out["chain_id"] = None
    try:
        out["block_number"] = int(str(block).strip())
    except Exception:
        out["block_number"] = None
    addrs = {
        "escrow_factory_v2": "0x6e9a4c4032d2d0c91e643faa5dea45ba7f86bdef",
        "settlement_router": "0x5a6df184e9c6b1285f8beb50a438d82d5f094d6a",
        "fee_router": "0xf406e6f1277b990544d4f0556421c3c14df0ab28",
        "timelock": "0x462402082b395f218ffb3634ec0611e39bdd504c",
    }
    out["contracts_have_code"] = {}
    ok = out["chain_id"] == SEPOLIA
    for role, addr in addrs.items():
        code = cast("code", addr, rpc=rpc)
        has = bool(code and code != "0x")
        out["contracts_have_code"][role] = {"address": addr, "has_code": has}
        ok = ok and has
    out["verdict"] = "FRESH_PASS" if ok else "FRESH_FAIL"
    try:
        import urllib.request

        with urllib.request.urlopen("http://127.0.0.1:8080/meta", timeout=2) as resp:
            meta = json.loads(resp.read().decode("utf-8"))
            chain = meta.get("chain") if isinstance(meta, dict) else None
            out["meta_probe"] = {
                "reachable": True,
                "chain_id": (chain or {}).get("chain_id") if isinstance(chain, dict) else None,
            }
    except Exception:
        out["meta_probe"] = {"reachable": False}
    write_json(CONSOL / "RUNTIME-FRESHNESS-TICK-LATEST.json", out)
    return out


def next_pcr() -> str:
    nums = []
    for p in (ROOT / "registry/psg-change-records").glob("PCR-20260720-*.yaml"):
        try:
            nums.append(int(p.stem.split("-")[-1]))
        except ValueError:
            pass
    return f"PCR-20260720-{(max(nums) + 1) if nums else 54:03d}"


def main() -> int:
    recorded = utc_now()
    src = s7_input_source_check(recorded)
    fg = fg_capture_readiness(recorded)
    settle = settlement_final_capture_validator_prep(recorded)
    schema = schema_spotcheck(recorded)
    tmpl = post_s7_result_template(recorded)
    chain = evidence_chain_health(recorded)
    fresh = runtime_freshness(recorded)

    rollup = {
        "schema": "traveltrust.psg_project_a_closure_preflight_pack2.v1",
        "recorded_utc": recorded,
        "psg_release_version": PIN,
        "mode": "STEADY_STATE_WAIT_ETA",
        "project_b": "FROZEN",
        "executed_finalize": False,
        "executed_bridge": False,
        "executed_s7": False,
        "equals_psg_complete": False,
        "checks": {
            "s7_input_source_check": src["status"],
            "fg_capture_readiness": fg["verdict"],
            "settlement_final_capture_validator": settle["prep_status"],
            "s7_input_schema_spotcheck": schema["verdict"],
            "post_s7_result_template": tmpl["status"],
            "evidence_chain_health": chain["verdict"],
            "runtime_freshness": fresh["verdict"],
        },
        "critical": {
            "id": "S7-INPUT-SOURCE-CHECK",
            "status": src["status"],
            "actual": src["actual_sources_seen"],
            "action": "WAIT_FOR_FINAL_WINDOW — bridge after finalize, do not rewrite reader now",
        },
        "artifacts": [
            "evidence/PSG-EVIDENCE-CONSOLIDATION/S7-INPUT-SOURCE-CHECK-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/FG-CAPTURE-READINESS-LATEST.json",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/SETTLEMENT-FINAL-CAPTURE-VALIDATOR-PREP-LATEST.json",
            "scripts/dev/check-psg-settlement-final-capture.py",
            "evidence/PSG-EVIDENCE-CONSOLIDATION/PSG-RECALCULATE-RESULT-TEMPLATE-LATEST.json",
        ],
    }
    write_json(CONSOL / "PROJECT-A-CLOSURE-PREFLIGHT-PACK2-LATEST.json", rollup)

    pcr_id = next_pcr()
    (ROOT / "registry/psg-change-records" / f"{pcr_id}.yaml").write_text(
        f"""schema: traveltrust.psg_change_record.v1
id: {pcr_id}
title: Project A preflight pack-2 — S7 source check · FG readiness · Settlement capture validator prep
recorded_utc: "{recorded}"
owner: Sebastian Ward
status: RECORDED
class: governance_gate_docs
mode: STEADY_STATE_WAIT_ETA

summary: >
  Read-only/prep-only. S7 Input Source Checker (BLOCKED if OLD_FCG);
  FG Capture Readiness Scanner; Settlement Final Capture Validator script prepared
  (no finalize); schema spot-check; Post-S7 result template; evidence chain +
  freshness ticks. No Bridge execute, no S7, no Freeze/path rewrite, no Project B.

active_ssot: {PIN}
deploy_baseline: {BASELINE}

checks:
  s7_input_source: {src["status"]}
  fg_capture_readiness: {fg["verdict"]}
  settlement_validator_prep: {settle["prep_status"]}
  schema_spotcheck: {schema["verdict"]}
  evidence_chain: {chain["verdict"]}
  runtime_freshness: {fresh["verdict"]}

gates_not_triggered:
  - settlement_finalize
  - s7_reader_rewrite
  - candidate_evidence_bridge_execute
  - psg_recalculate
  - formal_release_baseline
  - project_b_start

post_eta_ladder:
  - settlement_finalize
  - settlement_final_capture_validator
  - candidate_evidence_bridge
  - verify_s7_input_source_check_READY
  - fg_capture_fill
  - l5_final_evidence
  - psg_recalculate
  - formal_release_baseline
""",
        encoding="utf-8",
    )

    st_path = CONSOL / "STATUS-LATEST.json"
    if st_path.exists():
        st = json.loads(st_path.read_text(encoding="utf-8"))
        st.update(
            {
                "recorded_utc": recorded,
                "closure_preflight_pack2_pcr": f"registry/psg-change-records/{pcr_id}.yaml",
                "s7_input_source_check": src["status"],
                "s7_reader_bridge": st.get("s7_reader_bridge")
                or {"status": "WAIT_FOR_FINAL_WINDOW"},
                "psg_complete": False,
            }
        )
        if isinstance(st.get("s7_reader_bridge"), dict):
            st["s7_reader_bridge"]["source_check"] = src["status"]
            st["s7_reader_bridge"]["status"] = "WAIT_FOR_FINAL_WINDOW"
        write_json(st_path, st)

    print(
        json.dumps(
            {
                "pcr": pcr_id,
                "s7_input_source": src["status"],
                "actual_sources": src["actual_sources_seen"],
                "fg_capture_readiness": fg["ready"],
                "settlement_validator": settle["prep_status"],
                "schema": schema["verdict"],
                "evidence_chain": chain["verdict"],
                "runtime": fresh["verdict"],
                "equals_psg_complete": False,
            },
            indent=2,
        )
    )
    print("TT_PSG_PROJECT_A_CLOSURE_PREFLIGHT_PACK2: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
