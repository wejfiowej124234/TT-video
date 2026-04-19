# 80 附录 01：Canonical Payload 白皮书（四项交付物 ①）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **本附录条款** | **正文** |
| **AI 行程主文档** | **[80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)** |
| **契约衔接** | **[01](01-总库总览.md)**、**[04](04-后端与API.md)** |

**文档编号**：80 附录 01  
**用途**：参与 **snapshotHash** 的**完整字段清单**与序列化规则，供实现与审计单源遵循；与 [80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md) §4.4、§0.5 四项交付物 ① 一致。  
**受众**：后端/合约实现、审计、产品；与 01、02、04、19 衔接。

---

## 1. 目的与约束

- **目的**：避免「软结构生成硬签名」——字段顺序或 UI 文案变动导致 hash 不同、版本升级冲突。snapshotHash 用于链上绑定与争议时可验证「确认时合同全文」。
- **约束**：生成 snapshot 前 payload **必须**通过本白皮书定义的 Canonical 规则与字段清单；**不得**将未列字段或未约定格式写入参与 hash 的 payload。

---

## 2. Canonical JSON 规则

| 规则 | 要求 |
|------|------|
| **键序** | 键按**字母序**排列（ASCII）。 |
| **数值** | 金额**全部用整数（最小单位）**；禁止 float；同一数值不得有多种表示（如 1000 与 1000.0 禁止混用）。 |
| **字符串** | UTF-8 编码；空串与 null 的约定见「不参与 / 可选」规则。 |
| **可选键** | 未定义或约定为「不参与」的键**不出现**于 canonical 串；或明确约定 null 的序列化方式（如 `"key": null` 必须出现且仅此一种）。 |
| **无多余空白** | 无换行、无多余空格（紧凑 JSON）。 |

---

## 3. 参与 snapshotHash 的字段（完整清单）

以下字段**必须**包含在 canonical payload 中，并参与 `snapshotHash = keccak256(canonical_json)`。实现时须与本表一致，增删须走协议变更与本文修订。

### 3.1 身份与链上下文（0.5 ⅠⅡ）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| traveler_id | string | 旅行者身份标识（如 wallet 或 user_id，与 01 主身份一致） |
| guide_id | string | 向导身份标识 |
| chain_id | string 或 integer | 链 ID（如 137） |
| settlement_token | string | 结算代币地址（token_address） |
| token_decimals | integer | 代币精度 |
| token_symbol | string | 代币符号（如 USDC） |
| contract_version | string | 合约/协议版本，用于多版本并存时路由裁决与验证 |

### 3.2 订单与档期

| 字段名 | 类型 | 说明 |
|--------|------|------|
| order_id | string | 订单 ID（bytes32 或等效字符串） |
| schemaVersion | string | ItinerarySpec 版本（如 "1"），用于 replay 与升级兼容 |
| version | integer | 行程/订单版本号 |
| start_date | string | 档期开始日期（ISO 8601 日期） |
| end_date | string | 档期结束日期 |

### 3.3 金额与结算（最小单位整数）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| amount | integer | 总金额，**最小单位**（如 USDC 6 位小数则 amount 为整数分） |
| currency | string | 货币代码（如 USDC） |
| platform_fee | integer | 平台费，最小单位；或 platform_fee_rate 按 08-3 定稿 |
| **amount_breakdown** | object | 完整费用拆分：guide_fee、vehicle、attractions、food、hotel、inter_city 等，每项为 integer 最小单位 |

### 3.4 行程与协议

| 字段名 | 类型 | 说明 |
|--------|------|------|
| destination | string | 目的地 |
| city | string | 城市（或主城市） |
| days | integer | 行程天数 |
| total_budget | integer | 总预算，最小单位（可与 amount 一致或仅展示用，按产品定稿） |
| policies | string 或 object | 政策条款（JSON 字符串或约定结构） |
| cancellation_rules | string 或 object | 取消规则 |

### 3.5 协商锚点（可选但建议）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| last_message_id | string | 确认前最后一条消息 ID，用于争议时锚定协商上下文 |
| last_change_request_id | string | 最后变更请求 ID（若有） |

### 3.6 Live Quote 扩展（Phase 2）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| quote_id | string | 报价 ID |
| expiresAt | string | 报价过期时间（ISO 8601） |

### 3.7 小费（协议层定稿）

小费**是否进入** canonical、是否可争议、是否链上支付须在 03/08-3 定稿；若进入则字段名与格式在此补充。

---

## 4. 不参与 snapshotHash 的字段

以下**不**写入 canonical payload，不参与 hash：

- UI 文案、描述性长文本（除非产品明确要求某描述进合同）
- content_images、proof 中与合同金额/身份无关的部分
- 仅用于展示的排序、标签、内部 ID（非 order_id/version）

---

## 5. 字段删除与升级策略（0.5 3️⃣、0.4 2️⃣）

- **v2 不得移除字段**：仅可**标记 deprecated**；canonical payload 为 **superset**（新版本仅追加）。
- **老 snapshot 可 replay**：历史订单 replay 时缺失字段按 deprecated 或默认值处理。
- **schemaVersion 必进 canonical**：便于 replay 时按版本解析。

---

## 6. 校验与实现要求

- 生成 snapshot 前，payload 须通过 **Snapshot Payload Schema**（JSON Schema）校验；校验失败**不得**写入 snapshot_hash。
- 后端实现须与本白皮书字段清单一致；新增字段须同步本文并走评审。

---

## 7. 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | — | 初版：完整字段清单与 Canonical 规则，与 80 §4.4、§0.5 ① 一致。 |

---

*与 [80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0](80-阶段-TravelTrust-AI行程系统-可行性架构方案-v1.0.md)、[01-总库总览](01-总库总览.md)、[19-Escrow-合约参数结构设计图](19-Escrow-合约参数结构设计图.md) 配套。*
