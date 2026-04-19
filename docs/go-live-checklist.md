# TravelTrust Go-Live Checklist

基于当前 **`docs/verification-evidence-pack.md`** 与 **`.env.example`** 的上线前必做项；按顺序执行并逐项勾选。不包含功能扩展或新任务。

**2026-04-17**：**新增** **§9 · Ethereum Mainnet 强制门禁（P0）**；原 **「监控与值班」** **顺延为** **§10**；原 **「发版真值并联」** **顺延为** **§11**（**P0 覆盖映射表** **已同步**）。

### 与 P0 / 07 的关系

本文件是**工程与运维向**的逐项核对表（env、链、DB、indexer、前端等），便于执行与留痕。

- **不替代**发版真值 **[缺口与待补-官方总表](spec/缺口与待补-官方总表.md)** 中的 **「发版前必做（P0）— 12 项闭环清单」**；P0 勾选、签字与 evidence 仍以该表及并联清单为准。
- **不替代** **[07-开发流程与顺序](spec/07-开发流程与顺序.md)** **§四**（含 **[§四 4.3 开工前 / 发版前检查清单](spec/07-开发流程与顺序.md#07-sec-4-3-release-checklist)**）中的发版多维入口与门禁串联说明。
- **`pre-release-automation` 等机器预检**：仅作辅助，**不能**单独视为 P0 或 §四 已闭合。
- **§0～§10** 各条已标注 **P0 #**（与官方总表行号一致）或 **07 §四**；**§11** 为十二项中**不以工程小节展开**的并联打卡；文末 **「P0 覆盖映射表」** 汇总。
- **Ethereum Mainnet 首次生产部署 / cutover（P0 强制）**：**目标网络为 Ethereum Mainnet（`CHAIN_ID=1`）** 时，**必须先** 完成 **[TT-MAINNET §0](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#0-门禁总表mainnet-deploy--cutover--全部为-go-才允许)** **门禁表（G0～G6** **与** **SL** **全 GO）** 并留痕；**其中** **SL** **（** **Mainnet Shadow Launch** **）** **独立证据包** **[`evidence/mainnet_shadow_launch/run_<UTC>/`](../evidence/mainnet_shadow_launch/README.md)** **`shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`** **为** **正式** **主网** **发布** **最终** **Go/No-Go** **输入**。**任一 NO-GO → 禁止 mainnet deploy**。**勾选见 §9**；**完整条款** **以该 Runbook 为准**。**Sepolia / 预发** **不能** **替代** **§9** **中** **仅适用于主网** **的项**。
- **B-421 文档互指机读（锚 `B-421-RUNBOOK-GOLIVE-DOCLINK-GATE` · `TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001`）**：[00-文档索引](spec/00-文档索引.md)、[缺口与待补-官方总表](spec/缺口与待补-官方总表.md)、[15 附录〇](spec/15-多维度文档与技术检查报告.md#发版前勾选总表)、[ops/RUNBOOK](../../ops/RUNBOOK.md)、[TT-B421 Runbook](runbook/TT-B421-GO-RUNBOOK-GOLIVE-DOCLINK-001.md)；**`bash scripts/check-runbook-golive-doclink-gate.sh`** **`--json`**。
- **Check-G / W-GATE 边界**：[Runbook §2.7.4 · Check-G](../../ops/RUNBOOK.md#check-g-dual-score-gate)（**`dual_score_signoff`** **↔** **`manifest.dual_score`**、签字链、**`--verify-artifact-files`** 策略、**封口命令**）**不**被 **`bash scripts/check-w-gate-prerelease.sh`**（[TT-B420](runbook/TT-B420-GO-W-GATE-PRERELEASE-001.md)）默认编排替代；**定型发布**须在本清单 **§11.13～11.18** 与 Runbook 并联执行。
- **全站回归 `report.json`（93 / R-002）**：发布前须完成 **[spec/R-002-回归执行闭环与发布准入.md](spec/R-002-回归执行闭环与发布准入.md)** **§1**（汇总 → 机读校验 → Gate）；**`python scripts/validate-regression-report.py evidence/GO_YYYYMMDD/report.json`**；**`release_gate`** 与 **[93 §7.1](spec/93-全站功能验证矩阵-域别回归清单.md)** 一致。**staging/prod 口径**须 **`environment.name`** 匹配或 **PARTIAL_GO** 已说明 — 详见 **R-002 §2**。**首次在 staging 按矩阵完整跑通 A+B 域**的步骤与 **D1～D5** 验收见 **[spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md](spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)**。

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
- [ ] **0.3 R-002 / 93 · 回归 `report.json` + 发版闸（不可跳过）**  
  - **机读（硬）**：`python scripts/validate-regression-report.py evidence/r003_staging_first/run_<UTC>/report.json --fail-on-no-go` **exit 0**（**首轮 R-003** 首选路径；若本轮主证据为 **`evidence/GO_YYYYMMDD/report.json`**，则对该路径执行同一命令）。  
  - **人工四样齐**（发布工单/记录 **须同时具备**，**缺一不得进入 go-live**）：① **`report.json` 路径** ② **`sha256`**（文件指纹）③ **`release_gate` 与 `release_gate_reason`**（可读、可对 **[93 §7.1](spec/93-全站功能验证矩阵-域别回归清单.md)**）④ **Release Owner 双签**。  
  - **`release_gate`** 符合 **93 §7.1**（**NO_GO → 禁止**本清单继续勾选为可发版）。**（R-002 §1；R-003）**

---

## 1. 合约与链（目标网络）

- [ ] **1.1** 目标链 **RPC 稳定可用**（延迟、限额、归档节点满足 `eth_getLogs` / `eth_call` / `eth_getTransactionByHash`）。**（P0 #10, P0 #11）**
- [ ] **1.2** 生产部署地址与 **`.env` / 前端 `NEXT_PUBLIC_*`** 一致：`ESCROW_FACTORY_ADDRESS`、`FEE_ROUTER_ADDRESS`、`REGION_VAULT_ADDRESS`、`REGISTRY_ADDRESS`、`GUIDE_STAKING_ADDRESS`、`STAKING_PROVIDER_ADDRESS`、`GOVERNOR_ADDRESS`、`GOVERNANCE_TOKEN_ADDRESS`、`INVESTOR_SHARE_TOKEN_ADDRESSES`、`INVESTOR_LOCK_CONTRACT_ADDRESSES`（按需，与 indexer 设计一致）。**（P0 #10）**
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
- [ ] **8.4** **合约**：不可回滚链上代码；已准备**暂停 / 关停入口**（pause、关前端入口、internal 限流）而非假设 `revert` 部署。**（P0 #6, P0 #11）** **合约层不存在「链上状态回滚」**；**仅** **pause / 治理修复 / 对账与补偿**（与 **[TT-MAINNET §6.2](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#62-p0必须写进-runbook-的强制句)** **及** **§9.0.6** **一致**）。

---

## 9. Ethereum Mainnet 强制门禁（P0 · 未完成则禁止 mainnet deploy）

**适用**：**`CHAIN_ID=1`** **的首次生产部署或等价 cutover**。**完整条款**：[TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)。

**CI 机读聚合（G0～G6 + SL）**：[`scripts/check-mainnet-launch-precheck-gate.sh`](../scripts/check-mainnet-launch-precheck-gate.sh)（**同一** **脚本** **机读** **`MAINNET_EVIDENCE_RUN_DIR/shadow_go_no_go.json`** **`shadow_launch_verdict":"GO"`** **与** **G0～G6** **；** **`CHAIN_ID=1`** **+** **`TT_MAINNET_GATE_ENFORCE=1`** **或** **`MAINNET_LAUNCH_PRECHECK=1`**）；**合并阻断** 见 [`.github/workflows/broadcast-batch-blockers.yml`](../.github/workflows/broadcast-batch-blockers.yml) **job** **`TT-MAINNET G0–G6+SL`**。**P0**：**未配置** **`MAINNET_CHAIN_RPC_URL`** **时** **TT-MAINNET** **job** **必须** **失败**（**禁止** **假绿**）；**禁止** **在** **未配齐** **Secrets** **时** **将** **该** **job** **列为** **`main`** **必过**。**影子演练**（**Shadow Launch**）与 **branch protection** **表** 见 **[TT-MAINNET §7](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6)**。**迭代** **期** **（** **冻结** **`Full GO`** **后** **）** **：** **新** **`run_<UTC>/` + G0～G6 + SL** **全** **GO** **须** **接入** **`main`** **必过** **与** **部署** **放行** **，** **未** **满足** **一律** **自动** **阻断** **发布** **（** **细则** **[TT-MAINNET §7](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md#7-ci-机读门禁g0g6)** **「** **迭代期** **：** **CI** **/** **部署** **流水线** **」** **）** **。**

- [ ] **9.0.1** **不可逆校验层**：**`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`** **exit 0**（**地址接线**）**且** **核心合约链上 bytecode** **与** **锁定发布 commit 的 `forge` 编译产物** **身份一致**（**bytecode / keccak 对拍留痕**）。**（TT §1.3）**
- [ ] **9.0.2** **Indexer 全量路径**：自约定起点至链尖 **indexer-tick** **迭代** **+** **`POST …/internal/indexer-replay`** **+** **`indexer-reconcile`** **+** **`admin/observability/overview`** **验证无未处理 panic、无断层，reconcile/overview 可收敛**。**（TT §2.2）**
- [ ] **9.0.3** **Timelock delay**：**≥ 86400 s（24h）** 或书面更高下限；**mainnet 不为 0 / 极小值**。**（TT §3.2）**
- [ ] **9.0.4** **Trigger Matrix**：**reconcile 异常 / indexer 超 lag / overview 关键键缺失** 等条件 **已接入可执行响应**（**pause 写路径 + API 只读**）。**（TT §4.2）**
- [ ] **9.0.5** **主网证据**：证据包 **README + JSON** **含** **`chain_id: 1`** **（或 `deployment_chain_id: 1`）** **强校验**，防测试网数据污染。**（TT §5.2）**
- [ ] **9.0.6** **合约层无回滚口径**：团队已签收 **「链上不可回滚；仅 pause / 治理修复 / 对账与补偿」**。**（TT §6.2）**
- [ ] **9.0.7** **Mainnet Shadow Launch（§0 SL）+ 主网小额灰度 / 全量 cutover**：影子 **四** **JSON** **+** **Trigger** **Matrix** **→** **`GO`** **证据** **→** **锁定** **发布** **窗口** **→** **收敛** **+** **书面** **放行** **→** **全量** **cutover** **→** **cutover** **后** **持续** **监控** **`reconcile`** **/** **`overview`** **至** **稳定** **收敛** **并** **正式** **关闭** **发布** **窗口** **→** **稳态** **后** **按** **§10** **持续** **告警** **值守** **与** **长期** **观测** **→** **确认** **长期** **稳定** **后** **`Full GO`** **（** **归档** **+** **版本** **标记** **）** **→** **本次** **主网** **上线** **作为** **可追溯** **发布** **基线** **→** **冻结** **`Full GO`** **基线** **（** **tag** **+** **证据** **）** **→** **所有** **主网** **发布** **须** **基于** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **并** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **。** **上线** **前** **、** **切换** **中** **与** **关窗** **前** **严禁** **任何** **形式** **资金** **敞口** **扩大** **（** **TT** **§7** **）**。**包** **[`evidence/mainnet_shadow_launch/run_<UTC>/`](../evidence/mainnet_shadow_launch/README.md)** · **[`run_TEMPLATE/README.md`](../evidence/mainnet_shadow_launch/run_TEMPLATE/README.md)**。**（TT §0 SL · §7；** **冻结** **`Full GO`** **后** **所有** **主网** **发布** **须** **新** **`run_<UTC>/`** **完整** **重跑** **G0～G6+SL** **全** **GO** **，** **否则** **一律** **禁止** **进入** **生产** **）**

---

## 10. 监控与值班

- [ ] **10.1** **告警**：API 5xx 率、延迟、indexer 失败日志、RPC 错误率、DB 连接池耗尽。**（P0 #6, P0 #11）**
- [ ] **10.2** **仪表盘**：链高度 vs indexer checkpoint 滞后（阈值已设）。**（P0 #6, P0 #11）**
- [ ] **10.3** **值班路径**：on-call 能访问内网 internal 与 DB 只读账号；**Runbook** 链接已贴在工单/聊天置顶。**（P0 #6）**
- [ ] **10.4** **审计证据**：如需对外出具，**`sha256sum -c docs/verification-evidence-sha256.txt`** 在发布分支通过（与 pack 第 2 节自校验哈希一致）。**（P0 #7）**

**并联（非 P0 子项 · GitHub Actions 组织健康）**：若组织 **付款失败** 或 **Actions spending limit** 过低，GitHub 可 **拒绝启动** `ubuntu-latest` job（注解常含 *payments have failed* / *spending limit*）；此时 **无** 常规 CI step 日志，**与** 单条 Dependabot（如 **`upload-artifact`**）**版本 bump** **无**可验证因果链。**处理**：**Billing & plans**（组织：`https://github.com/organizations/<ORG>/settings/billing`）+ 放行 **Actions** 支出；复跑后按 **[TT-L4-PARALLEL-CI-001](runbook/TT-L4-PARALLEL-CI-001.md) §5～§8** 对拍 **L4 parallel CI** 是否已进入 **`npm run e2e:sepolia`**。

---

## 11. 发版真值并联（官方总表 P0 十二项 · 此处仅打卡）

本节**不重复** 08-2 / 08-4 / 00 正文；仅确认已在 **[缺口与待补-官方总表](spec/缺口与待补-官方总表.md)** 对应行 **☑**，并与 **07 §四 4.3** 发版前并联说明一致。

**Evidence path 约定**：日期目录一律写 **`evidence/GO_YYYYMMDD/`**（`YYYYMMDD` 为发版或过门日）；首次可复制模板 **`evidence/GO_YYYYMMDD_template/`**（见 [evidence/README](../../evidence/README.md)）。**Run command** 在仓库根执行，除非另注。

**并联（非 P0 十二项子项）**：**Production 工程/治理/链上三条闭环** 的 **仓库内唯一总入口** 为 **[`evidence/GO_FINAL_20260416/README.md`](../../evidence/GO_FINAL_20260416/README.md)**（**对外摘要** **[`RELEASE_NOTES_PUBLIC.md`](../../evidence/GO_FINAL_20260416/RELEASE_NOTES_PUBLIC.md)** **）** **；** **与** **本节** **08** **证据包** **路径** **约定** **正交** **，** **勿** **混为** **第二套** **顶层** **入口** **。**

**Check-G · 定型包 · 签字链（并联 [15 附录〇 · Check-G](spec/15-多维度文档与技术检查报告.md#发版前勾选总表) / [Runbook §2.7.4](../../ops/RUNBOOK.md#check-g-dual-score-gate)）** — **非** P0 十二项子项；**合并进 `main` 的 CI 绿灯** **不** **替代** **下列发布前动作**。

- [ ] **11.13** **`GO_FINAL_*`**：用作**定型发布包**目录名时，**同次封口**在仓内只认**一个** bundle 根路径（勿复制出多套同名前缀目录）；一般过门仍用 **`evidence/GO_YYYYMMDD/`**（与上文 **Evidence path 约定** 一致）。
- [ ] **11.14** **Check-G 封口三连**已在**发布前/发布动作**执行（见 [Runbook §2.7.4](../../ops/RUNBOOK.md#check-g-dual-score-gate)「**封口命令（建议顺序）**」）：**`bash scripts/check-dual-score-gate.sh`** → **`python scripts/dev/validate_dual_score_signoff.py <评分件路径> --bundle-root <GO包根目录>`** → **`python scripts/dev/validate_evidence_manifest.py validate <GO包根目录>`**；**`GO_FINAL_*`** **须**对第三步加 **`--verify-artifact-files`**。
- [ ] **11.15** **`dual_score_signoff.v1.json`**：**`stage`**、**`risk_acceptances[]`**、**`evidence_refs[]`** 已与当次**会议纪要 / PR / TT** **人工对读**一致（**谁 / 何时 / 依据**可追溯）。**`evidence_refs[]`** **须**含与本发布一致的 **commit 可解析行**（推荐 **`commit:`** + **40 位小写 hex**，与 **§11.16** / **`g1_snapshot`** 同源）；建议并列 **`tag:`**、**`PR:`**（例：`commit: abcdef…`、`tag: v1.0.x`、`PR: #482`），以绑定**评分对应的构建 / release 状态**（仍用字符串数组，**不**改 schema）。
- [ ] **11.16** 发版 **PR** 或工单已写明**本发布 tip `git` commit SHA**（与 **§0.1** **`TRAVELTRUST_GIT_SHA` / tag / 镜像 digest** 可追溯对齐）。
- [ ] **11.17** **供应链留痕**：本发布与根目录 **`Cargo.lock`**、**`frontend/package-lock.json`**（及 CI **run** 或制品号，若有）已能在工单/PR 中关联，便于事后对拍（**不**替代 **§0.1** 运行时 SHA）。
- [ ] **11.18** **封口执行留痕**：**Check-G 三连**（[Runbook §2.7.4](../../ops/RUNBOOK.md#check-g-dual-score-gate)）成功运行的**终端输出**已粘贴至发版 **PR/工单**，或落入本 bundle **`artifacts/check-g-seal.log`**（或等价可链 URL）— **不**引入 CI 强制，仅满足审计「发生过、可核对」。

- [ ] **11.1 （P0 #1）** [08-4](spec/08-4-对外口径包.md) 文末 **定稿日期、法务/运营签字或邮件确认** 已在官方总表 **P0 #1** 勾选。
  - **Evidence path:** `docs/spec/08-4-对外口径包.md`（文末三要素 Git 可追溯）；可选扫描件/邮件落 **`evidence/GO_YYYYMMDD/artifacts/08-4-signoff/`**（或内网制品库路径写入 **`manifest.json` → `artifacts`**）。
  - **Run command:** 人工完成 08-4 文末更新后 `git add docs/spec/08-4-对外口径包.md && git commit -m "…"`；bundle 内另附 **`manifest.json` + `manifest.sha256`**（格式见 [evidence/README](../../evidence/README.md)）。

- [ ] **11.2 （P0 #2）** [08-2](spec/08-2-附录-闭合工单表.md) 各工单 **Owner + backup** 已填实，官方总表 **P0 #2** 已勾选。
  - **Evidence path:** `docs/spec/08-2-附录-闭合工单表.md`（提交 SHA）；或 **`evidence/GO_YYYYMMDD/artifacts/08-2-owner-snapshot.md`**（粘贴关键表片段 + 日期）。
  - **Run command:** 编辑 08-2 各表 Owner 列 → `git commit`；与 **08-2 定稿前检查** 同批。

- [ ] **11.3 （P0 #3）** [08-2 审查一](spec/08-2-附录-闭合工单表.md#发版前审查一关键语义一致性审查表) **11 行**已逐行勾选并填审查人/日期/结论，**P0 #3** 已勾选。
  - **Evidence path:** `docs/spec/08-2-附录-闭合工单表.md`（审查一表内勾选与签字可追溯）。
  - **Run command:** 人工逐行勾选审查一；`git commit`；**Runbook** [§12.9](../../ops/RUNBOOK.md) 定稿顺序。

- [ ] **11.4 （P0 #4）** [08-2 审查二](spec/08-2-附录-闭合工单表.md#发版前审查二gate-冲突矩阵与优先级规则) **最后更新 / 评审日期 / Evidence 路径**已填实，**P0 #4** 已勾选。
  - **Evidence path:** 08-2 审查二表本体；可选矩阵副本 **`evidence/GO_YYYYMMDD/artifacts/gate-cross-check.md`**（与 [Runbook §12.7](../../ops/RUNBOOK.md) 一致）。
  - **Run command:** `bash scripts/check-08-consistency.sh`（机读辅助，**不替代**审查二）；`bash scripts/check-governance-doc-linkage.sh`（涉 82～84/08-4 时）；结果日志可落入 **`evidence/GO_YYYYMMDD/artifacts/`**。

- [ ] **11.5 （P0 #5）** [08-4](spec/08-4-对外口径包.md) **定稿检查勾选**（企业级/穿透/自检七项等）已完成，**P0 #5** 已勾选。
  - **Evidence path:** `docs/spec/08-4-对外口径包.md` 文末与文内勾选区；并联 **08-3** 时可将 `bash scripts/check-08-evidence-pointer.sh` 输出存 **`evidence/GO_YYYYMMDD/artifacts/check-08-evidence-pointer.log`**。
  - **Run command:** 人工勾选 08-4 定稿检查；可选 `bash scripts/check-08-evidence-pointer.sh`。

- [ ] **11.6 （P0 #6）** [Runbook §2](../../ops/RUNBOOK.md) **P0 最小九项、值班/批准人真实联系人**已与 08-2 定稿口径一致，**P0 #6** 已勾选。
  - **Evidence path:** `ops/RUNBOOK.md`（§2 表 + P0 九项表 Git 可追溯）；或 **`evidence/GO_YYYYMMDD/artifacts/runbook-p0-table-snapshot.md`**。
  - **Run command:** 编辑 `ops/RUNBOOK.md` §2 → `git commit`。

- [ ] **11.7 （P0 #7）** [evidence/README](../../evidence/README.md) 与 **08-2 Evidence 列**：各 Gate 产物路径或 manifest hash 已填实，**P0 #7** 已勾选。
  - **Evidence path:** **`evidence/GO_YYYYMMDD/manifest.json`** + **`manifest.sha256`**（必填字段见 [evidence/README](../../evidence/README.md)）；索引器快照可选 **`indexer_public_snapshot_*.json`**、**`indexer_evidence_bundle_*.zip`**（同目录）。
  - **Run command:** `cp -r evidence/GO_YYYYMMDD_template evidence/GO_YYYYMMDD` 后编辑 manifest；**`sha256sum manifest.json > manifest.sha256`**（或等价）；索引器留痕：**`bash scripts/write-indexer-evidence.sh`** 或 **`bash scripts/internal-indexer-ops.sh evidence`** / **`evidence-bundle`**（须 **`API_BASE_URL` + `INTERNAL_API_SECRET`**，见 [Runbook §2.55 / §12.5](../../ops/RUNBOOK.md)）；前端 Gate-5：**`./scripts/gen-frontend-manifest.sh`**（可选 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`**）。

- [ ] **11.8 （P0 #8）** [00 文档索引 · 发版前快速核对（7 项）](spec/00-文档索引.md#发版前快速核对7项) 已逐项执行（含 **07 §四 4.3**、版本表、签字等并联），**P0 #8** 已勾选。
  - **Evidence path:** `docs/spec/00-文档索引.md` 版本表 Git 记录；机读日志 **`evidence/GO_YYYYMMDD/artifacts/pre-release-automation.log`**。
  - **Run command:** **`bash scripts/pre-release-automation.sh`**（或 **`.ps1`**，见 [scripts/README](../../scripts/README.md)、[缺口总表](spec/缺口与待补-官方总表.md) 核查流水步骤 4）；并联 **`bash scripts/run-check-04-routes.sh`**、**`bash scripts/check-55-s13.sh`**（与 7 项中 08-3/04 勾选对应）。

- [ ] **11.9 （P0 #9）** [27-P26 实现记录](spec/27-archived/27-P26-实现记录.md) **可调通验收**（脚本/门禁表）已按该文执行并勾选，**P0 #9** 已勾选。
  - **Evidence path:** 27-P26 §二 **验收日期 / 结果** 表（Git 可追溯）；执行日志 **`evidence/GO_YYYYMMDD/artifacts/p26-smoke.log`**（粘贴 `cargo test` / smoke 输出）。
  - **Run command:** **`cargo test -p traveltrust-api`**；API 就绪时 **`bash scripts/smoke-api-public-routes.sh`**（见脚本头注释设 `BASE_URL`）；若仓库内存在 **`scripts/p4_chain_off_e2e.sh`**（27-P26 原文口径）则优先执行并将输出落入 **`artifacts/`**。争议路径可选文档所列 **`p10_e2e_dispute`** 类脚本（若存在）。

- [ ] **11.10 （P0 #10）** **E2E 三项**在目标环境已留痕（`YYYY-MM-DD` 格式，见 [evidence/README](../../evidence/README.md)、[01 发布与 E2E](spec/01-总库总览.md)），**P0 #10** 已勾选。
  - **Evidence path:** **`evidence/GO_YYYYMMDD/artifacts/e2e-normal-release.md`**、**`e2e-dispute-three-terminals.md`**、**`e2e-three-timeouts.md`**（文件名与 [evidence/README · 07-p0-e2e-three](../../evidence/README.md#07-p0-e2e-three) 一致）；并入 **`manifest.json` → `artifacts`**。
  - **Run command:** 目标环境按 01/53 执行三项并记录命令与结论；合约侧可选 **`cd contracts && forge test`**（与部署网络一致时）；将 tx hash / 订单 id 写入上述 **`artifacts/*.md`**。

- [ ] **11.11 （P0 #11）** [Runbook §4](../../ops/RUNBOOK.md) **资损 runbook 演练**至少登记一次（与 01 §9 一致），**P0 #11** 已勾选。
  - **Evidence path:** **`evidence/DR-YYYYQX-0N/`** 或 **`evidence/GO_YYYYMMDD/artifacts/runbook-dr-*.md`**（与 §4 演练历史表 **产物** 列互指）；示例见 Runbook §4 已登记行。
  - **Run command:** 按 [Runbook §1](../../ops/RUNBOOK.md) 场景 **①～⑤** 之一执行桌面演练；将 **日期 / 场景 / 结果 / 产物路径** 填入 Runbook §4 表；产物 MD/JSON 落 **`evidence/…/artifacts/`**。

- [ ] **11.12 （P0 #12）** [27-P10-02 十三勾选表](spec/27-archived/27-P10-02-十三勾选表.md) **02 §十三 发版前** **13.1 / 13.2 / 13.3** 已勾选，**P0 #12** 已勾选。
  - **Evidence path:** `docs/spec/27-archived/27-P10-02-十三勾选表.md`（勾选与日期 Git 可追溯）；或 **`evidence/GO_YYYYMMDD/artifacts/02-sec13-snapshot.md`**。
  - **Run command:** 人工打开 [02 §十三](spec/02-架构设计.md) 与 27-P10-02 表逐项勾选 → `git commit`；并联 **07 §四 4.3** 发版前检查叙述。

---

## P0 覆盖映射表（轻量版）

| 官方总表 P0 # | 待补项（摘要） | 本清单落点 |
|---------------|----------------|------------|
| — | **Mainnet 专项（非十二项子项）** | **§9**（**含** **9.0.7** **Shadow** **Launch**）；并联 **[TT-MAINNET](runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)**、**[`evidence/mainnet_shadow_launch/`](../evidence/mainnet_shadow_launch/README.md)** |
| 1 | 08-4 签字/定稿日期 | **§11.1** |
| 2 | 08-2 Owner + backup | **§11.2** |
| 3 | 08-2 审查一 | **§11.3** |
| 4 | 08-2 审查二 / Gate 矩阵 | **§11.4** |
| 5 | 08-4 定稿检查勾选 | **§11.5**；并联 **§3.3**、**§1.4** |
| 6 | Runbook P0 九项、值班链 | **§11.6**；并联 **§1.5, §3.8, §8.x, §10.x** |
| 7 | evidence / 08-2 Evidence | **§11.7**；并联 **§0.1, §1.3, §4.x, §5.4, §6.x, §7.4, §8.2, §10.4** |
| 8 | 00 快速核对 7 项 | **§11.8**；并联 **§0.2, §3.2, §6.3** |
| 9 | P26 可调通 | **§11.9**；并联 **§2.2, §3.2, §3.7** |
| 10 | E2E 三项留痕 | **§11.10**；并联 **§1.x～§7.x**（链/DB/API/索引/前端/smoke）、**§4.5**（Escrow SSOT：**TT-RELEASE-GATE-ESCROW-SSOT-014**） |
| 11 | 资损 runbook 演练 | **§11.11**；并联 **§1.1, §2.3, §8.x, §10.1～10.2** |
| 12 | 02 §十三 发版前勾选 | **§11.12**（正文在 27-P10-02；**07 §四 4.3** 并联） |
| — | **Check-G / 定型包 / 签字链（非十二项）** | **§11.13～11.18**；并联 **[Runbook §2.7.4](../ops/RUNBOOK.md#check-g-dual-score-gate)**、**[TT-B420](runbook/TT-B420-GO-W-GATE-PRERELEASE-001.md)**（边界：**W-GATE** **不**含 Check-G 默认编排） |

**文档维护**：合约或 indexer 契约变更时，同步更新本清单第 1、3、4 节；不必改业务代码也可单独修订本文。若官方总表 **P0 #** 行变更，须同步本表 **§11** 与映射表。
