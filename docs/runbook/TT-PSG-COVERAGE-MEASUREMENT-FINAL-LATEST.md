# PSG · Coverage Measurement FINAL（Phase 3 Residual Cell Fill）

**Machine:** `TT_PSG_COVERAGE_MEASUREMENT_FINAL`  
**Status:** **METRIC_FINAL** · Phase **3** · `2026-07-19`  
**Mode:** Phase1 基线 + Phase2 补证 + Phase3 剩余 NOT_RUN 定向补齐  
**机读：** [`registry/psg-coverage-measurement-final.v1.yaml`](../../registry/psg-coverage-measurement-final.v1.yaml)  
**全格 JSON：** `evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/MEASUREMENT-FINAL-CELLS.json`  
**Phase2 日志：** `…/phase2/CELL_PASS.ndjson` · `phase2-runner.log`  
**Phase3 日志：** `…/phase3/CELL_PASS.ndjson` · `phase3-runner.log`  
**编排：** `bash scripts/dev/smoke-coverage-measurement-phase3-local.sh`  
**再生：** `python scripts/dev/gen-psg-coverage-measurement-final.py`

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: NOT_ALIGNED   ← Local ≠ Git pin ≠ Staging
Threshold Rollup:    NEED_FIX
```

> **Metric FINAL** = 全格已赋值且 `pass/denom` 已算（**本地分子**）。  
> **≠** Production GO · **≠** Fix=0 · **≠** ALIGNED_PASS。  
> **Consistency Control（硬闸）：** [TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) —  
> 仅 **ALIGNED_PASS**（Local→Git SHA→Staging 同 SHA→Evidence→Recalculate）可计入 Threshold / Acceptance。  
> 本 FINAL 的 pass 格当前 = **LOCAL_PASS** · **禁止**冒充 Staging/发布级 Coverage PASS。  
> Phase3 Register 关联最小修复：`seed_repair_immutable_business_account_roles`（`ΔFix=0` · **未**动 Fix=8 / Web3）— 须再走 Alignment Loop 才升格。
**公式：** `Coverage_% = pass_cells / denom_cells`（`N/A` 不计 PASS）。

---

## 1 · Dashboard（Phase 3 FINAL）

| 维 | pass / denom | % | vs Phase2 | Threshold |
|----|--------------|---|-----------|-----------|
| **RBAC** | **60 / 96** | **62.5%** | 47 → 60 | **NEED_FIX** |
| **Journey** | **5 / 5** | **100%** | 5 → 5 | **PASS** |
| **Data** | **20 / 20** | **100%** | 18 → 20 | **PASS** |
| **UI P0** | **24 / 24** | **100%** | 24 → 24 | **PASS** |

**Rollup：** **NEED_FIX**（RBAC 阈值仍为 `pass/96 == 100`；结构 `N/A`=36 不计 PASS）。

| 维 | FAIL | NOT_RUN | N/A |
|----|------|---------|-----|
| RBAC | 0 | **0** | 36 |
| Journey | 0 | 0 | 0 |
| Data | 0 | **0** | 0 |
| UI P0 | 0 | 0 | 0 |

---

## 2 · Phase 3 补证来源（摘要）

| 维 | 主要 Evidence |
|----|----------------|
| RBAC（13 剩余） | `…/phase3/CELL_PASS.ndjson` — Admin/DAO_Gov UI·API 拒 / proposals enterability |
| Data Create×2 | Community `POST …/posts`（`post_type: text`）· Announcement `CmsAnnouncementCreateInput`（`kind=product` · `content_tier=live`） |
| Drift 修复 | Tourist `CAP_ADMIN_DENY`：immutable seed role repair → reverify 403；关联 Register `PFA-UI-ADMIN-01` |

---

## 3 · 剩余缺口

**定向 NOT_RUN 格：已全部补齐（0）。**

RBAC 仍 **NEED_FIX** 的原因不是「未测格」，而是阈值写死 **96/96 PASS**（36 个结构 `N/A` 永不进 PASS 分子）。Owner 若要改阈值/分母须另开 Measurement Recalculate 决策，**非**本 Phase3 范围。

---

## 4 · Threshold Decision

| 项 | 结果 |
|----|------|
| Measurement（本地） | **FINAL** · 分子 = LOCAL_PASS |
| Consistency Control | **NOT_ALIGNED**（见 Gate 报告） |
| Journey / Data / UI（本地阈值） | **PASS** · **未** ALIGNED |
| RBAC | **NEED_FIX**（60/96 本地） |
| Rollup（Acceptance） | **NEED_FIX**（本地 Rollup + 未对齐） |
| PSG Gate | **CONDITIONAL_GO**（未改） |
| Fix Required | **8**（未改 · `ΔFix=0`） |

**下一动作：** Alignment Loop — Git 提交固化 SHA → Staging 同 SHA 部署/复验 → `coverage_run` staging ALIGNED → Recalculate；**禁止**仅本地计入 Coverage PASS；产品 Fix 仍走 Min-Fix（Fix=8）。
---

## 5 · 纪律确认

| 禁止项 | 本轮 |
|--------|------|
| 随机扩测 / 全量 E2E / 安全扫描 | **未做** |
| 改产品 FE/BE「为刷覆盖」 | **未做** |
| Register 关联最小修复（seed role） | **已做** · 不增 Fix |
| Web3 / Fix=8 / Gate | **未碰** |
| 估算 % | **未做** |
