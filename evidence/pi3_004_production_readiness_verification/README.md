# PI3-004 · Production Readiness Verification · 机读证据

| 文件 | 含义 |
|------|------|
| `baseline_record.v1.json` | PI3-004 主记录 · `status=PASS` + `report_release_gate=GO` 为 GO 必要条件 |
| `r003-prod-skeleton/report.json` | 154 交付 skeleton · `release_gate=NO_GO` |
| `r003-production-*/report.json` | Owner R-003 全站回归 · **GO 必需** |
| `prod-uat-six-domains-*/` | Owner 六大域 UAT |

**Gate:** `python scripts/gates/check-pi3-004-production-readiness-baseline-record.py`

**SSOT:** [154-PI3-004-Production-Readiness-Verification-Report.md](../../docs/handbook/engineering/154-PI3-004-Production-Readiness-Verification-Report.md)
