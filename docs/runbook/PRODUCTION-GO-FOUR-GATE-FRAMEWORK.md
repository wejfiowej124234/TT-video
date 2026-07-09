# Production GO · Four-Layer · Four-Gate Framework

**Governance Root:** [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md) · **Production Release Governance v1**

**Machine SSOT:** [`registry/production-go-four-gate-framework.v1.yaml`](../../registry/production-go-four-gate-framework.v1.yaml)  
**Remaining work:** [`registry/production-go-remaining-work.v1.yaml`](../../registry/production-go-remaining-work.v1.yaml)  
**Gate runner:** `bash scripts/check-production-go-four-gates.sh`  
**Payment 不可混读：** [`registry/payment-architecture-classification.v1.yaml`](../../registry/payment-architecture-classification.v1.yaml)

> **2026-07-08 起：** Production GO **只有四个 Gate + Owner Sign-off**。  
> **Layer 2 Web3 = USDC + Escrow（核心）** · **Stripe = Optional Fiat Onboarding（不在任何 Gate 内）**

---

## Production GO 链（唯一权威）

```text
Business Ready          (L1 · 业务)
        │
        ▼
Web3 Ready              (L2 · 链 · USDC · PAY-W01..W16)
        │
        ▼
Infrastructure Ready    (L3 · 全平台基础设施)
        │
        ▼
Operations Ready        (L4 · 全运营后台)
        │
        ▼
Owner Sign-off
        │
        ▼
TT_PRODUCTION_GO = GO
```

**Machine keys:** `TT_PRODUCTION_BUSINESS_READY` → `TT_PRODUCTION_WEB3_READY` → `TT_PRODUCTION_INFRASTRUCTURE_READY` → `TT_PRODUCTION_OPERATIONS_READY` → `TT_OWNER_FINAL_SIGNOFF` → `TT_PRODUCTION_GO`

---

## 第一层 · Business（业务）

**Gate:** `TT_PRODUCTION_BUSINESS_READY`  
**当前：** **PASS**（约 90%+）

| 检查域 | 状态 |
|--------|------|
| 六角色业务流程 | ✅ |
| 订单生命周期（业务语义） | ✅ |
| Escrow / Settlement / FeeRouter（业务设计） | ✅ |
| CMS 基础 | ✅ |
| OCS Bootstrap + Parity | ✅ |
| 冷启动框架 | ✅ |
| RBAC | ✅ |
| API 一致性 | ✅ |
| 数据一致性 | ✅ |
| HAT · Manual · BFM | ✅ |
| RC Freeze · Production Entry | ✅ |

**不包含：** 链上 USDC 真实 tx（→ Layer 2）· Fly CDN 切流（→ Layer 3）· 运营全量 CRUD UAT（→ Layer 4）

**Legacy 映射：** G1 PASS · G2 PASS（业务部分）· `TT_PRODUCTION_ENTRY_READY=YES`

---

## 第二层 · Web3（链）— **Production GO 核心**

**Gate:** `TT_PRODUCTION_WEB3_READY`  
**当前：** **NOT_STARTED** · **P0 阻断**

| 域 | Checklist |
|----|-----------|
| Wallet · DID · Sign Message | PAY-W01 |
| Approve · Deposit | PAY-W02 · W03 |
| Escrow · Release | PAY-W04 · W07 |
| Settlement · Treasury · FeeRouter | PAY-W08 · W09 |
| Event · Indexer · Ledger | PAY-W05 · W10 · W11 |
| Explorer · Multi Wallet | PAY-W13 · W14 |
| RPC · Recovery · Security | PAY-W12 · W15 · W16 |

**SSOT：** [`PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md`](PRODUCTION-USDC-GO-LIVE-MASTER-CHECKLIST.md) · PAY-W01～W16

```bash
bash scripts/check-web3-payment-production-readiness.sh
```

**明确排除 Layer 2：** Stripe · mock-pay · test PSP

---

## 第三层 · Infrastructure（基础设施）

**Gate:** `TT_PRODUCTION_INFRASTRUCTURE_READY`  
**当前：** **IN_PROGRESS**

| 域 | 说明 |
|----|------|
| Fly | tt-api-prod · tt-web-prod |
| PostgreSQL | backup · PITR · restore drill |
| Redis | 缓存/会话（若启用） |
| RPC | Primary + Backup · failover |
| Object Storage | 社区/媒体 R2/S3 |
| CDN | Media · HLS |
| DNS · TLS · CORS | PI3-002 · G3-01 |
| Backup · Rollback | PI3-001 · G3-03 · go-live §8 |
| Monitoring · Alert · Logging | G3-04 |

**不是只有 CDN** — 是整个生产平台设施。

**Legacy 映射：** G3-01 · G3-03 · G3-04 · G3-05 · PI3-001 · PI3-002

---

## 第四层 · Operations（运营）

**Gate:** `TT_PRODUCTION_OPERATIONS_READY`  
**当前：** **IN_PROGRESS**（CMS publish GO ≠ 全运营 Ready）

### 内容运营
Homepage Hero · 公告 · Banner · 视频 · Landing Ambient · Countries · Cities · POI

### 用户运营
用户管理 · 多身份 · DID · Trust · 黑名单 · 举报 · 审核

### 市场运营
Guide · Provider · Acquisition · Listings · Official Content

### 增长运营
Invite · Growth · Airdrop · Campaign · Ranking

### 系统运营
Config · Feature Flag · Audit · RBAC · Logs · **Consumer sync**（发布后公开 API 对拍）

---

## Optional · 不在 Four-Gate 内

| 项 | 分类 |
|----|------|
| Stripe PI3-003 | P1 Optional Fiat Onboarding |
| Mainnet cutover | 独立 PI3-005-M 程序 |

---

## 距离真正上线 · 还剩什么？

### 已完成（约 90%+ · Business 为主）

产品功能 · 六角色 · HAT/Manual/BFM · OCS Bootstrap/Parity · CMS 基础 · RBAC · Production Entry · RC Freeze · API 一致性 · 冷启动

### 发布前 P0（必须完成）

| # | 项 | Gate | 状态 |
|---|-----|------|------|
| 1 | **Web3 支付生产验证 PAY-W01～W16** | Web3 | ⬜ NOT_STARTED |
| 2 | **运营后台全量 UAT**（非仅 CMS） | Operations | 🔄 IN_PROGRESS |
| 3 | **基础设施 G3**（CDN/域/监控/备份/回滚） | Infrastructure | 🔄 IN_PROGRESS |
| 4 | **Owner Final Sign-off** | — | ⬜ PENDING |

### 关键路径

```text
Web3 Ready  →  (Operations ∥ Infrastructure)  →  Owner Sign-off  →  GO
```

**Stripe 不在此路径上。**

---

## 验证命令

```bash
bash scripts/check-production-go-four-gates.sh
bash scripts/check-web3-payment-production-readiness.sh
```

---

*Four-Gate Framework · 2026-07-08 · 取代零散 PI3/Stripe 混读*
