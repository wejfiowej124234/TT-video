#!/usr/bin/env python3
"""Production GO reassessment gate (read-only classify).

File-only by default. Does not recast L7, bake www, execute CI-02 B,
repeat 1 USDC, or flip TT_PRODUCTION_GO.
Optional live Official identity check matches Final Reality cert (cite, do not recast).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CERT = ROOT / "docs" / "runbook" / "TT-FINAL-REALITY-RELEASE-CERTIFICATION-LATEST.json"
LATEST = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-LATEST.json"
AMEND = ROOT / "docs" / "runbook" / "TT-FINAL-TRUTH-BASELINE-V8-CYCLE-20260818.json"
PACK = ROOT / "docs" / "runbook" / "TT-PRODUCTION-GO-REASSESSMENT-LATEST.json"
WWW = ROOT / "docs" / "runbook" / "TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json"

CLASSES = {
    "REQUIRED_BEFORE_GO",
    "OWNER_ACCEPTED_ED",
    "DEFERRED_POST_GO",
    "ALREADY_CLOSED",
}
STOP_STATUS = "TT_PRODUCTION_GO_REASSESSMENT_STOP"
STOP_PHASE = "FTB_V8_CYCLE_ACTIVE_PRODUCTION_GO_REASSESSMENT_STOP_REQUIRED_BEFORE_GO_OPEN"
WWW_URL = "https://www.web3-ttg.com/api/release-identity"
META_URL = "https://api.web3-ttg.com/meta"
WWW_SHA = "daa5ae87b8c1af548c6beff6dd3451e5d386acf2"
WWW_BUILD = "2026-08-16T15:15:49Z"
NEW = {
    "governance_token_address": "0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602",
    "governor_address": "0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F",
    "primary_market_address": "0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2",
}
LINEAGE = "0x052052f06bfc15cbd63606252db68b4b445aa4f7"
WIRED = "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def norm(addr: str) -> str:
    return addr.lower()


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "tt-go-reassessment/1"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    failed: list[str] = []
    for path in (CERT, LATEST, AMEND, PACK, WWW):
        if not path.is_file():
            failed.append(f"missing {path.relative_to(ROOT)}")
    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_PRODUCTION_GO_REASSESSMENT: FAIL", file=sys.stderr)
        return 1

    cert = load(CERT)
    latest = load(LATEST)
    amend = load(AMEND)
    pack = load(PACK)

    if cert.get("status") != "FINAL_REALITY_RELEASE_CERTIFICATION_PASS":
        failed.append(f"cert status={cert.get('status')}")
    if cert.get("issued_at_utc") != "2026-08-18T03:20:00Z":
        failed.append("must not recast Final Reality cert issued_at_utc")
    if cert.get("tt_production_go") != "NO_GO":
        failed.append("cert must remain NO_GO")
    if cert.get("unexplained_drift") != 0:
        failed.append("cert unexplained_drift must stay 0")

    if pack.get("machine_key") != "TT_PRODUCTION_GO_REASSESSMENT":
        failed.append("pack machine_key")
    if pack.get("status") != STOP_STATUS:
        failed.append(f"pack status={pack.get('status')} (this round must be honest STOP)")
    if pack.get("read_only") is not True:
        failed.append("pack must be read_only")
    if pack.get("tt_production_go") != "NO_GO":
        failed.append("pack must not flip TT_PRODUCTION_GO")
    if pack.get("owner_production_go_verdict") != "NOT_THIS_TURN":
        failed.append("Owner GO verdict must remain NOT_THIS_TURN")
    if pack.get("hard_gate") == "PASS":
        failed.append("hard_gate=PASS is forbidden while this STOP pack is honest")
    if pack.get("hard_gate") != "REFUSED":
        failed.append(f"pack hard_gate={pack.get('hard_gate')} must be REFUSED this round")
    if pack.get("unexplained_drift") != 0:
        failed.append("pack unexplained_drift must be 0")

    residuals = pack.get("residuals") or []
    counts = {c: 0 for c in CLASSES}
    ids: list[str] = []
    for row in residuals:
        klass = row.get("class")
        rid = row.get("id")
        if klass not in CLASSES:
            failed.append(f"residual {rid} class={klass}")
            continue
        counts[klass] += 1
        if rid in ids:
            failed.append(f"duplicate residual id {rid}")
        ids.append(str(rid))
        if row.get("repair_this_round") is not False:
            failed.append(f"{rid} repair_this_round must be false on a read-only round")

    expect_map = {
        "REQUIRED_BEFORE_GO": int(pack.get("required_before_go") or -1),
        "OWNER_ACCEPTED_ED": int(pack.get("owner_accepted_ed") or -1),
        "DEFERRED_POST_GO": int(pack.get("deferred_post_go") or -1),
        "ALREADY_CLOSED": int(pack.get("already_closed") or -1),
    }
    for klass, expect in expect_map.items():
        if counts[klass] != expect:
            failed.append(f"count {klass}={counts[klass]} vs pack {expect}")

    if expect_map["REQUIRED_BEFORE_GO"] <= 0:
        failed.append("this STOP pack must not claim required_before_go=0")

    entry = pack.get("entry_to_owner_go_verdict") or {}
    if entry.get("this_turn_meets_entry") is not False:
        failed.append("must not claim entry to Owner GO verdict")

    forbidden = set(pack.get("forbidden") or [])
    for item in (
        "claim_production_go",
        "repeat_1_usdc_real_money",
        "www_bake",
        "ci02_hop_b_execute",
        "bitget_unwind_v8_pin",
    ):
        if item not in forbidden:
            failed.append(f"pack forbidden missing {item}")

    bitget = pack.get("token_risk_bitget") or {}
    if bitget.get("must_not_unwind_v8_pin") is not True:
        failed.append("Bitget must_not_unwind_v8_pin missing")
    if bitget.get("must_not_become_v8_rollback_condition") is not True:
        failed.append("Bitget must_not_become_v8_rollback_condition missing")

    if latest.get("tt_production_go") != "NO_GO":
        failed.append("living FTB must remain NO_GO")
    if latest.get("phase_now") != STOP_PHASE:
        failed.append(f"living phase_now={latest.get('phase_now')}")
    go_cite = latest.get("production_go_reassessment") or {}
    if go_cite.get("status") != STOP_STATUS:
        failed.append("living FTB must cite Production GO reassessment STOP")
    if int(go_cite.get("required_before_go") or -1) != 8:
        failed.append("living FTB must cite required_before_go=8")
    if (latest.get("final_reality_release_certification") or {}).get("blocking_p0_p1") != 0:
        failed.append("living FTB must still cite cert blocking_p0_p1=0")

    ladder = amend.get("ladder") or []
    if "FINAL_REALITY_RELEASE_CERTIFICATION_PASS" not in ladder:
        failed.append("amendment ladder missing cert PASS")
    if STOP_STATUS not in ladder and "PRODUCTION_GO_REASSESSMENT_STOP_REQUIRED_BEFORE_GO_OPEN" not in ladder:
        failed.append("amendment ladder missing GO reassessment STOP")
    if amend.get("tt_production_go") != "NO_GO":
        failed.append("amendment must remain NO_GO")

    www = load(WWW)
    live_www = www.get("live") or {}
    if live_www.get("git_sha") != WWW_SHA:
        failed.append(f"www freeze git_sha={live_www.get('git_sha')}")
    if live_www.get("build_time") != WWW_BUILD:
        failed.append(f"www freeze build_time={live_www.get('build_time')}")

    skip_live = os.environ.get("TT_GO_REASSESSMENT_SKIP_LIVE", "").strip() == "1"
    if skip_live:
        print("WARN: TT_GO_REASSESSMENT_SKIP_LIVE=1 · live Official fetch skipped")
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
            for key, expect in NEW.items():
                if norm(str(c.get(key) or "")) != norm(expect):
                    failed.append(f"live /meta {key}={c.get(key)} unexplained vs NEW")
            if norm(str(c.get("escrow_factory_address") or "")) == norm(LINEAGE):
                failed.append("live /meta escrow_factory_address is lineage 0x0520")
            if norm(str(c.get("escrow_factory_address") or "")) != norm(WIRED):
                failed.append(
                    f"live /meta escrow_factory_address={c.get('escrow_factory_address')} not Wired"
                )

    if failed:
        for f in failed:
            print(f"FAIL: {f}", file=sys.stderr)
        print("TT_PRODUCTION_GO_REASSESSMENT: FAIL", file=sys.stderr)
        return 1

    print("PASS: Final Reality cert PASS issued_at unchanged · unexplained_drift=0")
    print("PASS: residuals classified · required_before_go=8 · hard_gate=REFUSED")
    print("PASS: TT_PRODUCTION_GO remains NO_GO · Owner GO verdict NOT_THIS_TURN")
    print("PASS: Bitget HOLD independent · must_not_unwind_v8_pin")
    print("TT_PRODUCTION_GO_REASSESSMENT: STOP")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
