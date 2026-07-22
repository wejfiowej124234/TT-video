# TT · FINAL RELEASE BASELINE（唯一体系 · Home AI 预览闸 tip 待烤 Staging）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PENDING_STAGING_WEB_API_REDEPLOY`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-HOME-AI-PREVIEW-GATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / product tip：** `1b6229234ab6…`  
**Staging Web + API tip：** 待烤入 `1b622923`（当前可能仍为 `f9c227de`）

---

## 0 · 暂停认证主轨

```text
本轮：Home AI 行程卡状态机 Delta + Freeze
× 不自动开跑 Inventory / Reality / Formal Delta Cert / Hard Gate / GO
```

---

## 1 · Delta 摘要

| 项 | 内容 |
|----|------|
| 范围 | `/` AI 行程卡：`previewLocked` 直至国家/城市/时间/人数/预算齐备 |
| 解锁 | 仅本会话主动「AI 生成行程」成功 → `showLiveAiResults` |
| 禁止 | 磨砂态生成真卡、露出可用订单入口；会话恢复 id 不单独解锁 |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry_active / psg_pin | 以 tip `1b622923` 钉（Freeze overlay 后 HEAD 可能 ≠ tip） |
| web / api / release_identity / runtime | **待 redeploy** → Expected Difference 直至对齐 |
| evidence | 随 tip 刷新；**不**写 FG-15-A 根 |

---

## 3 · 诚实边界

产品 tip 冻结 ≠ Staging tip 已烤 ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。  
认证流程暂停；Owner 明确后再继续 PSG Delta / Inventory / Reality。
