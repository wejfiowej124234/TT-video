# TT · FINAL RELEASE BASELINE（唯一体系 · Cinema/宣传片 tip 已烤入 Staging）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `WEB_API_TIP_ALIGNED`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-CINEMA-PROMO-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / Runtime tip：** `f9c227de14ab…`  
**Staging Web + API tip：** `f9c227de14ab…`（已对齐）

---

## 0 · 暂停认证主轨

```text
本轮仅完成 tip 烤入 + 八轴一致性 + Freeze 收口
× 不自动开跑 Inventory / Reality / Formal Delta Cert / Hard Gate / GO
```

---

## 1 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry_active / psg_pin | PASS @ `f9c227de`（Registry tip） |
| web / api / release_identity / runtime | PASS @ `f9c227de` |
| evidence | PASS @ `f9c227de`（已刷新 identity） |
| HEAD vs freeze tip | **EXPECTED_DIFFERENCE**（Freeze overlay docs commit `68ad15c8`） |

---

## 2 · Delta dry-run

**Verdict:** `DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE` · P0=0  
唯一 Expected：`FREEZE_OVERLAY_HEAD_VS_FREEZE_TIP`

---

## 3 · 诚实边界

Web/API tip 对齐 ≠ Inventory PASS ≠ Reality Closure PASS ≠ Staging-grade GO ≠ Production GO。  
认证流程暂停；Owner 明确后再继续 PSG Delta / Inventory / Reality。
