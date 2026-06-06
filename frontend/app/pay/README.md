# `/pay` · 支付 Hub

**阶段：① 本地** · **非五主路由**

## 读序

| 顺序 | 文档 |
|------|------|
| ① | **[GO_local_orders_l5](../../../evidence/GO_local_orders_l5/README.md)** — 列表 → 支付走廊 |
| ② | **[PAY-HUB-PHASE1-CLOSURE](../../../evidence/GO_local_web3_pages_closure/PAY-HUB-PHASE1-CLOSURE.md)** — Phase ① 收口 |
| ③ | `lib/pay/payHubL5.ts` · `app/pay/PayPageMain.tsx` |

## 路由

- **页身：** `page.tsx` → `PayPageInner` → `usePayPage` → `PayPageMain`
- **入口：** `/pay?orderId=`（列表卡 `data-tt-orders-list-pay-link`）

## 机读

```bash
bash scripts/dev/run-orders-l5-green.sh
```

含：`lib/pay/payHubL5.contract.test.ts` · `app/pay/page.test.tsx`
