# L5 Consistency & System Integrity Audit · Consistency Matrix

**Program ID:** `l5-consistency-system-integrity-audit-20260608`  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产  
**审计标准：** 同一业务对象在五角色全站须 **一致表达 · 一致状态 · 一致预期**  
**机读 SSOT：** `frontend/lib/l5/l5ConsistencySystemIntegrityAuditModel.ts` · `l5ConsistencySystemIntegrity.contract.test.ts`

---

## 总表

| 项 | 结论 |
|----|------|
| **有没有收口（① 五角色一致性）** | **是** — P0/P1 已闭；P2 留 ②③ |
| **有没有 UI 冻结** | **是** — 仅 i18n / SSOT 引用 / 展示对齐 |

---

## 一致性维度 × 五角色

| 维度 | Traveler | Guide | Merchant | Admin | Governance |
|------|:--------:|:-----:|:--------:|:-----:|:----------:|
| 术语 | ● | ● | ○ | ● | ○ |
| 状态机 | ● | ● | ○ | ● | ○ |
| 金额 | ● | ● | ○ | ○ | ○ |
| 时间 | ○ | ○ | ○ | ○ | ○ |
| CTA | ● | ● | ○ | ● | ○ |
| 导航 | ● | ● | ○ | ● | ○ |
| 权限 | ○ | ○ | ○ | ● | ○ |
| 空状态 | ○ | ○ | ○ | ○ | ○ |
| 错误状态 | ○ | ○ | ○ | ○ | ○ |
| 数据展示 | ● | ● | ○ | ● | ○ |
| 跨角色交互 | ● | ● | ○ | ● | ○ |

---

## Consistency Findings Matrix

### P0（1/1 ✅）

| ID | 角色 | 维度 | 场景 | 问题 | 修复 |
|----|------|------|------|------|------|
| CSI-P0-01 | Traveler | 金额 | 首页预览 → 订单详情 | 预览「美元估算」、详情卡 USDC | `CONSUMER_TRIP_CURRENCY_LOCALE_KEY` 统一 QuoteSummaryCard / EscrowDetail / OrderCard |

### P1（10/10 ✅）

| ID | 角色 | 维度 | 场景 | 问题 | 修复 |
|----|------|------|------|------|------|
| CSI-P1-01 | Traveler | 术语 | `/escrow/:id` meta | meta 仍写「托管详情」 | →「订单详情、金额、参与方与付款进度」 |
| CSI-P1-02 | Traveler | CTA | `/pay` mock | mock 成功文案「打开托管详情」 | →「打开订单详情」 |
| CSI-P1-03 | Traveler | 导航 | Header | `header_payHub` vs `pay_pageTitle` | 统一为「行程付款 / Trip payment」 |
| CSI-P1-04 | Traveler | 导航 | 市场绑定向导 | 返回「订单页」 | →「返回订单详情」 |
| CSI-P1-05 | Traveler | 术语 | `/orders` | 列表 hint / expect banner 托管详情 | → 订单详情 |
| CSI-P1-06 | Traveler | 术语 | `/help` FAQ | Pay/Escrow FAQ 托管/Escrow 用语 | 消费者「订单详情」+ 保留 `/escrow/` 路径 |
| CSI-P1-07 | Traveler | 金额 | `/market` 卡片 | OrderCard USDC | `traveler_quote_currency` |
| CSI-P1-08 | Traveler | CTA | 评价释放 | rate CTA 托管详情 | → 订单详情 |
| CSI-P1-09 | Admin | 术语 | 订单列表 aria | 订单托管页 | → 打开订单详情 |
| CSI-P1-10 | Guide | 跨角色 | 接单 → 游客付款 | 回归：`market_acceptSuccess` 已对齐 | contract guard |

### P2 → ②③

| ID | 维度 | 场景 | 阶 |
|----|------|------|-----|
| CSI-P2-01 | 导航 | `/escrow/` URL 与消费者「订单详情」命名 | ② |
| CSI-P2-02 | 状态机 | Admin `admin_orders_state_*` vs `order_status_*` | ② |
| CSI-P2-03 | 术语 | `orders_meta_description` 托管状态 | ② |
| CSI-P2-04 | 术语 | TravelTrust 品牌页 订单托管/USDC 叙事 | ③ |
| CSI-P2-05 | 术语 | Admin 列表 hint Escrow 详情 | ② |

---

## 金额 SSOT（消费者路径）

| 表面 | 货币标签 | 金额来源 |
|------|----------|----------|
| 首页行程预览 | `traveler_quote_currency`（美元估算） | `resolveEscrowDisplayAmount` |
| 订单详情报价卡 | 同上 | 同上 |
| 市场订单卡 | 同上 | 卡片 amount 字段 |
| 链上协议区（非 draft） | `formatEscrowStablecoinCurrency` | 入金后 USDC |

---

## 订单详情术语 SSOT（消费者 + Admin 行操作）

| Key | zh | en |
|-----|----|----|
| `escrow_meta_title` | 订单详情 | Order details |
| `escrow_breadcrumb_current` | 订单详情 | Order details |
| `orders_escrowDetail` | 订单详情 | Order details |
| `pay_ctaEscrow` | 打开订单详情 | Open order details |
| `header_payHub` | 行程付款 | Trip payment |
| `pay_pageTitle` | 行程付款 | Trip payment |

---

## 验收

```bash
cd frontend
npx vitest run lib/l5/l5ConsistencySystemIntegrity.contract.test.ts \
  lib/l5/l5EdgeCaseExceptionAudit.contract.test.ts \
  lib/l5/l5CrossRoleRealityAudit.contract.test.ts \
  lib/l5/l5MultiDimensionalExcellence.contract.test.ts \
  lib/travelerL5ExcellenceSprint.contract.test.ts \
  lib/homeConsumerExperienceL5.contract.test.ts
```

**L5 System Integrity Standard（①）：** Consistency Matrix 已输出 · **P0/P1 = 0 open** · 消费者主路径术语/金额/CTA/导航已 SSOT 对齐。
