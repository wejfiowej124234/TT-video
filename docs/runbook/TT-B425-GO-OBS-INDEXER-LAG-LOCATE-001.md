# TT-B425 · B-425 — GO 闭环：indexer lag 可定位

**母表**：[B-425](../任务母表.md)  
**卡号**：`TT-B425-GO-OBS-INDEXER-LAG-LOCATE-001`  
**状态**：已封口（2026-04-16）

---

## 1. 验收封口

**机读**：`bash scripts/check-indexer-lag-locate-gate.sh`（可 `--json`，schema **`traveltrust.indexer_lag_locate_gate.v1`**；`/meta` / `internal/indexer-status` / `admin/indexer/health` **lag_core** 同源叙事见母表）。

---

## 2. 互证

- **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)** **§2.55**  
- **GO 总册**：[TT-GO-CLOSELOOP-10-B418-B427-001.md](./TT-GO-CLOSELOOP-10-B418-B427-001.md#b-425--tt-b425-go-obs-indexer-lag-locate-001)
