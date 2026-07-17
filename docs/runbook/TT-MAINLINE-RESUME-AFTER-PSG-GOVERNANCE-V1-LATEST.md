# TT · Mainline Resume after PSG Governance v1

**STATUS:** `ACTIVE`  
**Since:** PSG Governance v1 = `BASELINE_ESTABLISHED` · Governance design track = **EXITED**  
**Governance SSOT:** [TT-PSG-GOVERNANCE-V1-BASELINE-ESTABLISHED-LATEST.md](./TT-PSG-GOVERNANCE-V1-BASELINE-ESTABLISHED-LATEST.md)  

---

## Ops path（写死）

```
Feature → Local Validation → Incremental Audit → RCP Gate
      → Staging Deploy → Verification
```

| 禁止 | 允许 |
|------|------|
| 新增一级治理能力 | 复用 PSG Governance **v1** |
| 扩 Wave C/D | Dependency Registry **域扩展**（非新 Gate） |
| 平行 Gate | Incremental Audit · RCP · 既有 Certification |
| 继续设计 Governance | 只解决真实业务问题 · 验证用户完整旅程 |

---

## 主线优先序（最小批次）

| # | 批次 | 说明 | 人控 |
|---|------|------|------|
| **①** | **CMS Content QA + 运营数据一致性** | Community / Guide / Market / Campaign / Official 内容与媒体；**CMS → API → Web** 全链验证；按 Daily Board 资产族推进（当前 POI ACTIVE） | 工程可推 |
| **②** | **产品 P0/P1 Bug 修复** | 真实缺陷 · 最小切片 · 同上 ops path | 工程可推 |
| **③** | **OA-02 WalletConnect 真机** | **仅** OA-01 `KEY_PRESENT` 后立即执行 | Owner → 工程配合 |
| **④** | **OA-03 Timelock** | Owner 签收 / 签名 execute | Owner-only |

**OA-01**（WC Project ID）= Owner 阻塞 · 不挡 ①② 工程推进。  
**OA-04** = Phase② CLOSED 前 **FORBIDDEN**。

---

## 本批默认开工（①）

- Daily Board：`node scripts/dev/run-cms-daily-ops-board.cjs`
- Active Family：**POI**（~51%）
- 最小下一城项：**Korea · Busan · 广安里大桥**（7/8 → 8/8）
- 单 POI：`Review → Replace(1×) → Publish → Verify → 六维 QA → LOCK`（禁止 bulk）
- 媒体对齐批次已 `MEDIA_ALIGNMENT: ENGINEERING_CLOSED` — 新问题走 RCP，不重开治理设计

---

## 诚实边界

① 本地绿 ≠ ② Staging 全矩阵 GO ≠ ③ Production GO。  
不解冻 Tag / Release Archive / Cert。不扩 PSG Governance v1。
