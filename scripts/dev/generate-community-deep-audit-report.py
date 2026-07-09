#!/usr/bin/env python3
"""Generate COMMUNITY-DEEP-AUDIT-REPORT.md from cda-findings.json."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def table(rows: list[dict], cols: list[str]) -> str:
    if not rows:
        return "_无记录。_\n"
    lines = ["| " + " | ".join(cols) + " |", "|" + "|".join(["---"] * len(cols)) + "|"]
    for r in rows:
        lines.append("| " + " | ".join(str(r.get(c, "")) for c in cols) + " |")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--findings", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    f = json.loads(Path(args.findings).read_text(encoding="utf-8"))
    by: dict[str, list] = defaultdict(list)
    for p in f.get("probes", []):
        by[p.get("section", "probes")].append(p)
    now = datetime.now(timezone.utc).isoformat()
    md = f"""# Community Deep Audit 报告

**记录时间：** {now}  
**API：** `{f.get('api_base','')}`  
**git_sha：** `{f.get('git_sha','')}`  
**证据：** `{Path(args.findings).parent}`  

---

## Executive verdict

**CDA_DEEP_AUDIT: {f.get('verdict','FAIL')}**

```text
CDA_DEEP_AUDIT: {f.get('verdict','FAIL')}
```

---

## 1 · Community Critical Path Matrix

{table(by.get('community_critical_path', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 2 · Moderation Matrix

{table(by.get('moderation_matrix', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 3 · Engagement Matrix

{table(by.get('engagement_matrix', []), ['probe_id','role','step','method','path','http','expected','status','notes'])}

---

## 4 · UI Corridor

{table(by.get('ui_corridor', []), ['probe_id','step','status','notes'])}

---

## 5 · PG Consistency

{table(by.get('pg_consistency', []), ['probe_id','target','pg_value','expected','status','notes'])}

---

## 复跑

```bash
bash scripts/dev/run-community-deep-audit.sh
```
"""
    Path(args.out).write_text(md, encoding="utf-8")
    print(f"CDA_REPORT: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
