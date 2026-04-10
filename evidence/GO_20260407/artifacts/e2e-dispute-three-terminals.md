# E2E：争议三终态（Refunded / PartiallyRefunded / Slashed）

| 字段 | 值 |
|------|-----|
| **日期** | 2026-04-07 |
| **执行人** | plant（收口确认） |
| **SSOT 路径** | `docs/verification-evidence/B-094-resolution-fixtures-SSOT.md`、`evidence/B-094-execute-resolution-fixtures.md`、`docs/verification-evidence/tt-09-b094-resolution-indexer.json`（B-094 裁决与 ResolutionExecuted fixtures） |
| **结论** | 三终态可复核留痕以 SSOT 与 indexer 证据为准；**生产 E2E** 须在目标链各终态至少补一条可检索 tx / dispute id。 |
