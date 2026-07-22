# TT · FINAL RELEASE BASELINE（唯一体系 · Market→Escrow ACL 闸 · Web tip 待烤）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PRODUCT_TIP_FROZEN_PENDING_WEB_BAKE`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-MARKET-ESCROW-ACL-GATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / product tip：** `6b85bde97737…`  
**Staging Web tip：** 待烤入 `6b85bde9`（Expected：仍可能停在 `1b622923`）  
**Staging API tip：** Expected Difference · FE-only Delta（可不跟烤）

---

## 0 · 暂停认证主轨

```text
本轮：Market→Escrow/Pay 参与方 ACL CTA + Escrow 401/403 引导 Delta + Freeze
× 不自动开跑 Inventory / Reality / Formal Delta Cert / Hard Gate / GO
× 不放宽后端 order participant ACL
```

---

## 1 · Delta 摘要

| 项 | 内容 |
|----|------|
| Drawer | 仅 `GET /orders/:id` 参与方成功后露 `/escrow`·`/pay` |
| OrderCard | 去掉无 `onViewDetail` 的 `/escrow` fallback；Pay 仅 own-binding |
| Escrow | 401→login returnUrl；403→清 prefetch + 市场/订单下一步 |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry / psg_pin | tip `6b85bde9`（Freeze overlay 后 HEAD ≠ tip = Expected） |
| web / release_identity | **PENDING** bake @ `6b85bde9` |
| api | **Expected Difference**（本 Delta 仅前端） |
| evidence | 不写 FG-15-A 根 |

---

## 3 · 诚实边界

Product tip 冻结 ≠ Web tip 已烤 ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。  
认证流程暂停；Owner 烤 Staging Web 并对齐后再恢复 Project A → Inventory → Reality。
