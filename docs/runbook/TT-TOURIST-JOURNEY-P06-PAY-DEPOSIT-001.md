# TT-TOURIST-JOURNEY-P06-PAY-DEPOSIT-001 · 支付 hub + Escrow 入金

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P2** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 6 步**  
**前置**：[P05](TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001.md) 已通过；**已配置** `escrow_address` / mock 路径或真链环境（见 04、`P3_CHAIN_OFF` 等）  
**下一卡**：[P07 · 完成与评价](TT-TOURIST-JOURNEY-P07-COMPLETE-RATING-001.md)

---

## 范围

- **`/pay?orderId=<uuid>`**：解析、错误边界、跳转 **`/escrow/[id]`**（与 **`stashEscrowOrderPrefetch`** 等行为一致）。  
- **Escrow 入金**：链上 **deposit** 或允许的 **`mock-pay` / `set-escrow-address`** 测试路径 — **本卡须书面声明采用哪条**，避免混谈「已主网级验证」。

---

## 页面 / 路由

- `/pay`  
- `/escrow/[id]`

---

## 依赖 API / 链

- `GET /api/v1/orders/:id`  
- `POST /api/v1/orders/:id/mock-pay`（仅允许环境）  
- `POST /api/v1/orders/:id/set-escrow-address`（若 mock 管线）  
- 合约：`Escrow` deposit / `token` allowance — 见 **14** + 前端 `useEscrowDetail`

---

## 验收（可勾选）

- [ ] 非法 `orderId`：**边界提示** + **不崩溃**（对齐 pay 相关已封口 TT）  
- [ ] 合法订单：**可进入托管** 并完成 **一次入金或 mock 等价步骤**  
- [ ] **`GET :id`** **状态** 推进至 **Escrowed**（或与 04 一致的后继态）  
- [ ] **B-068**：RPC 降级时 **不展示陈旧 allowance 为真**  
- [ ] 若走真链：**chainId / 地址** 与 **`GET /meta`** **同源**

---

**文档版本**：1.0 · 2026-04-17
