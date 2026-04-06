# 80 附录 04：Payment Window + Timeout 状态机（四项交付物 ④）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **本附录条款** | **正文** |
| **AI 行程主文档** | **[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)** |
| **契约衔接** | **[01](01-总库总览.md)**、**[04](04-后端与API.md)** |

**文档编号**：80 附录 04  
**用途**：定义 **confirm 后 payment_window**、**超时状态转换**（自动取消、释放档期），与 [80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) §4.9、§4.15、§0.5 四项交付物 ④ 及 01 订单状态机衔接。  
**受众**：产品、后端、Schedule Engine、运维；与 01、03、04、49 F 一致。

---

## 1. 状态与事件（与 01 一致）

- **Accepted**：向导已接单，待游客 deposit。
- **Escrowed**：游客已 deposit（Paid 事件已确认），行程进行中。
- **Cancelled**：已取消或**超时取消**（未进 Escrow）。

---

## 2. Payment Window 定义

| 项 | 要求 |
|----|------|
| **窗口时长** | confirm-final-plan 成功后，在 **payment_window** 内（如 **30 分钟**，可配置 **PAYMENT_WINDOW_MINUTES** / **P3_PAYMENT_TTL_SECS**）**必须**完成 deposit。 |
| **超时未支付** | 超时未 deposit → **自动取消订单**（Accepted → Cancelled） + **解除向导档期锁定**（向导可再接单）。 |
| **锁定生效点** | 向导档期**不在** confirm 时锁定，而在 **deposit 成功并达链上 finality** 后锁定（80 §4.15）；故 payment_window 内未支付不会长期占用向导档期。 |

---

## 3. 超时状态转换表

| 当前状态 | 事件/条件 | 下一状态 | 副作用 |
|----------|-----------|----------|--------|
| Accepted | 超时未在 payment_window 内 deposit | **Cancelled** | 解除向导档期软占；释放价格/报价占用；可选通知双方。 |
| Accepted | 游客 deposit 成功（Paid 事件） | **Escrowed** | 占档（Schedule Engine）；锁定向导 start_date～end_date。 |
| Accepted | 任一方取消 / 向导撤回 | **Cancelled** | 同左。 |
| Escrowed | 双签完成 / 超时自动放款 / 争议裁决执行 | Completed / Refunded / PartiallyRefunded / Slashed | 解档；评价开放（仅资金终态）。 |

---

## 4. 与 01 订单状态机的衔接

- 01 定义：Created → Accepted → Escrowed → Completed | Disputed | Cancelled；**支付超时（Accepted→Cancelled）** 在 01 §1、03 已有。
- 本状态机将 **payment_window** 与 **超时自动取消 + 解档** 显式成文，与 01、03、49 F（PAYMENT_WINDOW_MINUTES、P3_PAYMENT_TTL_SECS）一致。

---

## 5. 实现与配置（49 F 落点）

- **后端**：Accepted 后若在 **P3_PAYMENT_TTL_SECS** 或 **PAYMENT_WINDOW_MINUTES** 内未收到 Paid 事件，可：
  - 定时任务或 Schedule Engine 将订单置为 Cancelled，并调用档期释放；
  - 或 mock-pay 返回 **410 payment_window_expired**，前端/运维可据此触发取消与解档。
- **Runbook**：ops/RUNBOOK §2.5 与 .env.example 已含 PAYMENT_WINDOW_MINUTES、档期持久化说明；本状态机为协议层补全。

---

## 6. 防锁单（80 §4.15）

- **confirm 后不支付、反复操作**：通过 **payment_window 超时自动取消** 避免向导被白锁。
- **confirm 次数/频率限制、用户信誉惩罚、冷却**：与 50-80-11 防锁单攻击成文+实现 对齐，可在此状态机扩展「同一用户短时内多次 confirm 不支付」的惩罚或限流。

---

## 7. 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | — | 初版：Payment Window 定义、超时转换表、与 01/03/49 F 衔接；与 80 §4.9、§4.15 一致。 |

---

*与 [01-总库总览](01-总库总览.md) §1 状态机、[03-业务流程与风控](03-业务流程与风控.md)、[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)、[49-阶段建议](49-阶段建议-下一阶段方向与优先级.md) F 阶段、ops/RUNBOOK 配套。*
