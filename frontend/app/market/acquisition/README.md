# `/market/acquisition` — 旅行收购子站 · 代码 SSOT

**阶段：① 本地 · PD-009 数据链 + 筛选 已闭（2026-06-03）**

**四页总 SSOT：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](../../evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)  
**规则：** [acquisition-publish-trust-rules §8.1](../../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)

**多重身份：** **非** 第五 `users.role`；**`identity_slots.acquisition`** + **`GET /me.trust.acquisition_*`**

---

## 路由与组件

**入口：** `app/market/acquisition/page.tsx` → `MarketStandaloneBusinessPage variant="acquisition"`

与 **provider** 同构（`MarketStandaloneBusinessPage`），差异：

| 项 | acquisition |
|----|-------------|
| Studio | `AcquisitionCarryStudioModal` · `acquisitionPublishEligibility.ts` |
| CTA | 打开收购 Studio · `?returnUrl=` 回 **`/me/identities`** |
| Bond UI | `MeAcquisitionPublishBondAction` · `MeAcquisitionFulfillmentBondAction` |
| 机读 | `data-testid="market-acquisition-page"` · `data-tt-market-acquisition-page="1"` |

**列表/筛选：** 同 provider — `MarketSubsiteFilterBar` · `MarketSubsiteMasonry` · `GET …/market/acquisition/listings?country=&category=&sort=`

---

## 设计（Dark Premium 子站）

- **氛围 / Hero / Hub / 页脚：** 与 [`/market/provider`](../provider/README.md) 同 token 体系（`MarketHeroFrame subsite` · `TT_MARKETING_MARKET_DARK_PATH`）
- **Hub UI 冻结范围：** **`/me/identities`** 收购卡（[`ME-IDENTITIES-UI-FREEZE`](../../evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)）— **非** 本子站 layout lock

---

## 发布 listing 前置（API · PD-009）

`POST /api/v1/market/acquisition/listings` 与 **`…/listings/drafts`**（**`acquisition_publish_gate.rs`**）：

1. Bearer 登录  
2. **`users.default_wallet_address`** 已绑  
3. **publish bond ACTIVE** 或 **`acquisition_trust_score ≥ 700`**  
4. 24h 频控 ≤ 5 条  
5. **`GET /me.trust`** 无收购阻塞  
6. POST publish **`agree_escrow_copy: true`**

**勿** 要求 **`region_steward`** · **96-18 准入费** · 商家 KYB。

**错误码：** **400** `acquisition_wallet_required` · `acquisition_publish_bond_required` · `acquisition_escrow_ack_required`；**403** `acquisition_publish_suspended` · `acquisition_trust_restricted`；**429** `acquisition_publish_rate_limited`

---

## 接单 / 履约

`POST …/acquisition/listings/:id/orders` — 委托方 = listing owner · 承运方 = 会话用户 · **`order_kind=acquisition_listing`** · 高 bounty 须 **fulfillment bond**

---

## 本地 mock 押金（① · 非链上）

- **`POST /api/v1/me/acquisition/publish-bond`**（默认 50 USDC）  
- **`POST /api/v1/me/acquisition/fulfillment-bond`**（默认 100 USDC）  
→ **②/③** 真链见 **§8.2 / §8.3**

---

## 三阶进度

| 阶 | SSOT |
|----|------|
| **①** | country/category/sort + PG catalog + PD-009 门闸 + mock bond — **已闭** |
| **②** | **MKT-FILT-P2-003** · **P2-004～012** + **轨 5** staging 收购 — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| **③** | **MKT-FILT-P3-001～005** · bond 真链 — [§8.3](../../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md) |

规格：[94 §1.3–§1.4](../../../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md) · [04 §3.4](../../../../docs/spec/04-后端与API.md)

---

## 验收（①）

```bash
cargo test -p traveltrust-api market_subsite_catalog
cargo test -p traveltrust-api matrix_pd009_trust_pg_memory_parity
cd frontend && npx vitest run acquisitionL5 acquisitionL5FullScore meTrust --run
bash scripts/dev/smoke-acquisition-pd009-local.sh
```
