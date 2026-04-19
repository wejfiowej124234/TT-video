# 证据链冻结声明 · `93-path-register-order-mockpay-governance-read`

**生效日期**：2026-04-19  
**状态**：**FROZEN（冻结）**

## 冻结范围（本目录下不再扩展）

下列内容视为 **本条 93 证据链的封闭边界**，后续迭代 **不得** 在本目录追加新用例、新链段、新环境矩阵行或新「主叙事」分支（例如再扩测试网托管 UI、再增 C 域子页、再绑新合约写路径等）：

- **产品叙事**：注册 / 登录 → 市场 / 向导 → 下单 → 消息（烟测）→ 接单 → **chain_off mock-pay** → 治理池 / 奖励 **HTTP 只读** → 前端 **F1（注册 + 登录双支）/ F2 / F3 / F4**。
- **已映射 93 ID**：A-ENV-001 · A-REG-001 · A-LOG-001 · A-ME-001 · B-MKT-001 · B-GDE-001 · B-ORD-001 · B-MSG-002 · B-TRN-001 · B-ESC-001 · C-GOV-001 · C-GOV-002（及前端路由互证）。
- **自动化入口**：`bash scripts/smoke-ab-core-chain.sh`、`frontend/e2e/93-matrix-path-f1-f4.spec.ts`（**`@e2e-chain-off-mock-pay`** 段 + **A-REG-001** 注册补口）。

## 允许的后续修改（仅限「勘误 / 复跑登记」）

- 修正错别字、链接、**复跑日期 / 执行人 / 机读 exit 码**等与事实校对相关的行级更新。
- 若上游契约变更导致原 PASS 不再成立，应 **新开证据目录** 或新路径 ID，**不得** 在本冻结链下混入新域用例。

## 新增长路径

请另建 **`evidence/GO_YYYYMMDD/93-path-<slug>/`**（示例：社区 Feed 发帖链见 **`../93-path-community-feed-post-detail/`**）。
