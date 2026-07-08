# BD-002 · REDEFINE 确认文档

**Document type:** Root Cause REDEFINE Confirmation（Discovery-only · 无 Fix）  
**Recorded:** 2026-07-07  
**Sprint:** B · **TT_SPRINT_B:** READY · **TT_SPRINT_B_ACTIVE:** false  
**Status:** REDEFINE **CONFIRMED**（文档确认）· **Root Cause CONFIRMED for Sprint ACTIVE:** ❌（本文档不触发 ACTIVE）

---

## 1. 摘要

| 字段 | 值 |
|------|-----|
| Issue ID | BD-002 |
| 原 Root Cause 假设 | Provider Pricing 不完整 |
| 假设状态 | **REJECTED** |
| 候选新 Root Cause | Provider Order Lifecycle / Fulfillment Guide 缺失导致下单 422 |
| HAT 总 verdict | **FAIL**（阻塞于 `create_order`） |
| Catalog Day2 verdict | **READY**（6/6 PASS，含 Pricing） |
| 结论 | Catalog PASS ≠ Provider Business PASS；Pricing 不是 staging 阻塞点 |

---

## 2. 原假设 · REJECTED

### 2.1 原表述

> **BD-002：** Provider Pricing 不完整 — Market/API 层 listing 缺少有效 `priceUsdc` 或展示不一致。

### 2.2 否定依据

| 探针 | 结果 | 说明 |
|------|------|------|
| Day2 · Pricing Probe | **PASS** | 10/10 公开 provider listings 含有效 `priceUsdc` |
| Day2 · 全检查 | **PASS** | Profile / Pricing / Images / Status / Listings / Availability 均无 FAIL |
| HAT · Market catalog | **PASS** | `GET /api/v1/market/provider/listings` 返回 10 条，含价格与 cover |
| HAT · create_order | **FAIL** | HTTP **422**，与 Pricing 字段无关 |

**REJECTED 声明：** 在 staging 当前数据面下，「Provider Pricing 不完整」**不能**解释 Provider 业务链阻塞，**不应**作为 Sprint B Fix 目标。

---

## 3. 候选新 Root Cause（待 Sprint ACTIVE 前正式登记）

### 3.1 表述

> **Provider Order Lifecycle / Fulfillment Guide 缺失** — Provider listing 可发布且在 Market 可见，但 **`POST …/market/provider/listings/:id/orders`** 因 listing owner **无 active guide profile** 返回 **422** `market_listing_fulfillment_guide_required`，导致订单生命周期无法启动（accept → mock-pay → complete 均未执行）。

### 3.2 失败签名（机读）

```json
{
  "http": 422,
  "error": "market_listing_fulfillment_guide_required",
  "hint": "fulfillment party must have an active guide profile"
}
```

### 3.3 与代码契约对齐

- 实现：`crates/api/src/chain_off/market_listing_orders.rs` — provider variant 调用 `select_active_guide_id_for_user(pool, listing.owner_user_id)`；无 active guide → 422。
- 94 规格：`POST …/provider/listings/:id/orders` → `order_kind=merchant_listing`；矩阵测试通过路径要求 owner 具备 **active guide**（见 `listing_orders.rs` matrix_94）。

### 3.4 次要观察（非本 RC 主因 · 记入 Evidence）

| 观察 | Verdict | 说明 |
|------|---------|------|
| `merchant@test.com` 自建 listing 未出现在 public catalog | WARN | `TRAVELTRUST_PUBLIC_CATALOG_SURFACE` 过滤 dev/smoke `data_origin`；不影响对 **已发布 production catalog** 下单失败的归因 |
| `merchant@test.com` 无 guide | 上下文 | 与 catalog listing owner（如 `62ce943b…`）同样无 active guide 时，下单均 422 |

---

## 4. Supporting Evidence

| # | 路径 | 用途 |
|---|------|------|
| E1 | `evidence/GO_production_readiness/step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json` | Catalog 层 6/6 PASS · BD-002 Pricing 假设 REJECTED |
| E2 | `evidence/GO_production_readiness/step2/probes/provider_pricing_probe.json` | Pricing 逐条 PASS |
| E3 | `evidence/GO_production_readiness/step2/hat/SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json` | HAT 全链 · Order FAIL 422 |
| E4 | `evidence/GO_production_readiness/sprints/SPRINT-B-DISCOVERY-RESULT.md` | Catalog + HAT 汇总 |
| E5 | `scripts/dev/run-sprint-b-provider-hat-order-validation.cjs` | 可复现探针 |
| E6 | `scripts/dev/run-provider-business-data-readiness-probes.cjs` | Day2 可复现探针 |

**HAT 探针样本（staging · 2026-07-07）：**

- API: `https://tt-api-staging.fly.dev`
- 账号: `merchant@test.com` / `tourist@test.com`
- 失败 listing: `c6f938af-4fb6-4059-bcac-5dd3e2015655`（东京旅拍 · production catalog）
- 步骤: provider_auth PASS → create_listing PASS → market_visible_catalog PASS → **create_order FAIL 422** → accept/pay/complete SKIP

---

## 5. Impact

### 5.1 业务影响

| 层级 | 状态 | 用户可见影响 |
|------|------|----------------|
| Catalog / Market 浏览 | ✅ | 用户可见 Provider 商品与价格 |
| 下单 | ❌ | 旅行者无法从 Provider listing 创建订单 |
| 支付 / 托管 | ⛔ 未触达 | mock-pay 未执行 |
| 完成 / 结算 | ⛔ 未触达 | confirm-completion 未执行 |
| Provider Business Ready | **NO** | 整条 Provider 商业链未 PASS |

### 5.2 与 Open RC 关系

