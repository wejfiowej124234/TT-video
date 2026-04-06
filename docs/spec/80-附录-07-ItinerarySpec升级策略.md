# 80 附录 07：ItinerarySpec 升级策略（50-80-13）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **本附录条款** | **正文** |
| **AI 行程主文档** | **[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)** |
| **契约衔接** | **[01](01-总库总览.md)**、**[04](04-后端与API.md)** |

**文档编号**：80 附录 07  
**用途**：行程规范 **ItinerarySpec** 的**版本升级策略**：向下兼容、老 snapshot 可 replay、schemaVersion 进 hash，与 [80-附录-01-Canonical-Payload-白皮书](80-附录-01-Canonical-Payload-白皮书.md) §5、80 §0.4 2️⃣、§9 验收 11 一致。  
**受众**：后端、合约、审计。

---

## 1. 原则

| 原则 | 说明 |
|------|------|
| **v2 不得移除字段** | 新版本（如 schemaVersion=2）仅可**追加**字段或标记 **deprecated**；canonical payload 为 **superset**（老版本字段仍存在）。 |
| **老 snapshot 可 replay** | 历史订单 replay 时，按**当时**的 schemaVersion 解析；缺失字段按 deprecated 或默认值处理，不因新版本而破坏老数据。 |
| **schemaVersion 必进 canonical** | 参与 snapshotHash 的 payload **必须**含 **schemaVersion**（如 "1"、"2"），便于 replay 时按版本选择解析器。 |

---

## 2. 升级流程（建议）

1. **定义 v2 schema**：在 80-附录-01 或独立 ItinerarySpec 文档中定义 v2 新增字段与语义；v1 字段保留且不删。
2. **后端/合约**：生成 snapshot 时写入 **schemaVersion**；验证与 replay 时根据 schemaVersion 选择解析逻辑。
3. **兼容读取**：GET 订单/行程时，若为 v1 snapshot 则按 v1 返回；v2 则返回 v2 结构；前端或客户端按需兼容多版本展示。

---

## 3. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2025-03-04 | 初版：superset、replay、schemaVersion 必进 hash；50-80-13 成文。 |
