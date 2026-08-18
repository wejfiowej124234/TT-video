#!/usr/bin/env python3
"""Final Reality / Release Certification gate.

Read-only: cite existing PASS_STOP packs + living FTB V8 Cycle + frozen www pin.
Optionally fetch Official live /meta and www identity (default on).
Does not recast L7, bake www, flip TT_PRODUCTION_GO, or require CI-02 B / 1 USDC replay.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PARENT = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-20260812.json"
LATEST = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-LATEST.json"
AMEND = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-V8-CYCLE-20260818.json"
CONSIST = ROOT / "docs" / "runbook" / "TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.json"
WWW = ROOT / "docs" / "runbook" / "TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json"
CERT = ROOT / "docs" / "runbook" / "TT-FINAL-REALITY-RELEASE-CERTIFICATION-LATEST.json"

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
    "timelock": "0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7",
}
PHASE_NOW = "FTB_V8_CYCLE_ACTIVE_FINAL_REALITY_RELEASE_CERT_PASS_WAIT_PRODUCTION_GO_REASSESSMENT"
WWW_SHA = "daa5ae87b8c1af548c6beff6dd3451e5d386acf2"
WWW_BUILD = "2026-08-16T15:15:49Z"
CONSIST_ISSUED = "2026-08-18T03:00:00Z"
CERT_ISSUED = "2026-08-18T03:20:00Z"
LINEAGE_FACTORY = "0x052052f06bfc15cbd63606252db68b4b445aa4f7"
SR_FT = "0xD1DAE665eDc16FCEc7b7530Ead3504A846457147"

WWW_URL = "https://www.web3-ttg.com/api/release-identity"
META_URL = "https://api.web3-ttg.com/meta"


def norm(addr: str) -> str:
    return (addr or "").strip().lower()


def load(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(f"FAIL: missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def addrs(doc: dict) -> dict:
    return ((doc.get("web3") or {}).get("addresses") or {})


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "TravelTrust-FinalRealityCert/1"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    failed: list[str] = []
    parent = load(PARENT)
    latest = load(LATEST)
    amend = load(AMEND)
    consist = load(CONSIST)
    www = load(WWW)
    cert = load(CERT)

    if parent.get("status") != "IMMUTABLE_HISTORICAL_PARENT":
        failed.append(f"parent status={parent.get('status')}")
    if parent.get("do_not_mutate") is not True:
        failed.append("parent do_not_mutate must stay true")
    pa = addrs(parent)
    for k, v in OLD.items():
        if norm(str(pa.get(k) or "")) != norm(v):
            failed.append(f"parent {k} mutated off OLD {v}")
    if norm(str(pa.get("governance_token") or "")) == norm(NEW["governance_token"]):
        failed.append("parent 20260812 mutated to NEW TTG")

    if latest.get("status") != "ACTIVE_UNIQUE_SSOT":
        failed.append(f"living status={latest.get('status')}")
    if latest.get("tt_production_go") != "NO_GO":
        failed.append(f"living tt_production_go={latest.get('tt_production_go')}")
    if latest.get("phase_now") != PHASE_NOW:
        failed.append(f"living phase_now={latest.get('phase_now')}")
    if latest.get("owner_choice") != "NEW_FTB_CYCLE_ABSORB_V8_DO_NOT_OVERWRITE_20260812":
        failed.append("living missing Owner choice")

    la = addrs(latest)
    for k, v in NEW.items():
        if norm(str(la.get(k) or "")) != norm(v):
            failed.append(f"living {k} must stay NEW {v}")
    for k, v in KEEP.items():
        if norm(str(la.get(k) or "")) != norm(v):
            failed.append(f"living KEEP {k} drifted")
        if norm(str(pa.get(k) or "")) != norm(v):
            failed.append(f"parent KEEP {k} drifted")

    if consist.get("status") != "PASS_STOP":
        failed.append(f"consistency status={consist.get('status')}")
    if consist.get("issued_at_utc") != CONSIST_ISSUED:
        failed.append("do not rewrite consistency issued_at_utc")
    if consist.get("tt_production_go") != "NO_GO":
        failed.append("consistency must remain NO_GO")

    live_www = (www.get("live") or {})
    if live_www.get("git_sha") != WWW_SHA:
        failed.append(f"www freeze git_sha={live_www.get('git_sha')}")
    if live_www.get("build_time") != WWW_BUILD:
        failed.append(f"www freeze build_time={live_www.get('build_time')}")

    if cert.get("status") != "FINAL_REALITY_RELEASE_CERTIFICATION_PASS":
        failed.append(f"cert status={cert.get('status')}")
    if cert.get("issued_at_utc") != CERT_ISSUED:
        failed.append(f"cert issued_at_utc={cert.get('issued_at_utc')}")
    if cert.get("tt_production_go") != "NO_GO":
        failed.append("this cert must not flip TT_PRODUCTION_GO")
    if cert.get("blocking_p0_p1") != 0:
        failed.append(f"blocking_p0_p1={cert.get('blocking_p0_p1')}")
    if cert.get("unexplained_drift") != 0:
        failed.append(f"unexplained_drift={cert.get('unexplained_drift')}")
    if cert.get("do_not_mutate_ftb_20260812") is not True:
        failed.append("cert must forbid mutating 20260812")
    bitget = cert.get("token_risk_bitget") or {}
    if bitget.get("must_not_unwind_v8_pin") is not True:
        failed.append("cert Bitget must_not_unwind_v8_pin missing")
    if bitget.get("must_not_become_v8_rollback_condition") is not True:
        failed.append("cert Bitget must_not_become_v8_rollback_condition missing")
    if cert.get("next") != "PRODUCTION_GO_REASSESSMENT_NOT_THIS_TURN":
        failed.append("cert next must remain Production GO reassessment")

    living_bitget = latest.get("token_risk_bitget") or {}
    if living_bitget.get("must_not_unwind_v8_pin") is not True:
        failed.append("living Bitget must_not_unwind_v8_pin missing")

    if amend.get("tt_production_go") != "NO_GO":
        failed.append("amendment must remain NO_GO")
    ladder = amend.get("ladder") or []
    if "FINAL_REALITY_RELEASE_CERTIFICATION_PASS" not in ladder:
        failed.append("amendment ladder missing FINAL_REALITY_RELEASE_CERTIFICATION_PASS")
    if "PRODUCTION_GO_REASSESSMENT_NOT_THIS_TURN" not in ladder:
        failed.append("amendment ladder must keep Production GO as next")

    skip_live = os.environ.get("TT_FINAL_REALITY_CERT_SKIP_LIVE", "").strip() == "1"
    if skip_live:
        print("WARN: TT_FINAL_REALITY_CERT_SKIP_LIVE=1 · live Official fetch skipped")
    else:
        try:
            rid = fetch_json(WWW_URL)
            meta = fetch_json(META_URL)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            failed.append(f"live Official fetch failed: {exc}")
        else:
            if rid.get("git_sha") != WWW_SHA or rid.get("build_time") != WWW_BUILD:
                failed.append(
                    f"live www pin drifted git_sha={rid.get('git_sha')} build_time={rid.get('build_time')}"
                )
            chain = meta.get("chain") or {}
            if str(chain.get("chain_id") or "") != "1":
                failed.append(f"live /meta chain_id={chain.get('chain_id')}")
            c = chain.get("contracts") or {}
            live_map = {
                "governance_token_address": NEW["governance_token"],
                "governor_address": NEW["governor"],
                "primary_market_address": NEW["primary_market"],
                "escrow_factory_address": KEEP["escrow_factory_v2_wired"],
                "fee_router_address": KEEP["fee_router"],
                "timelock_address": KEEP["timelock"],
            }
            for key, expect in live_map.items():
                if norm(str(c.get(key) or "")) != norm(expect):
                    failed.append(f"live /meta {key}={c.get(key)} unexplained vs living FTB {expect}")
            if norm(str(c.get("escrow_factory_address") or "")) == norm(LINEAGE_FACTORY):
                failed.append("live /meta escrow_factory_address is lineage 0x0520 — unexplained Defect")
            if norm(str(c.get("governance_token_address") or "")) == norm(OLD["governance_token"]):
                failed.append("live /meta TTG reverted to OLD — unexplained Drift")
            v2 = norm(str(c.get("escrow_factory_v2_address") or ""))
            if v2 and v2 not in (norm(LINEAGE_FACTORY), norm(KEEP["escrow_factory_v2_wired"])):
                failed.append(f"live /meta escrow_factory_v2_address unexpected {c.get('escrow_factory_v2_address')}")
            sr = norm(str(c.get("settlement_router_address") or ""))
            if sr and sr not in (
                norm(SR_FT),
                norm("0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372"),
            ):
                failed.append(f"live /meta settlement_router_address unexpected {c.get('settlement_router_address')}")

    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_FINAL_REALITY_RELEASE_CERTIFICATION: FAIL", file=sys.stderr)
        return 1

    print("PASS: parent 20260812 IMMUTABLE OLD identity")
    print("PASS: living FTB NEW TTG/PM/Governor + KEEP Wired/FR/Timelock")
    print("PASS: consistency cert PASS_STOP issued_at unchanged")
    print("PASS: Official www freeze pin daa5ae87 / 2026-08-16T15:15:49Z")
    print("PASS: FINAL_REALITY_RELEASE_CERTIFICATION_PASS · blocking_p0_p1=0")
    print("PASS: Bitget HOLD independent · must_not_unwind_v8_pin")
    print("PASS: TT_PRODUCTION_GO remains NO_GO · next=PRODUCTION_GO_REASSESSMENT")
    print("TT_FINAL_REALITY_RELEASE_CERTIFICATION: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