- **BD-002（Pricing 假设）：** 无 Fix 价值；若仅修 Pricing 将 **修错问题**（Sprint A BD-001/BD-004 教训同源）。
- **BD-003（Cover）：** Day2 Images PASS；与本次 Order 422 **无直接因果**。
- **HAT-003 / BFM-001：** 独立队列项；不冲突。

### 5.3 Sprint 信号（本文档 **不修改**）

- `TT_SPRINT_B=READY`
- `TT_SPRINT_B_ACTIVE=false`
- `root_cause_confconfirmed=false`（须新 RC 登记 + 门禁后方能 ACTIVE）

---

## 6. Exit Condition

### 6.1 原 BD-002（Pricing 假设）· 关闭条件

原假设已 REJECTED，**关闭方式**应为「假设否定 · 无需 Fix」，而非「Pricing Fix 后 PASS」：

- [x] Day2 Pricing Probe PASS（10/10）
- [x] HAT 证明阻塞点 **不在** Pricing 层
- [ ] 正式 registry 动作：将 BD-002 标为 **CLOSED（hypothesis rejected）** 或 **REDEFINED**（见 §7）

### 6.2 新 Root Cause（Order Lifecycle）· 关闭条件

Sprint B Fix **应**以以下条件为 Exit（与 Guide HAT 同构）：

1. **前置：** staging 上存在可下单的 Provider pilot（owner 具备 **active guide**，或产品明确豁免/替代 fulfillment 路径且有 Evidence）。
2. **HAT 全链 PASS：**
   - `POST …/market/provider/listings/:id/orders` → 200，`order.id` 存在
   - `POST …/orders/:id/accept`（provider/fulfillment 身份）→ `accepted`
   - `POST …/orders/:id/mock-pay`（tourist）→ `escrowed`
   - `POST …/orders/:id/confirm-completion` → `completed`
3. **Evidence：** `SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json` → `TT_SPRINT_B_PROVIDER_HAT_ORDER: PASS`
4. **Validation script：** `scripts/dev/run-sprint-b-provider-hat-order-validation.cjs` exit 0

**WARN 项（market_visible_own_listing）：** merchant 测试账号 listing 被 public surface 过滤 — 不作为 Order Lifecycle RC 的阻塞关闭条件；关闭以 **production catalog listing 可完成全链** 为准。

---

## 7. 复用 BD-002 vs 拆分新 Root Cause · 建议

### 7.1 选项 A · **拆分新 RC（推荐）**

| 动作 | 说明 |
|------|------|
| BD-002 | **CLOSED** — `close_note`: 原假设「Provider Pricing 不完整」REJECTED · Catalog+HAT Evidence · 无 Fix |
| 新 ID（建议 **BD-005**） | **OPEN** — Root Cause: Provider Order Lifecycle / Fulfillment Guide 缺失 · Sprint B 候选 ACTIVE 项 |

**理由（对齐 Sprint A 先例）：**

- Sprint A：**BD-001** 原假设否定 → **BD-004** 登记真实可 Fix 项（Pricing）；Availability 与 Pricing **分层**。
- Sprint B：Pricing 与 Order Lifecycle **分层**；BD-002 名称与历史 Evidence 均绑定「Pricing」，继续复用 ID 易在 runbook / Open RC 计数上 **混淆已否定的假设与待 Fix 项**。
- Open RC 趋势指标按 **可 Fix Root Cause** 计数；REJECTED 假设应 **关闭**，新阻塞 **新开**。

### 7.2 选项 B · **复用 BD-002（REDEFINE in place）**

| 动作 | 说明 |
|------|------|
| BD-002 | 保留 OPEN · `root_cause` 改写为 Order Lifecycle · `hypothesis_pricing: REJECTED` 写入 `close_note` / 历史字段 |

**适用：** 希望 sprint_queue 头部 ID 不变、减少 registry 条目时。  
**代价：** 证据链与文档中须长期区分「BD-002 曾指 Pricing」；与 Sprint A 分 ID 惯例不一致。

### 7.3 确认结论

| 决策项 | 确认值 |
|--------|--------|
| 原假设 REJECTED | **是** |
| 新 Root Cause 方向 | **Provider Order Lifecycle / Fulfillment Guide 缺失 → 422** |
| 推荐 registry 策略 | **选项 A · 拆分（BD-002 CLOSED rejected + BD-005 OPEN）** |
| 本文档是否触发 ACTIVE | **否** |
| 下一步（registry 外） | Owner 确认 BD-005 命名 → 更新 `production-readiness-open-issues.v1.yaml` → `root_cause_confirmed=true` → 方可 `TT_SPRINT_B ACTIVE` |

---

## 8. Discovery-first 记录（Lesson）

1. **Catalog PASS ≠ Provider Business PASS** — 须 HAT 全链再关 RC。
2. Sprint B 第二次 **假设否定**（Pricing），避免「修错问题」。
3. 失败层明确：**Market 展示层 PASS · Order 创建层 FAIL** — Fix 应指向 fulfillment / guide 前置或产品策略，而非 Pricing 字段。

---

## 9. 签核槽（未执行 Fix · 仅 Discovery 确认）

| 角色 | 状态 | 说明 |
|------|------|------|
| Evidence | ✅ READY | E1–E6 已落盘 |
| REDEFINE 文档 | ✅ 本文档 | 不代替 registry 变更 |
| Root Cause CONFIRMED（Sprint ACTIVE 门禁） | ⏳ Pending | 待 Owner 采纳 §7 并更新 registry |
| TT_SPRINT_B ACTIVE | ❌ false |  intentional · 无 Fix / 无数据变更 |

---

*Generated from Provider HAT Discovery · mode: discovery_only · no code · no data · no ACTIVE*
