# SESSION-LOG · 20260704T012735Z

| 字段 | 值 |
|------|-----|
| **Session** | 20260704T012735Z |
| **Phase** | ① local |
| **Track** | Manual UAT C1–E2 (product validation) |
| **Commit** | fea685b0 |
| **Started UTC** | 2026-07-04T01:28:23Z |
| **Checklist SSOT** | docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md |
| **Config** | FROZEN — no Configuration Sprint |

## 纪律

- **API/路由预检 PASS** ≠ **UI 勾选 PASS**（须浏览器 + §0 人工须看）
- Business Bug → `evidence/manual-uat/defects/DEFECT-NNN.md` + registry

## 本轮进度

- Kickoff: `bash scripts/dev/run-manual-uat-c1e2-kickoff.sh`
- API/route prep pass count: 21 (non-§0 items with route probe)
- UI PASS: 0 / 27 (awaiting human browser)
