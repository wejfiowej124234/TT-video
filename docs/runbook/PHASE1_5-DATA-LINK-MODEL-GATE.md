# ①.5 数据链路建模闸（Identity · Wallet · Stake）

**Status:** Active — **在 ② 测试网全矩阵之前必过**  
**阶段：** 仍属 **① 本地可验证**（契约 + migration + seed + API·IT）；**不等于** ② staging HTTP 全矩阵 GO。

**硬边界：** **不改五主路由 UI**（[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）。`/me/identities`、`/me/onboarding`、`/guide/register`、**`/provider/register`**、**`/admin/provider-applications`**、**`/admin/users/[id]`**（商家审核卡片）、治理层等 **数据/API/DB** 可动。

**② 暂缓：** [PHASE2-TESTNET-ACCEPTANCE.md](./PHASE2-TESTNET-ACCEPTANCE.md) 在本文 **§6 出口** 满足前 **不跑** `run_r003_staging_evidence_chain` 作产品正确性结论。

---

## 为什么先 ①.5 再 ②

② 测试网验证的是 **真实业务链路**（注册 → 钱包 → 身份申请 → 资料 → 质押 → 审核 → 落库 → 读写）。若下列未定义，staging 只会得到 **环境失败 / 表不对 / API 不通**，**不能**说明产品正确。

| 现象 | 根因 |
|------|------|
| R-003 大面积 FAIL | 数据模型与流程未闭合 |
| smoke `/meta` 字段空 | 产品与 `meta` 契约未对齐 |
| 多重身份「能点不能审」 | 缺统一状态机与表 |

---

## 真源地图（先读再写，勿新造平行 SSOT）

| 主题 | 文档 / 代码 |
|------|-------------|
| **协议四类角色** | [87 §1.1](../../docs/spec/87-TravelTrust-角色体系技术文档-融合架构版.md) — `traveler` / `guide` / `provider` / `region_steward`（**非** 另起 `merchant`/`agency` 除非 ADR） |
| **多重身份 · 钱包 · 四脊签** | [96-17](../../docs/spec/96-17-多重身份与钱包真值.md) §0.2～§0.3（**生产核对矩阵**） |
| **商家/主理人准入费** | [96-18](../../docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md) + [04-附录 准入费](../../docs/spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md) |
| **向导资料 + 质押（现有）** | [04 §二 guides](../../docs/spec/04-后端与API.md) · `POST /guides` · `POST …/stake` |
| **注册/Me/钱包字段** | [04 §3.4](../../docs/spec/04-后端与API.md) · `users.default_wallet_address` |
| **身份质押经济** | [81](../../docs/spec/81-经济模型-向导质押与订单押金.md)（**≠** TTG 治理路径） |
| **① 机读闸（回归）** | `npm run gate:phase1-linkage` · `gate:me-routes` |
| **①.5 统一模型（本闸主交付）** | [`identity-unified-model.v1.md`](../spec/artifacts/identity-unified-model.v1.md) |
| **`/` + `/market*` 四页 ① FE 数据链** | **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · 绿集 **`run-web3-itinerary-l5-green.sh`**（**非** 本闸身份/钱包表交付，但 **① 数据链已闭**） |

**命名收敛建议：** UI 文案可用 Shop / 商家 / 主理人；**API/DB** 以 **87** 四枚举为准。`host` / `merchant` / `agency` 若出现，须映射表或废弃，写入 **§1 交付物**。

---

## 六块建模交付物（①.5 出口）

### 1. 身份类型清单（闭合枚举 + 扩展规则）

| 身份 | API/DB | 申请入口（现状） | ①.5 须明确 |
|------|--------|------------------|------------|
| 旅行者 | `traveler` / `tourist` 双读 | 注册默认 | 是否单独「升级」流程 |
| 向导 | `guide` | `/guide/register` → `guides` 行 | 与 `users.role` 关系 |
| 商铺 | `provider` | **`/provider/register`** → **`/me/onboarding`**（96-18）→ **`/admin/provider-applications`** → **`/admin/users/[id]`** 审核 | 与 96-18 准入费关系；**① 代码锚** **[`frontend/app/provider/register/README.md`](../../frontend/app/provider/register/README.md)**；**烟测** **`bash scripts/dev/smoke-provider-onboarding-local.sh`** |
| 区域主理人 | `region_steward` | 同上 | 同上 |
| 旅行收购 | 产品榜 `acquisition` | `/did-rank?board=acquisition` · **`/market/acquisition`** | **≠** `users.role` 第五枚举；**发布门闸 PD-009**（**`acquisition_publish_gate.rs`**）· **§8.1 ① 已闭** |

**产出（PD 已锁）：** [`identity-unified-model.v1.md`](../spec/artifacts/identity-unified-model.v1.md) **§0.1 PD-001～008 LOCKED** — migration 可按 **Phase A 双写** 开工；合规/工程签字见该文 §7.2。

### 2. 每身份申请资料（字段级）

| 身份 | 现有落点 | 缺口 |
|------|----------|------|
| guide | `guides.*`（护照哈希、证件 URL、城市…） | 是否统一到 `role_documents` |
| provider / region_steward | `onboarding_entitlements` + 合规审计 | KYC/执照字段是否进专用表 |
| traveler | `users` + KYC 档位 | 钱包是否必填 |

**产出：** 字段矩阵（身份 × 必填/选填 × 存储表 × 04 API 字段名）。

### 3. 每身份质押规则

| 路径 | 现状 | ①.5 须定稿 |
|------|------|------------|
| guide | `guides.stake_amount` + `POST …/stake` + **81** 池 | 币种、数量、解锁、罚没 |
| provider | 96-18 **B 轨准入费**（**USDC** 官方地址 · **不退**）+ **IdentityStakingPool**（**可赎回**） | **两笔分路径** · 非二选一 |
| region_steward | 同上 + **A 轨 TTG 质押** | **三轨分路径** |
| traveler | 通常无身份质押 | 明确 N/A |

**产出：** 质押规则表 + 与 **治理 TTG** 分轨声明（**96-18 §1.2 非目标** 同源）。

### 4. 注册与钱包模型

| 能力 | 04 现状 | ①.5 决策项 |
|------|---------|------------|
| email/password | `POST /auth/register` | 保留 |
| OAuth | 查 04/97 | 是否 P0 |
| 单钱包 | `users.default_wallet_address` | 是否唯一 |
| 多钱包 | **96-17 §2** 讨论 | 是否 MVP |
| 主钱包 | 同上 | 与治理 `castVote` 对齐 |
| 向导 DID 钱包 | `guides.wallet_address` | 与 default 可否不同 |

**产出：** 序列图：注册 →（可选）绑钱包 → 申请身份。

### 5. 数据库表结构（目标 vs 现状）

**目标模型（PD-006/008 已锁，见 artifact §4）：**

```
users + wallets（主钱包 default_wallet_address）
role_applications + role_documents + staking_positions  -- 必建三表
guides + onboarding_entitlements                       -- KEEP，Phase A 双写
```

**现状（已部分存在，勿重复造轮）：**

- `users`（含 `role`, `default_wallet_address`, `kyc_status`）
- `guides`（向导申请 + stake 字段）
- `onboarding_entitlements` / `onboarding_payment_events`（provider/steward 准入）
- `onboarding_compliance_audit_events`

**产出：** ER 图 + **delta migration 清单**（只增不破坏 53 订单状态机）。

### 6. 状态机（统一申请单）

**已锁（PD-007）：**

```
draft → submitted → reviewing → approved | rejected
approved → suspended
```

| 身份 | 现状状态字段 | 对齐动作 |
|------|--------------|----------|
| guide | `guides.status` pending/active/suspended/rejected | 映射到上表 |
| onboarding | `onboarding_entitlements.status` | 映射 + 文档 |
| 注册即 role | `users.role` 直接写 | 是否改为「须 approved 才生效」 |

**产出：** 状态机图 + **04 §3.4 新/改路由表**（admin 审核、用户查询）。

---

## 推荐工程顺序（①.5 内）

```
产品/合规签字（§1～§3 表）
    ↓
04 / 96-17 / 96-18 文档同批（契约句，非仅 runbook）
    ↓
SQL migration + 回滚说明
    ↓
本地 seed（每身份至少 1 条可演示路径）
    ↓
cargo API·IT（register → wallet → apply → stake → admin approve）
    ↓
gate:phase1-linkage + gate:me-routes（防五主路由回流）
    ↓
② PHASE2 staging（R-003 + did-rank D1–D4 + C-GOV MANUAL-P1）
```

---

## ①.5 机读最低集（本地 exit 0，非 ②）

| 闸 | 命令 |
|----|------|
| **S1–S4 cargo IT** | `bash scripts/dev/run-phase15-s1-s4-it-green.sh`（**`phase15_identity_s*`** + **`role_identity_dual_write_*`**；须 **`DATABASE_URL`**） |
| 演示 seed 烟测 | `bash scripts/dev/smoke-phase15-identity-demo-local.sh`（S1 钱包 + guide · S3 provider · S4 steward 烟测编排） |
| 路由契约 | `bash scripts/run-check-04-routes.sh` |
| 双写 IT | `cargo test -p traveltrust-api role_identity_dual_write` |
| API 子集 | `cargo test -p traveltrust-api`（identity/onboarding/guides 相关模块） |
| 前端契约 | `npm run gate:me-routes` |
| 五主防回流 | `CI_LOCAL_SKIP_PHASE1_BACKEND_TRIPLE=1 npm run gate:phase1-linkage` |

**不**在本阶段要求：`run_r003_staging_evidence_chain` **GO**。

---

## §6 出口判据（满足后才开 ②）

- [x] **[`identity-unified-model.v1.md`](../spec/artifacts/identity-unified-model.v1.md)** **PD-001～009 LOCKED**（**PD-009 旅行收购 ① 已闭** · 2026-05-27）
- [x] **身份类型清单** 与 **04/96-17** 台账同批（87 四角色 + **acquisition 附加能力分轨** · **非** `region_steward` 发布门闸）
- [x] **资料 + 质押** 两表定稿 — **§3 工程矩阵已 LOCKED**（**identity-unified-model.v1**）；**Compliance** 见 [`PHASE1-OWNER-SIGNOFF`](../../frontend/evidence/GO_local_phase1/PHASE1-OWNER-SIGNOFF-SEBASTIAN-WARD-20260603.md)（**① Owner 自证 · 非 ②③ GO**）
- [x] **ER + migration** SQL：`20260601120000_role_identity_phase_a_dual_write.sql`（本地须 `sqlx migrate`）
- [x] **应用层双写**（写路径；读不变）：`db/role_identity` ← guides / onboarding
- [x] **状态机** 写入 04 §3.4 + admin 路径 — **① 契约**：[`identity-unified-model.v1` PD-007](../spec/artifacts/identity-unified-model.v1.md) · admin **`PATCH …/provider-application-review`** / **`…/steward-application-review`** / 收购 suspend；**96-17 §0.3 全矩阵对拍** 另项
- [x] **本地 seed** 可演示：`smoke-phase15-identity-demo-local.sh`（S1 绑钱包 + guide · S3 provider · S4 steward）
- [x] **双写 IT**：`cargo test -p traveltrust-api role_identity_dual_write`（**`DATABASE_URL`**）
- [x] **API·IT** 覆盖 S1–S4 全链 — **`phase15_identity_s*`** + **`role_identity_dual_write_*`**（**`db/mod.rs` 已接线**）· **`bash scripts/dev/run-phase15-s1-s4-it-green.sh`**
- [x] **96-17 §0.3** 生产核对矩阵与实现对拍 — **文档 DOC-CLOSED** + **`didRankUtils.test.ts` · 96-17 脊签机读**（**`itinerary`** 为 **30 §0.1 第五签**）

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-05-26 | 初版：插入 ①.5；② 测试网全矩阵 **显式暂缓** |
| 2026-05-27 | **PD-009** 收购 **① 已闭** 互指；身份类型清单 **acquisition 分轨** 与 **96-17/identity-unified-model** 对拍 |
| 2026-05-26 | **PD-001～008 LOCKED** — 见 `identity-unified-model.v1.md` §0.1 |
| 2026-05-29 | **Freeze 维护**：`smoke-phase15-identity-demo-local.sh` 修 S1–S4 编排 · §6 状态机/seed 勾选与实现对拍 |
