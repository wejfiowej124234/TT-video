# 80 附录 12：Live Quote Phase 2 排期（50-O-80-1）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **本附录条款** | **正文** |
| **AI 行程主文档** | **[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)** |
| **契约衔接** | **[01](01-总库总览.md)**、**[04](04-后端与API.md)** |

**文档编号**：80 附录 12  
**用途**：**Live Quote**（实时报价）的 **Phase 2 排期**与范围说明，与 [80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) §5.1、§8 Phase 2 一致。  
**受众**：产品、后端、前端。

---

## 1. Phase 2 范围（80 §8）

| 项 | 说明 |
|------|------|
| **Live Quote** | 1 个航班 API + 1 个酒店 API（80 §5.1：Amadeus/Duffel、Booking Demand/Expedia Rapid 等）；输出 Quote 对象（source、retrievedAt、ttl、expiresAt）；UI 标注 Live quote + 倒计时 TTL。 |
| **pricing_service** | 报价服务独立于 AI；API 聚合 + TTL；Redis 缓存、expiresAt；Confirm Final Plan 时再拉一次实时价。 |
| **前置** | **Price Drift Handling Policy** 须先定稿（见 [80-附录-11-Price-Drift-Handling-Policy](80-附录-11-Price-Drift-Handling-Policy.md)）。 |

---

## 2. 排期与依赖

- **当前**：Phase 1 已闭环（Canonical、资金流、Replay、Payment Window、Draft 上限、乐观锁、Snapshot 扩展、排序/限流/互斥、幂等、proof 落库等）；**无** Live Quote 实现。
- **Phase 2 排期**：由产品与资源排期；实现前须完成 Price Drift Policy 定稿、pricing_service 设计与 Quote TTL 约定。
- **50-O-80-1**：本附录为 Live Quote Phase 2 的排期与范围成文；实现时以 80 §5.1、§8 及本附录为准。

---

## 3. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2025-03-04 | 初版：Phase 2 范围与排期说明；50-O-80-1 成文。 |
