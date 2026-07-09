# 旅行收购 · 发布准入 · 押金与信用风控 — 产品规则 v1

**Status:** **LOCKED（PD-009 · AQ-001～008）** — **产品定稿**；**HTTP/门闸/FE 实现以本文件 + [04 §3.4](../04-后端与API.md) **① 已对齐行** 为准。**① 本地（2026-05-27）已闭** — 见 **§8.1**；**② 测试网** / **③ 公网·生产** 未完成项见 **§8.2** / **§8.3**（**禁止** 用 **①** 冒充 **②③ GO**）。

**阶段：** **① 本地** — **已闭**（规则 + 代码 + IT + L5 vitest + smoke）；**② 测试网** — staging 真数据链 / 测试网质押 / 榜 Production-like **待验**；**③ 公网/生产** — 主网真链 Escrow + 真 PSP + **`go-live`** **另闸**。

**硬边界：** **不改五主路由 UI 结构/视觉**（[FIVE-MAIN-ROUTES](../../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）；可改 **`/market/acquisition`** 数据链、**`/me/identities`** 文案/CTA（非 layout lock）、API、DB、Admin 风控。

**互指：** [87 §1.4](../87-TravelTrust-角色体系技术文档-融合架构版.md) · [94 §1.4](../94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md) · [96-17 §0.3.3](../96-17-多重身份与钱包真值.md) · [identity-unified-model §3.5](identity-unified-model.v1.md) · [03 §1.2.2](../03-业务流程与风控.md) · [81 附录 E](../81-经济模型-向导质押与订单押金.md) · [90](../90-阶段开发文档-身份与信任系统.md) · [04-附录-did-rank §1.2](../04-附录-did-rank对接说明.md)

---

## 0. 读前摘要

| 你要定什么 | 本节 |
|------------|------|
| **产品一句话** | **C 端低门槛发收购帖** + **发布押金/信用** + **订单 Escrow** + **事后评价信用** 四层防诈 |
| **与商家入驻差异** | **非** 商家三门闸（KYB + 准入费 + Admin 资质）；**非** `region_steward` 专属 |
| **与向导差异** | **无** 全量向导申请/KYB；发布侧 **轻押金**；履约侧可叠 **旅行者** + 可选 **履约押金** |
| **锁定决策表** | **§1（PD-009 / AQ-001～008）** |
| **分层门闸（L0～L4）** | **§2** |
| **HTTP / 错误码（① 已对齐）** | **§3** |
| **信用与评价** | **§4** |
| **DID 榜与 `identity_slots`** | **§5** |
| **① 已闭 · 代码差分台账** | **§6** |
| **实现顺序（文档→代码）** | **§7** |
| **三阶验收（① CLOSED · ②③ backlog）** | **§8** |

---

## 1. 产品决策（**LOCKED** · 2026-05-27）

| ID | **锁定结论** | 工程约束 |
|----|--------------|----------|
| **PD-009** | **旅行收购发布** = **附加能力**，**不**新增第五种 **`users.role`**；**委托方（发 listing）** 默认 **任意已注册旅行者侧账号** 可开通，**禁止** 以 **`region_steward`** 或 **商家 KYB** 作为发布前置 | 替换 **`market_merchant_gate.rs`** 收购写路径；**Hub** 收购卡片保持 **「进入子站」**，子站内 **gated publish** |
| **AQ-001** | **浏览目录**（**L0**）**匿名可访问**；**写 listing**（**L1**）须 **Bearer 登录** | **`GET …/acquisition/listings*`** 保持公开；**POST** 须会话 |
| **AQ-002** | **发布前置（L1）**：**主钱包已绑**（**`users.default_wallet_address`** 非空，PD-004）+ **Escrow/风险提示勾选**（94 Studio 已有 **`agreeEscrowCopy`**）+ **禁限品/跨境风险提示勾选**（审计 **120**） | FE **`publishGate`** 与 API **同源**；缺钱包 **400** **`acquisition_wallet_required`** |
| **AQ-003** | **发布押金（L1 核心）**：首次及持续发布须 **有效发布保证金** — **`staking_positions.kind=acquisition_publish_bond`**（**ACTIVE**，金额 ≥ **`acquisition_publish_bond_min_usdc`**，**81 附录 E**）**或** **`GET /me.trust.acquisition_publish_eligible=true`**（信用达阈 **免押**，见 AQ-005） | **禁止** 用 **96-18 准入费** / **`onboarding_entitlements`** 替代发布押金；**禁止** 挂 **`users`** 新列（PD-005） |
| **AQ-004** | **发布频控（L1）**：每账户 **滚动 24h** 最多 **`acquisition_publish_daily_max`** 条 **新发布**（含 draft→publish）；超限 **429** **`acquisition_publish_rate_limited`** | 与 **160** 社区反刷 **并列**，不互相替代 |
| **AQ-005** | **收购信用分（L4 反馈 → L1 减免）**：**`acquisition_trust_score`**（0～1000，**① 已实现**）由 **已完成 `order_kind=acquisition_listing` 订单的评价**、**争议结果**、**爽约/虚假 listing** 扣罚汇总；≥ **`acquisition_trust_waive_bond_threshold`** 时 **`acquisition_publish_eligible`** 可 **免发布押金**（仍须 AQ-002） | **`compute_acquisition_trust_score`** · **`GET /me.trust.acquisition_*`**；**向导 `ReviewWeight`** 公式 **可复用** 但 **分池统计**（不混进 guide 均分） |
| **AQ-006** | **履约/接单（L2）**：**受托方** = **登录用户** + **`GET /me.trust`** 无 **`trust_*` 阻塞**（与 **90** 游客/向导侧规则同源）；**大额单**（listing **`bounty_max_usdc` ≥ `acquisition_fulfillment_bond_threshold_usdc`**）另须 **`staking_positions.kind=acquisition_fulfillment_bond`** **ACTIVE** | **`POST …/acquisition/listings/:id/orders`** 门闸扩展；**不**要求 **`users.role=guide`** 为默认路径（与 **① 代码** 不同处见 **§6**） |
| **AQ-007** | **成交资金（L3）**：赏金 **仅** 经 **`Order` + Escrow** 锁定（**94 §1.2**）；**禁止** 私信地址收款 | 已有 **`POST …/listings/:id/orders`** → **`/escrow/:id`** |
| **AQ-008** | **事后治理（L4）**：**双向评价**（**`POST …/orders/:id/reviews`**）、**争议**（**100**）、**举报**（**160** / Admin）、**人工 suspend** 收购能力（**`identity_slots.acquisition=restricted`** 或 **`acquisition_publish_suspended_until`**） | Admin **不**审每条 listing 正文（**非** 商家 KYB）；**高危类目** 可 **②** 增 **关键字+人工抽检** |

**参数默认值（① 已实现 · 本地 dev 可调 · 生产阈值 **08-3** 同批）：**

| 键 | 默认值 | 说明 |
|----|--------|------|
| **`acquisition_publish_bond_min_usdc`** | **50** | 发布保证金下限（USDC/USDT 等值；**①** mock **`POST …/me/acquisition/publish-bond`**） |
| **`acquisition_trust_waive_bond_threshold`** | **700** | 信用 ≥ 此值免发布押金 |
| **`acquisition_publish_daily_max`** | **5** | 24h 发布上限 |
| **`acquisition_fulfillment_bond_threshold_usdc`** | **1000** | 赏金上限 ≥ 此值时接单须履约押金 |
| **`acquisition_fulfillment_bond_min_usdc`** | **100** | 履约押金下限 |

---

## 2. 分层门闸（产品 SSOT）

```text
L0 浏览    GET …/acquisition/listings*     匿名 OK
L1 发布    POST …/acquisition/listings*    登录 + 钱包 + 勾选 + (发布押金 ∨ 信用免押) + 频控
L2 接单    POST …/listings/:id/orders      登录 + trust 门禁 + (大额履约押金)
L3 成交    Escrow Deposit / 验货里程碑      双方 + 链上/mock（①）
L4 信用    reviews / disputes / 榜 / 限流   复用订单域 + 收购分池
```

**与商家（provider）对比：**

| 维度 | 商家橱窗 | 旅行收购（本规则） |
|------|----------|-------------------|
| 发布者 | **`users.role=provider`** + KYB + 准入费 | **旅行者侧** + **轻押金/信用** |
| Admin | **资质审核**（长期身份） | **风控 suspend**（能力级，非 KYB） |
| 身份槽 | **`merchant` active** = provider | **`acquisition` active** = 已开通发布能力（AQ-002 满足） |
| 榜单 filter | **`owner_role_filter=provider`** | **`owner_role_filter` 取消**（任意 listing owner） |

---

<a id="aq-rules-http-34"></a>

## 3. HTTP 契约（**① 已对齐** · **04 §3.4**）

### 3.1 `POST /api/v1/market/acquisition/listings`（及 **drafts** 写路径）

**须（全部）：**

1. **Bearer** 有效会话  
2. **`users.default_wallet_address`** 已设置  
3. **`payload`** 通过 **94** **`acquisition_carry_studio_v1`** 校验（含 **`title`**、**`kind`**、验货字段等）  
4. **发布押金或信用免押**（AQ-003 / AQ-005）  
5. **频控**（AQ-004）  
6. **`GET /me.trust`** 无 **`acquisition_publish_blocked`**（受限 / 高争议 / Admin suspend）

**勿再要求（LEGACY · 待删）：**

- ~~**`users.role=region_steward`**~~  
- ~~**`onboarding_entitlements` paid · `role_target=region_steward`**~~

**错误码（① 已实现）：**

| HTTP | `error` | 含义 |
|------|---------|------|
| 400 | **`acquisition_wallet_required`** | 未绑主钱包 |
| 400 | **`acquisition_publish_bond_required`** | 无有效发布保证金且信用未达免押阈 |
| 400 | **`acquisition_escrow_ack_required`** | **`agree_escrow_copy`** 未勾选 |
| 403 | **`acquisition_publish_suspended`** | Admin/风控暂停发布能力 |
| 403 | **`acquisition_trust_restricted`** | **`GET /me.trust`** 收购发布向阻塞（与 **90** 同源扩展） |
| 429 | **`acquisition_publish_rate_limited`** | 超 AQ-004 日上限 |

### 3.2 `POST …/acquisition/listings/:id/orders`

**须：**

- 非 listing owner  
- **`GET /me.trust`** 通过（**`trust_verification_pending`** / **`trust_identity_restricted`** / **`trust_risk_too_high`** 等同 **POST /orders**）  
- 若 **`bounty_max_usdc` ≥ threshold** → **`acquisition_fulfillment_bond`** **ACTIVE**

**错误码（① 已实现）：** **`acquisition_fulfillment_bond_required`**（400）

### 3.3 `GET /me` 扩展（**① 已对齐**）

**`identity_slots[id=acquisition]`：**

- **`inactive`**：从未满足 AQ-002（无钱包或未开通）  
- **`active`**：可发布（押金或免押信用已满足）  
- **`restricted`**：suspend / 高争议  

**`trust` 扩展字段（① 已实现 · `acquisition_trust_snapshot`）：**

- **`acquisition_trust_score`**：整数 0～1000  
- **`acquisition_publish_eligible`**：bool（综合钱包+押金/免押+未 suspend）  
- **`acquisition_publish_bond_display`**：可选，与 **`staking_positions`** 镜像  

---

## 4. 评价、争议与信用（**① 已对齐**）

1. **订单完成后**，委托方与受托方均可 **`POST …/orders/:id/reviews`**（与 **03 §1.2** 同源 **`ReviewWeight`**）。  
2. **收购分池**：评价计入 **`acquisition_trust_score`**，**不**写入向导 **`avg_received_review_score`**（除非同一用户另有 guide 行）。  
3. **争议 / 裁决**：**`refund_ratio`**、**爽约**、**虚假 listing** 扣 **`acquisition_trust_score`** 并可能 **slash 发布保证金**（**81 附录 E** · **`acquisition_publish_bond`** 池）。  
4. **每单押金与差评扣款** 叙事与 **03 §1.2.1** 表「每单押金与差评扣款减信用」**对齐**，但参数 **收购独立**（**≠** 向导 **`stakeToOrderCapMap`**）。

---

## 5. DID 榜与 Hub

1. **`GET /api/v1/did-rank/acquisitions`**：**① 已对齐** — **无** **`owner_role_filter=region_steward`**；排行 **`rank_basis=acquisition_fulfillment_orders_then_gross_then_published_listings_in_window`**，**owner** = **任意** 发布过 **`variant=acquisition`** listing 的用户。**②③** 真 GMV / Production-like GO 见 **§3.2 D1**。
2. **`/me/identities` Hub**：收购卡片 **CTA = 「进入子站」**（**`/market/acquisition`**）；**首次发布**引导在子站 Studio 内完成 **绑钱包 + 押金/信用说明**（**非** 跳转 **`/provider/register`** 或 **主理人 onboarding**）。  
3. **② Partial** 不变：榜 **Production 真排行 GO** 仍 **另闸**（**30 §3.2**）。

---

## 6. ① 现行代码差分（**已闭** · 2026-05-27）

| 模块 | **LEGACY（① 代码）** | **TARGET（本文件）** | **2026-05-27 实现态** |
|----|----------------------|----------------------|------------------------|
| 发布写门闸 | **`region_steward` + paid entitlement** | **旅行者侧 + 钱包 + 发布押金/信用** | **已替换** · **`acquisition_publish_gate.rs`** |
| FE **`publishGate`** | 仅登录 + 表单 | + 钱包 + 押金/信用态 | **已对齐** · **`AcquisitionCarryStudioModal`** |
| **`identity_slots.acquisition`** | 默认 **inactive** | **`active`** = 发布能力已开通 | **已对齐** · **`GET /me`** PG 快照 |
| **did-rank acquisitions** | **`owner_role_filter=region_steward`** | **无 role filter** | **已对齐** |
| **listing→order** | 接单向 **active guide** | **受托方 = 会话用户** + trust | **已对齐** · **`ensure_acquisition_fulfillment_guide_id`** 自动最小 guide + **fulfillment bond** + **trust** |
| **Admin suspend** | — | **`acquisition_publish_suspended_until`** | **已对齐** · **`PATCH …/admin/users/:id/acquisition-publish-suspend`** + **Admin 用户详情卡片**；**`GET …/admin/users`** / **`GET …/users/:id`** 含 **`acquisition_publish_suspended`** 投影（**有 PG**） |
| **社区 `/community/me` 信任条** | Studio/Guide 押金 CTA | **已对齐** · **`CommunityMeAcquisitionTrustStrip`**（**`TT_COMMUNITY_PAGE_L5`** 暖金玻璃） |
| **信用 L4 / slash** | 收购分池 + 争议扣保证金 | **已对齐** · **`order_kind=acquisition_listing`** PG + **`chain_off::OrderRow`**；**`compute_acquisition_trust_score`** 计 **`reviewee_id=user ∨ guides.id`**；**guide `avg_score`** **排除**收购池评价 |
| **L5 · AQ-002 Escrow 勾选** | FE + API 同源 | **已对齐** · **`agree_escrow_copy`** → **400** **`acquisition_escrow_ack_required`** |
| **L5 · 频控 / 信用免押 IT** | AQ-004 / AQ-005 | **已对齐** · **`matrix_pd009_l5_*`** |
| **全链路 ①** | 发布→接单→Escrow→完成→评价 | **已对齐** · IT **`matrix_pd009_l5_full_closure_*`** + **`matrix_pd009_full_flow_*`** + smoke 脚本 |
| **PG ↔ memory 信任分** | **`GET /me.trust`** 收购分池 | **已对齐** · **`matrix_pd009_trust_pg_memory_parity_*`** + **`scripts/dev/smoke-acquisition-trust-parity-local.sh`** |

**验收（① 已闭 · L5 · 本地必跑）：**

```bash
cargo test -p traveltrust-api market_subsite_catalog
cargo test -p traveltrust-api matrix_pd009_trust_pg_memory_parity
cd frontend && npx vitest run acquisitionL5 acquisitionL5FullScore meTrust --run
bash scripts/dev/smoke-acquisition-pd009-local.sh
bash scripts/dev/smoke-acquisition-trust-parity-local.sh   # 有 PG + seed 时
```

**②③** 见 **§8**；**禁止** 用上述 **①** 绿集冒充 **staging 全矩阵 GO** 或 **Production GO**。

---

## 7. 实现顺序（文档 → 代码）

1. **本文 + 04 TARGET 行 + 94/87/96-17 互指**（**本轮**）  
2. **08-3 参数表** + **`staking_positions`** migration（**`acquisition_publish_bond`** / **`acquisition_fulfillment_bond`**）  
3. **API 门闸 + `GET /me.trust` 扩展**  
4. **FE Studio / Hub 文案 + `publishGate`**  
5. **93/95 矩阵 + 窄切片 IT 换 seed**  
6. **②** staging Escrow 密度 **另闸**（**§8.2**）

---

## 8. 三阶验收（PD-009 垂直切片）

**口径：** 与根 **[README](../../README.md)**「工程规划方向」、**[AGENTS.md](../../AGENTS.md)** 三阶同源 — **须顺序递进，禁止跳阶**。

### 8.1 第一阶段 · **① 本地 — CLOSED（2026-05-27）**

| # | 验收项 | 证据 |
|---|--------|------|
| 1 | **AQ-001～008** 产品规则 LOCKED | 本文 **§1～§5** |
| 2 | 发布写门闸 **PD-009**（非 **`region_steward`**） | **`acquisition_publish_gate.rs`** · IT **`acquisition_pd009_*`** |
| 3 | **`GET /me.trust`** 收购扩展 + **`identity_slots.acquisition`** | **`me.rs`** · vitest **`meTrust*`** |
| 4 | **L5** · **`order_kind=acquisition_listing`** PG + memory **`OrderRow`** | migration **`20260527140000_*`** · IT L5 closure |
| 5 | **L5** · **`agree_escrow_copy`** API 门闸 | IT **`matrix_pd009_l5_*`** · **`acquisitionL5*`** vitest |
| 6 | **L4** · 评价 / 争议扣 **`acquisition_trust_score`** + slash | **`acquisition_trust.rs`** · IT dispute slash |
| 7 | **Admin suspend** + 用户列表/详情投影 | **`PATCH …/acquisition-publish-suspend`** · IT admin |
| 8 | **FE** Studio / Hub / Admin / Community 数据链（**非**五主路由 layout 变更） | **`AcquisitionCarryStudioModal`** · **`CommunityMeAcquisitionTrustStrip`** · **`AdminAcquisitionPublishSuspend*`** |
| 9 | **PG ↔ memory** 收购信任分 parity | **`matrix_pd009_trust_pg_memory_parity_*`** |
| 10 | **本地 smoke** | **`smoke-acquisition-pd009-local.sh`** · **`smoke-acquisition-trust-parity-local.sh`** |

**① 结论：** PD-009 **收购垂直切片** 在 **本地 dev / Docker / 单测 / vitest / smoke** 口径 **已闭**。**不** 含全站 **93** 矩阵每路由、**②** staging 真 PSP、**③** 主网真链。

### 8.2 第二阶段 · **② 测试网 — 待验（backlog）**

| ID | 未完成项 | 说明 / 入口 |
|----|----------|-------------|
| **②-A** | **Staging 全链路密度** | 发布→接单→Escrow **testnet/mock 链** 在 **staging 主机 + 测试 DB** 上重复 **§8.1** 流程；非仅本地 **`chain_off`** |
| **②-B** | **测试网质押 / slash** | **`acquisition_publish_bond`** / **`acquisition_fulfillment_bond`** 在 **测试网合约** 与 PG **`staking_positions`** **对账**（**81 附录 E**）；本地多为 PG/mock |
| **②-C** | **DID 收购榜 Production-like GO** | **`GET …/did-rank/acquisitions`** 在 **②** 数据量下 **真 GMV / 窗口** 验收（**30 §3.2** · **04-附录 §3.2 D1**） |
| **②-D** | **160 举报 / 关键字 / 收购专项 moderation** | **AQ-008** 运营流：**举报队列**、高危类目 **关键字 + 人工抽检**（**非** ① Admin suspend 单点） |
| **②-E** | **ReviewWeight 收购分池独立公式证明** | 与向导均分 **分池** 在 **staging 评价量** 下复核（**§4** · **90**） |
| **②-F** | **Stripe test mode / 测试 PSP** | 赏金 **Escrow** 若接 **测试 PSP**，须在 **②** 验 webhook / 回调 |
| **②-G** | **R-002 / ISS-007 staging 矩阵** | 窄切片 **`PARTIAL_GO`** **不得** 冒充全矩阵 **GO**（**[TT-9628 §0.0.5](../runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)**） |
| **②-H** | **B-MKT-006～012** 在 **②** 主机 | **94** 子站 catalog / draft / order 延伸在 **staging** 与 **本地 ①** 行为 **一致** 复核 |
| **②-I** | **`identity_slots.acquisition=restricted`** 运维 | Admin suspend 在 **多实例 / 复制延迟** 下 **`GET /me`** 投影一致 |

**② 完成标准（草案）：** 上表 **②-A～I** 在 **测试网环境** 各有 **`exit 0` 或 runbook 签字证据**；**仍不** 等同 **③ Production GO**。

### 8.3 第三阶段 · **③ 公网/生产 — 待验（backlog）**

| ID | 未完成项 | 说明 / 入口 |
|----|----------|-------------|
| **③-A** | **主网真链 Escrow + 赏金** | **`Order` + Escrow** 真资金路径；**禁止** 用 **①② mock** 冒充 |
| **③-B** | **主网 **`acquisition_*_bond`** 池 audit** | **81 附录 E** 链上 **slash / 释放** 与 PG **逐笔可对账** |
| **③-C** | **Production PSP** | 真 **Stripe / 法币** 或生产稳定币通道 + **公网 webhook** |
| **③-D** | **`go-live-checklist` · Production GO** | **[go-live-checklist](../go-live-checklist.md#go-decision-entry-point)** 收购域签字 |
| **③-E** | **合规 / 法律** | 跨境收购、禁限品、KYC 分层 **产品签核**（**03** · **120**） |
| **③-F** | **生产监控 / 滥用告警** | **AQ-004** 频控 + **160** 在 **生产流量** 的 SLA |
| **③-G** | **DID 榜生产真值** | **30** 收购榜 **Production SSOT**（非 illustrative） |
| **③-H** | **边缘 rate limit / WAF** | 发布 API **生产级** 限流（补 **①** 应用层频控） |

**③ 完成标准（草案）：** **`go-live`** 决策表收购行 **CLOSED** + **③-A～H** 生产证据；**仅** 此时可对外宣称 **PD-009 Production GO**。

---

*维护：变更 **AQ-001～008** 或 **§3 HTTP** 时须同批 **04 §3.4**、**94 §1.4**、**87 §1.4**、**96-17 §0.3.3**、**identity-unified-model PD-009**；动 **did-rank filter** 时同批 **04-附录-did-rank §1.2**；**②③ backlog** 收口时更新 **§8.2/§8.3** 行态（**禁止假完成**）。*
