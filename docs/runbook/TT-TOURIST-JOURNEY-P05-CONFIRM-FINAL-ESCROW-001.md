# TT-TOURIST-JOURNEY-P05-CONFIRM-FINAL-ESCROW-001 · 终版确认 + 进入托管页

**母表**：**B-436**（[`docs/任务母表.md`](../任务母表.md)）  
**优先级**：**P1** · **程序位**：[`TT-TOURIST-JOURNEY-PROGRAM-001`](TT-TOURIST-JOURNEY-PROGRAM-001.md) **第 5 步**  
**前置**：[P04](TT-TOURIST-JOURNEY-P04-BILATERAL-001.md) 已通过  
**下一卡**：[P06 · 支付 hub 与入金](TT-TOURIST-JOURNEY-P06-PAY-DEPOSIT-001.md)

---

## 范围

- **前置**：P04 已通过（`Accepted` + **`sub_status=confirmed`**）。  
- **`POST /api/v1/orders/:id/confirm-final-plan`** 成功（链下：`Draft` **或** 上述 Accepted；须带 **`expected_version`** 与当前行程 **`version`** 一致）。  
- 市场建单（`POST /orders`）与接单会确保存在最小 **`itinerary` bundle**，以便报价区与 canonical **`snapshot_hash`**。  
- **`/escrow/[id]`** 展示协议快照（**`#escrow-after-final-plan`** 锚点、**快照哈希**文案）；**B-070** 同页刷新/路由行为见 04 §3.4。  
- **不纳入**：P06 入金 / 链上 deposit。

---

## 页面 / 路由

- 订单详情 / ConfirmFinalPlanBlock 所在页  
- `/escrow/[id]`

---

## 依赖 API

- `POST /api/v1/orders/:id/confirm-final-plan`  
- `GET /api/v1/orders/:id`  
- `GET /meta`（B-067 协议暂停门闸）

---

## 验收（可勾选）

- [x] **`GET :id`** 在成功后含 **`itinerary.snapshot_hash`**（`0x` 前缀）  
- [x] **`/escrow/<orderId>`** 主区域可见 **快照哈希**（中/英其一）且存在 **`#escrow-after-final-plan`**  
- [ ] **409 `version_conflict`** 时与现实现一致（刷新后重试）  
- [ ] **Escrow** 页 **无**「meta 未加载却假阳性暂停」  

## 自动化

- `npm run e2e:p05-final-escrow`（`frontend`，`--project=chromium`）  
- 全栈：`PLAYWRIGHT_FULL_STACK=1`。若本机 **8080** 已有陈旧 API，可先停该进程，或设 **`PLAYWRIGHT_REUSE_API_SERVER=0`** 并换端口，例如：  
  `PLAYWRIGHT_API_PORT=18080` **`PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:18080`** **`PLAYWRIGHT_API_HEALTH_URL=http://127.0.0.1:18080/health`**（与 `playwright.config` 一致）。

---

**文档版本**：1.1 · 2026-04-17
