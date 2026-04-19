# B-430 · Governance API 观测（Production 支柱 · reconcile ↔ overview）

**母表**：**B-430** · **TT**：`TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001`

## 真源证据根

- **`evidence/b430_gov_post_exec_reconcile_overview/`** — 含 **`run_<UTC>/b430-closeout-record.json`**、**`b430-indexer-reconcile.json`**、**`b430-admin-overview.json`**

## Runbook 与一键

- [docs/runbook/TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001.md](../../../docs/runbook/TT-B430-GOV-POST-EXEC-RECONCILE-OVERVIEW-BUNDLE-001.md)  
- **`B430_WRITE_CLOSEOUT_PACK=1`** **`bash scripts/ops/b430-gov-post-exec-reconcile-overview-bundle.sh`**

## GO 条件（本支柱）

- 脚本 **`exit 0`** **（** **四键** **reconcile** **↔** **overview** **无漂移** **）** **；** **落盘时** **`b430-closeout-record.json`** **`verdict`** **==** **`GO`**
