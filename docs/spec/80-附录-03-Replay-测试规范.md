# 80 附录 03：Replay 测试规范（四项交付物 ③）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **本附录条款** | **正文** |
| **AI 行程主文档** | **[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)** |
| **契约衔接** | **[01](01-总库总览.md)**、**[04](04-后端与API.md)** |

**文档编号**：80 附录 03  
**用途**：定义**任意 order_id 从 genesis 到终态可 100% 重建**的验收标准与测试规范，与 [80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) §4.10、§0.5 四项交付物 ③ 一致。  
**受众**：后端、测试、审计；与 01、04、DB 事件表一致。

---

## 1. 目标

- **投资人/审计要求**：给定任意 order_id，可从**创单**到**资金终态**完整重建订单状态与资金流。
- **输入**：order_id（及可选 chain_id）。  
- **输出**：可重建的**完整状态**（订单字段、snapshot 版本、事件序列、message/quote 锚点、链上事件投影）。

---

## 2. 必须可追溯的要素

| 要素 | 要求 |
|------|------|
| **event_log** | 订单生命周期内关键事件可追溯：创建、确认最终版本（snapshot）、deposit（Paid）、争议提起、裁决、放款/退款/扣罚（ResolutionExecuted）。事件表含 blockNumber、blockHash、txHash、logIndex、event 类型与 payload。 |
| **snapshot 版本记录** | 每笔订单的 snapshot 版本与 canonical 快照可查；confirm-final-plan 写入的 snapshot_hash、schemaVersion、version 可 replay。 |
| **message / quote 版本记录** | 协商消息、报价版本与 snapshot 锚点一致（如 last_message_id、last_change_request_id、quote_id/expiresAt 若用 Live Quote），可复现「确认时上下文」。 |
| **链上事件投影** | Paid、Released、Refunded、PartiallyRefunded、Slashed、DisputeOpened、ResolutionExecuted 等与 01 §5 四类事件一致；投影可仅靠事件重建（01 17 条 #6、#12）。 |

---

## 3. Replay Validation Test 验收标准

| # | 验收项 | 通过标准 |
|---|--------|----------|
| 1 | **输入 order_id 可查** | 订单存在于 orders 表或可从 event_log 推断创建事件。 |
| 2 | **事件链完整** | 从创单到终态，事件顺序与 01 状态机一致；无缺失关键节点（如已 Paid 无 Paid 事件则失败）。 |
| 3 | **snapshot 可还原** | 若已 confirm-final-plan，可取出当时 canonical payload（或等价）与 snapshot_hash 校验一致。 |
| 4 | **金额与终态一致** | 重建后的金额、participants、终态与链上/DB 当前一致；价值守恒（01 17 条 #1）。 |
| 5 | **message/quote 锚点** | 若有 last_message_id / quote_id，可解析对应版本，与 snapshot 生成时一致。 |

---

## 4. 测试用例类型

| 类型 | 说明 |
|------|------|
| **单笔订单 Replay** | 给定一个 order_id，运行 Replay 脚本/用例，输出「可重建」且与 DB/链当前一致。 |
| **冷启动 Replay** | 仅凭 event_log（及必要 snapshot 存储）重建投影，与现有 DB 对比，无差异（01 P0-6、17 条 #6）。 |
| **CI 或发版前** | 至少 1 笔样本订单执行 Replay 并断言通过；可选：每次 deploy 后全量抽样。 |

---

## 5. 与 04、DB、01 的衔接

- **event 表**：04、01 约定 event 表含 blockNumber、blockHash、txHash、logIndex、finalityNUsed；checkpoint (blockNumber, logIndex)；reorg 时回退重放。
- **DB 全丢重建**：01 P0-6、8 项 #8 要求「仅靠事件可重建最小产物」；本规范为 Replay 的**测试层面**落地。
- **proof/evidence**：80 §4.7 要求 promptVersion、schemaVersion、snapshotHash、quoteHash 等落库；Replay 时可选用作「确认时上下文」校验。

---

## 6. 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | — | 初版：Replay 目标、必须要素、验收标准、用例类型；与 80 §4.10、01 17 条一致。 |

---

*与 [01-总库总览](01-总库总览.md)、[04-后端与API](04-后端与API.md)、[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) 配套。*
