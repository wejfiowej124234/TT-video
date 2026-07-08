# OWNER-FULFILLMENT-GUIDE-DECISION

**Decision type:** Business Rule · Fulfillment Guide Requirement  
**Recorded:** 2026-07-07  
**Owner:** Solo Founder  
**Mode:** Decision document only · 无 registry · 无代码 · 无数据 · 无 Fix · 无 ACTIVE

**Context:** BD-005 · Provider Order Lifecycle · HAT FAIL @ `market_listing_fulfillment_guide_required`

---

## 1. 裁定结论

| 项 | 值 |
|----|-----|
| **选定方案** | **A — Provider listing 必须绑定 active fulfillment guide** |
| **未选方案** | B — Provider 可无 guide 自履约（当前设计与 SSOT **不支持**） |
| **性质** | **By Design（产品/工程 SSOT）** + **Staging 数据/入驻 Readiness 缺口** |
| **非性质** | Pricing 缺陷 · 422 误报 · 应删除的门闸 |

---

## 2. 审查范围与方法

基于 **Provider Order Lifecycle 设计规范** 对读，未改实现：

| SSOT | 审查结论 |
|------|----------|
| [04-后端与API §3.4](docs/spec/04-后端与API.md) | `POST …/provider/listings/:id/orders` 明文：履约 **`guide_id`** = listing **owner** 的 **active `guides` 行**；**422** `market_listing_fulfillment_guide_required` 为**契约内错误** |
| [94-自由市场…技术规格 §3.2](docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md) | 收购单：**自动** `ensure_acquisition_fulfillment_guide_id`；**商家单未列同等自动创建** —  asymmetry 为设计差异 |
| [identity-unified-model §3.3/§3.5](docs/spec/artifacts/identity-unified-model.v1.md) | **Provider** 与 **Guide** 分轨（PD-003）；收购履约可 auto-guide；**商家轨未声明免 guide** |
| `market_listing_orders.rs` | provider：`select_active_guide_id_for_user(owner)` → 无则 422；acquisition：`ensure_acquisition_fulfillment_guide_id` |
| `matrix_94_provider_listing_post_order_*` | 测试前置：**owner 须 insert active guide** 方可下单 |
| DID rank `providers`（04 §3.4） | MVP 以 **`guide_id` 完成单** 代理商家履约统计 |

**Evidence 对读：** staging 10 条 production catalog 可见，但 owner 无 active guide → 422 与 SSOT **一致**，非规则意外。

---

## 3. 方案对比与 Owner 裁定

### 方案 A · Provider listing requires active fulfillment guide（**采用**）

**业务规则（裁定后表述）：**

> 商家橱窗 listing 成交时，系统复用旅游 **Order + Escrow** 状态机。Listing **owner**（`users.role=provider`）在创单前必须已有 **`guides.status=active`** 行；该 guide 行作为 **`order.guide_id` 履约主体**，承接 accept / confirm-completion 等链下进度（与 Sprint A Guide HAT 同构，身份为 listing owner 或其 guide 轨）。

**设计理由（规范层）：**

1. **订单模型复用**：`merchant_listing` 订单写入 `guide_id`，与 53/Escrow 释放路径对齐；无 guide 则状态机无履约方。
2. **与收购对称但不同**：收购受托方接单时 **自动** 最小 fulfillment guide；**商家 owner 不自动创建** — SSOT 已区分两业务线。
3. **422 为文档化契约**：04 路由表将 `market_listing_fulfillment_guide_required` 与 200 并列登记，非未文档化 bug。
4. **榜单与统计**：Provider DID 榜以 guide 完成单代理，免 guide 会破坏 KPI 语义。

**对 BD-005 的含义：**

- **不是**「改 Pricing / 改 Market」
- **是** Provider **Order Lifecycle Readiness**：catalog 可展示，但 **owner 未完成 fulfillment guide 前置** → 业务链未 Ready
- Staging 缺口：OCS/production catalog owner **发布时未绑定 guide 轨**（数据/onboarding），非否定 A

### 方案 B · Provider can fulfill without guide（**不采用**）

