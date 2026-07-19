#!/usr/bin/env python3
"""Stamp Product Cert aggregate from Function + Data + UI + Deploy (honest).

Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
Does NOT claim PASS unless all inputs PASS.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_phase2_v311_final_release"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(rel: str):
    p = ROOT / rel
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    fn = _load("evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json")
    data = _load("evidence/GO_phase2_v311_final_release/P2.5-DATA-CERT-LATEST.json")
    ui = _load("evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json")
    deploy = _load("evidence/GO_phase2_v311_final_release/P2-DEPLOYMENT-CERT-LATEST.json")
    if not deploy:
        deploy = _load("evidence/GO_phase2_v311_final_release/DEPLOYMENT-CERT-LATEST.json")

    counts = fn.get("counts") or {}
    function_54 = (
        counts.get("PASS") == 54
        and counts.get("FAIL", 1) == 0
        and counts.get("OWNER_REQUIRED", 1) == 0
        and (fn.get("verdict") or "").upper() == "PASS"
    )
    if function_54:
        fn_st = "PASS"
    elif (fn.get("verdict") or "").upper() == "FAIL":
        fn_st = "FAIL_WAITING_F02_EXECUTE" if (counts.get("OWNER_REQUIRED") or 0) else "FAIL"
    else:
        fn_st = fn.get("verdict") or "UNKNOWN"

    data_st = data.get("tt_data_cert") or data.get("status") or "UNKNOWN"
    ui_st = ui.get("tt_v311_web3_ui_ux_full_cert") or ui.get("status") or "UNKNOWN"
    deploy_st = deploy.get("status") or deploy.get("tt_v311_deployment_cert") or "UNKNOWN"

    # LOCK-1: Product PASS only after UI Full PASS (and Function 54/0/0)
    ui_pass = str(ui_st).upper() == "PASS"
    deploy_ok = str(deploy_st).upper().startswith("PASS")
    data_ok = str(data_st).upper() == "PASS"

    if function_54 and ui_pass and data_ok and deploy_ok:
        status = "PASS"
    elif function_54 and not ui_pass:
        status = "OPEN_WAITING_UI_FULL"  # LOCK-1: refuse Product PASS
    elif not function_54:
        status = "OPEN"
    else:
        status = "OPEN"

    out = {
        "schema": "traveltrust.v311_web3_full_product_cert.v1",
        "machine_key": "TT_V311_WEB3_FULL_PRODUCT_CERT",
        "recorded_utc": _utc(),
        "status": status,
        "tt_v311_web3_full_product_cert": status,
        "order_lock": "S4_UI_FULL_PASS_BEFORE_S3_PRODUCT_PASS",
        "aggregate": {
            "deployment_cert": deploy_st,
            "function_cert": fn_st,
            "function_counts": counts,
            "function_54_0_0": function_54,
            "ui_ux_cert": ui_st,
            "data_cert": data_st,
        },
        "pass_requires_all": [
            "function_cert_54_0_0",
            "ui_ux_cert_PASS",
            "data_cert_PASS",
            "deployment_cert_PASS",
        ],
        "cite": {
            "function": "evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json",
            "data": "evidence/GO_phase2_v311_final_release/P2.5-DATA-CERT-LATEST.json",
            "ui": "evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json",
        },
        "gate": "G-RC-03",
        "on_fail_rollback_to": "S2_FUNCTION"
        if not function_54
        else ("S4_UI_FULL" if not ui_pass else "S3_PRODUCT"),
    }
    EV.mkdir(parents=True, exist_ok=True)
    (EV / "P6-PRODUCT-CERT-LATEST.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (EV / "P6-PRODUCT-CERT-LATEST.md").write_text(
        f"""# P6 · Product Cert

**Machine:** `TT_V311_WEB3_FULL_PRODUCT_CERT`  
**Status:** `{status}`  
**Recorded:** `{out['recorded_utc']}`

| Input | Status |
|-------|--------|
| Function 54/0/0 | {function_54} ({fn_st}) |
| Data | {data_st} |
| UI/UX Full | {ui_st} |
| Deploy | {deploy_st} |

**Gate:** G-RC-03 · Rollback on fail → `{out['on_fail_rollback_to']}`
""",
        encoding="utf-8",
    )
    print(json.dumps({"TT_V311_WEB3_FULL_PRODUCT_CERT": status, "function_54": function_54}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
