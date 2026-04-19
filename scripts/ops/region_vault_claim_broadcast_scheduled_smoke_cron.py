#!/usr/bin/env python3
# B-294: cron/CI-friendly shortened broadcast chain smoke (self-test orchestration + optional JSON status).
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

B294_IMPLEMENTATION_TT = "TT-B294-SCHEDULED-BROADCAST-SMOKE-CRON-001"
B294_MOTHER_TABLE = "B-294"
SMOKE_ANCHOR = "14-REGIONVAULT-CLAIM-BROADCAST-SCHEDULED-SMOKE-CRON-V1"
SMOKE_RULE_VERSION = "region_vault_claim_broadcast_scheduled_smoke_cron_v1"


def _repo_root() -> Path:
    # scripts/ops/this_file.py → repo root
    return Path(__file__).resolve().parent.parent


def _ops_dir() -> Path:
    return Path(__file__).resolve().parent


def _smoke_env() -> dict[str, str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(_ops_dir())
    return env


def _step_defs(*, preset: str, with_batch2: bool) -> list[tuple[str, list[str]]]:
    py = str(Path(sys.executable))
    ops = _ops_dir()
    exe = lambda name: str(ops / name)

    minimal: list[tuple[str, list[str]]] = [
        ("execute_selftest", [py, exe("region_vault_claim_broadcast_execute.py"), "self-test"]),
        ("receipt_archive_selftest", [py, exe("region_vault_claim_broadcast_receipt_archive.py"), "self-test"]),
        ("broadcast_batch_json_assert_1", [py, exe("broadcast_batch_json_assert.py"), "1"]),
    ]
    if preset == "minimal":
        return minimal

    cron: list[tuple[str, list[str]]] = [
        ("execute_selftest", [py, exe("region_vault_claim_broadcast_execute.py"), "self-test"]),
        ("nonce_preflight_selftest", [py, exe("region_vault_claim_broadcast_nonce_preflight.py"), "self-test"]),
        ("onchain_reconcile_selftest", [py, exe("region_vault_claim_broadcast_onchain_reconcile.py"), "self-test"]),
        ("receipt_archive_selftest", [py, exe("region_vault_claim_broadcast_receipt_archive.py"), "self-test"]),
        ("receipt_revalidate_selftest", [py, exe("region_vault_claim_broadcast_receipt_revalidate_rpc.py"), "self-test"]),
        ("production_go_gate_selftest", [py, exe("region_vault_claim_production_go_gate.py"), "self-test"]),
        ("evidence_bundle_merkle_selftest", [py, exe("region_vault_claim_evidence_bundle_merkle.py"), "self-test"]),
        ("out_dir_evidence_bundle_b295_selftest", [py, exe("region_vault_claim_broadcast_out_dir_evidence_bundle.py"), "self-test"]),
        ("operator_run_structured_b296_selftest", [py, exe("region_vault_claim_broadcast_operator_run_structured.py"), "self-test"]),
        ("rpc_url_redaction_b297_selftest", [py, exe("region_vault_claim_broadcast_rpc_url_redaction_regression.py"), "self-test"]),
        ("evidence_index_retention_b298_selftest", [py, exe("region_vault_claim_broadcast_evidence_index_retention.py"), "self-test"]),
        ("runbook_version_pin_b299_selftest", [py, exe("region_vault_claim_broadcast_runbook_version_pin.py"), "self-test"]),
        ("mainnet_dual_control_b300_selftest", [py, exe("region_vault_claim_broadcast_mainnet_dual_control.py"), "self-test"]),
        ("stub_integrity_signing_b301_selftest", [py, exe("region_vault_claim_broadcast_stub_integrity_signing.py"), "self-test"]),
        ("eth_send_raw_rate_limit_b302_selftest", [py, exe("region_vault_claim_broadcast_eth_send_raw_rate_limit.py"), "self-test"]),
        ("break_glass_roles_b303_selftest", [py, exe("region_vault_claim_broadcast_break_glass_roles_b303.py"), "self-test"]),
        ("rpc_key_rotation_runbook_b304_selftest", [py, exe("region_vault_claim_broadcast_rpc_key_rotation_runbook_b304.py"), "self-test"]),
        ("rpc_host_allowlist_b305_selftest", [py, exe("region_vault_claim_broadcast_rpc_host_allowlist_b305.py"), "self-test"]),
        ("broadcast_batch_json_assert_1", [py, exe("broadcast_batch_json_assert.py"), "1"]),
    ]
    if with_batch2:
        cron.append(("broadcast_batch_json_assert_2", [py, exe("broadcast_batch_json_assert.py"), "2"]))
    return cron


def run_scheduled_smoke(
    *,
    preset: str,
    with_batch2: bool,
    step_timeout_s: float,
) -> dict[str, Any]:
    root = _repo_root()
    steps_out: list[dict[str, Any]] = []
    blocking: list[str] = []
    t0 = time.monotonic()
    for name, argv in _step_defs(preset=preset, with_batch2=with_batch2):
        s0 = time.monotonic()
        try:
            proc = subprocess.run(
                argv,
                cwd=str(root),
                env=_smoke_env(),
                capture_output=True,
                text=True,
                timeout=step_timeout_s,
                check=False,
            )
        except subprocess.TimeoutExpired as e:
            elapsed_ms = int((time.monotonic() - s0) * 1000)
            msg = f"B294_SCHEDULED_SMOKE step={name} timeout_after_s={step_timeout_s}"
            blocking.append(msg)
            tail = (e.stderr or "")[-4000:] if e.stderr else ""
            steps_out.append(
                {
                    "step": name,
                    "argv": argv,
                    "exit_code": None,
                    "timeout": True,
                    "elapsed_ms": elapsed_ms,
                    "stderr_tail": tail,
                }
            )
            break
        elapsed_ms = int((time.monotonic() - s0) * 1000)
        tail = (proc.stderr or "")[-4000:]
        steps_out.append(
            {
                "step": name,
                "argv": argv,
                "exit_code": proc.returncode,
                "timeout": False,
                "elapsed_ms": elapsed_ms,
                "stderr_tail": tail,
            }
        )
        if proc.returncode != 0:
            blocking.append(f"B294_SCHEDULED_SMOKE step={name} exit={proc.returncode}")
            break
    elapsed_total_ms = int((time.monotonic() - t0) * 1000)
    verdict = "GO" if not blocking else "NO_GO"
    return {
        "anchor": SMOKE_ANCHOR,
        "rule_version": SMOKE_RULE_VERSION,
        "mother_table": B294_MOTHER_TABLE,
        "implementation_tt": B294_IMPLEMENTATION_TT,
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "preset": preset,
        "with_batch2": with_batch2,
        "step_timeout_s": step_timeout_s,
        "smoke_verdict": verdict,
        "smoke_blocking_reasons": blocking,
        "steps": steps_out,
        "elapsed_total_ms": elapsed_total_ms,
        "notes": (
            "B-294: orchestrated self-tests for B-262→B-266 broadcast chain slices (no live CHAIN_RPC_URL required); "
            "cron should treat non-zero process exit or smoke_verdict NO_GO as alert."
        ),
    }


def _cmd_run(args: argparse.Namespace) -> int:
    rep = run_scheduled_smoke(
        preset=str(args.preset),
        with_batch2=bool(args.with_batch2),
        step_timeout_s=float(args.step_timeout_s),
    )
    outp = args.output
    if outp:
        Path(str(outp)).write_text(json.dumps(rep, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {outp}", file=sys.stderr)
    if rep.get("smoke_verdict") != "GO":
        for line in rep.get("smoke_blocking_reasons") or []:
            print(line, file=sys.stderr)
        return 1
    print("region_vault_claim_broadcast_scheduled_smoke_cron: OK", file=sys.stderr)
    return 0


def _cmd_self_test(_: argparse.Namespace) -> int:
    r = run_scheduled_smoke(preset="minimal", with_batch2=False, step_timeout_s=300.0)
    assert r["smoke_verdict"] == "GO", r
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "smoke.json"
        p.write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        loaded = json.loads(p.read_text(encoding="utf-8"))
        assert loaded.get("implementation_tt") == B294_IMPLEMENTATION_TT
    print("region_vault_claim_broadcast_scheduled_smoke_cron self-test OK", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="B-294: scheduled shortened broadcast smoke (self-test chain) for cron/CI."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    run = sub.add_parser("run", help="run orchestrated smoke steps (exit 1 on first failure)")
    run.add_argument(
        "--preset",
        choices=("minimal", "cron"),
        default="cron",
        help="minimal: execute+receipt_archive+batch1 assert; cron: broader B-262…B-266 slice self-tests + batch1 (+ optional batch2)",
    )
    run.add_argument(
        "--with-batch2",
        action="store_true",
        help="after batch-1 JSON assert, also run broadcast_batch_json_assert 2 (cron preset only)",
    )
    run.add_argument(
        "--step-timeout-s",
        type=float,
        default=600.0,
        metavar="SEC",
        help="per-step subprocess wall timeout (default 600)",
    )
    run.add_argument(
        "-o",
        "--output",
        metavar="PATH",
        default=None,
        help="write smoke report JSON (machine-readable)",
    )
    run.set_defaults(func=_cmd_run)

    st = sub.add_parser("self-test", help="minimal smoke run + JSON sanity")
    st.set_defaults(func=_cmd_self_test)

    args = ap.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
