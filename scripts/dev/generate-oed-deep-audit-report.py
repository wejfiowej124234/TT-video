#!/usr/bin/env python3
"""Generate ORDER-ESCROW-DISPUTE-DEEP-AUDIT-REPORT.md from oed-findings.json."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def section_table(rows: list[dict], cols: list[str]) -> str:
    if not rows:
        return "_无记录。_\n"
    hdr = "| " + " | ".join(cols) + " |"
    sep = "|" + "|".join(["---"] * len(cols)) + "|"
    lines = [hdr, sep]
    for r in rows:
        lines.append("| " + " | ".join(str(r.get(c, "")) for c in cols) + " |")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--findings", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    findings = json.loads(Path(args.findings).read_text(encoding="utf-8"))
    out_path = Path(args.out)
    probes = findings.get("probes", [])
    by_section: dict[str, list] = defaultdict(list)
    for p in probes:
        sec = p.get("section", "probes")
        by_section[sec].append(p)

    verdict = findings.get("verdict", "FAIL")
    now = datetime.now(timezone.utc).isoformat()
    api = findings.get("api_base", "")
    sha = findings.get("git_sha", "")
    evid = Path(args.findings).parent

    md = f"""# Order–Escrow–Dispute Deep Audit 报告

**记录时间：** {now}  
**API：** `{api}`  
**git_sha：** `{sha}`  
**证据：** `{evid}`  

---

## Executive verdict

**OED_DEEP_AUDIT: {verdict}**

| 项 | 结果 |
|----|------|
| P0 | **{findings.get('p0', 0)}** |
| P1 | **{findings.get('p1', 0)}** |
| P2 | **{findings.get('p2', 0)}** |

```text
OED_DEEP_AUDIT: {verdict}
```

---

## 1 · Business Critical Path Matrix

{section_table(by_section.get('business_critical_path', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 2 · Escrow Matrix

{section_table(by_section.get('escrow_matrix', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 3 · Dispute Matrix

{section_table(by_section.get('dispute_matrix', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 4 · UI Corridor Matrix (Playwright f024/f025/f026)

{section_table(by_section.get('ui_corridor', []), ['probe_id','spec','step','status','notes'])}

---

## 5 · PG Consistency Matrix

{section_table(by_section.get('pg_consistency', []), ['probe_id','check','target','pg_value','expected','status','notes'])}

---

## 复跑

```bash
export P3_SEED_ARBITRATOR_EMAIL="oed-arbitrator-$(date -u +%Y%m%dT%H%M%SZ)@traveltrust.test"
bash scripts/dev/run-order-escrow-dispute-deep-audit.sh
```

*Generated {now[:10]}*
"""
    out_path.write_text(md, encoding="utf-8")
    print(f"OED_REPORT: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
