#!/usr/bin/env python3
"""FTB V8 Cycle absorb gate · file-only.

Confirms Owner choice: NEW FTB Cycle 20260818 is living Active Truth;
parent 20260812 remains immutable OLD identity. Does not recast L7.
Does not claim Final Reality / Release Certification or Production GO.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARENT = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-20260812.json"
LATEST = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-LATEST.json"
AMEND = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-V8-CYCLE-20260818.json"
CERT = ROOT / "docs" / "runbook" / "TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.json"

NEW = {
    "governance_token": "0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602",
    "governor": "0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F",
    "primary_market": "0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2",
}
OLD = {
    "governance_token": "0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A",
    "governor": "0x46Ce671b04d21760e496646bb370ADEbC374ea4d",
    "primary_market": "0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34F56ce",
}
KEEP = {
    "escrow_factory_v2_wired": "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6",
    "fee_router": "0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72",
    "settlement_router": "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372",
    "timelock": "0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7",
}


def norm(addr: str) -> str:
    return (addr or "").strip().lower()


def load(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(f"FAIL: missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def addrs(doc: dict) -> dict:
    return ((doc.get("web3") or {}).get("addresses") or {})


def main() -> int:
    failed: list[str] = []
    parent = load(PARENT)
    latest = load(LATEST)
    amend = load(AMEND)
    cert = load(CERT)

    if parent.get("status") != "IMMUTABLE_HISTORICAL_PARENT":
        failed.append(f"parent status={parent.get('status')}")
    if parent.get("do_not_mutate") is not True:
        failed.append("parent do_not_mutate must be true")
    pa = addrs(parent)
    for k, v in OLD.items():
        if norm(str(pa.get(k) or "")) != norm(v):
            failed.append(f"parent {k} must stay OLD {v}")
    if norm(str(pa.get("governance_token") or "")) == norm(NEW["governance_token"]):
        failed.append("parent mutated to NEW TTG")

    if latest.get("status") != "ACTIVE_UNIQUE_SSOT":
        failed.append(f"living status={latest.get('status')}")
    if latest.get("tt_production_go") != "NO_GO":
        failed.append(f"living tt_production_go={latest.get('tt_production_go')}")
    if latest.get("alignment_stamp") != "20260818T031500Z":
        failed.append(f"living alignment_stamp={latest.get('alignment_stamp')}")
    allowed_phase = {
        "FTB_V8_CYCLE_ACTIVE_WAIT_FINAL_REALITY_RELEASE_CERT",
        "FTB_V8_CYCLE_ACTIVE_FINAL_REALITY_RELEASE_CERT_PASS_WAIT_PRODUCTION_GO_REASSESSMENT",
        "FTB_V8_CYCLE_ACTIVE_PRODUCTION_GO_REASSESSMENT_STOP_REQUIRED_BEFORE_GO_OPEN",
    }
    if latest.get("phase_now") not in allowed_phase:
        failed.append(f"living phase_now={latest.get('phase_now')}")
    if latest.get("owner_choice") != "NEW_FTB_CYCLE_ABSORB_V8_DO_NOT_OVERWRITE_20260812":
        failed.append("living missing Owner choice")

    la = addrs(latest)
    for k, v in NEW.items():
        if norm(str(la.get(k) or "")) != norm(v):
            failed.append(f"living {k} must be NEW {v}")
    if norm(str(la.get("governance_token") or "")) == norm(OLD["governance_token"]):
        failed.append("living FTB still OLD TTG — absorb incomplete")
    if "primary_market_live_implementation" in la:
        failed.append("living addresses must not keep OLD primary_market_live_implementation as ACTIVE")

    for k, v in KEEP.items():
        if norm(str(la.get(k) or "")) != norm(v):
            failed.append(f"living KEEP {k} drifted")
        if norm(str(pa.get(k) or "")) != norm(v):
            failed.append(f"parent KEEP {k} drifted")

    money = (latest.get("web3") or {}).get("money_path")
    if money != "MAINNET_MONEY_PATH_TRACK1_REALITY_SEALED":
        failed.append(f"living money_path={money}")

    min_usdc = (latest.get("web3") or {}).get("primary_market_live_min_purchase_usdc")
    if min_usdc not in (1.0, 1, "1", "1.0"):
        failed.append(f"living min_purchase_usdc={min_usdc}")

    bitget = latest.get("token_risk_bitget") or {}
    if bitget.get("independent_track") is not True or bitget.get("must_not_unwind_v8_pin") is not True:
        failed.append("living Bitget must_not_unwind_v8_pin missing")

    cited = latest.get("v8_consistency_cert_cited_do_not_recast") or {}
    if cited.get("status") != "PASS_STOP":
        failed.append("living must cite consistency cert PASS_STOP")
    if cited.get("issued_at_utc") != "2026-08-18T03:00:00Z":
        failed.append("living must cite cert issued_at_utc 2026-08-18T03:00:00Z without recast")
    if cert.get("status") != "PASS_STOP":
        failed.append(f"cert status={cert.get('status')}")
    if cert.get("issued_at_utc") != "2026-08-18T03:00:00Z":
        failed.append("do not rewrite historical cert issued_at_utc")
    if cert.get("ftb_20260812_mutated_this_cert") is not False:
        failed.append("cert must still record that it did not mutate 20260812")

    if amend.get("owner_choice") != "NEW_FTB_CYCLE_ABSORB_V8_DO_NOT_OVERWRITE_20260812":
        failed.append("amendment owner_choice mismatch")
    if (amend.get("token_risk_bitget") or {}).get("must_not_unwind_v8_pin") is not True:
        failed.append("amendment Bitget must_not_unwind missing")

    parent_path = (latest.get("immutable_parent") or {}).get("machine")
    if parent_path != "docs/runbook/TT-FINAL-TRUTH-BASELINE-20260812.json":
        failed.append("living missing parent pointer")

    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_FTB_V8_CYCLE_ABSORB: FAIL", file=sys.stderr)
        return 1

    print("PASS: parent 20260812 IMMUTABLE OLD TTG/PM/Governor")
    print("PASS: living LATEST NEW TTG/PM/Governor ACTIVE")
    print("PASS: KEEP Wired/Fee/SR/Timelock same identity")
    print("PASS: cited consistency cert PASS_STOP · issued_at unchanged")
    print("PASS: Bitget HOLD independent · must_not_unwind_v8_pin")
    print("PASS: TT_PRODUCTION_GO NO_GO · absorb holds after Final Reality cert")
    print("TT_FTB_V8_CYCLE_ABSORB: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
