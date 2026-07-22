# TT · FINAL RELEASE BASELINE（唯一体系 · UI Delta RC 合并 · Web tip 已烤）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `WEB_TIP_ALIGNED_API_EXPECTED_LAG`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-RC-CONSOLIDATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / RC tip：** `1ed03a9a959d…`（合并 `6b85bde9` ACL + `1ed03a9a` Unlock/gov · **未丢弃**）  
**Staging Web tip：** `1ed03a9a959d`（已对齐）  
**Staging API tip：** Expected Difference · FE-only

---

## 0 · 暂停认证主轨

```text
本轮：RC tip 合并确认 + Web tip 烤入 + dry-run
× 不丢弃 6b85bde9 / 1ed03a9a
× 不自动开 Inventory / Reality / GO
```

---

## 1 · RC 范围（保留）

| tip | 内容 | 状态 |
|-----|------|------|
| `6b85bde9` | Market→Escrow/Pay ACL · Escrow 401/403 | 祖先保留 |
| `1ed03a9a` | Unlock 诚实徽章 · 链下投票闸 | **RC tip / Web tip** |

---

## 2 · 八轴（诚实）

| 轴 | 状态 |
|----|------|
| Git / Registry / Engineering | tip `1ed03a9a959d` |
| Web / release_identity | **PASS** @ `1ed03a9a959d` |
| API | Expected Difference |
| 10×4 | LOCKED（烤入时） |
| page surfaces | Unsplash residual · CMS Expected |
| evidence | tip 对齐 |

---

## 3 · 诚实边界

Web tip 对齐 ≠ Inventory PASS ≠ Reality Closure ≠ Staging-grade GO ≠ Production GO。
