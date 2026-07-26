# TT · FINAL RELEASE BASELINE（唯一体系 · tip `ea71c577` · FROZEN）

> **ACTIVE tip (machine SSOT · Drift Cleanup 2026-07-24):** `ea71c577` (`ea71c577ce6f99696df33f9394cf96746edc843b`) · Pin `PSG-REL-20260720-WEB3-CAND-V2` — ancestry SHAs in body = historical lineage only.

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `WEB_TIP_ALIGNED_API_TIP_ALIGNED`  
**Registry YAML:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**JSON:** [`TT-FINAL-RELEASE-BASELINE-LATEST.json`](./TT-FINAL-RELEASE-BASELINE-LATEST.json)  
**Drift Cleanup PCR：** `PCR-20260724-FINAL-TRUTH-DRIFT-CLEANUP`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Living tip（ACTIVE）：** `ea71c577ce6f99696df33f9394cf96746edc843b`  
**Staging Web/API tip：** aligned @ `ea71c577`（POST_CLOSURE）  
**Deploy HEAD（ED）：** Track B Staging patch Batch-10 **FINAL CLOSED FROZEN** · W14 Web `06:16:38Z` · stamp `892c20c8` · PATCH-STG-014 · `STAGING_PATCH_HEAD_NE_TIP` = CONFIRM_DESIGN（≠ 新 RC）  
**Living Product/Release（Track B · Mainnet Deploy Prep PLACEHOLDER）：** Batch-10 = **FINAL CLOSED · FROZEN** · Phase now = **MAINNET_DEPLOY_PREP_PLACEHOLDER** · cite [`TT-BATCH10-FINAL-CLOSED-LATEST`](./TT-BATCH10-FINAL-CLOSED-LATEST.md) · [`TT-PRE-MAINNET-HUMAN-UIUX-BATCH-10-FINAL-TRUTH-BASELINE-CITE-LATEST`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-10-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · Phase transition [`TT-FINAL-TRUTH-PHASE-TRANSITION-BATCH10-MAINLINE-LATEST`](./TT-FINAL-TRUTH-PHASE-TRANSITION-BATCH10-MAINLINE-LATEST.md) · [`W14-VERIFY`](./TT-BATCH10-W14-STAGING-VERIFY-LATEST.md) PASS · tip **仍** `ea71c577` · Mainnet **PLACEHOLDER** · Hard Gate **LOCKED** · **≠** GO
**Batch-9（archive · Residual Final CLOSED）：** 禁止回流 · cite [`TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST`](./TT-BATCH9-RESIDUAL-FINAL-CLOSURE-LATEST.md)  
**Web3 Mainnet（Final Truth）：** **PLACEHOLDER** · 不宣称已部署 · **禁止**提前 Final Align / Hard Gate unlock / Cutover · **Post-mainnet Final Align** = **一次性 · DEFERRED_UNTIL_MAINNET_DEPLOY_COMPLETE** · **全程** `TT_PRODUCTION_GO: NO_GO`
**Prior Batch-8（保留 ARCHIVED）：** UI+HU-098 API FROZEN · archive [`BATCH-8-ARCHIVE`](../../evidence/GO_pre_mainnet_human_uiux/batch8_archive/BATCH-8-ARCHIVE-LATEST.md)  
**Prior Batch-7（保留）：** R1=100 · cite [`TT-PRE-MAINNET-HUMAN-UIUX-BATCH-7-FINAL-TRUTH-BASELINE-CITE-LATEST`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCH-7-FINAL-TRUTH-BASELINE-CITE-LATEST.md)

---

## 0 · 读法（写死 · 防误读）

```text
Final Truth living tip  = ea71c577   ← 本轮产品/工程唯一 tip
Archive PSG GO Tag      = v1.1.0-psg-go.20260717 (0bbc7adbd314…)
                          ← Hotfix/Patch 分支根 · Expected Difference
HEAD (may move)         = Staging patch（当前 f123f691b3f4…）
                          ← CONFIRM_DESIGN · 禁止当成新 RC Identity
```

**禁止**用 Archive Tag 的历史 `TT_PRODUCTION_GO: GO` 冒充本轮 Final Truth Production GO。  
**禁止**把 HEAD≠tip 修成「假一致」或新铸 RC。

---

## 1 · RC 范围（祖先保留 · 未丢弃）

| tip | 内容 | 状态 |
|-----|------|------|
| `6b85bde9` | Market→Escrow/Pay ACL · Escrow 401/403 | 祖先保留 |
| `1ed03a9a` | Unlock 诚实徽章 · 链下投票闸 | 祖先保留 |
| `3b310ca8` | Admin write · Community honesty · Studio gate | 祖先保留 |
| `ea71c577` | Completeness + role promo Media Asset SSOT | **living tip** |

---

## 2 · 对齐（Drift Cleanup 后）

| 轴 | 状态 |
|----|------|
| Git / Registry / Engineering | living tip `ea71c577` |
| Web / API / release_identity | **ALIGNED** @ tip（stale PENDING bake **cleared**） |
| HEAD vs tip | **ED** `STAGING_PATCH_HEAD_NE_TIP` |
| Archive Tag vs living tip | **ED** `ARCHIVE_PSG_GO_TAG_VS_LIVING_FINAL_TRUTH_TIP` |
| page surfaces | Unsplash residual · CMS Expected |

---

## 诚实边界

FROZEN tip ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Hard Gate PASS ≠ Cutover ≠ Production GO。  
资金主线停点：AXIS-05 ✅ · AXIS-11 Owner auth · Cutover open `09/12/14` · **mainnet baseline = PLACEHOLDER**（正式对齐/Recertify 待主网部署完成后）。
