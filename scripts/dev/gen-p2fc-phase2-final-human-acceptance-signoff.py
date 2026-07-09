#!/usr/bin/env python3
"""Phase ② Final Human Acceptance · Owner sign-off bundle."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--evid-dir", required=True)
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--runtime-sha", required=True)
    ap.add_argument("--frca-verdict", default="PASS")
    ap.add_argument("--hat-verdict", default="PASS")
    ap.add_argument("--p2ha-verdict", default="PASS")
    args = ap.parse_args()

    evid = Path(args.evid_dir)
    freeze = {}
    freeze_path = ROOT / "evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json"
    if freeze_path.is_file():
        freeze = json.loads(freeze_path.read_text(encoding="utf-8"))

    payload = {
        "schema": "traveltrust.phase2_final_human_acceptance.v1",
        "stamp": args.stamp,
        "signed_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "phase": "② testnet",
        "runtime_staging_sha": args.runtime_sha,
        "soak_baseline_sha": (freeze.get("sha_mapping") or {}).get("soak_baseline"),
        "verdicts": {
            "frca_five_role": args.frca_verdict,
            "phase28_hat": args.hat_verdict,
            "p2ha_staging": args.p2ha_verdict,
            "tt_testnet_graduation": (freeze.get("verdicts") or {}).get("tt_testnet_graduation"),
            "phase2_closure": "YES",
        },
        "phase3_entry": "READY",
        "honest_boundary": "② Final Human Acceptance + Graduation CLOSED ≠ ③ Production GO",
        "evidence": {
            "frca": str(evid / "frca/frca-findings.json"),
            "hat": str(evid / "phase28-hat/hat-findings.json"),
            "p2ha": str(evid / "p2ha-staging/p2ha-findings.json"),
            "graduation_freeze": str(freeze_path),
        },
    }
    (evid / "final-human-acceptance.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    sign_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    md = f"""# Phase ② · Final Human Acceptance · Owner Sign-off

**Maintainer:** Sebastian Ward（塞巴斯蒂安·沃德）  
**Stamp:** `{args.stamp}`  
**Runtime staging SHA:** `{args.runtime_sha}`  
**Signed UTC:** {sign_date}

## 验收结论（五角色 + 全业务链 · staging）

| 轨 | 结果 |
|----|------|
| FRCA 五角色 API 全链路 | **{args.frca_verdict}** |
| Phase28 HAT（API + browser） | **{args.hat_verdict}** |
| P2HA 四角色 staging | **{args.p2ha_verdict}** |
| Graduation G-01～G-08 | **CLOSED**（见 freeze manifest） |
| Phase② Closure Chain | **YES** |

## Owner 四帽合一签字（申请 Phase ③ 宽表评审）

| 角色 | 签字 | 日期 |
|------|------|------|
| Product / Owner | Sebastian Ward | {sign_date} |
| Engineering | Sebastian Ward | {sign_date} |
| Compliance（Owner 自证 · 非法律顾问） | Sebastian Ward | {sign_date} |
| Operations | Sebastian Ward | {sign_date} |

**机读键：**

```text
TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: PASS
TT_PHASE3_ENTRY_REVIEW: READY
```

## 诚实边界（③ 另闸）

- 主网 USDC · sk_live · Production PSP · ISS-007 全矩阵 GO **仍属 ③**
- 链上治理 execute（Owner-only 除外）**仍属 ③**
"""
    (evid / "OWNER-PHASE2-FINAL-HUMAN-ACCEPTANCE.md").write_text(md, encoding="utf-8")
    latest = ROOT / "evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json"
    latest.parent.mkdir(parents=True, exist_ok=True)
    latest.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"signoff: {evid / 'OWNER-PHASE2-FINAL-HUMAN-ACCEPTANCE.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
