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
Fix:                 2  # Release Window partial close; WC open
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: ALIGNED_PASS
Pass Tier:           ALIGNED_PASS   ← bound via coverage_run + Staging SHA
Threshold Rollup:    NEED_FIX       ← RBAC 60/96 阈值未满
```

> **Metric FINAL** = 全格已赋值且 `pass/denom` 已算。  
> **Pass Tier = ALIGNED_PASS**：`coverage_run` staging · SHA 对拍 · Consistency Gate 已闭后 Recalculate 绑定（**禁止** Local-only 冒充）。  
> **≠** Production GO · **≠** Fix=0 · RBAC 阈值仍 **NEED_FIX**（不扩测刷 96/96）。  
> **Consistency Control：** [TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md)。  
> Phase3 Register 关联最小修复：`seed_repair_immutable_business_account_roles`（`ΔFix=0` · **未**动 Fix=8 / Web3）。
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
| Measurement | **FINAL** · Recalculate **ALIGNED_BINDING** |
| Consistency Control | **ALIGNED_PASS** |
| Pass Tier | **ALIGNED_PASS**（Acceptance 可计 Journey/Data/UI） |
| Journey / Data / UI | **PASS**（ALIGNED） |
| RBAC | **NEED_FIX**（60/96 · 阈值 `pass/96==100`） |
| Rollup（Acceptance） | **NEED_FIX**（RBAC） |
| PSG Gate | **CONDITIONAL_GO**（未改） |
| Fix Required | **2**（本窗已关 ACTIVE/Trust/ROLE-01 · 剩 WC+ROLE-02） |

**下一动作：** Domain Batch 继续 RBAC（不扩测刷 %）· Web3/Min-Fix 另窗；**禁止**改 Fix=8 / Gate。
---

## 5 · 纪律确认

| 禁止项 | 本轮 |
|--------|------|
| 随机扩测 / 全量 E2E / 安全扫描 | **未做** |
| 改产品 FE/BE「为刷覆盖」 | **未做** |
| Register 关联最小修复（seed role） | **已做** · 不增 Fix |
| Web3 / Fix=8 / Gate | **未碰** |
| 估算 % | **未做** |
