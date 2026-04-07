# TravelTrust Go-Live Checklist

基于当前 **`docs/verification-evidence-pack.md`** 与 **`.env.example`** 的上线前必做项；按顺序执行并逐项勾选。不包含功能扩展或新任务。

---

## 0. 冻结与范围

- [ ] **0.1** 发布标签 / 镜像 digest / `TRAVELTRUST_GIT_SHA`（或 `GIT_COMMIT_SHA`）已记录，与待部署二进制一致。
- [ ] **0.2** 本清单覆盖环境：**预发 → 生产** 各跑一遍；生产勾选须有双人复核。

---

## 1. 合约与链（目标网络）

- [ ] **1.1** 目标链 **RPC 稳定可用**（延迟、限额、归档节点满足 `eth_getLogs` / `eth_call` / `eth_getTransactionByHash`）。
- [ ] **1.2** 生产部署地址与 **`.env` / 前端 `NEXT_PUBLIC_*`** 一致：`ESCROW_FACTORY_ADDRESS`、`FEE_ROUTER_ADDRESS`、`REGION_VAULT_ADDRESS`、`REGISTRY_ADDRESS`、`STAKING_ADDRESS`、`GOVERNOR_ADDRESS`、`GOVERNANCE_VOTES_TOKEN_ADDRESS`、`INVESTOR_SHARE_TOKEN_ADDRESSES`、`INVESTOR_LOCK_CONTRACT_ADDRESSES`（按需，与 indexer 设计一致）。
- [ ] **1.3** 合约字节码与 **审计 / 发布 commit** 对齐（源码 hash 或 verified explorer 记录已存档）。
- [ ] **1.4** **Factory / FeeRouter 等 pause 位**符合上线策略（非意外 pause）；若计划只读期，与 **TT-11 / `GET /meta` pause 叙事**一致并已沟通。
- [ ] **1.5** 执行器 / 多签 / Timelock（若使用）**权限与限额**已配置，`CHAIN_EXECUTOR_*` 与 Runbook 一致。

---

## 2. 数据库

- [ ] **2.1** `DATABASE_URL` 指向**生产库**；连接池、TLS（若适用）、凭据轮换策略已确认。
- [ ] **2.2** **迁移已全部应用**（含 governance / investor / orders 投影相关 migration；与 evidence pack 中 TT 依赖一致）。
- [ ] **2.3** **备份与 PITR**（或等价恢复手段）已启用且做过**一次恢复演练**（或最近一次备份校验成功）。
- [ ] **2.4** 上线窗口内**迁移顺序与回滚脚本**已写明（见第 8 节）；禁止无文档的手工 `ALTER`。

---

## 3. 后端 API（运行时）

- [ ] **3.1** `CHAIN_RPC_URL`、`CHAIN_ID` 与链上部署一致。
- [ ] **3.2** **`CORS_ORIGINS`** 生产已设为真实前端 origin（逗号分隔）；与 **STRICT_SSOT / CHECK_SSOT** 联用时满足启动门禁（见 `.env.example`）。
- [ ] **3.3** **`SSOT_VERSION` / `SSOT_SHA256`**：若启用 **STRICT_SSOT=1** 或 **CHECK_SSOT=1**，值已按 08-3 流程填入且与发布物一致。
- [ ] **3.4** **`INTERNAL_API_SECRET`** 已设；**网关 / WAF 禁止公网访问** `POST/GET …/api/v1/internal/*`（仅内网或 mTLS）。
- [ ] **3.5** **`PUBLIC_API_BASE_URL`（或 `API_PUBLIC_BASE_URL`）** 与浏览器可达的 API 主机一致（媒体签名 URL 等）。
- [ ] **3.6** 生产 **`P3_CHAIN_OFF`** 未误开；**`SEED_TEST_ACCOUNTS`** 生产关闭。
- [ ] **3.7** **`REQUIRE_IDEMPOTENCY_KEY`**、**`STRICT_SESSION_GATE`** 等加固项按安全评审结论已显式设定（开或关均有记录）。
- [ ] **3.8** **`PAUSE_MODE` / `PAUSE_API_ALLOWLIST`**：若启用紧急只读，白名单已评审且值班知晓。
- [ ] **3.9** **`FINALITY_N` / finality 相关 env** 与链特性一致（非证据包里的调试值 **1** 误带到生产）。

---

## 4. Indexer 与投影（必须可观测）

