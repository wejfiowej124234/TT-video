# TT · FINAL RELEASE BASELINE（唯一体系 · Market→Escrow ACL 闸 · Web tip 已烤）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `WEB_TIP_ALIGNED_API_EXPECTED_LAG`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-MARKET-ESCROW-ACL-GATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / product tip：** `6b85bde97737…`  
**Staging Web tip：** `6b85bde9`（已对齐）  
**Staging API tip：** `f9c227de`（Expected Difference · FE-only Delta）

---

## 0 · 暂停认证主轨

```text
本轮：Market→Escrow/Pay ACL CTA Delta + Freeze + Web tip 烤入
× 不自动开跑 Inventory / Reality / Formal Delta Cert / Hard Gate / GO
× 不放宽后端 order participant ACL
```

---

## 1 · Delta 摘要

| 项 | 内容 |
|----|------|
| Drawer | 仅参与方 GET 成功后露 `/escrow`·`/pay` |
| OrderCard | 去掉 fallback `/escrow`；Pay 仅 own-binding |
| Escrow | 401→login；403→清 prefetch + 下一步 |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| local_git / registry / psg_pin | tip `6b85bde9`（Freeze overlay 后 HEAD ≠ tip = Expected） |
| web / release_identity | **PASS** @ `6b85bde9` |
| api | **Expected Difference** @ `f9c227de` |
| 10×4 | **LOCKED_10X4** |
| page surfaces | `/` unsplash residual · **Expected Difference（CMS）** · ≠ ACL P0 |
| evidence | tip 对齐 |

---

## 3 · 诚实边界

Web tip 对齐 ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。  
认证流程暂停；继续 P1 UI/UX Alignment。
