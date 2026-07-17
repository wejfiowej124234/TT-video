# Public Surface Governance（PSG）· Board LATEST

**Status:** `ACTIVE` · **Phase A Foundation**  
**Phase:** ② Staging · ≠ ③ Production GO  
**Production GO:** **`NO_GO`**  
**PF Step 5:** **FROZEN**  
**Deploy `46af7c70`:** **DEFERRED**（等 P0③④⑤ Foundation 完成后整合部署）  
**Stamp:** `20260716T011137Z`  
**Machine key:** `TT_PUBLIC_SURFACE_GOVERNANCE`  
**SSOT:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)  
**Matrix:** [registry/psg-public-surface-matrix.v1.yaml](../../registry/psg-public-surface-matrix.v1.yaml)  
**Machine board JSON:** [TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.json](./TT-PUBLIC-SURFACE-GOVERNANCE-BOARD.json)（与本文对拍 · PSG runner 已在本仓）

---

## 0 · 当前主线（唯一 · 不可跳）

1. ~~P0② UPSERT~~ → **CLOSED**（API `3fd5b3e8` · unique=10）  
2. **P0③ CMS Governance** → Foundation SSOT + Gate（**FOUNDATION_READY** · 未 CLOSED）  
3. **P0④ COS Governance** → **持久对象存储永久治理**（**GOVERNANCE_ENFORCED** · 未 CLOSED · sftp restore=LEGACY_INCIDENT_ONLY）  
4. **P0⑤ Public Data Governance** → Foundation SSOT + Gate（**FOUNDATION_READY** · 未 CLOSED）  
5. 整合提交一次性 Staging Deploy（含 OCS Admin under freeze 等）  
6. PSG Runtime Certification（全 Matrix）  
7. **才**解冻 PF Step 5  

**禁止**按单页继续修；**禁止**提前单独部署 `46af7c70`。

---

## 1 · 冻结闸

| 轨 | 状态 |
|----|------|
| PF Step 5 | **FROZEN** |
| 整树 Staging Deploy | **FORBIDDEN** |
| 单独部署 `46af7c70` | **DEFERRED / FORBIDDEN** |
| Production GO | **NO_GO** |
| DELETE / 手工清库 | **FORBIDDEN** |

---

## 2 · P0 状态

| P0 | 状态 | 说明 |
|----|------|------|
| ② OCS UPSERT | **CLOSED** | Staging unique=10 after UPSERT×2 |
| **③ CMS 治理** | **FOUNDATION_READY** | [TT-PSG-P0-3](./TT-PSG-P0-3-CMS-GOVERNANCE.md) · Guest 仅 Published · Approved=transition |
| **④ COS 治理** | **GOVERNANCE_ENFORCED** | [TT-PSG-P0-4](./TT-PSG-P0-4-COS-GOVERNANCE.md) · Tigris 主存 · 禁 ephemeral · CLOSED 须破坏性 broken=0 |
| **⑤ Public Data / Guest Contract** | **CODE_READY** · `psg_guest_contract.v1` in-tree; Staging runtime pre-contract until integrate deploy | [TT-PSG-P0-5](./TT-PSG-P0-5-PUBLIC-DATA-GOVERNANCE.md) · origin 隔离 + 契约 |
| ⑥ API Contract | **OPEN** | 随 P0⑤ DTO 补齐 |
| ⑦ Deploy Evidence | **OPEN** | 整合部署后强制重验 |

---

## 3 · PSG Matrix（滚动）

| 模块 | PSG |
|------|-----|
| Provider | ✅ PASS_PARTIAL（P0②） |
| Acquisition | ✅ PASS_PARTIAL（P0②） |
| Home | ⏳ PENDING |
| Guides | ⏳ PENDING |
| Community | ⏳ PENDING |
| CMS | ⏳ FOUNDATION_READY |
| COS | ⏳ GOVERNANCE_ENFORCED |
| Campaign | ⏳ PENDING |
| Hero | ⏳ PENDING |
| Ambient | ⏳ PENDING |
| Banner | ⏳ PENDING |
| Pulse | ⏳ PENDING |
| Official Guide | ⏳ PENDING |

---

## 4 · 永久 Gate

```bash
bash scripts/gates/run-psg-runtime-certification.sh
PSG_SKIP_BOOTSTRAP=1 STAGING_API_BASE=https://tt-api-staging.fly.dev   bash scripts/gates/run-psg-runtime-certification.sh
```

**诚实边界：** GOVERNANCE_ENFORCED ≠ CLOSED ≠ PSG Exit ≠ PF Step 5 ≠ Production GO · sftp 补图 ≠ P0④ CLOSED