- [ ] **4.1** 进程/调度具备对 **`POST /api/v1/internal/indexer-tick`**（及按需 **`indexer-reconcile`** / **`indexer-replay`**）的**内网调用能力**，且带 **`X-Internal-Api-Secret`**（若已启用）。
- [ ] **4.2** 上线后**首次**在可控窗口执行：reconcile（含需要的 RPC verify 标志）→ tick，确认 **无持续报错**、checkpoint 前进。
- [ ] **4.3** **终态口径（B-094）**：团队已读 **`verification-evidence-pack.md` 第 1.2 节**——**订单细终态以 `orders_projection` 为准**；`GET /api/v1/orders/:id` 与业务表一致但与投影分歧时，**以投影为 SSOT**（例如 `partially_refunded`）。客服/运营脚本不得仅读 `orders.state` 做赔付判定。
- [ ] **4.4** **FeeRouter / RegionVault / Governor / 份额 Transfer / Lock** 等与 env 地址对应的日志管道在 DB 中有预期行增长（抽样 SQL 或内部 dashboard）。

---

## 5. 前端 / DApp

- [ ] **5.1** **`NEXT_PUBLIC_*`**（RPC、链 ID、`ESCROW_FACTORY`、`FEE_ROUTER` 等与 UI 链上交互相关项）与**生产合约地址**一致。
- [ ] **5.2** 前端请求的 **API base URL** 指向生产网关；**无混合内容**（HTTPS 页不请求 http API）。
- [ ] **5.3** **Governance 列表/详情**（B-090 路径）对生产 API 返回 200，且与内网 indexer 投影一致（抽样 1～2 条提案）。
- [ ] **5.4** 构建注入的 **build / git sha**（若有）与后端 **`/meta` / `/meta/build`** 发布记录一致或可解释。

---

## 6. 环境与密钥管理

- [ ] **6.1** 所有密钥（DB、INTERNAL_API、JWT/HMAC、云厂商）**仅存密钥管理器**，未写入镜像层或公开仓库。
- [ ] **6.2** **日志与 APM** 中对 `Authorization`、`X-Internal-Api-Secret`、数据库 URL **已脱敏**。
- [ ] **6.3** **各环境 env 隔离**（staging 与 prod 的 `DATABASE_URL`、`CHAIN_*`、CORS 互不串用）。

---

## 7. 上线当日最小验收（Cutover smoke）

- [ ] **7.1** **`GET /health`**、**`GET /meta`** 200；`pause`/链配置字段符合预期。
- [ ] **7.2** **创建/查询订单路径**（与产品当前范围一致）无 5xx；链上模式下一笔**非资金关键**路径已走通（或 staging 已等价验证）。
- [ ] **7.3** **`GET /governance/fee-pool-aggregates`**（需鉴权头）与 DB 投影抽样一致（对照 TT-3 思路）。
- [ ] **7.4** Indexer tick 后 **orders_projection / governance_proposals_projection** 有合理增量或对齐链上高度。

---

## 8. 回滚（上线前必须已写清）

- [ ] **8.1** **回滚决策人**与触发条件（错误率、资金异常、索引停滞）已定义。
- [ ] **8.2** **API/前端回滚**：保留上一版镜像 digest 与一键回切步骤（含 env 是否需同步回退）。
- [ ] **8.3** **数据库**：若本版本含迁移，**仅前滚兼容**或已准备**向下迁移 / 备份还原**脚本与预估停机时间。
- [ ] **8.4** **合约**：不可回滚链上代码；已准备**暂停 / 关停入口**（pause、关前端入口、internal 限流）而非假设 `revert` 部署。

---

## 9. 监控与值班

- [ ] **9.1** **告警**：API 5xx 率、延迟、indexer 失败日志、RPC 错误率、DB 连接池耗尽。
- [ ] **9.2** **仪表盘**：链高度 vs indexer checkpoint 滞后（阈值已设）。
- [ ] **9.3** **值班路径**：on-call 能访问内网 internal 与 DB 只读账号；**Runbook** 链接已贴在工单/聊天置顶。
- [ ] **9.4** **审计证据**：如需对外出具，**`sha256sum -c docs/verification-evidence-sha256.txt`** 在发布分支通过（与 pack 第 2 节自校验哈希一致）。

---

**文档维护**：合约或 indexer 契约变更时，同步更新本清单第 1、3、4 节；不必改业务代码也可单独修订本文。
