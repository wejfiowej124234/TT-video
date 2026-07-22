# TT · FINAL RELEASE BASELINE（唯一体系 · P1-05/06/07 tip · PENDING Web bake）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PRODUCT_TIP_FROZEN_PENDING_WEB_BAKE`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-P1-05-06-07-FREEZE`  
**Prior PCR：** `PCR-20260722-UI-DELTA-RC-CONSOLIDATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / RC tip：** `3b310ca856ce…`（继承 `1ed03a9a` + `6b85bde9` · **未丢弃**）  
**Staging Web tip：** PENDING clean bake @ `3b310ca8`（当前 runtime 仍可能为 `1ed03a9a`）  
**Staging API tip：** Expected Difference · FE-only

---

## 0 · 暂停认证主轨

```text
本轮：P1-05/06/07 产品 tip + Engineering 钉 + Web tip 烤入
× 不丢弃 1b622923 / 6b85bde9 / 1ed03a9a / 3b310ca8
× 不自动开 Inventory / Reality / GO
```

---

## 1 · RC 范围（保留）

| tip | 内容 | 状态 |
|-----|------|------|
| `6b85bde9` | Market→Escrow/Pay ACL · Escrow 401/403 | 祖先保留 |
| `1ed03a9a` | Unlock 诚实徽章 · 链下投票闸 | 祖先保留 |
| `3b310ca8` | Admin write · Community honesty · Studio gate | **RC tip · PENDING Web** |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| Git / Registry / Engineering | tip `3b310ca856ce` |
| Web / release_identity | **PENDING** bake @ tip |
| API | Expected Difference |
| 10×4 | 烤入时再验 LOCKED |
| page surfaces | Unsplash residual · CMS Expected |
| evidence | tip 对齐待烤入 |

---

## 诚实边界

FROZEN tip ≠ Web tip aligned ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。
