# TravelTrust Go-Live Checklist

基于当前 **`docs/verification-evidence-pack.md`** 与 **`.env.example`** 的上线前必做项；按顺序执行并逐项勾选。不包含功能扩展或新任务。

### 与 P0 / 07 的关系

本文件是**工程与运维向**的逐项核对表（env、链、DB、indexer、前端等），便于执行与留痕。

- **不替代**发版真值 **[缺口与待补-官方总表](spec/缺口与待补-官方总表.md)** 中的 **「发版前必做（P0）— 12 项闭环清单」**；P0 勾选、签字与 evidence 仍以该表及并联清单为准。
- **不替代** **[07-开发流程与顺序](spec/07-开发流程与顺序.md)** **§四**（含 **[§四 4.3 开工前 / 发版前检查清单](spec/07-开发流程与顺序.md#07-sec-4-3-release-checklist)**）中的发版多维入口与门禁串联说明。
- **`pre-release-automation` 等机器预检**：仅作辅助，**不能**单独视为 P0 或 §四 已闭合。
- **§0～§9** 各条已标注 **P0 #**（与官方总表行号一致）或 **07 §四**；**§10** 为十二项中**不以工程小节展开**的并联打卡；文末 **「P0 覆盖映射表」** 汇总。

---

## 0. 冻结与范围

- [ ] **0.1** 发布标签 / 镜像 digest / `TRAVELTRUST_GIT_SHA`（或 `GIT_COMMIT_SHA`）已记录，与待部署二进制一致。**（P0 #7, P0 #8）**

  **v0.1.0 勾选条件（四项须同时成立）**

  | # | 项 | 要求 |
  |---|-----|------|
  | 1 | Git commit（发布 tip） | `7ca218faac36001013138e17dc1f1f2849a1e02b` |
  | 2 | tag | `v0.1.0`（`git rev-parse v0.1.0` 与上项一致） |
  | 3 | `TRAVELTRUST_GIT_SHA`（运行时注入） | `7ca218faac36001013138e17dc1f1f2849a1e02b` |
  | 4 | image digest | 本地构建或 registry 上的镜像为 `sha256:…`（见下） |

  **在可联网环境（仓库根）构建并记录本地镜像 ID：**

  ```bash
  docker build --build-arg TRAVELTRUST_BUILD_GIT_SHA=7ca218faac36001013138e17dc1f1f2849a1e02b -t traveltrust/traveltrust-api:v0.1.0 .
  docker image inspect traveltrust/traveltrust-api:v0.1.0 --format '{{.Id}}'
  ```

  输出示例：`sha256:abcdef…` —— 记入发布记录即 **image digest（本地镜像 ID）**。

  **若推送到镜像仓库**：再记录 **registry manifest digest**（`docker push` 末尾或 `docker buildx imagetools inspect <registry>/traveltrust-api:v0.1.0`），并与上述 Git SHA 一并归档。

- [ ] **0.2** 本清单覆盖环境：**预发 → 生产** 各跑一遍；生产勾选须有双人复核。**（P0 #8；07 §四 4.3 发版前并联核对）**

---

## 1. 合约与链（目标网络）

- [ ] **1.1** 目标链 **RPC 稳定可用**（延迟、限额、归档节点满足 `eth_getLogs` / `eth_call` / `eth_getTransactionByHash`）。**（P0 #10, P0 #11）**
- [ ] **1.2** 生产部署地址与 **`.env` / 前端 `NEXT_PUBLIC_*`** 一致：`ESCROW_FACTORY_ADDRESS`、`FEE_ROUTER_ADDRESS`、`REGION_VAULT_ADDRESS`、`REGISTRY_ADDRESS`、`STAKING_ADDRESS`、`GOVERNOR_ADDRESS`、`GOVERNANCE_VOTES_TOKEN_ADDRESS`、`INVESTOR_SHARE_TOKEN_ADDRESSES`、`INVESTOR_LOCK_CONTRACT_ADDRESSES`（按需，与 indexer 设计一致）。**（P0 #10）**
- [ ] **1.3** 合约字节码与 **审计 / 发布 commit** 对齐（源码 hash 或 verified explorer 记录已存档）。**（P0 #7, P0 #10）**
- [ ] **1.4** **Factory / FeeRouter 等 pause 位**符合上线策略（非意外 pause）；若计划只读期，与 **TT-11 / `GET /meta` pause 叙事**一致并已沟通。**（P0 #10；与 08-3/08-4 口径一致部分见 P0 #1/#5）**
- [ ] **1.5** 执行器 / 多签 / Timelock（若使用）**权限与限额**已配置，`CHAIN_EXECUTOR_*` 与 Runbook 一致。**（P0 #6, P0 #10）**

---

## 2. 数据库

- [ ] **2.1** `DATABASE_URL` 指向**生产库**；连接池、TLS（若适用）、凭据轮换策略已确认。**（P0 #10）**
- [ ] **2.2** **迁移已全部应用**（含 governance / investor / orders 投影相关 migration；与 evidence pack 中 TT 依赖一致）。**（P0 #9, P0 #10）**
- [ ] **2.3** **备份与 PITR**（或等价恢复手段）已启用且做过**一次恢复演练**（或最近一次备份校验成功）。**（P0 #11）**
- [ ] **2.4** 上线窗口内**迁移顺序与回滚脚本**已写明（见第 8 节）；禁止无文档的手工 `ALTER`。**（P0 #6, P0 #11）**

---

## 3. 后端 API（运行时）

- [ ] **3.1** `CHAIN_RPC_URL`、`CHAIN_ID` 与链上部署一致。**（P0 #10）**
- [ ] **3.2** **`CORS_ORIGINS`** 生产已设为真实前端 origin（逗号分隔）；与 **STRICT_SSOT / CHECK_SSOT** 联用时满足启动门禁（见 `.env.example`）。**（P0 #8, P0 #9）**
- [ ] **3.3** **`SSOT_VERSION` / `SSOT_SHA256`**：若启用 **STRICT_SSOT=1** 或 **CHECK_SSOT=1**，值已按 08-3 流程填入且与发布物一致。**（P0 #5, P0 #8）**
- [ ] **3.4** **`INTERNAL_API_SECRET`** 已设；**网关 / WAF 禁止公网访问** `POST/GET …/api/v1/internal/*`（仅内网或 mTLS）。**（P0 #10）**
- [ ] **3.5** **`PUBLIC_API_BASE_URL`（或 `API_PUBLIC_BASE_URL`）** 与浏览器可达的 API 主机一致（媒体签名 URL 等）。**（P0 #10）**
- [ ] **3.6** 生产 **`P3_CHAIN_OFF`** 未误开；**`SEED_TEST_ACCOUNTS`** 生产关闭。**（P0 #10）**
- [ ] **3.7** **`REQUIRE_IDEMPOTENCY_KEY`**、**`STRICT_SESSION_GATE`** 等加固项按安全评审结论已显式设定（开或关均有记录）。**（P0 #9, P0 #10）**
- [ ] **3.8** **`PAUSE_MODE` / `PAUSE_API_ALLOWLIST`**：若启用紧急只读，白名单已评审且值班知晓。**（P0 #6）**
- [ ] **3.9** **`FINALITY_N` / finality 相关 env** 与链特性一致（非证据包里的调试值 **1** 误带到生产）。**（P0 #10）**

---

## 4. Indexer 与投影（必须可观测）

- [ ] **4.1** 进程/调度具备对 **`POST /api/v1/internal/indexer-tick`**（及按需 **`indexer-reconcile`** / **`indexer-replay`**）的**内网调用能力**，且带 **`X-Internal-Api-Secret`**（若已启用）。**（P0 #6, P0 #7, P0 #10）**
- [ ] **4.2** 上线后**首次**在可控窗口执行：reconcile（含需要的 RPC verify 标志）→ tick，确认 **无持续报错**、checkpoint 前进。**（P0 #7, P0 #10）**
- [ ] **4.3** **终态口径（B-094）**：团队已读 **`verification-evidence-pack.md` 第 1.2 节**——**订单细终态以 `orders_projection` 为准**；`GET /api/v1/orders/:id` 与业务表一致但与投影分歧时，**以投影为 SSOT**（例如 `partially_refunded`）。客服/运营脚本不得仅读 `orders.state` 做赔付判定。**（P0 #10；07 §四 4.3 与 01 E2E 叙事一致）**
- [ ] **4.4** **FeeRouter / RegionVault / Governor / 份额 Transfer / Lock** 等与 env 地址对应的日志管道在 DB 中有预期行增长（抽样 SQL 或内部 dashboard）。**（P0 #7, P0 #10）**
- [ ] **4.5** **Escrow 订单详情链上 SSOT 演练（TT-RELEASE-GATE-ESCROW-SSOT-014）**：在 **chain_off 已挂载**且 **`CHAIN_RPC_URL` + `ESCROW_FACTORY_ADDRESS`** 就绪的预发/生产（或等价 staging），按 **[Runbook §7.1.3](../ops/RUNBOOK.md)** 执行 **A/B** **`curl|jq`**，结论与 **04 §3.4 `GET /api/v1/orders/:id`**、**B-097**、**[evidence/README · 订单详情 escrow 链上 SSOT](../evidence/README.md#orders-detail-escrow-chain-state-ssot-drill)** 一致；**B** 须证明**列表与占位**响应根级**无** **`escrow_chain_state*` / `escrow_release_state*` / `escrow_dispute_state*` / `escrow_locked_amount*`**。可选将脱敏 **`jq` 输出或 JSON** 落入 **`evidence/GO_YYYYMMDD/artifacts/`** 并入 manifest。**（P0 #10；并联 B-097 与 TT-001～013 交付）**

---

## 5. 前端 / DApp

- [ ] **5.1** **`NEXT_PUBLIC_*`**（RPC、链 ID、`ESCROW_FACTORY`、`FEE_ROUTER` 等与 UI 链上交互相关项）与**生产合约地址**一致。**（P0 #10）**
- [ ] **5.2** 前端请求的 **API base URL** 指向生产网关；**无混合内容**（HTTPS 页不请求 http API）。**（P0 #10）**
- [ ] **5.3** **Governance 列表/详情**（B-090 路径）对生产 API 返回 200，且与内网 indexer 投影一致（抽样 1～2 条提案）。**（P0 #10）**
- [ ] **5.4** 构建注入的 **build / git sha**（若有）与后端 **`/meta` / `/meta/build`** 发布记录一致或可解释。**（P0 #7, P0 #8）**

---

## 6. 环境与密钥管理

- [ ] **6.1** 所有密钥（DB、INTERNAL_API、JWT/HMAC、云厂商）**仅存密钥管理器**，未写入镜像层或公开仓库。**（P0 #7, P0 #10）**
- [ ] **6.2** **日志与 APM** 中对 `Authorization`、`X-Internal-Api-Secret`、数据库 URL **已脱敏**。**（P0 #7）**
- [ ] **6.3** **各环境 env 隔离**（staging 与 prod 的 `DATABASE_URL`、`CHAIN_*`、CORS 互不串用）。**（P0 #8, P0 #10）**

---

## 7. 上线当日最小验收（Cutover smoke）

- [ ] **7.1** **`GET /health`**、**`GET /meta`** 200；`pause`/链配置字段符合预期。**（P0 #10）**
- [ ] **7.2** **创建/查询订单路径**（与产品当前范围一致）无 5xx；链上模式下一笔**非资金关键**路径已走通（或 staging 已等价验证）。**（P0 #10）**
- [ ] **7.3** **`GET /governance/fee-pool-aggregates`**（需鉴权头）与 DB 投影抽样一致（对照 TT-3 思路）。**（P0 #10）**
- [ ] **7.4** Indexer tick 后 **orders_projection / governance_proposals_projection** 有合理增量或对齐链上高度。**（P0 #7, P0 #10）**

---

## 8. 回滚（上线前必须已写清）

- [ ] **8.1** **回滚决策人**与触发条件（错误率、资金异常、索引停滞）已定义。**（P0 #6）**
- [ ] **8.2** **API/前端回滚**：保留上一版镜像 digest 与一键回切步骤（含 env 是否需同步回退）。**（P0 #6, P0 #7）**
- [ ] **8.3** **数据库**：若本版本含迁移，**仅前滚兼容**或已准备**向下迁移 / 备份还原**脚本与预估停机时间。**（P0 #6, P0 #11）**
- [ ] **8.4** **合约**：不可回滚链上代码；已准备**暂停 / 关停入口**（pause、关前端入口、internal 限流）而非假设 `revert` 部署。**（P0 #6, P0 #11）**

---

## 9. 监控与值班

- [ ] **9.1** **告警**：API 5xx 率、延迟、indexer 失败日志、RPC 错误率、DB 连接池耗尽。**（P0 #6, P0 #11）**
- [ ] **9.2** **仪表盘**：链高度 vs indexer checkpoint 滞后（阈值已设）。**（P0 #6, P0 #11）**
- [ ] **9.3** **值班路径**：on-call 能访问内网 internal 与 DB 只读账号；**Runbook** 链接已贴在工单/聊天置顶。**（P0 #6）**
- [ ] **9.4** **审计证据**：如需对外出具，**`sha256sum -c docs/verification-evidence-sha256.txt`** 在发布分支通过（与 pack 第 2 节自校验哈希一致）。**（P0 #7）**

---

## 10. 发版真值并联（官方总表 P0 十二项 · 此处仅打卡）

本节**不重复** 08-2 / 08-4 / 00 正文；仅确认已在 **[缺口与待补-官方总表](spec/缺口与待补-官方总表.md)** 对应行 **☑**，并与 **07 §四 4.3** 发版前并联说明一致。

**Evidence path 约定**：日期目录一律写 **`evidence/GO_YYYYMMDD/`**（`YYYYMMDD` 为发版或过门日）；首次可复制模板 **`evidence/GO_YYYYMMDD_template/`**（见 [evidence/README](../../evidence/README.md)）。**Run command** 在仓库根执行，除非另注。

- [ ] **10.1 （P0 #1）** [08-4](spec/08-4-对外口径包.md) 文末 **定稿日期、法务/运营签字或邮件确认** 已在官方总表 **P0 #1** 勾选。
  - **Evidence path:** `docs/spec/08-4-对外口径包.md`（文末三要素 Git 可追溯）；可选扫描件/邮件落 **`evidence/GO_YYYYMMDD/artifacts/08-4-signoff/`**（或内网制品库路径写入 **`manifest.json` → `artifacts`**）。
  - **Run command:** 人工完成 08-4 文末更新后 `git add docs/spec/08-4-对外口径包.md && git commit -m "…"`；bundle 内另附 **`manifest.json` + `manifest.sha256`**（格式见 [evidence/README](../../evidence/README.md)）。

- [ ] **10.2 （P0 #2）** [08-2](spec/08-2-附录-闭合工单表.md) 各工单 **Owner + backup** 已填实，官方总表 **P0 #2** 已勾选。
  - **Evidence path:** `docs/spec/08-2-附录-闭合工单表.md`（提交 SHA）；或 **`evidence/GO_YYYYMMDD/artifacts/08-2-owner-snapshot.md`**（粘贴关键表片段 + 日期）。
  - **Run command:** 编辑 08-2 各表 Owner 列 → `git commit`；与 **08-2 定稿前检查** 同批。

- [ ] **10.3 （P0 #3）** [08-2 审查一](spec/08-2-附录-闭合工单表.md#发版前审查一关键语义一致性审查表) **11 行**已逐行勾选并填审查人/日期/结论，**P0 #3** 已勾选。
  - **Evidence path:** `docs/spec/08-2-附录-闭合工单表.md`（审查一表内勾选与签字可追溯）。
  - **Run command:** 人工逐行勾选审查一；`git commit`；**Runbook** [§12.9](../../ops/RUNBOOK.md) 定稿顺序。

- [ ] **10.4 （P0 #4）** [08-2 审查二](spec/08-2-附录-闭合工单表.md#发版前审查二gate-冲突矩阵与优先级规则) **最后更新 / 评审日期 / Evidence 路径**已填实，**P0 #4** 已勾选。
  - **Evidence path:** 08-2 审查二表本体；可选矩阵副本 **`evidence/GO_YYYYMMDD/artifacts/gate-cross-check.md`**（与 [Runbook §12.7](../../ops/RUNBOOK.md) 一致）。
  - **Run command:** `bash scripts/check-08-consistency.sh`（机读辅助，**不替代**审查二）；`bash scripts/check-governance-doc-linkage.sh`（涉 82～84/08-4 时）；结果日志可落入 **`evidence/GO_YYYYMMDD/artifacts/`**。

- [ ] **10.5 （P0 #5）** [08-4](spec/08-4-对外口径包.md) **定稿检查勾选**（企业级/穿透/自检七项等）已完成，**P0 #5** 已勾选。
  - **Evidence path:** `docs/spec/08-4-对外口径包.md` 文末与文内勾选区；并联 **08-3** 时可将 `bash scripts/check-08-evidence-pointer.sh` 输出存 **`evidence/GO_YYYYMMDD/artifacts/check-08-evidence-pointer.log`**。
  - **Run command:** 人工勾选 08-4 定稿检查；可选 `bash scripts/check-08-evidence-pointer.sh`。

- [ ] **10.6 （P0 #6）** [Runbook §2](../../ops/RUNBOOK.md) **P0 最小九项、值班/批准人真实联系人**已与 08-2 定稿口径一致，**P0 #6** 已勾选。
  - **Evidence path:** `ops/RUNBOOK.md`（§2 表 + P0 九项表 Git 可追溯）；或 **`evidence/GO_YYYYMMDD/artifacts/runbook-p0-table-snapshot.md`**。
  - **Run command:** 编辑 `ops/RUNBOOK.md` §2 → `git commit`。

- [ ] **10.7 （P0 #7）** [evidence/README](../../evidence/README.md) 与 **08-2 Evidence 列**：各 Gate 产物路径或 manifest hash 已填实，**P0 #7** 已勾选。
  - **Evidence path:** **`evidence/GO_YYYYMMDD/manifest.json`** + **`manifest.sha256`**（必填字段见 [evidence/README](../../evidence/README.md)）；索引器快照可选 **`indexer_public_snapshot_*.json`**、**`indexer_evidence_bundle_*.zip`**（同目录）。
  - **Run command:** `cp -r evidence/GO_YYYYMMDD_template evidence/GO_YYYYMMDD` 后编辑 manifest；**`sha256sum manifest.json > manifest.sha256`**（或等价）；索引器留痕：**`bash scripts/write-indexer-evidence.sh`** 或 **`bash scripts/internal-indexer-ops.sh evidence`** / **`evidence-bundle`**（须 **`API_BASE_URL` + `INTERNAL_API_SECRET`**，见 [Runbook §2.55 / §12.5](../../ops/RUNBOOK.md)）；前端 Gate-5：**`./scripts/gen-frontend-manifest.sh`**（可选 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`**）。

- [ ] **10.8 （P0 #8）** [00 文档索引 · 发版前快速核对（7 项）](spec/00-文档索引.md#发版前快速核对7项) 已逐项执行（含 **07 §四 4.3**、版本表、签字等并联），**P0 #8** 已勾选。
  - **Evidence path:** `docs/spec/00-文档索引.md` 版本表 Git 记录；机读日志 **`evidence/GO_YYYYMMDD/artifacts/pre-release-automation.log`**。
  - **Run command:** **`bash scripts/pre-release-automation.sh`**（或 **`.ps1`**，见 [scripts/README](../../scripts/README.md)、[缺口总表](spec/缺口与待补-官方总表.md) 核查流水步骤 4）；并联 **`bash scripts/run-check-04-routes.sh`**、**`bash scripts/check-55-s13.sh`**（与 7 项中 08-3/04 勾选对应）。

- [ ] **10.9 （P0 #9）** [27-P26 实现记录](spec/27-archived/27-P26-实现记录.md) **可调通验收**（脚本/门禁表）已按该文执行并勾选，**P0 #9** 已勾选。
  - **Evidence path:** 27-P26 §二 **验收日期 / 结果** 表（Git 可追溯）；执行日志 **`evidence/GO_YYYYMMDD/artifacts/p26-smoke.log`**（粘贴 `cargo test` / smoke 输出）。
  - **Run command:** **`cargo test -p traveltrust-api`**；API 就绪时 **`bash scripts/smoke-api-public-routes.sh`**（见脚本头注释设 `BASE_URL`）；若仓库内存在 **`scripts/p4_chain_off_e2e.sh`**（27-P26 原文口径）则优先执行并将输出落入 **`artifacts/`**。争议路径可选文档所列 **`p10_e2e_dispute`** 类脚本（若存在）。

- [ ] **10.10 （P0 #10）** **E2E 三项**在目标环境已留痕（`YYYY-MM-DD` 格式，见 [evidence/README](../../evidence/README.md)、[01 发布与 E2E](spec/01-总库总览.md)），**P0 #10** 已勾选。
  - **Evidence path:** **`evidence/GO_YYYYMMDD/artifacts/e2e-normal-release.md`**、**`e2e-dispute-three-terminals.md`**、**`e2e-three-timeouts.md`**（文件名与 [evidence/README · 07-p0-e2e-three](../../evidence/README.md#07-p0-e2e-three) 一致）；并入 **`manifest.json` → `artifacts`**。
  - **Run command:** 目标环境按 01/53 执行三项并记录命令与结论；合约侧可选 **`cd contracts && forge test`**（与部署网络一致时）；将 tx hash / 订单 id 写入上述 **`artifacts/*.md`**。

- [ ] **10.11 （P0 #11）** [Runbook §4](../../ops/RUNBOOK.md) **资损 runbook 演练**至少登记一次（与 01 §9 一致），**P0 #11** 已勾选。
  - **Evidence path:** **`evidence/DR-YYYYQX-0N/`** 或 **`evidence/GO_YYYYMMDD/artifacts/runbook-dr-*.md`**（与 §4 演练历史表 **产物** 列互指）；示例见 Runbook §4 已登记行。
  - **Run command:** 按 [Runbook §1](../../ops/RUNBOOK.md) 场景 **①～⑤** 之一执行桌面演练；将 **日期 / 场景 / 结果 / 产物路径** 填入 Runbook §4 表；产物 MD/JSON 落 **`evidence/…/artifacts/`**。

- [ ] **10.12 （P0 #12）** [27-P10-02 十三勾选表](spec/27-archived/27-P10-02-十三勾选表.md) **02 §十三 发版前** **13.1 / 13.2 / 13.3** 已勾选，**P0 #12** 已勾选。
  - **Evidence path:** `docs/spec/27-archived/27-P10-02-十三勾选表.md`（勾选与日期 Git 可追溯）；或 **`evidence/GO_YYYYMMDD/artifacts/02-sec13-snapshot.md`**。
  - **Run command:** 人工打开 [02 §十三](spec/02-架构设计.md) 与 27-P10-02 表逐项勾选 → `git commit`；并联 **07 §四 4.3** 发版前检查叙述。

---

## P0 覆盖映射表（轻量版）

| 官方总表 P0 # | 待补项（摘要） | 本清单落点 |
|---------------|----------------|------------|
| 1 | 08-4 签字/定稿日期 | **§10.1** |
| 2 | 08-2 Owner + backup | **§10.2** |
| 3 | 08-2 审查一 | **§10.3** |
| 4 | 08-2 审查二 / Gate 矩阵 | **§10.4** |
| 5 | 08-4 定稿检查勾选 | **§10.5**；并联 **§3.3**、**§1.4** |
| 6 | Runbook P0 九项、值班链 | **§10.6**；并联 **§1.5, §3.8, §8.x, §9.x** |
| 7 | evidence / 08-2 Evidence | **§10.7**；并联 **§0.1, §1.3, §4.x, §5.4, §6.x, §7.4, §8.2, §9.4** |
| 8 | 00 快速核对 7 项 | **§10.8**；并联 **§0.2, §3.2, §6.3** |
| 9 | P26 可调通 | **§10.9**；并联 **§2.2, §3.2, §3.7** |
| 10 | E2E 三项留痕 | **§10.10**；并联 **§1.x～§7.x**（链/DB/API/索引/前端/smoke）、**§4.5**（Escrow SSOT：**TT-RELEASE-GATE-ESCROW-SSOT-014**） |
| 11 | 资损 runbook 演练 | **§10.11**；并联 **§1.1, §2.3, §8.x, §9.1～9.2** |
| 12 | 02 §十三 发版前勾选 | **§10.12**（正文在 27-P10-02；**07 §四 4.3** 并联） |

**文档维护**：合约或 indexer 契约变更时，同步更新本清单第 1、3、4 节；不必改业务代码也可单独修订本文。若官方总表 **P0 #** 行变更，须同步本表 **§10** 与映射表。
