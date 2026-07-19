# TT · V3.1.1 Full-System Drift Audit

**Machine:** `TT_V311_FULL_SYSTEM_DRIFT_AUDIT`  
**Script:** `python scripts/dev/run-v311-full-system-drift-audit.py`  
**Evidence:** [`FULL-SYSTEM-DRIFT-AUDIT-LATEST.md`](../../evidence/GO_phase2_v311_final_release/FULL-SYSTEM-DRIFT-AUDIT-LATEST.md)  
**ACTIVE pin:** `v311_sepolia_clean_baseline` · `chain_id=11155111`  
**Mode:** Timelock read-only · **禁止**改合约 / ACTIVE 矩阵 / Runtime / Registry ACTIVE 切轨

---

## 目的

Execute 前确认各层引用**同一 ACTIVE** 与**同一套运营数据**，避免 Function Cert `54/0/0` 之后因遗漏漂移打断 RC-02。

## 检查层

| Layer | 对拍对象 |
|-------|----------|
| Protocol / Registry | `active_deploy_baseline` · freeze matrix · PCD `environments.v311_*` 地址 |
| Execution Matrix | `address_authority.baseline` |
| Deployment Inventory | baseline + 与 freeze 重叠地址 |
| Runtime | local `/health` · `/api/v1/guides` · `/api/v1/discover/orders` · `/meta`（软） |
| CMS | 10 Country CLOSED · Ambient wiring |
| Catalog | ambient ISO · listings wave1 |
| OCS | guides public = 10 |
| Search | discover/orders |
| API Projection | I-01 + guides/discover |
| Docs | ACTIVE 叙事不得指向 V2（无 LEGACY 标签） |
| Package | RC1 PREP + Release Notes |

## 复跑时机

1. **Timelock 窗内（现在）** — 清 P0 漂移  
2. **Execute + Function Cert 54/0/0 之后** — 再跑一次，期望 **PASS** / 无新 P0  
3. 然后 Phase 8 → RC-02 → Manual → P10.5 → Freeze → GO  

## 与补文档的关系

本 Audit **优先于**继续零散文档扩写。发现 P0 → 先修漂移；P1 → 记入 Closure Audit 或 Owner Accept。