**若采用 B 须：**

- 修订 04 §3.4、94 §3.2、93 矩阵
- 改 `market_listing_orders.rs` 创单逻辑（无 guide 的 `order.guide_id` 语义）
- 重定 DID provider 榜 `rank_basis`
- 重跑 matrix_94 + HAT

**Owner 裁定不采用原因：**

- 与 **① 已闭** 工程 SSOT、IT 矩阵、API 契约 **正面冲突**
- 无产品 spec 支持「纯 provider 零 guide 走 Escrow 全链」
- BD-005 Discovery 已证明阻塞点在 **fulfillment 前置**，非 Pricing；解法是 **补齐 Readiness**，非拆除门闸

---

## 4. 治理语义（回应 Gate Review）

| 字段 | 裁定值 | 说明 |
|------|--------|------|
| `failure_signature_confirmed` | **true** | 422 + hint 已机读确认 |
| `root_cause_candidate` | `provider_fulfillment_guide_missing` | 候选解释与 SSOT 一致 |
| **`business_rule_confirmed`** | **true** | **本文 Owner 决策 · 方案 A 为设计真源** |
| `root_cause_confirmed`（Sprint ACTIVE 严格义） | **false** | 未批准 Fix 路径/未选 pilot 补齐方式 |
| `fix_authorized` | **false** | 本文档不授权工程或数据变更 |

**说明：** Registry v11 中 BD-005 `root_cause_confirmed: true` **语义过宽**；应以本文拆分字段为准，**待 Registry v12 微补丁**（不在本文执行）。

---

## 5. 已知产品/入驻 Gap（方案 A 下仍 OPEN）

规范审查发现 **implementation > onboarding 文档**  gap：

| Gap | 说明 |
|-----|------|
| Provider onboarding 未显式声明 | `/provider/register` 链（identity §3.3）完成 KYB/准入后可 **发 listing**，但 **未强制同步 guide 轨** |
| 双身份路径 | Owner 若需履约，须另走 `/guide/register` 或等价 **`guides` active** — **产品未在商家工作台单页声明** |
| Staging catalog | production listing owner 无 guide → **数据 Readiness** 问题，符合 A 下「未 Ready」 |

**不在本文关闭** — 留待 Fix Sprint（profile 补齐 vs onboarding UX）时处理。

---

## 6. Fix 路径预览（未授权 · 仅决策后果）

**在方案 A 下，BD-005 关闭仅能通过：**

1. 为 staging pilot provider（listing owner）建立 **active guide** 关联；**或**
2. 修正 catalog seed/onboarding，使 **published listing owner 必含 active guide**

然后：

- 重跑 `run-sprint-b-provider-hat-order-validation.cjs`
- `TT_SPRINT_B_PROVIDER_HAT_ORDER = PASS`
- Owner 显式 `TT_SPRINT_B ACTIVE=true` → Fix Validation → BD-005 CLOSED

**本文不执行以上任何步骤。**

---

## 7. 决策记录

| 项目 | 值 |
|------|-----|
| Decision ID | OWNER-FULFILLMENT-GUIDE-DECISION |
| Selected | **A** |
| Rejected | **B** |
| business_rule_confirmed | **true** |
| fix_authorized | **false** |
| TT_SPRINT_B_ACTIVE | **false**（不变） |
| Supersedes ambiguity | BD-005 registry `root_cause_confirmed` 宽语义 |

---

## 8. Supporting Evidence

- `evidence/GO_production_readiness/step2/hat/SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json`
- `evidence/GO_production_readiness/sprints/PRODUCTION-READINESS-GATE-REVIEW-LATEST.json`
- `evidence/GO_production_readiness/sprints/BD-002-REDEFINE-CONFIRMATION-LATEST.json`
- `docs/spec/04-后端与API.md` · `docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md`
- `docs/spec/artifacts/identity-unified-model.v1.md`
- `crates/api/src/chain_off/market_listing_orders.rs`

---

*Owner decision recorded · no registry · no code · no data · no Fix · no ACTIVE*
