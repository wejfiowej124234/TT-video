# `/pay` 支付 Hub · Phase ① 收口（2026-06-03）

**阶段：① 本地** — **`/pay?orderId=`** 暖色协议壳 · mock-pay / 钱包引导；**不**表示 ② Stripe / ③ 生产 PSP GO。

**代码真源：** `frontend/app/pay/` · `frontend/lib/pay/payHubL5.ts` · [`app/pay/README.md`](../../app/pay/README.md)

**互指：** [`GO_local_orders_l5`](../GO_local_orders_l5/README.md) · [`escrowProtocolUi.ts`](../../lib/escrowProtocolUi.ts)

---

## 收口结论（ACTIVE）

| 维度 | 状态 |
|------|------|
| **页壳 L5** | 与 **`escrowProtocolUi`** 同源暖色 Console 壳 · `data-tt-pay-hub-l5="1"` |
| **入口** | 列表卡 `data-tt-orders-list-pay-link` · 深链 `/pay?orderId=` |
| **① 支付** | mock-pay / chain_off 门闸（**非** 真 USDC 验收） |
| **UI 冻结** | **结构/token 维护期锁** — 禁止改回浅色 Console 或脱离协议壳 |
| **Escrow 草稿** | **非** 本页范围（草稿走 Experience 冻结） |

---

## 维护期边界

| 允许 | 禁止 |
|------|------|
| `usePayPage` API 接线 · i18n · 错误态 | 删除 `payHubL5` 协议壳或改布局为非 Escrow 同源 |
| mock-pay / order 状态门闸 | 宣称 ②③ 真 PSP 已验 |
| 面包屑 ↔ `/orders` / `/escrow/[id]` | 旅行者默认路径绕过订单 SSOT |

---

## 机读验收（须 exit 0）

```bash
bash scripts/dev/run-orders-l5-green.sh
```

含：`lib/pay/payHubL5.contract.test.ts` · `app/pay/page.test.tsx`

末行：`TT_ORDERS_L5_GREEN: OK`
