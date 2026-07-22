# TT · FINAL RELEASE BASELINE（唯一体系 · UI Delta RC 合并 · Web tip 待烤）

**Machine key:** `TT_FINAL_RELEASE_BASELINE`  
**Status:** `BASELINE_FROZEN` · **Freeze:** `FROZEN`  
**Cert suite:** `DELTA_RECERTIFY_FORMAL_COMPLETE_NO_GO`  
**UI Delta:** `PRODUCT_TIP_FROZEN_PENDING_WEB_BAKE`  
**Registry:** [`registry/final-release-baseline.v1.yaml`](../../registry/final-release-baseline.v1.yaml)  
**PCR：** `PCR-20260722-UI-DELTA-RC-CONSOLIDATE-FREEZE`  
**Gate:** `bash scripts/gates/check-final-release-baseline-freeze-gate.sh --require-frozen`

**唯一体系：** Candidate v2 + V3.1.1 Final + PSG-EGM Final  
**Pin：** `PSG-REL-20260720-WEB3-CAND-V2`（未新铸）  
**Freeze / RC tip：** `1ed03a9a959d…`（合并 `6b85bde9` ACL + `1ed03a9a` Unlock/gov）  
**Staging Web tip：** 待烤入 `1ed03a9a`（当前 live 仍可能为 `6b85bde9`）  
**Staging API tip：** Expected Difference · FE-only

---

## 0 · 暂停认证主轨 · 暂停新增 P1-05/06/07

```text
本轮：合并已完成 UI Delta → 单一 RC tip → Engineering 钉点 → Web tip 烤入 → dry-run → 再 FROZEN 确认
× 不丢弃 6b85bde9 / 1ed03a9a 产品改动
× 不自动开 Inventory / Reality / GO
× 烤入确认前不做 P1-05/06/07
```

---

## 1 · RC 合并范围（保留）

| tip | 内容 |
|-----|------|
| `6b85bde9` | Market→Escrow/Pay 参与方 ACL · Escrow 401/403 |
| `1ed03a9a` | Unlock 预览诚实徽章 · 链下投票 `can_cast_vote` 闸 |
| **RC** | **`1ed03a9a`**（祖先含 ACL，产品改动完整） |

---

## 2 · 诚实边界

Product tip 冻结 ≠ Web tip 已烤 ≠ Inventory PASS ≠ Reality ≠ Staging-grade GO ≠ Production GO。
