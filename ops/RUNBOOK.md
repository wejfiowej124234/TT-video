# Runbook + 演练模板（运维闭环）

本文档为 TravelTrust **资损与异常场景 Runbook** 及**演练记录模板**，与 [08-1-战略与合规风险检查清单](../docs/spec/08-1-战略与合规风险检查清单.md) B2、[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md) 配套。**谁值班、谁批准**须写死；演练产物入 **evidence/GO_YYYYMMDD/**。**脚本**：日常开发与 CI 脚本见 [scripts/README.md](../scripts/README.md)；发版/08/evidence 相关脚本已精简，本节以下流程以手工执行为准。

**维护**：运维。变更须双人审批并留痕。

**闭合标准**：下表每条**触发阈值、自动动作、人工动作、证据产物**四列填实，且「值班/批准人」联系人落具体角色或代号后，本 Runbook 方可作为 Gate-2/ Gate-4 门禁闭合证据；否则仅作骨架，见 08-1 B2、08-2 定稿前检查。

**08 落点索引**（从 08-4/08-2 快速跳转）：§1 触发表 / 值班批准链 → 08-4 第 6 章 Pause；§2 值班与批准链；**§2.55** internal indexer（tick/replay/reconcile）curl 模板 ↔ [04 §3.4](../docs/spec/04-后端与API.md) 内部 API，**Admin 只读 UI** 路由矩阵 ↔ [13-1 表 1](../docs/spec/13-1-UI产品级SSOT与页面规范.md) **`/admin/indexer*`**/**`observability`**/**`finance`**；**§2.56** 合约部署顺序（Anvil→测试网→主网；**SSOT**）→ [04 §四](../docs/spec/04-后端与API.md)（后端入口）、[contracts/README](../contracts/README.md)、[governance-token/02 §1.3](../docs/spec/governance-token/02-对内技术规格-草案.md)、[82 §三附](../docs/spec/82-治理币-文档总览.md)、[07 §二 Phase 3](../docs/spec/07-开发流程与顺序.md)、[14 §6](../docs/spec/14-合约-API-ABI-前后端对齐.md)；§3 演练模板；§4 演练历史；§5 证据链三条 → 08-4 第 3 章；§6 复检周期、法律突变、协议终止、DR 演练 → 08-4 第 3/8 章；§7 紧急多签、多签权限矩阵、override 可审计 → 08-4 第 2 章；**§7.1** 可分配费用基数与仲裁/slash 正交 → [84 §1.1.1](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)、08-4 第 2 章；§8 仲裁员容量、报酬脱钩、联盟防护 → 08-4 第 3/7 章；§9 证据删除与司法协助、GDPR → 08-4 第 3 章；§10 多签轮换、实质控制声明、参数变更 → 08-4 第 2 章；§11 冗余/reorg/冲突优先级/时间矩阵/自然终局/拥堵降级等 → 08-4 第 3/5/6 章。**§12** Outbox；**§12.1** 订单 **`/api/v1/orders/:id/evidence`**（**EVIDENCE_RECEIPT_HMAC_KEY** / **backend_signed**）→ [04 §三](../docs/spec/04-后端与API.md)；**§12.2** **`x-request-id`** / **`x-message-id`**、日志与 **Idempotency-Key** 区别 → [04 §四](../docs/spec/04-后端与API.md)；**§12.3** **`STRICT_SESSION_GATE`**、**`GET /meta` → `strict_mode.strict_session_gate`**、公开路径白名单 → [04 §7.8](../docs/spec/04-后端与API.md)；**§12.4** 合约 **ABI**（**forge** → **`contracts/abi`** → **`frontend/dapp/abis`**、**55-S13**、**verify-abi-forge**、**Contract ABI Gate**）→ [14 §1.2](../docs/spec/14-合约-API-ABI-前后端对齐.md)；**§12.5** **索引器/DB 对账**（**§2.55**、**01 §9**、**04 §四**）；**§12.6** **可验证发布 manifest**（**08-4 第 7 章**、**evidence/README**）+ **E2E 三项 / §4 演练** 留痕（**01 §「发布与 E2E」**、**27-P14 P14-3**）；**§12.7** **W-GATE-CROSS-CHECK**（全 Gate 横向评审 → **08-2 审查二**）；**§12.8** **01 §10 17 条 #5**（**export_deployment_params** / **Slither**）；**§12.9** **08-2 工单定稿**（定稿前检查 + Owner）；**§13** CI Fork PR；**§14** 250/260 调度。定稿表 P0 见 08-2 定稿前检查。

---

## 1. Runbook 触发阈值表（四列）

每条固定四列：**触发阈值** | **自动动作** | **人工动作** | **证据产物**。

| 场景 | 触发阈值（写死示例；定稿由运维确认） | 自动动作 | 人工动作 | 证据产物 |
|------|----------------------------------------|----------|----------|----------|
| ① RPC 大面积不可用 | 连续 5 分钟错误率 > 10% 或健康检查失败 | 降级/切换 RPC、只读模式 | 值班报批准人；批准人审批后执行切换/回滚 | bundle 文件名、日志索引 |
| ② Indexer 落后 | 落后 block 数 > 100 或延迟 > 60s | 告警、暂停依赖 Indexer 的写 | 值班排查、批准人审批重放/修数 | 对账 checkpoint、重放日志 |
| ③ reorg | 检测到链重组超过 finalityN（08-3） | 暂停结算、重扫/重放 | 批准人确认 finality 后恢复 | blockHash+logIndex、重放记录 |
| ④ 执行器卡单 | 卡单时长 > 30min 或队列积压 > 50 | 告警、可选只读/排队 | 批准人审批重试、值班执行/回滚 | resolutionId、双人审批日志 |
| ⑤ token 冻结/黑名单 | 监管/合约级冻结或 allowlist 移除 | 暂停该 token 新单、告警 | 批准人决定下线 token、值班执行 allowlist | 事件 TokenAllowlistUpdated、运维决策记录 |
| ⑥ 配置误发布 | allowlist/feePolicy 等误配 | 告警、可选回滚开关 | 批准人审批回滚、值班执行 | 配置快照、回滚 txHash |
| ⑦ 权限误配 | Pause 白名单/仲裁角色误配 | 告警、审计留痕 | 批准人审批修正、值班执行 | RBAC 快照、变更日志 |
| **⑧ 53 聊天确认超时** | 抢单后 N 天内（如 7 天）未在 TT 社区/订单消息中完成行程确认 | 订单释放为可抢单、占位向导档期解档；可选通知 | 值班核对订单状态与档期；用户申诉时批准人审批是否人工恢复 | 订单 id、超时时间、解档记录 |
| **⑨ 53 付款超时** | 双边确认后 N 小时内（如 24h）未 deposit | 订单取消、档期解档；可选通知 | 同上；人工干预仅限误判（如 tx 已发未确认）时批准人审批重试/修正 | 订单 id、超时时间、取消记录 |
| **⑩ 53 评分确认超时** | 完成服务后 N 天内（如 14 天）双方未均确认评分 | 按 01 autoComplete 等自动释放或保持可评 | 值班核对释放状态；人工强制释放须批准人审批并留痕 | 订单 id、释放 txHash、双人审批日志 |

**53 三种超时（F1/N6）**：上述 ⑧～⑩ 含义、自动动作与人工干预见 [53-阶段开发技术文档](../docs/spec/53-阶段开发技术文档.md) §3.5.1、§5.6；排查步骤：① 查订单 sub_status/status 与 04 API ② 核对 deadline 与 08-3 参数 ③ 需人工释放/取消时走批准人审批。**谁可强制取消/释放**：仅批准人（或运维+批准人双人）可执行人工释放/取消，工单入口为 API 或内部管理端（若有）；无单点「用户自助强制释放」。

**与 01 资损 runbook（P0）对应**：[01-总库总览](../docs/spec/01-总库总览.md) §9 要求资损 runbook 至少 5 条（RPC/Indexer/reorg/执行器卡单/token 冻结），对应本表场景 **①～⑤**；⑥ 配置误发布、⑦ 权限误配为 Runbook 扩展场景（08-1 要求人因错误演练覆盖）。

**RUNBOOK_PAUSE_ALLOWLIST**（08-3 pauseAllowlist 落点）：有权触发 Pause 的地址/角色列表，定稿时由运维填实并脱敏留存；变更须双人审批并同步 08-3 变更记录。

| 用途 | 说明 |
|------|------|
| Pause 白名单 | 多签地址或经批准的运维角色列表（见 B1 多签清单；具体表脱敏存内部） |
| 变更 | Runbook §10 变更流程；同步 08-3 pauseAllowlist evidence_pointer |

**反刷/限流（BB5）**：与 01 §4、04 §四、03 §二 一致。**全局限流**：API 层 `rate_limit_layer` 对 /api/v1 按 IP 每分钟上限（API_RATE_LIMIT_PER_MINUTE，默认 120）。**关键写接口限流（55 G7）**：对 POST accept、confirm-bilateral、confirm-rating、confirm-final-plan、cancel、reviews 按 IP 单独计数，`critical_write_rate_limit_layer` 默认每 IP 每分钟 15 次（CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE）；超限 429，错误码 `critical_write_rate_limit_exceeded`。.env 可选 CONFIRM_RATE_LIMIT_PER_USER、EVIDENCE_MAX_REQUESTS_PER_MINUTE、CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE（见根目录 .env.example）。53 附录 A BB5、[55-阶段-数据同步与数据库功能同步](../docs/spec/55-阶段-数据同步与数据库功能同步.md) §八附续 G7/O1。

---

## 2. 值班与批准链

| 角色 | 职责 | 联系人（脱敏或代号） |
|------|------|----------------------|
| 值班 | 7×24 首接、触发 Runbook、收集产物 | **plant**（代号）；联系方式**内部配置**（微信/钉钉/Slack），不入代码仓；backup 与运维 next on-call 登记表一致。**DR-2026Q1-01**：Indexer 探针演练执行/复核人见 `evidence/GO_20260407/artifacts/runbook-dr-DR-2026Q1-01.md`；**上市/监管级**须异名双人填实 §2 与 P0 ①。 |
| 批准人 | 人工动作审批、升级决策 | **plant**（代号）；批准权限与 08-3 多签口径一致；联系方式**内部配置**，不入仓。**上市/监管级**须由风控/合规负责人实名替换并与 B1 多签清单对应关系书面确认。 |
| 多签执行 | 链上/关键配置变更 | 见 B1 多签清单（独立脱敏） |

**Runbook 定稿表 P0 最小必填项（9 项）**：上线/过门前须填满以下 9 项，见 [08-2 定稿前检查](../docs/spec/08-2-附录-闭合工单表.md)。下表已按最佳实践填选；定稿时确认或替换为项目实际口径并勾选 08-2。

| # | 必填项 | 落点 | 定稿时填（占位示例，发版前替换为真实内容） |
|---|--------|------|----------|
| ① | 值班/批准人 | §2 上表联系人 | **已填（工程收口）**：值班 **plant**；批准 **plant**；联系方式见内部配置；与 08-2 B1 多签清单对应关系由责任人线下维护。**监管/上市发版前**须替换为异名双人实名并确认可达。 |
| ② | 多签实质控制声明更新频率 | §10 | 每 12 个月（已按最佳实践填选；定稿时确认） |
| ③ | OFAC+稳定币冻结+Pause 冲突矩阵步骤表 | §11 | **优先级固定**：监管命令（OFAC/政府请求）> 稳定币冻结披露 > Pause > 常规仲裁排队；**具体步骤**： 1️⃣ OFAC 命中→冻结交易+通知用户申诉渠道（30 天）；2️⃣ 稳定币冻结→声明"无限期冻结"+暂停新单+存量按既有规则结算；3️⃣ Pause 需执行→按 §6 Pause 流程；4️⃣ 争议未结清→按 §6 SLA 计算与延后策略。**矩阵表详见 Runbook §11 冲突矩阵小节**；已按最佳实践填选 |
| ④ | 法律突变 30 天存量策略 | §6 | 立即停止新单；存量订单按 08-4 释放/退回；用户资金链上 Escrow 按 08-4 口径（已按最佳实践填选） |
| ⑤ | 收入归集路径或收益流图 | 治理文档/08-4 | **仲裁费**：运营账户与合规成本；**质押罚没**：进入平台治理金库（不再分配给向导）；**订单手续费**：平台运营成本；**路径图**见 08-4 第 2 章与治理文档；**若启用 FeeRouter/区域池（Target）**：内部参数与一页闭环图以 [83-区域治理与收益分配-协议白皮书](../docs/spec/83-区域治理与收益分配-协议白皮书.md) **§3**、[84-第一阶段10国Country-Pool发行参数总表](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)、[08-4-附录-收益流闭环图-FeeRouter-Target](../docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md) 为技术单源，**对外**仍须 08-4 收益证券隔离与法务定稿；**防激励冲突**：仲裁费不与争议数量绑定（已按最佳实践填选） |
| ⑥ | 协议终止与 graceful shutdown | §6 | **触发**：监管勒令、多签不可恢复、稳定币永久冻结；**流程**：停止新单→存量订单按 08-4 默认裁决规则或清算→资金处置披露（详见 Runbook §6 协议强制关闭）；**存量终局**：所有订单在 30 天内解决，无卡住资金（已按最佳实践填选） |
| ⑦ | 多签权限矩阵或紧急多签触发条件表 | §7 | **多签可改**：allowlist、Pause 白名单、冷却期、费率参数等运营/安全参数；**多签不可改**：资金释放终态逻辑（Escrow 合约不可升级）；**紧急多签**仅限 Pause/OFAC/安全事件，可豁免 paramFreezeDays；**权限矩阵详表**见 Runbook §7、08-4 第 2 章（已按最佳实践填选） |
| ⑧ | 08-4 文末定稿日期+法务/运营签字 | 08-4 文末 | **2026-04-07**；**v20260407**；文末 plant 收口确认 + 持牌法务/运营书面替换说明（见 [08-4](../docs/spec/08-4-对外口径包.md) 文末） |
| ⑨ | 协议强制关闭（三种触发+关闭流程+存量终局+用户资金处理） | §6 | **三种触发**：① 监管勒令（政府/监管机构关停网络服务）② 多签不可恢复（关键多签成员均失联/丧失行为能力，≥12 个月无法恢复）③ 稳定币永久冻结（USDC 等稳定币发行方全球冻结，无法转移）；**关闭流程**： 1️⃣ 立即停止新单（前端下线、API /accept 返回 503）2️⃣ 通知用户 30 天内完成存量订单（邮件/网站公告）3️⃣ 存量订单按默认裁决（证据不足→game退款）或自动清算；**存量终局**：30 天内所有订单状态变更收尾，无卡住订单；**用户资金处理**：Escrow 按约定释放（游客取回/向导取回），资金无损失，链上可审计；**证据保全**：关闭前 30 天内生成审计报告与证据 snapshot 入 evidence；**披露**：公开宣布关闭原因与用户资金处理规则，接受查询（已按最佳实践填选） |

**发版时**：由责任人将上表占位替换为真实值班/批准人及九项定稿内容，替换完成即视为 Runbook P0 未完成部分已闭环。

**缺口官方总表 P1-B 互证（2026-04-09）**：[缺口与待补-官方总表](../docs/spec/缺口与待补-官方总表.md) **P1-B**「Runbook 定稿表」行已与 **`evidence/GO_20260409/artifacts/p0-runbook-nine-items-close.md`** + **`manifest.json`** / **`manifest.sha256`** 同批闭合（**TT-07-63B-SEQ1-P0-SINGLE-ITEM-001**）；**监管/上市**仍以本节 **§2** 表首「异名双人」要求为准。

**缺口官方总表 P1-B 互证（08-4 第 2 章，2026-04-09）**：**P1-B**「[08-4 定稿前必填清单 / 第 2 章](../docs/spec/08-4-对外口径包.md)」行已与 **[08-4 §2](../docs/spec/08-4-对外口径包.md)** 末条「P1-B 勾选互证索引」+ **`evidence/GO_20260409/artifacts/p1b-08-4-ch2-close.md`** + 同目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1B-08-4-CH2-SINGLE-001**）；**法理结论与签字**仍以 **08-4** 文末定稿三要素及持牌法务替换为准。

**缺口官方总表 P1-B 互证（08-4 第 3 章，2026-04-09）**：**P1-B**「[08-4 第 3 章](../docs/spec/08-4-对外口径包.md)」行已与 **[08-4 §3](../docs/spec/08-4-对外口径包.md)** 末条「P1-B 勾选互证索引」+ **本节 §11**（时间矩阵、回滚检测、NTP、冲突流程图互文）+ **`evidence/GO_20260409/artifacts/p1b-08-4-ch3-close.md`** + 同目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1B-08-4-CH3-SINGLE-001**）；**目标环境时间源/NTP** 实名定稿仍以架构/运维为准。

**上线前工程逐项核对入口**：[Go-Live Checklist](../docs/go-live-checklist.md)（env / 链 / DB / indexer / 前端等勾选）。该清单为**工程核对表**，**不替代** [缺口官方总表 P0 十二项](../docs/spec/缺口与待补-官方总表.md) 与 [07 §四 发版前检查（4.3）](../docs/spec/07-开发流程与顺序.md#07-sec-4-3-release-checklist)；P0 与发版多维门禁仍以该两处以并联勾选与 evidence 为准。

**P0 → evidence 可执行入口（与 Go-Live §10 对齐）**：按 [Go-Live Checklist §10](../docs/go-live-checklist.md) 逐项执行时，典型**落盘产物**为：**`evidence/GO_YYYYMMDD/manifest.json`** + **`manifest.sha256`**（各 Gate 汇总，**08-2 Evidence 列**可填此路径或 hash）；**`artifacts/e2e-*.md`**（01 E2E 三项留痕，见 [evidence/README §07-p0-e2e-three](../evidence/README.md#07-p0-e2e-three)）；**`indexer_public_snapshot_*.json`** / **`indexer_evidence_bundle_*.zip`**（**`bash scripts/write-indexer-evidence.sh`** 或 **`internal-indexer-ops.sh evidence|evidence-bundle`**，与 **§2.55 / §12.5** 同套 env）；**`frontend-build-manifest.json`**（**`./scripts/gen-frontend-manifest.sh`**，可选 **`EVIDENCE_GO_DIR`**）；**资损演练**行填 **§4** 表时产物入 **`evidence/DR-…/`** 或 **`evidence/GO_…/artifacts/runbook-dr-*.md`**。**机读门槛**（P0 #8/#9 辅助）：**`bash scripts/pre-release-automation.sh`**、**`cargo test -p traveltrust-api`**、**`bash scripts/smoke-api-public-routes.sh`**（输出可粘贴进 **`evidence/GO_YYYYMMDD/artifacts/*.log`**）。**已执行 dry-run 示例（可复现）**：`evidence/GO_20260407/`（`cargo test -p traveltrust-api` → **`artifacts/test.log`**；**`SKIP_FORGE_VERIFY=1 bash scripts/pre-release-automation.sh`** → **`artifacts/pre-release.log`**；根级 **`manifest.json`** / **`manifest.sha256`**）；该目录默认被根 **`.gitignore`** 排除，入仓需责任人 **`git add -f`** 或改存私有制品库。

**08-4 企业级须补齐项落点**（定稿时须补齐或落 Runbook/治理文档）：收益流闭环图、会计确认时间点、是否分红/治理币分配、时间优先级矩阵、时间回滚检测/NTP 审计、数据主权/DPA/data controller、可替代性阶段完成标准、公司结构/终极组合、若被认定为金融服务商时的应对路径、hash 与司法彻底删除 override。上述项见 [08-4 定稿前必填清单](../docs/spec/08-4-对外口径包.md) 与 Runbook §6/§7/§10；定稿时落本节或 08-4/治理文档即闭合。

**发版前自动化检查（可选）**：08-3/08-4 一致性、多环境必填项、08-2 evidence 指针等按本节描述手工核对；详见 [27-P34-实现记录](../docs/spec/27-P34-实现记录.md)。（注：原 p34_pre_release_checks 等脚本已精简，见 [scripts/README.md](../scripts/README.md)。）

**前端可验证发布（Gate-5 / 08-4 第 7 章）**：每次发版前须执行：① 构建前端 `cd frontend && npm run build` ② 在构建产物目录生成 manifest（如 `manifest.json` 列出产物路径与 sha256，再用 `sha256sum manifest.json > manifest.sha256`）③ 将 manifest 纳入 evidence 或发版包。详见 [evidence/README.md](../evidence/README.md)。

**生产部署前必检（P1）**：
| 项 | 说明 |
|------|------|
| **CORS_ORIGINS（P4 生产必配）** | 后端 API 必须配置生产前端域名，否则浏览器会拦截跨域请求；.env.example 已注明「生产必配」；55-S13/15 附录〇 发版前勾选「CORS_ORIGINS 已设」。 |
| **.env 与密钥** | `.env` 及含密钥文件勿提交；仅提交 `.env.example` 示例；见 项目优化与问题清单 §六。 |
| **internal API 仅内网（P3）** | `/api/v1/internal/*`（如 process-resolution-outbox、indexer-tick）**禁止公网暴露**；须通过网关/防火墙限制为 localhost 或内网 IP；见 55 §八附续.1 P3、04 内部 API 约定。 |

**发版前 P2 三处核对**：Runbook §2.5、[04-业务逻辑与数据库支持清单](../docs/spec/04-业务逻辑与数据库支持清单.md)、[41-后端数据库接库与落地清单](../docs/spec/41-后端数据库接库与落地清单.md) 三处对「无 DB 时」行为与「生产必配 DATABASE_URL」表述须一致；任一修改时同步改另两处，发版前做一次交叉核对并勾选（55 §八附续.1 P2）。

**前端发版前本地检查（可选）**：与 CI 一致，在 frontend 目录执行 `npm run lint`、`npx tsc --noEmit`、`npm run test -- --run`；通过后再构建并生成 manifest（见上文）。

---

## 2.5 启动、档期持久化与 Hydrate（49 C）

**CockroachDB 名 vs PostgreSQL 真源（SSOT）**：**PostgreSQL**（`DATABASE_URL` 所连实例）为本仓**开发与运行真源**；**CockroachDB** 为**目标分布式拓扑（规划名）**；**`crates/api/migrations`** 为 **SQL schema 单源**。勿将目标拓扑与当前 PG 落地混读。

**启动顺序**：① 配置 `.env`（PORT、DATABASE_URL、CORS_ORIGINS、SEED_TEST_ACCOUNTS 等）；② 若使用 DB，先启动 Postgres（如 `docker compose up -d`）；③ 启动 API（`cargo run -p traveltrust-api`）。API 启动时会：连接 DB、执行迁移、hydrate 将 orders/users/guides/disputes/itineraries 等灌入内存；若设置了 `SCHEDULE_SLOTS_PATH`，从该路径加载档期文件到 schedule_engine，未设置则档期仅内存（重启清空）。

**档期持久化（49 C）**：环境变量 `SCHEDULE_SLOTS_PATH` 指向 JSON 文件路径（如 `data/schedule_slots.json`）。设置后：启动时若文件存在则加载档期；每次 lock_slot/release_slot 后自动写回该文件。不设置则档期仅内存。**备份**：定期备份该文件与 DB；**回滚**：恢复该文件与 DB 后重启 API 即可恢复档期与业务数据。

**49 F payment_window**：`PAYMENT_WINDOW_MINUTES`（建议 30）或 `P3_PAYMENT_TTL_SECS` 控制接单后须在 N 分钟/秒内 deposit，超时自动取消订单并释放档期；见 80 §4.9、49 F.5、.env.example。防锁单 `CONFIRM_RATE_LIMIT_PER_USER` 为可选占位。

**Hydrate 验收**：重启 API 后，确认日志中有 `database: hydrated N users, ... N itineraries, ...`（当 DATABASE_URL 已设）；若有档期文件且 SCHEDULE_SLOTS_PATH 已设，接单/锁定档期后重启，再次接单前应能见到重叠校验生效（即档期已恢复）。双写与 hydrate 逻辑见 crates/api/src/startup/hydrate.rs、schedule_engine::init_from_env。

**55 O8 hydrate 部分失败策略**：关键表 **users、sessions** 加载失败则**启动失败**；**guides、orders、reviews、disputes、itineraries、order_messages、evidence_receipts** 为可降级表，单表失败时**跳过并打日志**、启动继续。详见 55 文档 §8.6。

**55 关键路径监控（O2）**：建议对以下路径做日志与告警（09 或监控平台）：① **hydrate 失败**—启动时 users/sessions 失败即启动失败，可降级表失败打 warning、记录表名；② **双写失败**—persist_order、insert_itinerary、insert_order_message 等 DB 写失败时打 error、建议监控双写失败率；③ **订单状态变更**—accept、cancel、confirm-*、reviews 等关键写成功/失败可打 info/error 便于审计。详见 55 §8.6、§八附续 O2/O9。

**社区接口 404**：若前端请求 `GET /api/v1/community/feed`、`/api/v1/community/me/following` 等返回 **404 (Not Found)**，说明当前运行的 API 进程未包含社区路由（多为旧二进制或未重新编译）。**处理**：在仓库根执行 `cargo build -p traveltrust-api` 后重启 API（`cargo run -p traveltrust-api` 或重启当前进程）；社区路由见 crates/api/src/routes/community.rs，已合并进 api_router。

**55-S7 无 DB 时约定（55 阶段）**：以下路由**依赖数据库**（需配置 `DATABASE_URL`）；未配置时 API 返回 `"message": "service unavailable"` 或列表为空：
- **社区**：Feed、发帖、点赞、评论、关注、好友、私信、收藏、**反馈/建议**（GET/POST /api/v1/community/feedback）；
- **DID 排行榜**：GET /api/v1/did-rank/travelers、/guides、/itineraries（G1）；
- **治理**：GET /api/v1/governance/pool、/rewards。
**生产/需持久化场景必须配置 DATABASE_URL**；开发可无 DB 仅跑内存（订单/行程/聊天等经 chain_off 双写，无 DB 时仅内存、重启清空）。见 [55-阶段-数据同步与数据库功能同步](../docs/spec/55-阶段-数据同步与数据库功能同步.md) §八、§八附。

**O5 环境变量汇总（多环境）**：dev/staging/prod 关键变量与根目录 **`.env.example`** 一致；发版前核对 PORT、DATABASE_URL、CORS_ORIGINS、NEXT_PUBLIC_API_BASE_URL 与 04 §六附续 E2E/53 BB2 一致。根目录与 frontend 各有一份 .env.example；**生产必配**：DATABASE_URL、CORS_ORIGINS（见上表）。**链与 DApp 对齐（Phase 3/4）**：`CHAIN_RPC_URL`、`CHAIN_ID`、`ESCROW_FACTORY_ADDRESS`、`STAKING_ADDRESS`、`REGISTRY_ADDRESS`（后端 ChainConfig / `GET /meta` → `chain.contracts`）；前端 `NEXT_PUBLIC_CHAIN_ID`、`NEXT_PUBLIC_STAKING_ADDRESS`、`NEXT_PUBLIC_REGISTRY_ADDRESS` 须与部署一致。**限流与观测**：`GET /meta` 的 `rate_limits` 与 middleware 同源；运维快照另见 `GET /api/v1/admin/observability/overview`（需 admin 会话）。完整映射见 [08-3 附录 A](../docs/spec/08-3-参数与门禁表.md#附录-a运维与实现映射非-26-key-数值对齐代码与-runbook)。**CI**：`scripts/check-55-s13.sh` 校验 API 路由锚点及 **Staking.json/Registry.json** 在 `contracts/abi` 与 `frontend/dapp/abis` 字节一致（Build workflow 已挂载）。

**55 O3/O4 发版前确认**：① **O3 审计日志**—若 04/08-3 已规定关键写操作（订单创建/状态变更、行程写回、反馈提交）须写审计表或日志，收口时确认并引用 04、53 附录 A Y4；若未规定则发版前确认是否补充。② **O4 数据与合规**—备份策略、敏感字段脱敏（password_hash、token、passport_number_hash）、PII 保留周期与 08-3/证据保留一致；Runbook §9 已有敏感数据访问控制与保留期限（待法务/合规定稿）、备份见 §2.5；发版前确认 Runbook §9 与 08-3 一致并勾选。**勾选落点**：发版时在 [55 §八附续.9 发版前勾选执行单](../docs/spec/55-阶段-数据同步与数据库功能同步.md) 或 15 附录〇 逐项勾选「O3 已与 04/08-3 确认」「O4 已与 Runbook §9/08-3 确认」即完成。**确认时核对**：O3 → 04 关键写操作与审计段落、08-3 参数表 `audit_requirement` 列；O4 → Runbook §9 敏感数据与保留期限、§2.5 备份（档期文件与 DB）、08-3 证据保留与 PII。见 55 §八附续.3 O3/O4、§八附续.6、§八附续.9 O3/O4 确认子项。

---

## 2.55 Indexer tick、重放与对账（internal + admin 只读）

**门禁**：`/api/v1/internal/*` **禁止公网暴露**（见上文 **internal API 仅内网（P3）**）。若配置了 **`INTERNAL_API_SECRET`**（非空），请求须带头 **`X-Internal-Api-Secret`** 与 env 一致，否则 **403** `internal_api_forbidden`。契约单源：[04-后端与API](../docs/spec/04-后端与API.md) §3.4 内部 API 段落。

**CI 锚点计数（B-120）**：**[`.github/workflows/indexer-reconcile-gate.yml`](../.github/workflows/indexer-reconcile-gate.yml)** 内 **`checks_total`** 须与 **`check_anchor`** 调用数一致（当前 **113**）；与 **[110 §3.1.2 运维 curl 表](../docs/spec/110-阶段开发链上索引器与事件同步器.md)** 同读。增删锚点时同步改 **`checks_total`** 与 **110**。

**FeeRouter / RegionVault 经济投影 · 规格同锚（B-116-P4）**：[**`evidence/GO_B116_P4.md`**](../evidence/GO_B116_P4.md)（**14 / 110 / 本 §2.55 / CI gate / evidence/README** 互指与可复核命令；**不**改写 **B-115** 证据 **[GO_B115_CLOSE.md](../evidence/GO_B115_CLOSE.md)** 范围）。

**Admin 只读 UI（与上表 internal 写路径对照；页面职责见 [13-1 §二 表 1](../docs/spec/13-1-UI产品级SSOT与页面规范.md)）**：在浏览器内核对 **health / 持久化对账 / 报告列表与详情** 时，可走 **`/admin/indexer`**（`GET …/indexer/health`，含 **`last_stored_reconciliation`**）、**`/admin/indexer/reconcile-reports`**（分页列表与 CSV·JSON 导出）、**`/admin/indexer/reconcile/[id]`**（**`GET …/reconcile-report/:id`**）、**`/admin/observability`**（**`GET …/observability/overview`**，**`overview.indexer`** 与 **`last_stored_reconciliation`**）、**`/admin/finance`**（**`GET …/finance/summary`** 元数据 **`last_stored_orders_projection_reconcile`**）。上述路由**不调用** internal **POST**；**tick / replay / reconcile / reorg-rewind** 仍以本节前表与下文 **curl**、**`scripts/internal-indexer-ops.*`** 为准。

| 动作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 状态快照 | `GET` | `/api/v1/internal/indexer-status` | 返回内存 **indexer**（`last_block` / `last_block_hash` 等）、**`state`**（checkpoint、lag、**`reorg_detected`**）；**固定 **`reorg_recovery`**（锚 **`110-REORG-RECOVERY-HINT`**：reorg 后人工 **replay/reconcile** 步骤与 internal 路径）；**有 DB** 且存在最新 **`orders_projection_vs_orders`** 报告时顶层 **`last_stored_orders_projection_reconcile`**（与 **admin indexer health** 同源）；**`?live_reconcile=1`** 时附加 **`live_orders_projection_reconcile`**（即时只读 **`orders`↔`orders_projection`**，成功时 **`projection_reconcile_clean`** / **`issues_total`**，便于探针单次 GET） |
| 索引一轮 | `POST` | `/api/v1/internal/indexer-tick` | 拉取日志、写 `event_log` / 投影 / checkpoint（须 **chain_off** + 链配置；有 **DATABASE_URL** 时持久化）；**若**上一已索引块 **hash** 与链上不一致 → 默认 **503** **`reorg_suspected`**；**`INDEXER_REORG_AUTO_REWIND_ON_TICK=1`** 且 **有 DB** 时**每 tick 至多一次**自动执行与 **`indexer-reorg-rewind`** 同源回滚并重校验，成功 **200** 可含 **`reorg_auto_rewind`**（可含 **`chain_off_orders_reload`** 摘要），仍失败 → **503** **`reorg_still_suspected_after_auto_rewind`**（局限同 **`indexer-reorg-rewind`**） |
| 重放投影 | `POST` | `/api/v1/internal/indexer-replay` | 按 `event_log` 顺序重放 **`orders_projection`**（须 **chain_off** + **PgPool**）；body 可选 `{"chain_id":<u64>}` |
| reorg 机读回滚 | `POST` | `/api/v1/internal/indexer-reorg-rewind` | **110 Partial**：body **`{"rewind_from_block":<u64>,"force":false}`**（**`force:true`** 跳过链上 hash 不一致校验）；删尾 **`event_log`**/**fee_router**、按链清空 **`orders_projection`** 后 **replay**；**有 chain_off** 且 **`INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND` 非 `0`** 时 replay 后自 **`orders`** 表重载内存 **`orders`/`guide_slot`**（仅内存未落库订单保留），体含 **`chain_off_orders_reload`**；可选 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`**：候选 **已填 escrow ∪ 本链投影 `order_id`**，与 **`orders_projection`** 对齐，体 **`orders_table_projection_sync`**（**`chain_id`**、**`clear_terminal_orphan_escrow_enabled`**、**`candidates_total`**/**`skipped_no_order_row`**/**`cleared_orphan_escrow_pre_funded`**/**`cleared_orphan_escrow_terminal_no_projection`**（**`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**）/**`skipped_no_projection_non_escrowed_with_escrow`** 等；**110 §3.1.3**/**§3.1.4**）；**`limitations`** 见响应（全量 **`orders`** 按链回滚：**`orders` 无 `chain_id`** 时仍为 **Target**，见 **110 §3.1.4**）；**`REWIND_FROM_BLOCK=… ./scripts/indexer-reorg-recovery.sh rewind`** |
| 对账 | `POST` | `/api/v1/internal/indexer-reconcile` | 比对 **`orders`（已填 escrow）↔ `orders_projection`**；body 可选 **`persist`**、**`chain_id`**、**`rpc_escrow_samples`**（1～10，须 RPC+factory）、**`backfill_orders_chain_id`**（**`true`** 时对账 **200** 后按 **`orders_projection`** 回填 **`orders.chain_id`**（仅 **NULL**），**110 §3.1.4**；**200** 可含 **`orders_chain_id_backfill.updated_rows`**）；**`persist:true`** 时写入 **`reconciliation_reports`**（`report_type`=`orders_projection_vs_orders`）；**`orders_chain_scope_rollback_dry_run:true`** 只读计数（**`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**）；**`orders_chain_scope_rollback_execute:true`** 须进程 **ENV `TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1`** 且 **`orders_chain_scope_rollback_confirm`** = **`CONFIRM_DELETE_ORDERS_CHAIN_<chain_id>`** 方执行删除（**`110-ORDERS-CHAIN-SCOPE-EXECUTE`**；**仅**匹配 **`orders.chain_id`**，见 **110 §3.1.4**）；**`event_log_chain_scope_rollback_dry_run:true`** 只读（**`110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN`**）；**`event_log_chain_scope_rollback_execute:true`** 须 **ENV `TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1`** 且 **`CONFIRM_DELETE_EVENT_LOG_CHAIN_<chain_id>`**（**`110-EVENT-LOG-CHAIN-SCOPE-EXECUTE`**；删 **`event_log`**/**`checkpoints_sharded`**/**`fee_router_routed_events`**；**不**改进程内 **`last_block`**，见 **110 §3.1.4**）；**`correction_executor_chain_scope_rollback_dry_run:true`** 只读（**`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN`**；**`correction_log`**/**`executor_executions`** 计数）；**`correction_executor_chain_scope_rollback_execute:true`** 须 **ENV `TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1`** 且 **`CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_<chain_id>`**（**`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE`**）；**`sync_indexer_memory_from_db_checkpoint:true`** 须 **ENV `TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`**（**`110-INDEXER-MEMORY-SYNC-FROM-DB`**）；**`include_chain_tip:true`** 时 **200** 与 **`persist` `summary`** 另含 **`chain_observation`**（**`110-RECONCILE-CHAIN-TIP`**；成功 **`eth_chain_tip_block_number`**/**`finality_n_used`**/**`indexer_finalized_upper_bound`**；RPC 失败 **`ok:false`**+**`error`**，对账仍为 **200**）；**`include_event_log_escrow_coverage:true`** 时另含 **`event_log_escrow_coverage`**（**`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引** **`event_log`**/**`orders_projection`** 计数；失败 **`500`** **`event_log_escrow_coverage_stats_failed`**）；**`200`** 根级含 **`issues_total`**、**`projection_reconcile_clean`**（与 **`stats`** 同源，可用 **`jq .projection_reconcile_clean`**） |

**curl 示例**（在**已登录 API 所在内网主机**上执行；将 `BASE`、`SECRET` 替换为实际值；`SECRET` 仅当 env 已配置时追加头）：

```bash
BASE=http://127.0.0.1:8080
# 可选：export INTERNAL_API_SECRET=...  &&  -H "X-Internal-Api-Secret: $INTERNAL_API_SECRET"
curl -sS -X POST "$BASE/api/v1/internal/indexer-tick" -H "Content-Type: application/json" -d '{}' | jq .
curl -sS -X POST "$BASE/api/v1/internal/indexer-replay" -H "Content-Type: application/json" -d '{}' | jq .
# reorg：将 <B> 换为 indexer-tick 503 响应中的 block_number（或 FORCE_REWIND=1 时运维指定）
# REWIND_FROM_BLOCK=<B> curl -sS -X POST "$BASE/api/v1/internal/indexer-reorg-rewind" -H "Content-Type: application/json" \
#   -d "{\"rewind_from_block\":$REWIND_FROM_BLOCK,\"force\":false}" | jq .
curl -sS -X POST "$BASE/api/v1/internal/indexer-reconcile" -H "Content-Type: application/json" \
  -d '{"persist":true,"rpc_escrow_samples":3,"backfill_orders_chain_id":true}' | jq .
```

**便捷脚本**（项目根，Git Bash / Linux / macOS）：`bash scripts/internal-indexer-ops.sh tick|replay|reconcile|status|probe|recover|evidence|evidence-bundle [--persist] [--rpc N] [--backfill-chain-id] [--chain-scope-dry-run] [--chain-scope-rollback-execute <TOKEN>] [--event-log-scope-dry-run] [--event-log-scope-rollback-execute <TOKEN>] [--correction-executor-scope-dry-run] [--correction-executor-scope-rollback-execute <TOKEN>] [--memory-sync-from-db] [--include-chain-tip] [--include-event-log-escrow-coverage]`（**`--memory-sync-from-db`** 须 API 设 **`TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1`**；**`--include-chain-tip`** → **`include_chain_tip:true`**，**200**/**`persist` `summary`** 可含 **`chain_observation`（`110-RECONCILE-CHAIN-TIP`）**；**`--include-event-log-escrow-coverage`** → **`include_event_log_escrow_coverage:true`**（**`event_log_escrow_coverage`** / **`110-EVENT-LOG-ESCROW-COVERAGE`**）；**`--correction-executor-scope-rollback-execute`** 须 **`TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1`**；见 **.env.example** / **110 §3.1.4**）；Windows：**`.\scripts\internal-indexer-ops.ps1`** 同子命令名（**evidence** / **evidence-bundle** 走 **PowerShell**；其余委托 **bash** 与 **.sh** 一致）；**`status --ops-artifact`** → **`GET …/internal/indexer-status`** + **`traveltrust.ops_artifact.v1`** 封装（**Epic D-03**；**`artifact_version`：`v1`**；**无** POST reconcile；见 **[Epic-D-indexer-ops-readonly-ladder.md](../docs/runbook/Epic-D-indexer-ops-readonly-ladder.md)**）；**`status --live-reconcile --ops-artifact`** → 同上 + **`?live_reconcile=1`**（**Epic D-04**；**`live_orders_projection_reconcile`** 只读；**非** **`persist`**）；**`reconcile --ops-artifact`** → **`POST …/internal/indexer-reconcile`** 空体（**无** **`persist`**，等价 **`persist:false`**）+ **`traveltrust.ops_artifact.v1`**（**Epic D-05**；**禁**与 **`--persist`** 同用；结构示例 **[Epic-D-ops-artifact.v1.example-d05-reconcile.json](../docs/runbook/Epic-D-ops-artifact.v1.example-d05-reconcile.json)**）；**`reconcile --chain-scope-dry-run --ops-artifact`** → 同上 **`POST`**（**`orders_chain_scope_rollback_dry_run:true`**）+ **`artifact_type:dry_run_chain`**（**Epic D-06**；**禁** **`--persist`** / **rollback-execute**；示例 **[Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json](../docs/runbook/Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json)**）；**`status --live-reconcile`**（无 **`--ops-artifact`**）→ 裸 JSON；**`probe`** → 调用 **`scripts/indexer-reconcile-probe.sh`**（Windows：**`.\scripts\indexer-reconcile-probe.ps1`** 委托 **.sh**；**退出码 0** 当且仅当即时对账 **`projection_reconcile_clean`**，须 **jq**）；**`recover <status|hint|replay|reconcile|rewind|all>`** → **`scripts/indexer-reorg-recovery.sh`**（**`rewind`** 须 **`REWIND_FROM_BLOCK`**，可选 **`FORCE_REWIND=1`**）（Windows：**`.\scripts\indexer-reorg-recovery.ps1`**；**reorg** 人工恢复 **curl** 序列，须 **jq**）。默认 `API_BASE_URL=http://127.0.0.1:8080`，若 API 配置了密钥则设 `INTERNAL_API_SECRET` 后脚本自动加头（**`status`** 为 **`GET …/internal/indexer-status`**）。**`evidence`** 子命令等价于 **`scripts/write-indexer-evidence.sh`**（Windows：**`.\scripts\write-indexer-evidence.ps1`** 写 **`evidence/GO_*`**，manifest/**`.zip`** 由 PS 生成；若仅需 **stdout** 合并快照可 **`.\scripts\indexer-public-snapshot.ps1`**；二者均须 **Git Bash** 跑 **`indexer-public-snapshot.sh`**；见 **evidence/README**）。**`evidence-bundle`**：同上并设 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** → 生成 **`indexer_public_snapshot_manifest.json`**（与 **[evidence/README.md](../evidence/README.md)** manifest 字段对齐）及 **`indexer_evidence_bundle_*.zip`**（须 **jq**、**zip**、**sha256sum** 或 **shasum**）。仅 manifest 不要 zip 时可 **`INDEXER_EVIDENCE_WRITE_MANIFEST=1 bash scripts/write-indexer-evidence.sh`**；正式 Gate 前请用 **`INDEXER_EVIDENCE_MANIFEST_GATE`** / **`INDEXER_EVIDENCE_MANIFEST_SIGN_OFF`** 覆盖默认占位。**证据落盘**：`bash scripts/write-indexer-evidence.sh`（或 **`internal-indexer-ops.sh evidence`** / **`.\scripts\write-indexer-evidence.ps1`**）调用 **`indexer-public-snapshot.sh`** 并将 stdout 写入 **`evidence/GO_YYYYMMDD/indexer_public_snapshot_*.json`**（可选 **`EVIDENCE_ROOT`** / **`EVIDENCE_DAY_GO`**）；快照可选 **`SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE=1`** 使 **`internal_indexer_status`** 含即时对账块。

**DB 对账探针（cron / 值班）**：`bash scripts/indexer-reconcile-probe.sh`（Windows：**`.\scripts\indexer-reconcile-probe.ps1`**；同上，直接调亦可）；失败时 **stderr** 含 **`issues_total`** 或 API **`error`**。与 **`GET /metrics`** 互补（metrics 不含 DB 干净度）。**调度示例**（须自行启用并配密钥）：**`ops/monitoring/github-actions-indexer-probe.example.yml`**（复制到 **`.github/workflows/`**，配置 **`INDEXER_PROBE_API_BASE_URL`** / **`INDEXER_PROBE_INTERNAL_SECRET`**）、**`ops/monitoring/k8s-indexer-reconcile-probe.cronjob.example.yaml`**（**CronJob** + **Secret**）；索引见 **`ops/monitoring/README.md`**。

**订单 rating_deadline SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.orders_deadline_ssot_ops_check`**（**TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001**）给出 **`overall`****/**`exit_code_hint`****（0=健康、1=须介入）****/**`degraded`****（链读回退但一致）****/**`checks`**（`governance_chain_read`****/**`fallback_path`****/**`reconcile_probe`****/**`chain_off_mounted`）；与同级 **`overview.orders_deadline_ssot`** 提示字段**同一次** RPC 派生，**不**改公开订单 JSON。值班脚本：**`bash scripts/orders-deadline-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**；见脚本头注释与 [04 §3.4](../docs/spec/04-后端与API.md) Admin 表）。

**`orderRatingReviewWindowDays()` · SEQ12 边界（母表 B-143 · 文档）**：**`TravelTrustGovernor.orderRatingReviewWindowDays()`** **已**由 **SEQ2** **`orders` deadline** bundle 与 **`GET /meta` → `orders.deadline_rating_observability`** / **`reconcile_probe`**、**本段上列** **`orders_deadline_ssot_ops_check`**、及下文 **SEQ3** **`indexer-reconcile`** **`orders_deadline_ssot_reconcile`** 消费。**默认规划态**为 **并列观测**：若未来仅在 **`807` `governance.*`** 增 **独立**观测键，与上列路径 **并行对读**，**不**等于 **单独改写** **公开** **`GET /api/v1/orders* `rating_deadline`**。**升格**为 **orders 唯一真值** 须 **另开实现 TT** 且 **04 / 母表 / 110（若动 compound）/ 本 Runbook** 同批；**fail-closed** 不弱于 **SEQ2**。**互证**：**`TT-B110-SEQ12-GOVERNANCE-GOVERNOR-ORDER-RATING-REVIEW-WINDOW-BOUNDARY-001`**（[**AI 任务卡索引 · 143**](../docs/AI任务卡索引.md)）。

**SEQ13 · 807 并列观测评估（母表 B-144 · 否决）**：**`TT-B110-SEQ13-GOVERNANCE-ORDER-RATING-REVIEW-WINDOW-PARALLEL-META-OBS-001`** 结论 — 再在 **`governance.*`** **重复**暴露 **`orderRatingReviewWindowDays()`** **无** **独立排障/运维** 价值（与上段 **`orders.deadline_*`**/**`orders_deadline_ssot*`** **同源**）；值班仍以 **`orders` meta 节** 与 **`orders-deadline-ssot-ops-check.sh`** 为准。**互证**：[**AI 任务卡索引 · 144**](../docs/AI任务卡索引.md)。

**Governor 视图参数 SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.governor_view_params_ssot_ops_check`**（**TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001**）对 **`TravelTrustGovernor`** **`votingDelayBlocks`/`votingPeriodBlocks`/`quorumNumeratorBps`** 给出与 **`GET /meta` → `governance.governor_view_params_observability`** 同源的 **`overall`****/**`exit_code_hint`****/**`checks`**；**不**改公开订单 JSON。值班脚本：**`bash scripts/governance-governor-view-params-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。

**Governor token / timelock 引用地址 SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.governor_token_timelock_ssot_ops_check`**（**TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001**）对 **`TravelTrustGovernor.token()` / `timelock()`**（**`immutable`** 引用）给出与 **`GET /meta` → `governance.governor_token_timelock_observability`** 同源的 **`overall`****/**`exit_code_hint`****/**`checks`**；**不**改公开 **`GET /api/v1/orders*`**。值班脚本：**`bash scripts/governance-governor-token-timelock-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。

**Timelock delay SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.timelock_delay_ssot_ops_check`**（**TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001**）对 **`GovernanceTimelock.delay()`**（任务卡 **`getDelay()`** 口径映射）给出与 **`GET /meta` → `governance.timelock_delay_observability`** 同源的 **`overall`****/**`exit_code_hint`****/**`checks`**；**不**改公开订单 JSON。值班脚本：**`bash scripts/governance-timelock-delay-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。

**CI / 预发（可选，不绑定默认 Build）**：**TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CI-STAGING-001** — Workflow **`Orders deadline SSOT ops (staging)`**（**`.github/workflows/orders-deadline-ssot-ops-staging.yml`**）：**`workflow_dispatch`** 手工触发 + **`schedule`** 每周一 **07:00 UTC**。**仅当**在仓库 **Actions secrets** 中配置 **`STAGING_ORDERS_DEADLINE_OPS_ADMIN_BEARER_TOKEN`** 与 **`STAGING_ORDERS_DEADLINE_OPS_API_BASE_URL`** 时才真正执行 **`orders-deadline-ssot-ops-check.sh`**；**未配置 token** 时步骤 **成功跳过**（**notice**，exit 0），**`ADMIN_BEARER_TOKEN` 不是** 通用构建或 PR 门禁的必需项。**已配置 token 但未配置 URL** → 步骤 **失败**（防误连 localhost）。失败时日志含脚本 stderr 与 **`overview.orders_deadline_ssot_ops_check`** JSON；成功时 stdout 末行 **`orders-deadline-ssot-ops-check.sh: ok`**。详见 **`scripts/README.md`** 表中本脚本行。**子主线 bundle 文档收口**（完成范围/边界/后续方向）：**`evidence/GO_B110_SEQ2_ORDERS_DEADLINE_BUNDLE_CLOSE.md`**（**`TT-B110-SEQ2-ORDERS-DEADLINE-BUNDLE-CLOSE-001`** · **母表 B-132**）。

**对账语义（读 110 §3.1.3）**：**`indexer-reconcile`** 主对账是 **`orders.escrow_address` 已填** ↔ **`orders_projection`**；**`rpc_escrow_samples`** 为链上 **Funded** 等与 **`orders.status`** 的粗对齐，**不替代**前者。**reorg**：**`POST …/indexer-reorg-rewind`** 为机读 **Partial**（见上表）；**`INDEXER_REORG_AUTO_REWIND_ON_TICK=1`** 为 **tick 内单次**自动回滚（**非**循环全自动）；**`orders`** 表与链上真一致回滚仍为 **Target**；**chain_off** 在 rewind/tick 自动路径上可与当前 **`orders`** 表对齐（**`INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND=0`** 可关）。此前以 **`reorg_suspected`** + **replay/reconcile** 为主。

**`POST …/internal/indexer-reconcile` · orders `rating_deadline` SSOT 并列巡检（母表 B-133 · TT-B110-SEQ3）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`orders_deadline_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.orders_deadline_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.orders_deadline_ssot_reconcile`**（**`B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**（**`exit_code_hint!=0`** 时可拉低复合门禁）。**不**改公开 **`GET /api/v1/orders*`**。互证 **[110 §3.1.3.1](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**、**[04 §3.4](../docs/spec/04-后端与API.md)** **`internal/indexer-reconcile`** 表行。

**`POST …/internal/indexer-reconcile` · Governor 视图参数 SSOT 并列巡检（母表 B-135 · TT-B110-SEQ5）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`governor_view_params_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.governor_view_params_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.governor_view_params_ssot_reconcile`**（**`B110-SEQ5-GOVERNOR-VIEW-PARAMS-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**不**改公开 **`GET /api/v1/orders*`**。

**`POST …/internal/indexer-reconcile` · Governor token / timelock 引用地址 SSOT 并列巡检（母表 B-142 · TT-B110-SEQ11）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`governor_token_timelock_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.governor_token_timelock_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.governor_token_timelock_ssot_reconcile`**（**`B110-SEQ11-GOVERNOR-TOKEN-TIMELOCK-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**`TravelTrustGovernor.token()` / `timelock()`** 为 **`immutable`** 引用地址；**`reconcile_probe`** 为**两次独立 **`eth_call`** 对拍**。**不**改公开 **`GET /api/v1/orders*`**。

**`POST …/internal/indexer-reconcile` · Timelock delay SSOT 并列巡检（母表 B-136 · TT-B110-SEQ6）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`timelock_delay_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.timelock_delay_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.timelock_delay_ssot_reconcile`**（**`B110-SEQ6-TIMELOCK-DELAY-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**不**改公开 **`GET /api/v1/orders*`**。

**`POST …/internal/indexer-reconcile` · Governor proposal threshold SSOT 并列巡检（母表 B-138 · TT-B110-SEQ8）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`governor_proposal_threshold_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.governor_proposal_threshold_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.governor_proposal_threshold_ssot_reconcile`**（**`B110-SEQ8-GOVERNOR-PROPOSAL-THRESHOLD-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**不**改公开 **`GET /api/v1/orders*`**。

**Governor proposal threshold SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.governor_proposal_threshold_ssot_ops_check`**（**TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001**）对 **`TravelTrustGovernor.proposalThresholdVotes()`** 给出与 **`GET /meta` → `governance.governor_proposal_threshold_observability`** 同源的 **`overall`****/**`exit_code_hint`****/**`checks`**；**不**改公开订单 JSON。值班脚本：**`bash scripts/governance-governor-proposal-threshold-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。

**`POST …/internal/indexer-reconcile` · Timelock governor/admin SSOT 并列巡检（母表 B-139 · TT-B110-SEQ9）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`timelock_governor_admin_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.timelock_governor_admin_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.timelock_governor_admin_ssot_reconcile`**（**`B110-SEQ9-TIMELOCK-GOVERNOR-ADMIN-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**`GovernanceTimelock.governor()` / `admin()`** 为 **`address public`**，**运行时可变**；**`reconcile_probe`** 语义为**两次独立 **`eth_call`** 对拍**（**`latest`**），**不**声称与链下配置/历史部署快照恒等。**不**改公开 **`GET /api/v1/orders*`**。

**Timelock governor/admin SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.timelock_governor_admin_ssot_ops_check`**（**TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001**）对 **`GovernanceTimelock.governor()` / `admin()`** 给出与 **`GET /meta` → `governance.timelock_governor_admin_observability`** 同源的 **`overall`****/**`exit_code_hint`****/**`checks`**；**不**改公开订单 JSON。值班脚本：**`bash scripts/governance-timelock-governor-admin-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。

**`POST …/internal/indexer-reconcile` · Governor proposal count SSOT 并列巡检（母表 B-140 · TT-B110-SEQ10）**：成功 **`200`**（及 **`persist:true` `summary`**）另含 **`governor_proposal_count_ssot_ops_check`**，与 **`GET …/admin/observability/overview`** **`overview.governor_proposal_count_ssot_ops_check`** **同源**；**`indexer_reconcile_compound_gate.breakdown.governor_proposal_count_ssot_reconcile`**（**`B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE`**）**AND** 入 **`reconcile_compound_pass`**。**`TravelTrustGovernor.proposalCount()`** 与 **`governance_proposals_projection`** 行数对读；**`drift_leg`** / **`GOVERNANCE_PROPOSAL_COUNT_MAX_INDEXER_LAG`** 见 **母表 B-140**。**不**改公开 **`GET /api/v1/orders*`**。

**Governor proposal count SSOT 运维门禁（Admin 只读，与 internal 正交）**：**`GET /api/v1/admin/observability/overview`** 响应 **`overview.governor_proposal_count_ssot_ops_check`**（**TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001**）与 **`GET /meta` → `governance.governor_proposal_count_observability`** 同源；值班脚本：**`bash scripts/governance-governor-proposal-count-ssot-ops-check.sh`**（须 **`ADMIN_BEARER_TOKEN`**、**jq**）。**`indexer-reconcile-gate`** **`checks_total`**/**`scripts/indexer-reconcile-probe.sh`** **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **B-120** 同锚（现行 **113**，累计 **SEQ3**/**SEQ5**/**SEQ6**/**SEQ8**/**SEQ9**/**SEQ10**/**SEQ11** 机读锚）。

**对账导出 Ed25519 离线验签**（**OpenSSL 3+**）：`bash scripts/verify-reconcile-export-ed25519.sh <export_body_file> <hex_signature> <hex_public_key_32bytes>`；**`--self-test`** 用临时密钥自签自验（CI 与本地冒烟）。**公钥**：**`GET /api/v1/meta`** → **`admin_exports.reconcile_export_ed25519_public_key_hex`**（未配置种子时无此字段）。**签名**：响应头 **`x-traveltrust-reconcile-export-ed25519`**。验签对象为**原始响应体字节**（与 **`RECONCILE_EXPORT_BODY_SHA256_HEADER`** 所覆盖字节一致）。

**Vault 转出投影专项导出落盘（P5-2-C1 · 只读）**：`bash scripts/vault-forwarded-export-fetch.sh`（Windows：**`.\scripts\vault-forwarded-export-fetch.ps1`**）调用 **`GET /api/v1/admin/region-vault/forwarded-events/export`**；**须** **`ADMIN_BEARER_TOKEN`**（与上段 **`ADMIN_BEARER_TOKEN`** 同形，**勿**入库）。可选 **`API_BASE_URL`**、**`VAULT_EXPORT_FORMAT`**（`csv`|`json`）、**`VAULT_EXPORT_CHAIN_ID`**、**`VAULT_EXPORT_LIMIT`**、**`VAULT_EXPORT_OUT_DIR`**。脚本校验 **HTTP 200**、**体非空**、**`sha256(体)`** 与头 **`x-traveltrust-reconcile-export-sha256`** 及侧车 **`.export.sha256`** 一致；若响应含 **`x-traveltrust-reconcile-export-ed25519`** / **`x-traveltrust-reconcile-export-truncated`** 则另写 **`.export.ed25519`** / **`.export.truncated`**。可与 **`verify-reconcile-export-ed25519.sh`** 联做离线验签（对象仍为**原始响应体字节**）。详见 **`scripts/vault-forwarded-export-fetch.sh`** 头注释与 **`scripts/README.md`**。

**公开 / 半公开快照**：`bash scripts/indexer-public-snapshot.sh`（Windows：**`.\scripts\indexer-public-snapshot.ps1`**）合并 **`/health`** 与 **`/meta`**；可**仅当前 shell** 设 **`ADMIN_BEARER_TOKEN=<session>`**（与浏览器 **Bearer** 同源，**勿**入库）以附带 **admin indexer health** 与 **observability overview**；若在**内网**且与 API 一致，可设 **`INTERNAL_API_SECRET`** 以附带 **`GET …/internal/indexer-status`**（**`internal_indexer_status`**，checkpoint / lag / 有 DB 时可含 **`last_stored_orders_projection_reconcile`**）及 **`POST …/internal/indexer-reconcile`**（**`persist:false`**，不落库报告），便于 evidence 与对账即时 **`stats`** 及根级 **`issues_total`/`projection_reconcile_clean`**；可选 **`SNAPSHOT_INTERNAL_RECONCILE_RPC=1～10`** 在 reconcile body 中加 **`rpc_escrow_samples`**（须 RPC+factory；见 **04 / 110**），输出 JSON 含 **`snapshot_options.snapshot_internal_reconcile_rpc`** 记录请求侧取值；可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP=1`** 在 reconcile body 中加 **`include_chain_tip:true`**（**`internal_indexer_reconcile`** 可含 **`chain_observation`（`110-RECONCILE-CHAIN-TIP`）**），**`snapshot_options.snapshot_internal_reconcile_include_chain_tip`** 记 **`"1"`**；可选 **`SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE=1`** 在 reconcile body 中加 **`include_event_log_escrow_coverage:true`**（**`event_log_escrow_coverage`** / **`110-EVENT-LOG-ESCROW-COVERAGE`**；**DB 已索引**范围），**`snapshot_options.snapshot_internal_reconcile_include_event_log_escrow_coverage`** 记 **`"1"`**；可选 **`SNAPSHOT_INTERNAL_SKIP_RECONCILE=1`** 时**不**调用 **`POST …/internal/indexer-reconcile`**，**`internal_indexer_reconcile`** 为 **`snapshot_skipped`**（**`snapshot_options.snapshot_internal_skip_reconcile`** **`"1"`**；**`SNAPSHOT_INTERNAL_RECONCILE_*`** body **不生效**；合并 JSON 内 **`snapshot_internal_reconcile_rpc`**/**`…_include_chain_tip`**/**`…_include_event_log_escrow_coverage`** 强制 **`null`**），仍保留 **`GET …/internal/indexer-status`** 与可选 **`SNAPSHOT_INTERNAL_INDEXER_TICK`**。

**Admin 只读（浏览器工作台，须 admin 会话 + DB）**：`GET /api/v1/admin/indexer/health`；`GET /api/v1/admin/indexer/reconcile-reports`（分页列表）；`GET /api/v1/admin/indexer/reconcile-report/:id`（`:id=latest` 或 UUID）。全量链上扫链与 110 级证据归档仍见 [110-阶段开发链上索引器与事件同步器](../docs/spec/110-阶段开发链上索引器与事件同步器.md)。

**演练 / 工单（internal）**：`POST /api/v1/internal/alerts/test-fire`、`POST /api/v1/internal/incident/open`。有 **DB** 且存在最新 **`orders_projection_vs_orders`** 报告时，响应 **`snapshot`** / **`context`** 可含 **`last_stored_orders_projection_reconcile`**（**`projection_reconcile_clean`**、**`issues_total`** 等，与 **`GET …/admin/indexer/health`** 同源）。契约见 [04 §3.4](../docs/spec/04-后端与API.md)。

**Prometheus（可选）**：`GET /metrics` 暴露 **`traveltrust_indexer_lag_blocks`**、**`traveltrust_indexer_reorg_detected`**、**`traveltrust_authority_degraded_mode`**、**`traveltrust_indexer_checkpoint_*`**、**`traveltrust_indexer_memory_*`**、**`traveltrust_indexer_finality_n`** 等 gauge（进程内快照，与 **`GET /meta`** 同源；**不**含 DB 对账是否干净，对账探针用 **`GET …/internal/indexer-status?live_reconcile=1`** 或 **`POST …/internal/indexer-reconcile`**）。**告警规则示例**（可复制进 Prometheus **`rule_files`**）：仓库 **`ops/monitoring/prometheus-alerts-indexer.example.yml`**（**`TravelTrustIndexerLagHigh`**、**`TravelTrustIndexerReorgSuspected`**、**`TravelTrustAuthorityDegraded`**、**`TravelTrustIndexerReplayRequired`**；按环境调 **`for:`** / 严重级别）。**Grafana 看板草稿**（**Import** JSON）：**`ops/monitoring/grafana-dashboard-traveltrust-indexer.example.json`**（**`uid`**：`traveltrust-indexer-example`；导入后绑定 Prometheus 数据源）；索引见 **`ops/monitoring/README.md`**。

---

## 2.56 合约部署与换链顺序（工程 · 与 Phase 3 / 5.2A / §7.1 换部署同读）

**SSOT（运维）**：本节为仓库内 **「Anvil → 测试网 → 主网」** 与 **换部署核对** 的**唯一完整叙述**；**[04 §四 — 后端设计要点](../docs/spec/04-后端与API.md)**、**[14 §6](../docs/spec/14-合约-API-ABI-前后端对齐.md)** 仅保留 **后端接链 / ABI 与本地联调清单**，**不得**再写第二套「顺序长文」以免漂移。

**硬约束**：**Anvil 本地**（`forge test`、**`forge script`**）跑通 **订单/Escrow 主路径** 与 **已开发的 FeeRouter/RegionVault/治理扩展（Target）** 联调后，再切换 RPC 部署 **测试网**，经 Runbook/多签与 **§7.1** 接线表核对后再 **主网**。**法务定稿不替代**上述工程闭环。

| 权威入口 | 用途 |
|----------|------|
| [contracts/README](../contracts/README.md) | Anvil、`Deploy.s.sol`、ABI 同步 |
| [governance-token/02 §1.3](../docs/spec/governance-token/02-对内技术规格-草案.md) | 验收句式；订单 + 治理币使用流（Target） |
| [82 §三附](../docs/spec/82-治理币-文档总览.md) | 链上交付顺序总表 |
| [07 §二 Phase 3](../docs/spec/07-开发流程与顺序.md)、[07 §五 5.2A](../docs/spec/07-开发流程与顺序.md) | 开发阶段总纲与经济·治理串联 |
| [14 §6](../docs/spec/14-合约-API-ABI-前后端对齐.md) | ABI、本地虚拟链与可测试性（顺序以本节为准） |
| [04 §四](../docs/spec/04-后端与API.md)（运行模式、`CHAIN_RPC_URL`） | 后端接链配置；**部署顺序**仅指回本节 |
| [Governor → Timelock queue/execute 证据（单一入口 · B-100）](../docs/verification-evidence/governor-timelock-queue-execute-evidence.md) | **B-100**：前置条件、**`forge test`** 命令、预期读点、失败分支、与 **B-089** 合约测试 / **B-090** 只读 UI+API 分工；**禁止**与 **`internal/indexer-reconcile`** 的 DB **`…_execute`** 回滚混读。SSOT 测试：**`contracts/test/TravelTrustGovernor.t.sol`** **`test_COMP_B089_governor_full_cycle_propose_vote_queue_execute`**（**B-089**） |
| [B-119 · Governor/Timelock 证入口（指针 · 封口）](../docs/verification-evidence/B-119-governor-timelock-queue-execute-ENTRY.md) | **B-119**：**仅**指向 **B-100** 正文与上表行、**110** Governor 指针；**不**重复命令/前置条件/失败表；与 **B-089**/**B-090**/**B-100** 语义须与 SSOT **逐字同源**（**`TT-B119-GOVERNOR-TIMELOCK-QUEUE-EXECUTE-ENTRY-001`**） |

**Governor / Timelock（链上）**：凡涉及 **`queue`→`execute`** 复现、审计举证、值班验收，**只**打开上表 **B-100** 单一入口 Markdown（或 **B-119** 指针链落回同一正文）；**勿**在 Runbook 其他节重复写第二套 forge 顺序长文（部署总顺序仍以本 §2.56 表内 **contracts/README** / **14 §6** 为准）。

**换部署核对**：新地址须同步 **根 `.env` / 前端 `NEXT_PUBLIC_*`**、**`GET /meta` → `chain.contracts`**，并按 **§12.4** 走 **ABI 同步** 与 **55-S13**。

---

## 2.6 53 发版回滚清单（BB1）

当 **53 阶段**（双边协议、订单/Escrow 流程、抢单/双边确认/评分释放）发版后出现严重问题需回滚时，按以下清单执行；**谁执行、谁批准**与 §2 值班/批准链一致，产物留痕。

| 步骤 | 动作 | 说明 |
|------|------|------|
| 1 | **判定回滚范围** | 仅前端 / 仅 API / 前端+API；是否涉及链上合约（Escrow 释放逻辑） |
| 2 | **前端回滚** | 回退至上一可用版本（CDN/静态托管或容器 tag）；清除浏览器缓存或发版说明提示用户硬刷新；必要时 CORS 与 API 版本兼容 |
| 3 | **API 回滚** | 若 API 已发版：回退至上一稳定二进制或镜像；DB 迁移若有破坏性变更，须按迁移脚本提供**回滚 SQL** 或备份恢复；档期文件 `SCHEDULE_SLOTS_PATH` 若有格式变更须恢复旧格式或兼容读取 |
| 4 | **数据一致性** | 回滚后核对：订单 status/sub_status、档期 slot、聊天消息、评分材料与 04/53 约定一致；若有新字段已写库，旧版 API 是否兼容或只读忽略 |
| 5 | **功能开关（若有）** | 若采用特性开关控制 53 流程，可先关闭开关降级为 52 行为，再择机修 bug 重开 |
| 6 | **留痕** | 回滚决策人、执行人、时间、回滚前/后版本号、DB 或档期文件备份点；入 evidence 或运维台账 |

**与 53 文档**：[53-阶段开发技术文档](../docs/spec/53-阶段开发技术文档.md) §3.9.8 BB1；附录 E 降级展示（API 超时/链维护时只读或提示）仍适用。

---

## 3. 演练记录模板

每次演练填写下表，产物存 **evidence/GO_YYYYMMDD/** 或 **evidence/DR-YYYYQX-0N/**。

| 字段 | 说明 | 示例 |
|------|------|------|
| **演练编号** | DR-YYYYQX-0N | DR-2025Q1-01 |
| **场景** | RPC/Indexer/reorg/执行器卡单/token 冻结/配置误发布/权限误配 | ⑤ token 冻结 |
| **触发阈值（模拟值）** | 与 Runbook 表一致 | 见上表该场景列 |
| **执行人** | 一人 | 值班负责人（已代填；发版时替换） |
| **批准人** | 另一人 | 批准人（已代填；发版时替换） |
| **结果** | 成功/失败 | 成功 |
| **产物** | bundle 文件名、hash、日志片段索引、配置快照 | manifest.json、manifest.sha256 |
| **复盘** | 根因、改进项、下次日期 | 无异常，按预案执行；下次 DR-2025Q2-01 |

---

## 4. 演练历史（按次登记）

| 演练编号 | 日期 | 场景 | 结果 | 产物路径/hash |
|----------|------|------|------|----------------|
| DR-2025Q1-01 | 2025-02-27 | ⑤ token 冻结 | 成功 | evidence/GO_20250227/ |
| DR-2025Q1-02 | 2025-03-01 | ① RPC 大面积不可用 | 成功 | evidence/GO_20250301/（已代填；发版时替换为真实演练产物） |
| DR-2026Q1-01 | 2026-04-07 | ② Indexer 落后 | 成功 | `evidence/GO_20260407/artifacts/runbook-dr-DR-2026Q1-01.md`（同目录 JSON 响应体 + SHA256 见该文件） |

**发版前至少登记一次真实演练**：日期、场景（①～⑤ 任选）、结果、产物路径须填实；未登记不得视为资损 runbook 闭环。

---

## 5. 证据链三条（K 9️⃣）— 证据存储不可用/丢失

- **上传回执**：上传成功必出 receipt（文件哈希、上传者、时间、orderId、服务器签名或链上锚）；存储不可用时重试策略与回执留存写死。
- **访问留痕**：谁查看/导出/分享证据 → 不可篡改审计日志，可导出法务。
- **争议期间保全冻结**：争议开启后证据不可删除/不可覆盖；丢失时的默认裁决与口径见 PDP 与 08。

*工单：W-K-COC。*

---

## 6. Gate 复检周期与法律环境变化（08-2 持续合规机制落点）

- **定期复检周期**：**强制 12 个月**（非「建议」）；具体日期由风控/法务在当年 evidence 或 08-3 变更记录中登记。**复检时必须产出新 evidence bundle 或留痕结论**，否则视为门禁失效。
- **法律/监管环境重大变化**：首发司法域或关键业务地法规变更后 **3 个月内**须完成 Gate 复评并留痕；复评结论入 evidence 或 08-3 变更记录。
- **法律环境突变（紧急迁移）**：若 **30 天内**监管强制禁止业务或要求关停（**首发司法域禁止类似业务、要求 30 天内停止并清算存量**）：① **立即停止新单**（暂停新订单创建与接单）；② **存量订单处理优先级**写死（如：在途争议→按默认裁决或清算规则；已完成未提现→允许提现窗口；具体由法务定稿）；③ **用户资金最终路径**写死（链上 Escrow 内资金按 08-4 释放/退回逻辑，不得进入公司账户）；④ 前端入口可关停，链上合约与资金逻辑按 08-4 口径执行。企业级须有「监管强制禁止时的紧急策略」写死并演练。触发条件（如书面禁令、生效日）由法务定稿写死本节。
- **协议终止与 graceful shutdown**（写死）：若**法律环境突变、稳定币永久冻结、仲裁体系不可恢复、多签失效**等导致协议无法持续运营，须有**协议终止与有序关闭**机制：① **graceful shutdown 流程**（停止新单→存量订单按 08-4 默认裁决或清算规则执行→资金处置披露）；② **存量订单最终路径**写死（自动清算脚本/流程或人工执行清单）；③ **自动清算脚本或等效执行清单**（可脚本化或 Runbook 步骤表）由法务/运维定稿写死本节；④ 与 08-4 第 3 章 fallback 一致。企业级须写死「协议如何终止」与终局机制，不得仅写应对而无终止路径。
- **协议强制关闭（监管最后一问）**（写死）：**在什么情况下协议会被强制关闭？** 须写死：① **至少三种明确触发条件**（如监管勒令关停、多签/仲裁不可恢复且无自然终局、稳定币永久冻结且无法迁移等）— 由法务定稿列于本节或 08-4；② **关闭流程**（谁触发、谁执行、留痕要求）；③ **存量订单终局路径**（按默认裁决/清算/退款规则）；④ **用户资金最终处理逻辑**（链上 Escrow 内资金如何释放/退回）。无此四则无真正终局设计。见 08-4「协议终极边界声明与终局设计」。
- **协议死亡场景**（写死）：若**公司破产、多签成员消失、团队集体退出、域名被封、GitHub 删除**：协议是否**还能自然运行**、用户是否**可完成存量订单**、是否存在**自然终局路径**须写死。若无（当前混合态下多为「否」），须明确「当前为平台型系统、无自然终局」及**依赖的终局路径**（如 30 天 fallback 默认裁决、或法务结论的存量处置）；否则企业级会认定无协议死亡设计。**团队消失推演（🔟）**（写死）：**若公司消失，协议如何自然终局？** 须写死：多签失联+仲裁员退出+公司破产+服务器下线时—**仲裁还能运行吗、Escrow 是否自动终局、存量订单是否自动清算、用户是否有自助路径**；若**必须依赖运营团队**=你不是协议、是 **SaaS**。**企业级须至少演练一次「团队消失」推演**（table-top 或 DR）；无实战推演=理论终局，须在本节或 08-4 注明是否已演练及结论。**团队消失后的自然终局证明（企业级深水区）**（写死）：**无运营团队情况下的自然终局能力**须写死—前端是否还能用、Escrow 是否还能释放、仲裁是否还能进行、参数是否还能执行；若存在**自动 fallback（如 30 天后默认裁决）、用户自助提现路径、时间触发终结逻辑**则具备自然终局能力；否则须明确「当前无、依赖运营」并落 08-4 四块深水区证明。可与团队消失推演合并为可出具的**自然终局证明**落点。
- **季度 DR 演练强制**（写死）：每季度必须至少一次 DR/table-top 演练（可选 Runbook §1 场景之一），并登记演练编号与复盘；无演练 = 无能力。年度复检（12 个月）必须能出示当年各季度演练记录与产物，否则视为门禁能力不足。**10× 争议/规模推演**（写死）：若存在 10× 争议或规模推演，**是否实际做过 table-top 演练**、**是否有演练编号**、**是否有复盘报告**须写死；否则属「纸面机制」。演练编号可沿用 DR-YYYYQX-0N 或单独编号，产物入 evidence。
- **08-3 key 变更**：若与该 Gate 相关，须同步 08-4 并评估是否重新过该 Gate（见 08-2 W-PDP-SSOT-CONSISTENCY）。
- **代币/合约升级**：若结算代币（如 USDC）升级合约或黑名单逻辑变更，是否**重新过门**由风控/法务在本节或 08-2 写死；建议触发 Gate-2/Gate-4 重评。
- **治理/极端风险补件（50-O-80-4 占位）**：Emergency Mode 行为矩阵、Admin 权限最小化矩阵、GDPR 删除策略等文档与可配置项，待 80 Phase 3 或法务定稿后落本节或 08-4；当前为占位，发版前按 [50-阶段 §六](../docs/spec/50-阶段-后续优化与开发清单.md) 50-O-80-4 四项交付物后补。

---

## 7. 紧急多签可豁免场景（08-3 权限层级落点）

**仅以下场景**可豁免 paramFreezeDays、pauseCooldown（仍须多签门限，不可改法务口径 key）：
- Pause（安全/黑天鹅事件）
- OFAC/监管执行（如冻结、allowlist 变更）
- 安全事件（密钥泄露、链异常等 Runbook §1 所列）

**紧急多签须受限于可验证触发条件**（写死）：上述「紧急」**须有写死的触发阈值或可验证条件**（如 Runbook §1 触发阈值表、链上事件、监管书面请求等）；**无写死触发条件 = 紧急 = 无限权**，企业级审计必问。触发条件表由风控/法务定稿写死本节；每次紧急动作须**事后留痕**（evidence 或 08-3 变更记录）；无「超级多签」或单把终极钥匙。**紧急 override 是否存在**（写死）：若存在**超级暂停、紧急升级、强制资金迁移**等，须写死**触发条件**、**是否公开**、**是否可审计**；否则不得声称无终极控制路径。

**多签权限矩阵**（写死）：可改「运营参数」（Pause 白名单、allowlist、冷却期、证据保留期等）与**不可改「资金终态逻辑」**（Escrow 释放条件、单笔资金流向）须在一页表或本节写死；见 08-4 第 2 章。若 Proxy/Implementation/admin 存在升级或 override 路径，须在本节或 01/02 写死边界。**控制权绝对封顶证明**（写死）：**是否存在任何单点或组合路径可改变资金释放规则？** 答案须为**绝对 NO**，或写死唯一例外并封顶。须写死：**无超级管理员**、**无终极 override 改资金终态**、**多签不可替换为单签**、**Timelock 不可缩短至 0**、**紧急多签不可改资金释放逻辑**；与 08-4「协议终极边界声明与终局设计」、01/02 一致。**紧急 override 四问**（写死）：若存在任何 emergency override，须在本节或 08-4 写死—**谁触发**、**是否链上可见**、**是否需二次确认**、**是否已写入 08-4**；**是否存在 timelock bypass、admin slot 可替换**须答 NO 或写死边界。**终极控制路径图**（企业级必补）：须能画出一页图（触发人→链上/链下动作→是否改资金终态）；画不出=风险，由架构/法务定稿存本节引用或 evidence。**不可逆结构图证明**（企业级深水区）：须在 01/02 或本节提供**一页不可逆结构图**（或等价文档）证明**无路径可改变资金流向**，或唯一例外写死并封顶；与监管穿透模拟（能否阻止某用户提现、OFAC 执行与 Immutable Core 边界）一致。无此证明=审计会要求补齐。落 08-4 监管穿透模拟、四块深水区证明。**Escrow 数学封顶（链上层）**（写死）：须在 01/02 或本节写死—Escrow 是否存在 **admin override、upgrade hook、emergency withdraw、delegatecall 可换逻辑**；**哪些逻辑不可升级、哪些升级须 timelock、哪些须 N-of-M 多签+timelock、是否允许改变历史订单逻辑**；否则审计结论=governance-controlled，非 immutable settlement。

**裁决与执行器双人审批步骤表（17 条 #11 落点，写死）**：裁决提交后、执行器代发 executeResolution 前，须完成双人审批并落审计；缺一不可执行。

| 步骤 | 角色 | 动作 | 留痕 |
|------|------|------|------|
| 1 | 仲裁员（发起人） | 提交裁决（refund_ratio、slash_guide 等）；系统写入 dispute 表、生成 resolutionId、decisionHash | 审计表：arbitrator_id、resolution_id、decision_hash、created_at |
| 2 | 复核人（第二人） | 复核裁决内容与金额；批准或驳回 | 审计表：approver_id、approved_at、approval_result（approve/reject）、input_hash |
| 3 | 执行器 | 仅当步骤 1+2 均完成且结果为批准时，消费 outbox、代发 executeResolution | 审计表：resolution_id、tx_hash、executed_at；08-3 单笔/单日上限校验 |
| 4 | 超限/异常 | 若单笔或单日额度超 08-3 上限，拒绝执行并告警；须批准人升级审批（Runbook §1 ④） | 双人审批日志、08-3 变更记录或工单 |

**写死规则**：复核人不得与发起人为同一人；**签字须含 arbiterRoleSnapshotHash（或等效角色快照），须 A+B 双人审批后执行**；审批结果与 input_hash 须可追溯；执行器不裁决议题，只执行已双人审批的 resolutionType 与 amounts。与 01 §7、02 §六、17 条 #11 一致。

### 7.1 仲裁费、向导质押罚没与 FeeRouter / RegionVault（正交路径 · 与 84 §1.1.1 对齐）

**目的**：满足 [08-4 对外口径包](../docs/spec/08-4-对外口径包.md)「收益流分列」与 [84-第一阶段10国Country-Pool发行参数总表](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md) **§1.1.1**；避免将 **仲裁费 / slash** 误并入 **FeeRouter 45/55** 叙事；**RegionVault** 承接 **FeeRouter `countryBucket`** 后的**国家桶链上再转出**（与 Escrow 用户本金路径正交）。

| 资金流 | 是否计入 84「可分配平台费用 100%」基数 | 默认归宿（草案 · 财务/法务可细化科目） |
|--------|----------------------------------------|----------------------------------------|
| **订单可分配手续费**（进入 FeeRouter 的稳定币） | **是** | [83](../docs/spec/83-区域治理与收益分配-协议白皮书.md) / **84** 第一层 **45% / 55%** |
| **链上 gas（L1/L2）** | **否** | 各笔交易发送方自担；**不扣减** 84 基数 |
| **争议仲裁费 / 仲裁运营成本** | **否** | **运营账户 / 合规与仲裁成本池**；与触发表 §1 ⑤「仲裁费：运营账户与合规成本」一致 |
| **`Staking.slash` 罚没**（向导 USDC 等质押品，见 [81](../docs/spec/81-经济模型-向导质押与订单押金.md)、[14](../docs/spec/14-合约-API-ABI-前后端对齐.md)） | **否** | **协议金库 / 运营处置池**（具体划转与披露与 **81**、财务定稿一致）；**不**进入 45/55 费用路由 |
| **TTG / RegionShare Claim** | **否** | 依 **83** Snapshot/Claim；与 Escrow **用户本金**隔离 |

**工程接线（Escrow → FeeRouter · 与 14 §1.1、07 §五 5.2A）**（发版/换部署须核对）：

| 检查项 | 说明 |
|--------|------|
| **同址三处** | `Escrow.init` / `createEscrow` 的 **`platformFeeRecipient`**、后端 **`FEE_ROUTER_ADDRESS`**（indexer-tick / `GET /meta`）、前端 **`NEXT_PUBLIC_FEE_ROUTER_ADDRESS`**（`frontend/lib/feeRouterEnv.ts`）须为 **同一 FeeRouter 部署地址**（EIP-55 校验和一致）。 |
| **资金流** | `release` / 裁决路径将平台费 **ERC20.transfer** 至 FeeRouter；**owner** 对累积余额调 **`distribute(token, amount)`** 后四方拆分并 emit **`PlatformFeeRouted`**；索引投影见 **110** §3.1.1、`fee_router_routed_events`。 |
| **禁止** | 不得将 **仲裁费、Staking.slash** 等并入上表「订单可分配手续费」路径（见 **84 §1.1.1**）。 |

**工程接线（FeeRouter → RegionVault · 与 14 §1.1.1、110 §3.1.1）**（发版/换部署须核对）：

| 检查项 | 说明 |
|--------|------|
| **后端 env** | **`REGION_VAULT_ADDRESS`**：与部署的 **RegionVault** 合约一致；设后 **`internal/indexer-tick`** 合并拉取 **`RegionVaultForwarded`** 并写入 DB **`region_vault_forwarded_events`**（须 **`DATABASE_URL`**）。见根目录 **`.env.example`**。 |
| **`GET /meta`** | **`chain.contracts.region_vault_address`** 与上项同源；前端治理页 **`/governance/vault-forwards`** 只读展示接线（与 **`GET /api/v1/governance/vault-forwards`** 对齐）。 |
| **观测** | **`region_vault_forwarded_events`** **无**独立 Prometheus 计数 gauge；索引进度与 lag 仍看 **`/metrics`** 既有 indexer gauge + **`GET /meta.indexer`**；行级审计用 **admin** **`GET /api/v1/admin/region-vault/forwarded-events`** 或 DB 查询。 |
| **reorg** | **`event_log` 链域回滚**路径已含 **`region_vault_forwarded_events`** 删尾（与 **fee_router_routed_events** 同族）；见 **internal** 响应键 **`region_vault_forwarded_events_rows`**。 |

#### 7.1.1 演练（可复制）：`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`（根级 **country_pool** 链上主读 · **TT-RUNBOOK-COUNTRY-POOL-DRILL-001**）

**契约 SSOT**（字段语义）：[04 §3.4 `GET …/governance/pool`](../docs/spec/04-后端与API.md) 大表行、**B110-SSOT-06/07**；与 **`GOVERNANCE_POOL_BALANCE_CHAIN_SSOT`**（**`pool_balance`**）**独立门闸**。本节强调：**不得**将 **`chain_alignment_hint.ssot_parallel_chain_snapshot.region_vault_erc20_balance_read`**（并行观测腿）或 **`GET …/governance/fee-pool-aggregates`**（**Σ 投影**）当作根级 **`country_pool`** 瞬时 **`balanceOf`** SSOT。

**前置**（开闸后仍须全部满足，否则 API **不**写根级 **`country_pool*`** 链上主读）：进程已挂载 **`ChainConfig` + 可用 RPC**；**`REGION_VAULT_ADDRESS`**（与 **`GET /meta` → `chain.contracts.region_vault_address`** 同源）；**`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**（与 **FeeRouter `pool_balance`** SSOT 代币同源）。

**A · 开启（预发 / 生产须书面批准后再做）**

1. 在编排 env / systemd `Environment=` 增加：  
   `GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT=1`  
   （同义：`true` / `on` / `yes`，大小写不敏感。）
2. **重启 API**（或等价使进程重读环境变量）。
3. **验证点（可复制）**：
   ```bash
   curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/governance/pool" \
     | jq '{country_pool,country_pool_data_source,country_pool_is_chain_ssot,data_source,is_chain_ssot}'
   ```
   - **成功（闸开且 RPC + 锚点读成功）**：`country_pool_data_source == "chain_read"` 且 `country_pool_is_chain_ssot == true`，且 **`country_pool`** 为规范 **全宽 `0x` u256 hex**（**禁止**用 **`0`** 或无 RPC 支撑值冒充；失败时根级**不出现**上述主读三键或按 **04** 降级，**不**用 **Σ** 顶替）。
   - **边界**：同响应 **`chain_alignment_hint.ssot_parallel_chain_snapshot`** 仍为 **B110-SSOT-03 观测**（嵌套体 **`is_chain_ssot`** 为 **false**），**不得**与根级 **`country_pool*`** 混读。
4. **Σ 路径（反证 fee-pool-aggregates 非主读）**：
   ```bash
   curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/governance/fee-pool-aggregates" \
     | jq '{data_source,anchor,has_country_pool_ssot: (.country_pool != null), has_country_pool_flag: (.country_pool_is_chain_ssot != null)}'
   ```
   **期望**：`data_source == "projection"`，**`anchor`** 含 **B-084** 语义；**`has_country_pool_ssot` / `has_country_pool_flag` 均为 `false`**（响应体**无**根级 **`country_pool*`** 主读键）。

**B · 回滚（单动作）**

1. 取消或置非启用：  
   `GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT=0`  
   （或 `unset` / `false` / `off` / `no`。）
2. **重启 API**。
3. **验证点**：再次执行 **A.3** 的 `jq`；**`country_pool_is_chain_ssot` 不得为 `true`**，**`country_pool_data_source` 不得为 `chain_read`**（键缺失视为关闸成功）。

**证据留痕（可选）**：开关前后各保存一份 **脱敏** 的 **`governance/pool`** JSON 片段（及可选 **fee-pool-aggregates** `data_source` 行）入 **`evidence/GO_YYYYMMDD/artifacts/`**，与工单 / manifest 互指；详见 **[evidence/README · 治理池根级链上 SSOT 演练留痕](../evidence/README.md#governance-pool-country-pool-ssot-drill)**。

**变更**：改任一行归宿或「是否计入基数」→ 同步 **84 §1.1.1**、**08-4**、**82 §六** 纪要，并按 [07 §二 2.4](../docs/spec/07-开发流程与顺序.md) 跑治理联动脚本（若涉 83/84 百分数）。

#### 7.1.2 演练（可复制）：`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`（根级 **treasury_erc20_pool** 链上主读 · **TT-RUNBOOK-TREASURY-ERC20-POOL-DRILL-007**）

**契约 SSOT**（字段语义）：[04 §3.4 `GET …/governance/pool`](../docs/spec/04-后端与API.md) 根级 **`treasury_erc20_pool*`**；与 **`GOVERNANCE_POOL_BALANCE_CHAIN_SSOT`**（**`pool_balance`**）、**`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`**（**`country_pool*`**）、**`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`**（**`treasury_pool`·原生 Wei**）**四门独立**。链上锚：**`ERC20.balanceOf(GovernanceTreasury)`**，**`token_address`** = **`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（**不必**与 **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** 同址）。本节强调：**不得**将 **`chain_alignment_hint.ssot_parallel_chain_snapshot`** 内并行观测腿当作根级 **`treasury_erc20_pool*`** 主读；**`GET …/governance/fee-pool-aggregates`**（**Σ 投影**）**永不**含根级 **`treasury_erc20_pool*`**，**不得**与主读混名或并入 Σ。

**前置**（开闸后仍须全部满足，否则 API **不**写根级 **`treasury_erc20_pool*`** 链上主读）：进程已挂载 **`ChainConfig` + 可用 RPC**；**`GOVERNANCE_TREASURY_ADDRESS`**（与 **`GET /meta` → 链上金库地址配置** 同源，见根目录 **`.env.example`**）；**`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（非空、规范合约地址）。

**A · 开启（预发 / 生产须书面批准后再做）**

1. 在编排 env / systemd `Environment=` 增加：  
   `GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT=1`  
   （同义：`true` / `on` / `yes`，大小写不敏感。）
2. **重启 API**（或等价使进程重读环境变量）。
3. **验证点（可复制）——根级三键出现**：
   ```bash
   curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/governance/pool" \
     | jq '{treasury_erc20_pool,treasury_erc20_pool_data_source,treasury_erc20_pool_is_chain_ssot}'
   ```
   - **成功（闸开且 RPC + 锚点读成功）**：`treasury_erc20_pool_data_source == "chain_read"` 且 `treasury_erc20_pool_is_chain_ssot == true`，且 **`treasury_erc20_pool`** 为规范 **全宽 `0x` u256 hex**（**禁止**用 **`0`** 或无 RPC 支撑值冒充；失败时根级**不出现**上述主读三键或按 **04** 降级，**不**用 **Σ** 顶替）。
   - **边界**：**`chain_alignment_hint`** 内并行快照仍为 **B110-SSOT-03 观测**，**不得**与根级 **`treasury_erc20_pool*`** 混读。
4. **验证点（可复制）——Σ 永不出现该三键（与闸开/关无关）**：
   ```bash
   curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/governance/fee-pool-aggregates" \
     | jq '{data_source,anchor,has_treasury_erc20_pool: (.treasury_erc20_pool != null), has_treasury_erc20_ds: (.treasury_erc20_pool_data_source != null), has_treasury_erc20_flag: (.treasury_erc20_pool_is_chain_ssot != null)}'
   ```
   **期望**：**`has_treasury_erc20_pool` / `has_treasury_erc20_ds` / `has_treasury_erc20_flag` 均为 `false`**（响应体根级**无** **`treasury_erc20_pool`**、**`treasury_erc20_pool_data_source`**、**`treasury_erc20_pool_is_chain_ssot`**）；**`data_source`** 为 **`projection`** 或（无 DB 时）**`placeholder`**，均**不得**因本闸在 Σ 体上**新增**上述键。可与 **A.3** 同一轮执行，用于证明 **「pool 根级可出现 `treasury_erc20_pool*`，Σ 仍永不出现」**。

**B · 回滚（单动作）**

1. 取消或置非启用：  
   `GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT=0`  
   （或 `unset` / `false` / `off` / `no`。）
2. **重启 API**。
3. **验证点**：再次执行 **A.3** 的 `jq`；**`treasury_erc20_pool_is_chain_ssot` 不得为 `true`**，**`treasury_erc20_pool_data_source` 不得为 `chain_read`**（键缺失视为关闸成功、即根级主读**消失**）。
4. 再次执行 **A.4** 的 `jq`；**仍须**满足 **A.4** 的三项 **`false`**（回滚后 Σ **仍**不得出现根级 **`treasury_erc20_pool*`**）。

**证据留痕（可选）**：开关前后各保存一份 **脱敏** 的 **`governance/pool`** 片段（及可选 **fee-pool-aggregates** 整段或 `jq` 输出）入 **`evidence/GO_YYYYMMDD/artifacts/`**，与工单 / manifest 互指；详见 **[evidence/README · treasury_erc20_pool SSOT 演练留痕](../evidence/README.md#governance-pool-treasury-erc20-ssot-drill)**。

#### 7.1.3 验证（可复制）：订单详情 **`escrow_chain_state*`** / **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`** 链上主读（**TT-ESCROW-SSOT-RUNBOOK-003** · **TT-ESCROW-SSOT-RUNBOOK-RELEASE-006** · **TT-ESCROW-SSOT-RUNBOOK-DISPUTE-009** · **TT-ESCROW-SSOT-RUNBOOK-AMOUNT-012**）

**契约 SSOT**：[04 §3.4 **`GET …/api/v1/orders/:id`**](../docs/spec/04-后端与API.md) 响应根级可选 **`escrow_chain_state`**、**`escrow_chain_state_data_source`**（**`chain_read`**）、**`escrow_chain_state_is_chain_ssot`**（**`true`**）；与 **`order.state` / `order.status`**（**投影/DB**）**不得混读或互相替代**。另可选根级 **`escrow_release_state`**、**`escrow_release_state_data_source`**（**`chain_read`**）、**`escrow_release_state_is_chain_ssot`**（**`true`**）：**仅当**链上 **`Escrow.status()`** 为 **放款类终态** **Completed / Refunded / Resolved / PartiallyRefunded / Slashed**（与 **`internal::terminal_escrow_label_for_reconcile`** 同源终态集）时出现；**`Created` / `Funded` / `Disputed` / `None`** 等**非**上述终态时**不得**出现 **`escrow_release_state*`**（**不**写 **`false`**、**`pending`**）；**不得**由订单/支付投影字段推导。另可选根级 **`escrow_dispute_state`**、**`escrow_dispute_state_data_source`**（**`chain_read`**）、**`escrow_dispute_state_is_chain_ssot`**（**`true`**）：**仅当**链上 **`Escrow.status()`** 处于 **争议生命周期** **`Disputed` / `Resolved`** 时出现（**TT-ESCROW-SSOT-DISPUTE-STATE-008**）；**无争议**（**`Created` / `Funded` / `Completed` / `Refunded` / `PartiallyRefunded` / `Slashed` / `None`** 等）时**不得**出现 **`escrow_dispute_state*`**；**不得**由订单状态或人工裁决记录推导。另可选根级 **`escrow_locked_amount`**、**`escrow_locked_amount_data_source`**（**`chain_read`**）、**`escrow_locked_amount_is_chain_ssot`**（**`true`**）：**仅当**链上 **`factory.escrowOf(orderId)`** 指向**有效** Escrow 合约、**`Escrow.token()`** 为**非零**地址且 **`ERC20.balanceOf(escrow)`** **> 0** 时出现（**TT-ESCROW-SSOT-AMOUNT-011**）；**无 Escrow / token 为零 / 余额 0 / RPC 失败** 时**不得**出现（**不**写 **0**）；**不得**由订单金额或 DB 推导。链上读路径（状态）：**`RPC_URL` + `ESCROW_FACTORY_ADDRESS`** → **`escrowOf(orderId)`** → **`Escrow.status()`**（**`chain::get_escrow_status`**）。**`GET …/api/v1/orders` 列表**及 **未挂载 `chain_off` 时的占位列表/占位详情** 响应根级**不得**出现 **`escrow_chain_state*`**、**`escrow_release_state*`**、**`escrow_dispute_state*`**、**`escrow_locked_amount*`**（与 **TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002** 单测语义一致）。

**前置（详情出现 `escrow_chain_state*`）**：进程已配置 **`ChainConfig`**（**`RPC_URL`**、**`ESCROW_FACTORY_ADDRESS`** 等）；API **已挂载 `chain_off`** 且订单存在于内存/DB；调用方 **`Authorization: Bearer bearer_<uuid>`** 之 **`<uuid>`** 须为该单 **tourist_id** 或 **guide_id**（与 **SEED_TEST_ACCOUNTS** / 会话一致）；链上 **`get_escrow_status` 返回 `Some`**（若返回 **`None`** 或 RPC 失败，详情**不出现** **`escrow_chain_state*`** 等状态三键，属契约行为，**不**用 **`order.state`** 回填）。**`escrow_locked_amount*`** 由 **`escrowOf` + `token()` + `balanceOf(escrow)`** 独立拉取，**可与** **`escrow_chain_state*`** 缺省**并存**（例如仅验证锁仓余额分支时可选用 **`Funded`** 且链上仍有余额之单）。

**A · 详情链读成功（根级 `escrow_chain_state*`；`escrow_release_state*` 视放款终态；`escrow_dispute_state*` 视争议生命周期；`escrow_locked_amount*` 视链上锁仓余额）**

```bash
ORDER_ID="<订单 UUID>"
PARTICIPANT_UUID="<该单 tourist_id 或 guide_id>"
curl -sS -H "Authorization: Bearer bearer_${PARTICIPANT_UUID}" \
  "${API_BASE:-http://127.0.0.1:8080}/api/v1/orders/${ORDER_ID}" \
  | jq '{escrow_chain_state,escrow_chain_state_data_source,escrow_chain_state_is_chain_ssot,escrow_release_state,escrow_release_state_data_source,escrow_release_state_is_chain_ssot,escrow_dispute_state,escrow_dispute_state_data_source,escrow_dispute_state_is_chain_ssot,escrow_locked_amount,escrow_locked_amount_data_source,escrow_locked_amount_is_chain_ssot,order_state: .order.state}'
```

**期望**：**`escrow_chain_state_data_source` == `"chain_read"`** 且 **`escrow_chain_state_is_chain_ssot` == `true`**，**`escrow_chain_state`** 为与链上一致的枚举字符串（**非**空串占位）。**当且仅当** **`escrow_chain_state`** 为 **`Completed` / `Refunded` / `Resolved` / `PartiallyRefunded` / `Slashed`** 之一时，须同时满足：**`escrow_release_state_data_source` == `"chain_read"`**、**`escrow_release_state_is_chain_ssot` == `true`**，**`escrow_release_state`** 与该终态字符串**一致**。**当** **`escrow_chain_state`** 为 **`Funded` / `Disputed` / `Created` / `None`** 等**未**进入放款终态时：**`escrow_release_state` / `escrow_release_state_data_source` / `escrow_release_state_is_chain_ssot`** 须均为 **`null`**。**当且仅当** **`escrow_chain_state`** 为 **`Disputed` / `Resolved`** 时，须同时满足：**`escrow_dispute_state_data_source` == `"chain_read"`**、**`escrow_dispute_state_is_chain_ssot` == `true`**，**`escrow_dispute_state`** 与 **`escrow_chain_state`** **一致**（**`Disputed`** 或 **`Resolved`**）。**无争议**（**其它**链上态）时：**`escrow_dispute_state` / `escrow_dispute_state_data_source` / `escrow_dispute_state_is_chain_ssot`** 须均为 **`null`**。**当且仅当**链上 **Escrow 有效**、**`token()` 非零**、**`balanceOf(escrow) > 0`** 时：**`escrow_locked_amount_data_source` == `"chain_read"`**、**`escrow_locked_amount_is_chain_ssot` == `true`**，**`escrow_locked_amount`** 为 **规范 `0x` + 64 位 uint256 hex** 且 **非全零**（手检可与 **`cast call`** 同源 **`balanceOf`** 比对）；**否则**（含余额 **0**）**`escrow_locked_amount` / `escrow_locked_amount_data_source` / `escrow_locked_amount_is_chain_ssot`** 须均为 **`null`**。

**B · 列表与占位路径（根级不得出现 `escrow_chain_state*`、`escrow_release_state*`、`escrow_dispute_state*`、`escrow_locked_amount*`）**

```bash
PARTICIPANT_UUID="<已登录用户 UUID>"
# B1：**chain_off 已挂载**时的订单列表
curl -sS -H "Authorization: Bearer bearer_${PARTICIPANT_UUID}" \
  "${API_BASE:-http://127.0.0.1:8080}/api/v1/orders?limit=5" \
  | jq '{has_escrow_state: (.escrow_chain_state != null), has_escrow_ds: (.escrow_chain_state_data_source != null), has_escrow_flag: (.escrow_chain_state_is_chain_ssot != null), has_rel_state: (.escrow_release_state != null), has_rel_ds: (.escrow_release_state_data_source != null), has_rel_flag: (.escrow_release_state_is_chain_ssot != null), has_disp_state: (.escrow_dispute_state != null), has_disp_ds: (.escrow_dispute_state_data_source != null), has_disp_flag: (.escrow_dispute_state_is_chain_ssot != null), has_lock_amt: (.escrow_locked_amount != null), has_lock_ds: (.escrow_locked_amount_data_source != null), has_lock_flag: (.escrow_locked_amount_is_chain_ssot != null)}'

# B2：**未挂载 chain_off** 时的占位列表（无需 Bearer）
curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/orders" \
  | jq '{has_escrow_state: (.escrow_chain_state != null), has_escrow_ds: (.escrow_chain_state_data_source != null), has_escrow_flag: (.escrow_chain_state_is_chain_ssot != null), has_rel_state: (.escrow_release_state != null), has_rel_ds: (.escrow_release_state_data_source != null), has_rel_flag: (.escrow_release_state_is_chain_ssot != null), has_disp_state: (.escrow_dispute_state != null), has_disp_ds: (.escrow_dispute_state_data_source != null), has_disp_flag: (.escrow_dispute_state_is_chain_ssot != null), has_lock_amt: (.escrow_locked_amount != null), has_lock_ds: (.escrow_locked_amount_data_source != null), has_lock_flag: (.escrow_locked_amount_is_chain_ssot != null)}'

# B3：**未挂载 chain_off** 时的占位详情（示例 UUID，可替换）
curl -sS "${API_BASE:-http://127.0.0.1:8080}/api/v1/orders/00000000-0000-4000-8000-000000000001" \
  | jq '{has_escrow_state: (.escrow_chain_state != null), has_escrow_ds: (.escrow_chain_state_data_source != null), has_escrow_flag: (.escrow_chain_state_is_chain_ssot != null), has_rel_state: (.escrow_release_state != null), has_rel_ds: (.escrow_release_state_data_source != null), has_rel_flag: (.escrow_release_state_is_chain_ssot != null), has_disp_state: (.escrow_dispute_state != null), has_disp_ds: (.escrow_dispute_state_data_source != null), has_disp_flag: (.escrow_dispute_state_is_chain_ssot != null), has_lock_amt: (.escrow_locked_amount != null), has_lock_ds: (.escrow_locked_amount_data_source != null), has_lock_flag: (.escrow_locked_amount_is_chain_ssot != null)}'
```

**期望**：**B1～B3** 中 **`has_escrow_*`、`has_rel_*`、`has_disp_*`、`has_lock_*` 共十二项均为 `false`**。

**证据留痕（可选）**：**A** 成功体（脱敏 **`API_BASE`**、**`Bearer`**）→ **`orders-detail-escrow-chain-state-ssot-ok.json`**（可含 **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`** 样例）；另可选 **`orders-detail-escrow-release-state-ssot-terminal-only.json`**（五放款终态之一）、**`orders-detail-escrow-dispute-state-ssot-disputed-or-resolved.json`**（**`Disputed`** 或 **`Resolved`**）、**`orders-detail-escrow-locked-amount-ssot-positive-balance.json`**（**`balanceOf(escrow) > 0`**）；**B** 的 **`jq` 输出** → **`orders-list-no-escrow-order-ssot-root-keys.json`**（列表 + 占位，证明根级**无** **`escrow_chain_state*`** / **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`**）；与 **manifest** 互指 — 详见 **[evidence/README · 订单详情 escrow 链上 SSOT](../evidence/README.md#orders-detail-escrow-chain-state-ssot-drill)**。

---

## 8. 仲裁员最低容量与降级策略（08-3 minArbitratorCount、08-4 第 7 章落点）

- **minArbitratorCount**（定稿由运营确认）：**3**。低于 3 人时：**自动暂停新争议受理**；存量争议按既有 SLA 或延长处理。
- **单一地区仲裁员占比上限**（写死）：若**单一地区/司法域仲裁员占比 > 80%**，告警并**暂停该地区新争议**或全平台暂停新争议（策略由运营定稿写死本节）；防地域单点。
- **仲裁员实质控制防护**（写死）：**仲裁员利益来源披露**（与争议方的利益关系、是否来自同一经济利益群体）；**收入结构透明度**（报酬不与单案结果挂钩）；**仲裁员报酬结构**须为**固定薪酬或与裁决方向/争议数量无关**（写死于本节或治理文档，与 08-4 一致），否则存在激励制造争议风险；**外部/独立仲裁员引入比例**（由运营或治理定稿写死本节）。避免 3 人全部来自向导侧或平台长期合作方等结构性控制。**仲裁员联盟/串谋防护**（写死）：**仲裁员之间是否可能串谋**须有制度缓解；**案件分配随机性证明**（如随机分配、轮询、可验证随机）须写死；**是否公开每个仲裁员历史偏差指数**（匿名化或脱敏）须写死；**是否存在外部审计抽查机制**须写死（由运营/法务定稿）。否则企业级会问「仲裁员是否可能形成联盟」。**仲裁员集体偏差**（写死）：若**80% 仲裁员倾向某类人或某城市**（非单人舞弊、乃群体结构偏差），须有**偏差指数阈值**触发**自动冻结裁决或暂停争议或强制复核**；由风控/运营定稿写死本节，否则集体偏向无制衡。**连续偏向阈值**（写死）：若**连续 N 单同向**（如长期偏向游客）须触发**自动审查**；**集体停机机制**（写死）：当集体偏差超过阈值时是否**暂停新争议受理或全平台仲裁暂停**须写死；**外部独立复核机制**（写死）：是否存在**外部审计抽查或独立复核**（非仅内部）须写死；否则仲裁系统可被经济攻击。与 08-3 连续偏向阈值、08-4 企业级审计一致。
- **50% 仲裁员离开或拒绝某类案件**：若在岗人数 < minArbitratorCount，按上款暂停新争议；降级策略见内部运营文档。
- **仲裁员重大舞弊处理**（写死）：舞弊一经确认：**永久退出** + 统计披露；**重大舞弊须按首发司法域要求通报执法机构**（流程由法务定稿写死）；留痕与通报记录入 evidence 或内部审计。

---

## 9. 证据删除后司法协助流程（08-3、08-4 第 3 章落点）

- 保留期（evidenceRetentionDays）届满后可删原文件；**hash + receipt 永久保留**。
- **司法协助**：收到合法司法请求后，平台可提供 hash、receipt、上传者、时间等元数据；不提供可逆原文件。流程：法务接件→核对请求合法性→导出元数据并留痕→见 ToS 与隐私政策。
- **敏感数据访问控制与保留期限**（待法务/合规定稿，企业级审计 C1 落点）  
  定稿时在本节或 08 系列写死以下三项，并同步 08-2 定稿前检查与 08-3 变更记录：  
  - **访问控制**：谁可访问证件/护照号哈希/真实姓名等敏感数据、审计留痕方式；  
  - **保留期限**：各类型敏感数据保留天数（可与 evidenceRetentionDays 一致或单独表）；  
  - **删除策略**：届满后删除/脱敏动作及执行责任方。  
  定稿前仅按证据保留期与司法协助流程执行。
- 外部备份策略（若有）由法务/运维另行规定并留档。

**双写失败策略**（产品/运维定稿，企业级审计 D3 落点，**50-O-R1**）  
当前行为：用户/会话/向导/订单/评价/争议双写 DB 失败时仅打 `[audit]` 日志、不改变 HTTP 响应。  
定稿时须在本节写死**三选一**并同步 08-3：① 维持现状（仅日志）；② 双写失败返回 503；③ 双写失败接入告警（不改变 HTTP）。运维/产品定稿后在此填写所选方案（①/②/③）并登记 08-3 变更。**当前（仓库/工程默认，2026-03-24）**：与下段「开发/预发」一致，**按 ① 实现与联调**；生产若改 ②/③ 须书面勾选决策记录并同步 08-3（本节勾选不可替代法务/运维定稿）。  
**开发/预发工程默认（仓库内，2026-03）**：未显式启用各 `TRAVELTRUST_STRICT_*` 时，按 **① 仅日志** 理解与联调；生产环境由运维/产品在「决策记录」勾选并最终同步 08-3。  
**已实现（可选，对应 ② 的部分路径）**：证据 / 订单消息 / 评价 / 链下开争议 / 仲裁裁决 / **行程** / **订单 upsert（接单、取消、mock 支付、完成、双边与评分确认、开争议前 persist、创建订单、托管地址）** / **注册与登录会话** / **`SEED_TEST_ACCOUNTS` 种子账号（先库后内存）** / **向导注册 `insert_guide`** 等可分别启用 `TRAVELTRUST_STRICT_*`（见仓库根 `.env.example`）；启用后 DB 写失败返回 **503**（或种子路径跳过该账号）与稳定 `error` 字段，并与 `GET /meta` 中各子块对齐。未启用时行为仍为「仅日志」为主。  
**工程观测（2026-03-28，不替代本节书面定稿）**：环境变量 **`DUAL_WRITE_FAILURE_POLICY`**（`log_only` \| `strict_503` \| `alert_only`，别名 `1`/`2`/`fail_closed`/`3`；非法→`log_only`）与 **`GET /meta` → `dual_write`**（`failure_policy`、`strict_db_write_any`、短 `rule` 指本节与 50-O-R1）同源；API 启动 **`startup_snapshot`** 行含 **`DUAL_WRITE_FAILURE_POLICY=`**、**`STRICT_DB_WRITE_ANY=`**（后者为任一 `TRAVELTRUST_STRICT_*_DB_WRITE=1`）。定稿登记见 **[08-3 附录 A](../docs/spec/08-3-参数与门禁表.md)** 与 **08-3 变更记录**（**不增删** 26 key 主表行）。

**决策记录（定稿时填）**：选定策略 □① 仅日志 □② 返回 503 □③ 告警不改 HTTP；定稿日期 __________；填实后同步 08-3。

---

## 10. 多签轮换、失联恢复与变更流程（08-3 多处「见 Runbook §10」落点）

- **多签轮换与失联恢复**：见 B1 多签清单（独立脱敏）；失联 T+24h 冻结、T+72h 完成轮换（与 08-2 W-B1-KEYS 一致）。退出后密钥作废、新多签接替。
- **多签实质控制声明**（写死）：多签成员须提供**实质控制声明**（股权/法人/控制关系，无共同实际控制人），**定期更新**（频率由法务定稿，如每 12 个月）；未声明或逾期未更新视为不合规，须暂停其多签权限直至补正。**多签成员不得由同一法人/同一控制方单独控制**（2/3 来自同一公司则门限无意义）；**公开透明度**（披露要求或可验证的「非同一控制」）由法务定稿写死本节或治理文档。**多签实质集中穿透**（写死）：监管会问**是否同一投资方持股、是否同一董事会、是否实际控制人为同一人、是否存在 side agreement**；若存在共同实控人则门限=形式。须写死：**禁止**上述情形控制多签多数，或**披露**并接受；由法务定稿落本节或治理文档。与 08-4 第 2 章一致。
- **参数/配置变更流程**：08-3 表内「Runbook §10」指本节。常规变更：提案→双人审批→Timelock（若链上）→执行→08-3 变更记录；回滚按本节及 §1 触发条件执行。**全局变更指数执行**（写死）：变更前须核对「过去 30 日 08-3 变更记录表内记录条数」≤ paramChangeMaxPer30d（3）；每条记录计 1（同批次多 key 仍计 1）；超限则进入 paramFreezeDays 冻结期，不得执行非紧急参数变更。口径与 08-3「全局变更指数（可执行口径）」一致。
- **执行器策略写死（17 条 #11、01 §7）**：单笔金额上限 = 08-3 **maxOrderAmount**（如 10000 USDC）；单日结算金额上限 = 08-3 **maxDailySettlementAmount**（如 100000 USDC）；重试次数 = **3**（CHAIN_EXECUTOR_RETRY_COUNT，env 或 ChainConfig）；超限拒绝执行并告警，须批准人升级（§1 ④）。双人审批见 §7 裁决与执行器双人审批步骤表。与 08-3 变更记录 2025-02-25、[27-P0至P47 §六](../docs/spec/27-P0至P47-多维度深度检查报告.md#六未完成部分按类型分类发版前逐项核对) 一致。
- **对账三段式触发与上限写死（17 条 #15、01 §9）**：① **链有 DB 无**（链上已 Paid/Completed 等，DB 投影缺失）→ 自动补写投影，单次自动修单笔金额上限 = 08-3 maxOrderAmount，单日自动修次数上限 = **10**（超则转半自动/工单）；② **链无 DB 有 Paid**（DB 有资金终态但链上无对应事件）→ 告警 + 冻结该单 + 进工单，不得自动改终态；③ **半自动/人工**：需人工确认的差异（如 reorg 后、金额异常）走工单与双人审批。触发条件与上限由运维/风控定稿可微调，但三段式分类与「链无 DB 有→冻结」不得弱化。与 chain_off::reconcile_order_chain_vs_db、04 §四、01 §9 一致。
- **KYC/证据/时间源等 Backend 参数**：变更流程同上；须同步 08-4 对应章节（若在映射表）。
- **部署前 08-3 校验与 Backend 启动 SSOT 校验**（写死）：
	- **部署前（已实现，enforce）**：部署/升级前须按 Runbook §10 校验 SSOT（STRICT_SSOT/CHECK_SSOT=1 时须校验 SSOT_VERSION、SSOT_SHA256 等）。当 `STRICT_SSOT=1` 或 `CHECK_SSOT=1` 时：
		1) 必须设置 `SSOT_VERSION`（非 `unset`）
		2) 必须设置 `SSOT_SHA256`，并且与 `docs/spec/08-3-参数与门禁表.md` 的 sha256 一致（不一致则阻断部署）
		证据产物：部署日志中出现 `OK: SSOT_VERSION=...` 与 `OK: SSOT_SHA256=...`。
	- **Backend 启动时（已实现）**：API 启动打印 `startup_snapshot`（包含 `SSOT_VERSION`、`CHARGEBACK_POLICY`、**`META_BUILD_GIT_SHA`** / **`META_BUILD_DEPLOYED_AT`**（与 **`GET /meta.build`**、`.env.example` 及 CI **`TRAVELTRUST_BUILD_GIT_SHA`** 同源）、请求体上限与超时默认值）；`STRICT_SSOT=1` 时缺失 SSOT_VERSION 则拒绝启动。
	- **生产环境幂等键（01 §10 #14、04 §四）**：生产部署须启用写操作幂等键校验，设置 `REQUIRE_IDEMPOTENCY_KEY=1` 或 `STRICT_SSOT=1`（以实际代码逻辑为准），使 POST/PUT 必须带 `Idempotency-Key` 或 `X-Idempotency-Key`，否则 400；见仓库根 `.env.example` 注释。
	- **运行时 drift 复检（频率与处置写死）**：
		1) **频率**：每次发布/重启必检；运行中至少 **每 24 小时**复检一次（定时任务/cron）。
		2) **触发入口（写死，可执行）**：执行 API 二进制的运行时校验命令：
			- 命令：`traveltrust-api --ssot-runtime-check`
			- 必要输入（由运维提供快照）：`RUNTIME_PARAM_SNAPSHOT_PATH=data/runtime_params.json`（JSON object，key=08-3 映射表 param_key；value=链上/配置读取结果）
			- 模板生成：将 08-3 关键 key 导出为 data/runtime_params.json 等，定稿时按 Runbook 执行。
			- 审计留痕：`SSOT_RUNTIME_AUDIT_LOG_PATH=data/ssot_runtime_audit.jsonl`（JSONL 追加，含 who/when/what），`SSOT_RUNTIME_LAST_SNAPSHOT_PATH=data/runtime_params_last.json`（用于对比“改了什么”）
			- 审批链字段（写入审计日志）：`SSOT_AUDIT_ACTOR`（操作者）、`SSOT_AUDIT_APPROVER`（批准人）、`SSOT_AUDIT_WORKITEM_ID`、`SSOT_AUDIT_REASON`、`SSOT_AUDIT_SOURCE`（periodic/startup/deploy）
		3) **检查项**：
			- `GET /meta` 输出（defaults + ssot_version + ssot.expected_sha256/computed_sha256/match）与本次发布 evidence/GO_* 绑定的版本一致
			- `--ssot-runtime-check` 比对：运行时快照（链上/配置读取）与 08-3 映射表 key 的 **value** 一致；缺 key 或不一致在严格模式下返回非 0（阻断/告警）
		4) **触发阈值（写死）**：任一项满足即视为 drift：
			- `ssot_version` 与预期不一致
			- `SSOT_SHA256` 与仓库 `docs/spec/08-3-参数与门禁表.md` 不一致（或 `/meta.ssot.match=false`）
			- `--ssot-runtime-check` 输出 drift（缺 key/值不一致）
		5) **自动动作（写死）**：立即告警（值班群/工单）；并执行“冻结关键写/只读降级”（后端已实现 degraded_mode 下冻结写；其余按 §11 定稿）。
		6) **人工动作（写死）**：批准人确认后执行回滚/修正；补齐 evidence：
			- `ssot_deploy_preflight_*.json`（部署前置证据）
			- `data/ssot_runtime_audit.jsonl` 片段（含 who/when/what）
			- `/meta` 输出与启动日志 `startup_snapshot`
			并在 08-3 变更记录登记（若为合法变更）或在事故复盘中标注“运行时外改”。
	- **Fork PR 边界条件（写死，防口头放行）**：若 PR 来自 fork 导致 CI 无法获取 `base.sha` 或 `git diff` 失败（见 08-5），维护者必须：
		1) 本地/受信 runner 手工核对 08-3 与 08-4 变更一致（diff docs/spec/08-3、08-4）
		2) 将输出作为证据写入 `evidence/ci_exemptions/PR-<号>-W-DRIFT-CI.md`（或本次 GO evidence bundle）并在 PR 中引用
		3) 未留痕不得合并（否则 CI 豁免机制变成绕过点）

---

## 11. 证据物理冗余、reorg 超 finalityN、监管升级与仲裁失效 fallback（08-3/08-4 落点）

- **证据存储物理冗余**：证据须**多地域或跨云**备份（具体架构由运维定稿）；主存储故障 **> 7 天**时：**暂停新仲裁受理**，存量争议按**证据缺失默认裁决**（退款优先）；恢复后按既有规则。cold archive 策略（若有）由运维留档。**证据链攻击（8️⃣）**（写死）：**证据是否可被批量删除**（须按保留期与策略写死）、**Hash 是否可被 GDPR 删除要求覆盖**（须写死法律 override 流程）、**司法命令是否 override 区块证据**（须写死优先级）；**若存储集中在单一云（如仅 S3），S3 被封时仲裁能否进行**须写死—须**多地域/多云**或写死「单云不可用时暂停新仲裁、存量按证据缺失默认裁决」，否则企业级会问。见 08-4 第 3 章。
- **reorg 超过 finalityN（超 finality 场景）**（如 > 12 block）：**自动暂停结算**；须**人工确认 finality** 后按 §1 恢复；**已基于旧链状态执行的裁决/DB 须回滚或按新链重放**（不得保留与最终链不一致的终态）；具体步骤由运维定稿写死本节。**reorg 后 disputeWindow 是否重算**须写死（如 reorg 后以新链 block 重算窗口、或已开窗口不重算）；否则时间攻击层不完整。
- **checkpoint（事件消费断点）必须包含 logIndex（写死，12 缝 #9）**：checkpoint 的最小唯一性必须是 `(blockNumber, logIndex)`（建议同时记录 txHash 以便审计），否则遇到**同一 tx 多个 log**、reorg 重放、重复事件去重时会出现**重建失败/漏账/错账**。证据产物：indexer/runtime state 文件或 DB 表中保存的 checkpoint 必含 `log_index` 字段；演练/复盘时附带 `blockHash+logIndex`。
- **事件唯一性与去重键（写死并可留痕）**：事件去重键必须包含 `txHash+logIndex+blockHash`（建议再加 `chainId`），否则跨节点重复拉取/同 tx 多事件/reorg 重放会导致重复入账或漏账。证据产物：append-only `data/indexer_events.jsonl` 中每条事件必须带 `dedupe_key`，并在 `data/indexer_audit.jsonl` 留痕 `event_applied/event_skipped_duplicate`。
- **finalityN 被修改后的重放/校验流程（写死并实现，12 缝 #8）**：
	1) **变更前置条件**：变更 `finalityN` 属于高风险参数，必须双人审批并登记 08-3 变更记录；变更提交必须附“重放计划”（见下）。
	2) **变更后强制动作（不得跳过）**：在后端/执行器启动或发布前，必须执行一次回放/重放前置动作：
		- 命令：`traveltrust-api --indexer-replay-finality-change`
		- 结果：更新 `data/indexer_state.json`（或 `INDEXER_STATE_PATH` 指定文件）中的 `last_seen_finality_n`，并将 checkpoint **回退**到 `max(old_finalityN, new_finalityN)+2` blocks 之前，且 `log_index=0` 重新消费。
		- 证据产物：部署/运维日志中出现 `indexer_replay_plan: {...}`，并把计划 JSON 作为 evidence/GO_* 的一部分（或贴 hash）。
	3) **启动门禁（enforce）**：当检测到 `last_seen_finality_n != FINALITY_N` 且 `STRICT_INDEXER_REPLAY=1` 时，后端必须拒绝启动（防止改一次 finalityN 就导致投影错乱/漏账）。
	3b) **`FINALITY_N` 过低误配闸（Partial，110 §3.3）**：当已配置 **`CHAIN_RPC_URL`** 且 **`ESCROW_FACTORY_ADDRESS`** 非空时，建议生产设 **`STRICT_INDEXER_FINALITY=1`** 或显式 **`INDEXER_MIN_FINALITY_N`**（与 **`FINALITY_N` 默认 12** 对齐）；不满足时 API 进程拒绝启动。实现：**`crates/api/src/startup/mod.rs`** **`enforce_indexer_finality_floor`**；见根目录 **`.env.example`**、**04 §四**、**110 §3.3**。
	4) **校验动作（写死）**：重放完成后，必须对关键聚合结果做一致性校验（至少：订单数/资金流入流出总额/未结算余额三项）并留痕；校验不通过则继续回放或触发只读/暂停。
	5) **离线演练/回放输入（实现落点）**：后端支持通过 JSONL 输入进行确定性事件回放（用于演练/审计/重建验证；真实环境事件源应来自 RPC/indexer）。
		- 命令（先校验）：`traveltrust-api --indexer-validate-jsonl <events.jsonl>`（输出 `dup_in_file` 等统计，便于验收输入是否自洽）
		- 命令（再回放/入库证据）：`traveltrust-api --indexer-ingest-jsonl <events.jsonl>`
		- 门禁（写死，防误操作）：**非重复事件**若 `block_number/log_index <= checkpoint` 将 **fail-closed**（避免 checkpoint 倒退或重复入账）；需要回退时必须先执行 `--indexer-replay-finality-change`（或重置 state/seen_keys）
		- 去重：使用 `INDEXER_SEEN_KEYS_PATH`（默认 `data/indexer_seen_keys.json`）持久化去重键集合
		- 证据产物：`data/indexer_events.jsonl`（原始事件 append-only）+ `data/indexer_audit.jsonl`（每次 applied/duplicate + `finality_n_used`）+ `data/indexer_state.json`（checkpoint）
- **OFAC + 稳定币冻结 + Pause 三者同时触发**：**冲突矩阵与执行顺序**写死：① 监管（OFAC/政府请求）② 稳定币冻结披露/处置 ③ Pause（若仍需）④ 仲裁延后；与 08-4 第 6 章一致；具体步骤表由风控/法务定稿写死本节。
- **服务开始时间防篡改**：backend 时间源须可验证（服务器时间签名、NTP 可信源或时间戳公证）；实现由运维/架构定稿并留 08-3 变更记录。**证据链时间戳与司法验证**（写死）：证据 hash 须配**防篡改时间戳**与**独立时间锚**（链上锚或可信时间公证），支持司法验证；仅 server timestamp 在跨境司法场景可能被质疑，见 08-4 第 3 章。
- **SSOT 与链/DB 冲突优先级**（写死）：**链事件 > SSOT（08-3）> DB**。冲突时以链为准，DB 与链/SSOT 不一致须修正 DB；与 08-3 一致。**冲突时自动停机策略**（写死）：若检测到链参数与 08-3 文档冲突且无法自动修正，**须拒绝执行或自动暂停相关结算/裁决**，直至人工确认并修正；不得进入「人工判断区」现场裁量。具体触发条件与恢复流程由运维定稿写死本节。
- **SSOT 运行时校验**：Backend **启动时**应校验或打印当前 SSOT 版本/hash（与 08-3 或约定版本一致）；链上读取参数与 08-3 关键 key 比对；与 08-2 防参数外改一致。
- **时间双轨冲突与时间优先级矩阵**（写死）：disputeWindow 以**链时间（block）**为界、裁决以 serviceStartTimeSource（backend_evidence）为准；冲突时**窗口以链为准、裁决采信以 08-3 为准**，见 08-4 第 3 章。**时间优先级矩阵**：争议窗口开闭→链（block）；服务开始时间/证据时间→backend_evidence + 可验证时间戳；**时间回滚检测**：检测到服务器时间回滚时须告警并暂停依赖该时间源的裁决直至运维确认；**服务器时间不可篡改证明方式**（NTP/时间戳公证/签名）由运维/架构定稿留本节或 08-3。**时间篡改攻击（9️⃣）**（写死）：若**服务器时间被调、NTP 被污染、block 时间被操控（极端）**，须有**时间回滚检测机制**、**双源时间差异阈值报警**（backend vs 链）、**时间不一致自动停机**；由运维/架构定稿写死本节。**Backend 时间是否可被运维修改**须写死（须**不可**由运维随意修改，或仅能经变更流程+留痕）；**NTP 是否双源校验**、**是否有时间回滚检测**须写死，否则仲裁时间可能被操纵。**时间一致性攻击（2️⃣）**（写死）：**区块时间 vs 服务器时间冲突**、**NTP 被劫持**时的 fallback 顺序须写死；**不同时区证据冲突**时的采用规则（如以 UTC 或 08-3 serviceStartTimeSource 为准）须写死；**时间优先级矩阵**与**时间冲突 fallback 顺序**须与 08-3/08-4 一致，否则裁决可被时间操纵影响。**冲突决策流程图**可为本节或独立一页，企业级审计必问。**时间权威证明（企业级深水区）**（写死）：**时间由谁定义**须写死—链上 block.timestamp、服务器时间、NTP、人工确认时间—及**优先级与冲突解决顺序**；若时间来源可被人为延迟或提前，可延长争议窗口、缩短冻结窗口、操控默认裁决。须有**时间优先级矩阵 + 冲突解决图**（一页图或本节附表），写死各场景采用的时间源与 fallback；落 08-3、08-4 四块深水区证明。无此证明=时间可被操纵。
- **SLA 暂停滥用**（写死）：freezeDisputePolicy 下 SLA 暂停；**是否可通过冻结反复触发 SLA 暂停作为仲裁拖延工具**须写死缓解（如单次冻结仅触发一次 SLA 暂停、或累计暂停上限、或异常触发告警）；由风控定稿写死本节或 08-3，否则 SLA 暂停可被滥用。
- **L2/链迁移策略**（写死）：若从主网迁移 L2（如 Gas 暴涨）：**旧订单如何迁移、是否强制清算**须写死；由法务/产品定稿写死本节或 08-4，避免迁移时存量资金处置歧义。
- **多签串谋 + 仲裁偏向 + 参数调整三者同时**：须有**外部制衡**（如外部监督人、链上报警、对账异常告警、外部举报通道至少一项）；纯内部治理不足以应对三者同时发生时的企业级审计质疑，见 08-4 多签串谋发现与监督。
- **监管 KYC 全量升级路径**：若监管要求全量实名/KYC，仅改参数即可时走 §10 变更流程并同步 08-4；需改架构时须产品/法务评估并更新 08-3、08-4 与本节。
- **仲裁系统完全失效 30 天 fallback**：若仲裁**完全不可用达 30 天**（无裁决、资金卡死），按 08-4 第 3 章执行**默认裁决（退款优先）**；触发条件与执行流程由运营/法务在本节或 08-4 中写死。**无运营团队时的自然终局**（写死）：若**仲裁员全部消失、多签全部消失**，须写死是否存在**自动 fallback**（如 30 天后自动默认裁决）、**最终资金自动路径**、**时间触发终结逻辑**；若无则协议不具备自然终局能力，须在本节或 08-4 明确「当前无自然终局、依赖人工/多签」及应对。
- **向导质押挤兑（协议信任抛盘）**（写死）：**非币抛盘**— 连续裁决偏向游客→向导亏损、质押被扣→向导集体退出并 unstake→订单骤降、质押池缩水、信誉系统崩塌。缓解=**默认裁决平衡**、**连续偏向阈值**触发自动风控（08-3、本节）、**质押覆盖率与 worst-case 模型**、若有**向导 unstake 冷却期**（如 7～14 天）须写死以减缓瞬间挤兑；由风控/产品定稿写死本节或 08-3。**叙事/信任抛盘**（写死）：稳定币冻结、仲裁争议曝光、多签暂停被滥用→用户「卖信任」→用户流失、TVL 下滑。缓解=Pause 滥用缓解（本节）、透明度与冲突矩阵（§6/§11）、OFAC+冻结+Pause 冲突步骤表；由风控/法务定稿。
- **异常争议率与关联账户**：异常争议率（某类服务/地区显著偏离均值）触发告警或**自动冻结**该类别新单；关联账户检测与处置流程由风控定稿写死（防协作套利/沉默攻击）。**系统级拥堵降级策略**（写死）：当**订单暴涨、链拥堵、RPC 不稳定**时，是否自动**限单、提高保证金、延长 SLA** 须写死；由风控/产品定稿写死本节或 08-3，否则规模极限与系统稳定性存在缺口。**争议量 10× 触发阈值（7️⃣）**（写死）：订单 10× 导致争议量暴增（如订单 10,000→争议 800 级）时，**SLA 自动延长/自动暂停新争议/动态提高 arbFee** 的**触发阈值**（如待裁件数 > N 或争议率 > X%）须写死；无触发阈值=规模错觉。见 08-3、W-D3-CAPACITY。**规模失控压力测试（企业级）**（写死）：**10× 争议 alone 不够**；须覆盖 **10× 争议 + 10× Gas + 10× 链拥堵 + 10× 恶意攻击 + 10× 仲裁投诉 + 10× 用户挤兑** 的推演或阈值。须写死或落点：**仲裁处理能力上限**、**仲裁员容量数学模型**（如 max 待裁件数/仲裁员/日）、**自动降级机制**（超载时限单/排队/只读）、**排队公平性算法**（FIFO 或加权）；无=规模幻觉。由风控/运营定稿写死本节或 08-3。**群体攻击（8️⃣）**（写死）：**游客集体恶意刷单、向导集体罢工、仲裁员集体拒绝、多签成员串谋**— 是否存在**协议级自动缓冲机制**（如限流、冻结、fallback）还是**仅能人工干预**须写死；由风控/运营定稿。**群体攻击压力测试**（写死）：假设**多组假游客+假向导互相制造争议、诱导仲裁拥堵、声誉操控**— 是否可通过系统漏洞套利、通过仲裁拖延冻结资金、通过声誉洗白；须有**群体攻击压力测试或缓解写死**（如关联账户检测、异常争议率冻结、声誉金额加权），否则企业级会问。**经济战**（写死）：**竞争对手大规模制造争议、大规模投诉、大规模链拥堵**— 是否存在**自动降级模式**（如限单、排队、只读）还是**系统崩溃**须写死；由风控/运维定稿写死本节。
- **紧急联系人机制、责任边界**（08-4 第 8 章落点）：紧急联系人机制（人身伤害/向导失联/地震等）的入口与流程写死于 ToS 或本节；责任边界具体范围见法务条款与 08-4 第 8 章。

---

## 12. Outbox/执行器（文件型）运行与排障（实现落点）

当前后端已提供**最小可运行**的文件型 Outbox（`pending/ in_progress/ done/ dead/` 四目录）与可选后台 worker（默认关闭）。语义为**at-least-once**：worker 可能重试同一条事件，处理器必须幂等。

**运行开关（写死）**：
- `OUTBOX_DIR`：默认 `data/outbox`
- `OUTBOX_WORKER=1`：启用后台 worker（默认不启用）
- `OUTBOX_LEASE_SECS`：默认 `60`（in_progress 领取租约）
- `OUTBOX_POLL_MS`：默认 `500`（空闲轮询间隔）
- `OUTBOX_MAX_ATTEMPTS`：默认 `10`（超过进入 `dead/`）

**工作目录结构（取证点）**：
- `data/outbox/pending/`：待处理事件（worker 通过原子 `rename` 领取）
- `data/outbox/in_progress/`：处理中事件（崩溃/宕机后可回收）
- `data/outbox/done/`：已完成事件（归档）
- `data/outbox/dead/`：超过重试上限/损坏事件（需人工介入）

**崩溃恢复（写死）**：
- worker 启动与循环中会执行 `recover_stuck(lease_secs)`：将超过租约的 `in_progress` 事件回收到 `pending`。
- 处理卡死/进程崩溃后，必须先确认 `in_progress` 是否被回收，再做人工重试或 dead-letter 处置。

**排障步骤（最小可执行）**：
1) 观察 `pending/in_progress/done/dead` 数量是否异常增长（`in_progress` 长期不动=可能 worker 死亡或 handler 卡死）。
2) 若 `dead/` 有新增：取出对应 JSON，定位 `kind/attempts/last_error`；需要双人审批后决定重放或人工补偿。
3) 证据产物：相关目录快照（文件名+hash）、API `startup_snapshot`、`GET /meta`、以及 dead 事件 JSON 的脱敏副本。

**实现提示（边界声明）**：当前 `evidence_receipt.created` 的 handler 仅将事件追加到 `data/outbox_processed.log` 作为“副作用边界示例”；真实链上提交/存储 pin 需要替换为幂等的链调用与结果持久化（txHash/logIndex）。

### 12.1 订单证据 API（`GET|POST /api/v1/orders/:id/evidence`）

**契约与实现**：[04-后端与API](../docs/spec/04-后端与API.md) §三；`crates/api/src/routes/evidence.rs`。

| 分支 | 条件 | `GET …/evidence` | `POST …/evidence`（须登录 **`Authorization: Bearer`**） |
|------|------|------------------|--------------------------------------------------------|
| **chain_off 已挂载** | 运行时存在 `chain_off` | 列表走 **`evidence_list_impl`**（DB / 内存 store） | 上传走 **`evidence_post_impl`**（与 55 hydrate **`evidence_receipts`** 等一致） |
| **无 chain_off** | 未接 chain_off（常见本地/单测） | **501** `not_implemented`（JSON 含 `path`） | **`EVIDENCE_TIMESTAMP_POLICY=backend_signed`**（默认，见根目录 **`.env.example`**）且 **`EVIDENCE_RECEIPT_HMAC_KEY` 非空**：**200** 返回 **`receipt`**（含 `server_time_utc_rfc3339`、`policy: backend_signed`）+ **`signature`**（**HMAC-SHA256**，hex）；先入 **`OUTBOX_DIR`**（默认 `data/outbox`）事件 **`evidence_receipt.created`**；可选 **`Idempotency-Key` / `X-Idempotency-Key`**。未配置 key → **424** `missing_config`（`required_env: EVIDENCE_RECEIPT_HMAC_KEY`）。检测到服务器时间早于上次持久化值 → **503** `time_rollback_detected`（须按 **§11** / 08-4 时间口径处理后再继续）。outbox 落盘失败 → **503** `outbox_persist_failed`。 |

**观测**：**`GET /meta`** → **`evidence.receipt_signature`** 为 **`hmac_sha256`**（已配置 key）或 **`unset`**；**`evidence.timestamp_policy`** 一般为 **`backend_signed`**；**`evidence.time_state_path`** 对应 **`EVIDENCE_TIME_STATE_PATH`**（默认 `data/evidence_time_state.json`）。限流见 **`.env.example`** **`EVIDENCE_MAX_REQUESTS_PER_MINUTE`**（与 **§1** 表 **BB5** 同源口径）。

**生产验收**：在目标环境对真实订单执行 **GET/POST**，确认状态码与 JSON schema；变更 **HMAC key** 须轮换流程 + 与 **08-3** evidence_pointer 同步。

### 12.2 请求追踪响应头（`x-request-id` / `x-message-id`）

**契约与实现**：[04-后端与API](../docs/spec/04-后端与API.md) §四「请求追踪响应头」；`crates/api/src/router.rs`（**`request_id_layer`**、**`message_id_layer`**）、`crates/api/src/middleware/trace.rs`（**`resolve_message_id`**，**`pub(crate)`**）；与 [01 §9](../docs/spec/01-总库总览.md) **requestId → messageId → txHash → logIndex** 串联一致。

| 响应头 | 请求头 | 行为 |
|--------|--------|------|
| **`x-request-id`** | 可选传入 | 若请求已带则**原样贯通**；否则服务端生成 **UUID**；**始终写入响应** |
| **`x-message-id`** | 可选传入（**`x-message-id`**，HTTP 头大小写不敏感） | 仅当值为**可解析的标准 UUID** 时**原样贯通**；否则服务端生成新 UUID（非法值丢弃，防注入/格式漂移） |

**中间件栈（Axum `.layer`）**：`message_id_layer` 在 **`request_id_layer` 之外**（见 **`router.rs`** 注册顺序）：响应返回时先经 **`request_id_layer`** 写入 **`x-request-id`**，再经 **`message_id_layer`** 写入 **`x-message-id`**。

**日志**：默认 **`eprintln!`** 行 **`[req] x-request-id=… path=… status=…`** 与 **`[req] x-message-id=…`**（与 **path**、**status** 同行）；生产须用日志采集将 **stderr** 与访问日志关联。

**与幂等键区别**：**`Idempotency-Key` / `X-Idempotency-Key`** 由 **`idempotency_key_layer`** 处理（写操作去重），与 **message-id** **独立**；见 **[04 §四](../docs/spec/04-后端与API.md)**「API 幂等」。客户端 **重试同一写操作** 应：**复传同一有效 UUID 的 `x-message-id`**（便于追踪）+ **同一 `Idempotency-Key`**（若启用 **`REQUIRE_IDEMPOTENCY_KEY`**）。

**生产验收**：对任意 **`GET /health`** 或业务 **`GET/POST`** 执行 **`curl -sS -D - -o /dev/null …`**，确认响应含两响应头；对失败请求做**受控重试**，核对日志中 **message-id** 是否与客户端复传一致。

### 12.3 严格会话门（`STRICT_SESSION_GATE`）与鉴权占位

**契约与实现**：[04-后端与API](../docs/spec/04-后端与API.md) §7.8、§3.4 错误体约定；`crates/api/src/middleware/auth_pause_metrics/mod.rs` **`auth_placeholder_layer`**；**`GET /meta`** 字段 **`strict_mode.strict_session_gate`**（与进程环境变量 **`STRICT_SESSION_GATE=1`** 一致）；根目录 **`.env.example`** 说明；单测 **`auth_placeholder_strict_gate_tests`**（`crates/api`）。

| 环境 | 非公开 **`/api/v1/*`**（不在下表白名单内） | 通过条件 | 否则 |
|------|---------------------------------------------|----------|------|
| **默认**（未设 **`STRICT_SESSION_GATE=1`**） | 须至少具备 **`X-User-Id`**（非空）或任意 **`Authorization`** 请求头 | 通过 | **401** `unauthorized`（`detail`：需登录） |
| **`STRICT_SESSION_GATE=1`**（生产推荐） | 须 **`Authorization: Bearer <session_token>`** 且 **`<session_token>` 非空** | 通过 | **401** `unauthorized`（`detail`：不接受仅 **`X-User-Id`**） |

**公开路径（本层直接放行，不校验上述登录头）**（与代码 `public` 一致，摘要）：**`OPTIONS *`**；**`/health`**、**`/meta`**；**`/auth/*`**；**`GET /api/v1/guides`**；**`GET /api/v1/discover/orders`**；**`GET /api/v1/did-rank/{travelers,guides,itineraries}`**；**`GET /api/v1/community/…`** 只读（**不含**路径含 **`/me/`**、**`/friends/`** 的社区子路径）；**`/api/v1/internal/*`**（**另**由 **`INTERNAL_API_SECRET`** 门禁，见 **04 §7.8**「内网密钥」；**不得**对公网暴露）。

**观测**：**`curl -sS "$API/meta" | jq '.strict_mode.strict_session_gate'`** 应为 **`true`** 或 **`false`**，与部署环境 **`STRICT_SESSION_GATE`** 一致；同响应中 **`strict_mode.require_idempotency_key`**、**`strict_ssot`** 等与 **[04 §7.10](../docs/spec/04-后端与API.md)** 一致。

**生产验收**：在 **`STRICT_SESSION_GATE=1`** 的环境对受保护 **`POST /api/v1/orders`**（或任意非公开写接口）先**仅**带 **`X-User-Id`**，应 **401**；再带 **`Authorization: Bearer test-token`**，应**不再**因本层返回 401（业务层仍可按未登录/权限返回 401/403）。在 **`STRICT_SESSION_GATE=0`** 复测：仅 **`X-User-Id`** 应通过本层。

### 12.4 合约 ABI 与前后端同步（forge → 仓库 → CI）

**契约与实现**：[14-合约-API-ABI-前后端对齐](../docs/spec/14-合约-API-ABI-前后端对齐.md) **§1.2**；[scripts/README.md](../scripts/README.md) **§二、§三**；**`.github/workflows/contract-abi-gate.yml`**（**Contract ABI Gate**）。

**本地最小顺序（改 `contracts/src` 或须刷新 ABI 时）**：

1. **`cd contracts && forge build && forge test`**（或等价）— 确保 Solidity 与测试通过。
2. **项目根** **`bash scripts/sync-abi-from-forge.sh`** 或 **`.\scripts\sync-abi-from-forge.ps1`**：写入 **`contracts/abi/{Escrow,EscrowFactory,Staking,Registry,FeeRouter}.json`**（及可选 IERC20/MockERC20）；脚本末尾已调用 **`run-verify-abi-forge`**（multiset 与 **contract-abi-gate** 同源）。
3. 按脚本 **Next** 提示将 **`Staking.json` / `Registry.json` / `FeeRouter.json`** 复制到 **`frontend/dapp/abis/`**（与 **`contracts/abi`** **字节一致**，**55-S13** 硬门禁）；**`Escrow`**：canonical 在 **`contracts/abi/Escrow.json`**；**`frontend/dapp/abis/Escrow.json`** 可为精简 ABI，须与 DApp 调用一致且含 **`openDispute`** 等（见 **14 §1.2**）。
4. 若变更 **`Staking` / `Registry` / `Escrow`** 对外接口：同步 **`frontend/lib/stakingAbi.ts`**、**`registryAbi.ts`** 等 **`as const`** 镜像（与 JSON 一致）。
5. **`bash scripts/check-55-s13.sh`** / **`check-55-s13.ps1`** — **55-S13** API/ABI/端口核对须 **退出码 0**。

**CI**：PR 变更命中 **`contracts/**`**、**`frontend/dapp/abis/**`** 或相关 **`scripts/*`** 时 **Contract ABI Gate** 自动跑；亦可 **Actions → Contract ABI Gate → Run workflow** 手动全量。

**部署与证据**：链上地址与 **`GET /meta` → `chain.contracts`**、**`FEE_ROUTER_ADDRESS` / `REGION_VAULT_ADDRESS` / `NEXT_PUBLIC_*`** 对齐见 **§7.1**、**04 §7.10**；**`export_deployment_params`**、**08-3**、**01 §10 17 条 #5** 见 **[scripts/README §三](../scripts/README.md)**。

**生产验收**：干净工作区跑通步骤 1～5；合并后主分支 **Contract ABI Gate** 通过。

### 12.5 链下对账与索引器留痕（P1-C）

**契约单源**：[01-总库总览](../docs/spec/01-总库总览.md) **§9**（对账、E2E、资损 runbook）；[04-后端与API](../docs/spec/04-后端与API.md) **§四**（投影、outbox、与链对账口径）；**17 条 #15** 三段式与本文 **§1** 触发表 / **§2.55** 前文「对账三段式」一致。

**与 §2.55 的关系**：**internal 路径、curl 示例、`internal-indexer-ops` 子命令、DB 对账语义（`orders`↔`orders_projection`、`rpc_escrow_samples`、`110 §3.1.3`）** 的**操作 SSOT** 在本文 **§2.55 Indexer tick、重放与对账**；本节仅给出**发版 / 值班可用的执行顺序**与 **evidence 对齐**，避免重复粘贴长模板。

**目标环境最小顺序（须内网；`INTERNAL_API_SECRET` 勿暴露公网）**：

1. 配置 **`API_BASE_URL`**（脚本默认 `http://127.0.0.1:8080`）与 **`INTERNAL_API_SECRET`**（与 API 进程一致）。
2. **即时只读对账**：**`GET /api/v1/internal/indexer-status?live_reconcile=1`** — 核对根级 **`projection_reconcile_clean`** 与 **`issues_total`**（与 **`GET /metrics`** 互补：**metrics 不含** DB 投影是否干净，见 **§2.55**）。
3. **门禁式探针**：**`bash scripts/indexer-reconcile-probe.sh`**（Windows：**`.\scripts\indexer-reconcile-probe.ps1`** 委托 **.sh**）— **退出码 0** 当且仅当即时对账干净（须 **jq**）；供 cron / 自建 CI job。**Epic D-09**：**`bash scripts/indexer-reconcile-probe.sh --ops-artifact`**（或 **`internal-indexer-ops.sh probe --ops-artifact`**）stdout 为 **`traveltrust.ops_artifact.v1`** **`artifact_type:probe`**，含 **`probe_exit_code`**、**`issues_total`**、**`clean`**、**`gate_workflow_checks_total_expected`**（与 **`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`** 同值，**B-120** 互证）、**`gate_workflow_rule_id`**；见 **[Epic-D-indexer-ops-readonly-ladder.md](../docs/runbook/Epic-D-indexer-ops-readonly-ladder.md)**。
4. **（可选）落库对账报告**：**`POST /api/v1/internal/indexer-reconcile`**，body **`persist:true`** — 写入 **`reconciliation_reports`**（**04 §3.4**、admin 只读）；偏差闭环仍按 **§7**、**01 §9**。
5. **证据落盘**：**`bash scripts/write-indexer-evidence.sh`** / **`internal-indexer-ops.sh evidence|evidence-bundle [--skip-internal-reconcile] [--with-indexer-tick]`**（Windows **`.ps1`** 同参；**`--with-indexer-tick`** 慎用）→ **`evidence/GO_YYYYMMDD/`**，与 **[evidence/README](../evidence/README.md)**、**08-2 / P0 #7** 一致；**`indexer-public-snapshot.sh`** 写出 JSON 顶域含 **`snapshot_provenance`**（**`script`**/**`script_semver`**/**`host_git_commit`**/**`host_git_branch`**/**`host_repo_dirty`**）便于审计对读生成器与**主机 Git 工作区**上下文。**Epic D-10**：**`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** 时另产出 **`manifest.json`**、**`manifest.sha256`**、**`epic_d_go_bundle_closure.json`**（**`traveltrust.ops_artifact.v1`** **`bundle`**）；建议 **`INTERNAL_API_SECRET`** 以便 **`artifacts/epic_d_d03～d05`** 与 **D-02** 快照同批满足 **≥2** 类 **`artifact_type`**（见 **[Epic-D-indexer-ops-readonly-ladder.md](../docs/runbook/Epic-D-indexer-ops-readonly-ladder.md)** **D-10**）。**契约三角**（合并 JSON 形状、**非** **§2.1** 表内独立 REST）：**[14 §2.1](../docs/spec/14-合约-API-ABI-前后端对齐.md)**「运维 JSON 快照」↔ **[04 §3.4 · internal](../docs/spec/04-后端与API.md)** ↔ **[110 §3.1.2](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**；**[scripts/README § 篇首索引器段](../scripts/README.md)**、**[07 §六 6.4](../docs/spec/07-开发流程与顺序.md)** 台账。
6. **（可选）链级 `dry-run` 只读计数（DR / 多链环境规划）**：**`bash scripts/internal-indexer-ops.sh reconcile --chain-scope-dry-run`**（及 **`--event-log-scope-dry-run`** / **`--correction-executor-scope-dry-run`**；须与上列同套 **`API_BASE_URL`** / **`INTERNAL_API_SECRET`** / **`CHAIN_ID`**，操作细节见 **§2.55**）— **`POST …/internal/indexer-reconcile`** 成功体可含 **`orders_chain_scope_rollback_dry_run`**、**`event_log_chain_scope_rollback_dry_run`**（**`110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN`**）、**`correction_executor_chain_scope_rollback_dry_run`**（**`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN`**）等对象与机读锚。归档 **`traveltrust.ops_artifact.v1`** 时：**`--chain-scope-dry-run --ops-artifact`** → **`artifact_type:dry_run_chain`**（**Epic D-06**）；**`--event-log-scope-dry-run --ops-artifact`** → **`artifact_type:dry_run_event_log`**（**Epic D-07**）；**`--correction-executor-scope-dry-run --ops-artifact`** → **`artifact_type:dry_run_correction_executor`**（**Epic D-08**；根级 **`dry_run:true`**、**`ops_summary.domain:"correction_executor"`**、**`reason_code`** 与 **D-06/D-07** 同纪律，见 **[Epic-D-indexer-ops-readonly-ladder.md](../docs/runbook/Epic-D-indexer-ops-readonly-ladder.md)**）。可将完整响应或 envelope **JSON** 落入 **`evidence/GO_YYYYMMDD/artifacts/`** 与 manifest 同批，与 **[evidence/README](../evidence/README.md)**、**[110 §3.1.4](../docs/spec/110-阶段开发链上索引器与事件同步器.md)** 同读。**`orders_chain_scope_rollback_execute:true`** 等 **DELETE** 路径仍须进程 **ENV** + **`…_confirm`** 精确串，**不**纳入本顺序的自动化门禁，亦**不**替代 **01/03** 与值班批准链。

**与 E2E 三项**：**01 §9** 的 **正常放款、争议三终态、三条超时路径** 须在目标环境单独留痕（**[27-P14 实现记录 · P14-3](../docs/spec/27-P14-实现记录.md)**）；**本节不替代 E2E**，仅覆盖 **索引器 ↔ DB 投影** 机器核对线。**可选**：与 **§12.6 §A 步骤 4** 同套的 **Epic F-06** 结构校验（**`CHECK_E2E_THREE_PACK`**）仅校验 **GO** 目录内 **三份 `e2e-*.md`** 与可选 **manifest** 登记—**不**跑索引器、**不**断言 Playwright。

**生产验收**：步骤 3 **退出码 0**；或步骤 2 人工确认 **`projection_reconcile_clean`** 与 **`issues_total`** 可接受；异常按 **§2.55**、**[110 §3.1.3](../docs/spec/110-阶段开发链上索引器与事件同步器.md)** 升级。

**缺口官方总表 P1-C 互证（对账流程 / reconcile，2026-04-09）**：[缺口与待补-官方总表](../docs/spec/缺口与待补-官方总表.md) **P1-C**「对账流程」行已与 **`evidence/GO_20260409/artifacts/p1c-reconcile-close.md`** + 该目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1C-RECONCILE-SINGLE-001**）。**命令入口摘要**：**`GET …/internal/indexer-status?live_reconcile=1`**、**`bash scripts/indexer-reconcile-probe.sh`**、**`write-indexer-evidence.sh`** / **`internal-indexer-ops.sh evidence|evidence-bundle`** — 详见上款 **目标环境最小顺序**；**操作 SSOT** 仍以上款 **与 §2.55 的关系** 及 **§2.55** 正文为准。**不替代** 目标环境真实对账与 **P0 #7**。

### 12.6 可验证发布 manifest 与 E2E 留痕（P1-C）

**契约单源**：[08-4 对外口径包](../docs/spec/08-4-对外口径包.md) **第 7 章「可验证发布」**（manifest + hash + 可复现构建说明）；[01-总库总览](../docs/spec/01-总库总览.md) **§「发布与 E2E（P2）」**（**正常放款**、**争议三终态**、**三条超时路径**；资损 **runbook** 至少 **5 条** ↔ 本文 **§1** **①～⑤**）；[evidence/README](../evidence/README.md)；根目录 **[CONTRIBUTING.md](../CONTRIBUTING.md)**。

#### A. 前端构建 manifest（可验证发布）

1. **`cd frontend && npm run build`**（Next 产物在 **`frontend/.next/`**）。
2. 仓库根执行 **`./scripts/gen-frontend-manifest.sh`** 或 **`.\scripts\gen-frontend-manifest.ps1`** → 生成 **`frontend/.next/build-manifest.json`**。可选：设置 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`**（PowerShell：**`$env:EVIDENCE_GO_DIR='evidence/GO_YYYYMMDD'`**）以同步 **`frontend-build-manifest.json`** + **`.sha256`** 至 **evidence**（与 **[evidence/README](../evidence/README.md)** 必填字段一致）。
3. **`pre-release-automation.sh`** / **`.ps1`**（见 **[scripts/README §三](../scripts/README.md)**、缺口总表核查流水步骤 4）聚合 **check-invariants**、**check-55-s13**、**run-check-04-routes**（**API 主表↔`.route`** + **04 前端↔`app`** + **13-1 表 1↔`app`** + **13-1⊆04 前端表**）等；**有 forge** 时另跑 **forge build** + **run-verify-abi-forge**。**注意**：**pre-release 不替代** 本款第 1～2 步；**manifest 须在 build 后单独执行**。
4. **（可选 · Epic F-10）E2E 三项证据「结构」门禁挂钩**：当次 **GO** 目录已落盘 **`artifacts/e2e-*.md`**（及可选完整 **`manifest.json`** 登记）后，可在同一机器聚合末尾**显式**开启：**`CHECK_E2E_THREE_PACK=1`** + **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`** → 调用 **`scripts/check-e2e-three-pack-evidence.sh`**（**Epic F-06**）。可选 **`CHECK_E2E_THREE_PACK_MANIFEST=1`**（须 **jq**）→ 同步 **`E2E_THREE_PACK_CHECK_MANIFEST=1`**。**默认不设置上述变量** → **pre-release 行为与历史一致**。**何时建议开启**：正式过门 / 合并 **GO bundle** 前，需确认 **F-02** 三文件名已在目标目录存在（及可选 **manifest** 登记）；**失败语义**：表示 **证据目录 / manifest 登记未准备好**（缺文件或 **`artifacts[]`** 缺 **`path`**），**不是**「订单 E2E 业务未通过」— **F-08 Playwright 真实路径** 仍须**单独**按需执行（见 **[Epic-F-e2e-three-pack-ladder · F-08](../docs/runbook/Epic-F-e2e-three-pack-ladder.md#epic-f-f08-real-path-playwright)**）。**PowerShell**：**`.ps1`** 同参；须本机 **Git Bash** 调 **`.sh`**。

**生产验收**：**`evidence/GO_YYYYMMDD/`** 内可复核 **manifest** 与 **sha256**；**08-2 Evidence** 列填路径或 hash。

**缺口官方总表 P1-C 互证（可验证发布 manifest，2026-04-09）**：[缺口与待补-官方总表](../docs/spec/缺口与待补-官方总表.md) **P1-C**「可验证发布 manifest」行已与 **`evidence/GO_20260409/artifacts/p1c-frontend-manifest-close.md`** + 该目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1C-MANIFEST-SINGLE-001**）。**字段分层**：**GO 根级 `manifest.json`** 见 **[evidence/README §manifest 格式与必填字段](../evidence/README.md)**；**`gen-frontend-manifest` 产物**（**`frontend/.next/build-manifest.json`** / **`frontend-build-manifest.json`**）之 **`gate`** / **`date`** / **`artifacts`** / **`sign_off`** 见 **该 artifact** 内表与 **[evidence/README · 可验证发布](../evidence/README.md)**。**真实构建清单**仍须按上款 **步骤 1～2** 在发版机生成并**逐文件**列入当次 **`artifacts[]`**。

#### B. E2E 三项与资损演练（人工闭环）

- **三项语义**（**01**）：**正常放款**、**争议三终态**、**三条超时路径** — 须在**目标环境**执行并**留痕**，格式 **YYYY-MM-DD** 填入 **[27-P14 实现记录](../docs/spec/27-P14-实现记录.md)** **P14-3**（对应 **[缺口官方总表 P0 #10](../docs/spec/缺口与待补-官方总表.md)**）。
- **资损 runbook 演练**：发版前至少 **一次**真实登记 **本文 §4 演练历史表**（对应 **P0 #11**）；场景从 **§1** **①～⑤** 任选。
- **Playwright / `npm run e2e`**（若仓库已配置）：仅作**辅助回归**，**不可替代** **01 §「发布与 E2E」** 的语义验收与 **27-P14** 日期闭环。
- **Epic F · 自动化真实路径（ADR）**：[docs/runbook/Epic-F-real-path-adr.md](../docs/runbook/Epic-F-real-path-adr.md)（与 [Epic-F-e2e-three-pack-ladder · F-04](../docs/runbook/Epic-F-e2e-three-pack-ladder.md#epic-f-f04-real-path-adr) 一致）：钉死 **本地链 + 本地 API**、**仅「正常放款」** 走自动化真实状态机、**B-115 / B-116 / P5** 路径 **不得 mock**；**不**减免 **01 §9** 三项手工留痕。

**生产验收**：**P14-3** 三处日期填实；**§4** 新增一行演练记录；需要时 **evidence bundle** 与 **P0 #7** 一致。

**缺口官方总表 P1-C 互证（E2E 三项脚本，2026-04-09）**：[缺口与待补-官方总表](../docs/spec/缺口与待补-官方总表.md) **P1-C**「E2E 三项脚本」行已与 **`evidence/GO_20260409/artifacts/p1c-e2e-close.md`** + 该目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1C-E2E-SINGLE-001**）。**三项语义**（**正常放款**、**争议三终态**、**三条超时路径**）与 **01 / 07**、**[27-P14 · P14-3](../docs/spec/27-P14-实现记录.md)**、**[evidence/README · 07-p0-e2e-three](../evidence/README.md#07-p0-e2e-three)** 互指；**仓内示例** **`evidence/GO_20260407/artifacts/e2e-*.md`**。**不替代** 目标环境真实执行后在 **P14-3** 填实日期及当次 **GO `artifacts[]`** 登记。

### 12.7 W-GATE-CROSS-CHECK（全 Gate 横向一致性评审）

**目的**（与 **[07 §四 4.3](../docs/spec/07-开发流程与顺序.md)** 发版前行、**[00 发版前快速核对（7 项）](../docs/spec/00-文档索引.md#发版前快速核对7项)** 第 ⑤ 项一致）：发版前对 **08-1（附录 GO/NO-GO Gate-1～5）**、**08-2 工单与发版前审查一/二**、**08-3 参数 SSOT**、**08-4 对外口径** 做**横向**核对，消除**互斥承诺**、**遗漏闭环**与 **Gate 间漂移**。

**权威填表落点（人工矩阵本体）**：[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md) **发版前审查二（Gate 冲突矩阵与优先级规则）** — 须完成表内**冲突场景**、**优先级规则**，并填 **最后更新**、**评审日期**、**Evidence 路径**（对应 **[缺口官方总表 P0 #4](../docs/spec/缺口与待补-官方总表.md)**）。**不得**仅用「见 Runbook」占位；若引用本文，须精确到 **§ 号**（见 **§13** 下文 **08-3 evidence_pointer** 规则）。

**可选扩展模板**：[27-archived/27-P13-Gate冲突矩阵与优先级.md](../docs/spec/27-archived/27-P13-Gate冲突矩阵与优先级.md) — 可与 **08-2 审查二** 同构复制到 **evidence/GO_YYYYMMDD/** 或 PR 附件，再于 **08-2 Evidence** 列填路径。

**机器辅助（不替代审查二签字与矩阵结论）**：
- **`./scripts/check-08-consistency.sh [BASE_REF]`**（默认 **main**；见 **[08-5](../docs/spec/08-5-CI与一致性落地说明.md)**、本文 **§13**）— **08-3 / 08-4** 等文档一致性机读校验。
- **`./scripts/check-governance-doc-linkage.sh`** — **82/83/84**、**governance-token**、**00 索引**、**07 §二 2.4** 等静态联动（**[00-文档治理总册 §8.3](../docs/spec/00-文档治理总册.md#doc-audit-gates-ssot)**）。

**生产验收**：**08-2 审查二** 表末字段填实；**00 快速核对** 第 ⑤ 项可勾选；重大冲突须在合并前解决或升 **产品/架构** 书面裁决。

**缺口官方总表 P1-C 互证（W-GATE-CROSS-CHECK，2026-04-09）**：[缺口与待补-官方总表](../docs/spec/缺口与待补-官方总表.md) **P1-C**「W-GATE-CROSS-CHECK」行已与 **`evidence/GO_20260409/artifacts/p1c-wgate-evidence-integration-close.md`** + 该目录 **`manifest.json`** / **`manifest.sha256`** 并联闭合（**TT-07-63B-P1C-EVIDENCE-INTEGRATION-001**）。**机读校验路径**（**不替代**上款 **08-2 审查二** 人工矩阵）：**`bash scripts/check-governance-doc-linkage.sh`**；**`./scripts/check-08-consistency.sh [BASE_REF]`**（见上款 **机器辅助** 清单）。**脚本头注释**已互指本 **TT** 与该 **artifact**。

### 12.8 17 条验收 #5：部署参数与静态分析（Slither）

**契约**：[01-总库总览 §10 审计验收表](../docs/spec/01-总库总览.md)；[scripts/checklist-17.md](../scripts/checklist-17.md) 第 **#5** 行与「发版前定稿」表；**participants 不可变、无零地址** 等部署口径以合约与 **Deploy** 脚本为准。

**最小顺序**：

1. **（须 Foundry）** 项目根 **`./scripts/export_deployment_params.sh [out.txt]`** 或 **`.\scripts\export_deployment_params.ps1 [out.txt]`** — 触发 **`cd contracts && forge build`**，汇总主要合约 **bytecode** 长度等；**.ps1** 产出为 **UTF-8 无 BOM**（与 **[scripts/README §三](../scripts/README.md)** 一致）。
2. **（可选，须本机安装 Slither）** **`cd contracts && slither . --json slither-report.json`**（或等价命令）— 静态分析报告；敏感环境勿将完整报告对未授权方公开。
3. 将 **`out.txt`**、**`slither-report.json`**（若跑）复制入 **`evidence/GO_YYYYMMDD/`**，或在 **[08-3](../docs/spec/08-3-参数与门禁表.md)** 对应 **evidence_pointer** 填**具体路径或 hash**（**禁止**仅写「见 Runbook」无 § 号 — 见 **§13**）。

**生产验收**：**checklist-17** #5 行可勾选「已产出 artifact」；**08-2 / P0** 与 evidence 目录可互查同一批 **GO_YYYYMMDD**。

### 12.9 08-2 工单定稿（P1-D 执行顺序）

**目的**：将 **[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md)** 从「占位/示例」推进到发版可签字态（**不替代**法务/产品填真实姓名与结论）。

**顺序**：

1. 打开 **08-2** 文内 **定稿前检查** 与 **workitem** 各表；按 **[27-P14 实现记录](../docs/spec/27-P14-实现记录.md)** 定稿操作清单逐项执行。
2. **Owner** 列由泛角色改为 **「角色（姓名或代号）+ backup」**（对应 **P0 #2**）。
3. **发版前审查一** 11 行逐行勾选并填 **审查人 / 日期 / 结论**（**P0 #3**）。
4. **发版前审查二** 按 **§12.7** 闭合。
5. 各工单 **Evidence** 列填 **具体路径或 manifest hash**（**P0 #7**）。

**生产验收**：**P0 十二项** 中 08-2 相关行可勾选；**00 快速核对** 与 **15 附录〇** 可交叉复核。

---

## 13. CI/门禁脚本的边界条件（Fork PR / base sha 不可用）

**与 §12.7 的关系**：**`check-08-consistency.sh`**、**`check-governance-doc-linkage.sh`** 为 **W-GATE-CROSS-CHECK** 的**机读辅助**；**08-2 审查二** 人工矩阵与 **Evidence** 列仍须按 **§12.7** 闭合。

- **Fork PR 的 base.sha 不可用时的处理（写死）**：当 CI 运行环境无法获取 PR 的 base 提交（如 fork/权限限制/浅克隆），`./scripts/check-08-consistency.sh` 这类基于 `git diff <base>` 的门禁会失效。
	1) **默认策略（fail-closed）**：无法确定 base 时，必须由维护者以有权限的方式重新触发校验（如在主仓库环境运行、或显式传入 base_ref 并确保已 fetch）。
	2) **可执行操作**：维护者手工核对 08-3/08-4 一致性，并将结果留痕作为 evidence。
	3) **门禁口径**：任何“因为 base.sha 不可用而跳过校验”的情况，必须在 PR 里留痕并由维护者审批；不得作为绕过点。

- **08-3 evidence_pointer 禁止裸指针（写死）**：08-3 属于 SSOT，任何 key 若 evidence_pointer 仅写“见 Runbook/见文档”，等价于门禁不可执行。
	1) **门禁**：人工检查 08-2 Evidence 列，若发现 evidence_pointer 为空/"—"/“见 Runbook”等裸指针，须补齐后再合并（原脚本已精简）。
	2) **精确性要求**：若 evidence_pointer 提及 Runbook，必须精确到 Runbook §N 或“表”。
	3) **证据产物**：脚本输出保留在 CI 日志或 evidence/GO_* 中；异常必须在 PR 中修复后再合并。

---

## 14. 250/260 异步与调度联动处置（文档对齐补充）

本节对应 `250`（队列执行面）与 `260`（调度计划面）联动值班流程，避免“调度问题按队列处理”或“队列问题按调度处理”的误处置。

### 14.1 分层处置边界（先判层后操作）

| 现象 | 优先归属层 | 首个核查点 |
|---|---|---|
| cron 未触发、触发时间漂移、同窗口重复触发 | `260` Scheduler 层 | 计划定义/锁/运行记录（`cron_jobs/job_runs/job_locks`） |
| 队列积压、重试飙升、死信增长、回放失败 | `250` Job/Queue 层 | pending/in_progress/dead 与 worker 运行状态 |
| 两层同时异常 | 先 `260` 后 `250` | 先确认触发是否正确，再处理消费与补偿 |

### 14.2 触发阈值与动作

| 场景 | 触发阈值 | 自动动作 | 人工动作 | 证据产物 |
|---|---|---|---|---|
| 队列积压 | `pending` 连续 15 分钟增长且无下降趋势 | 告警并标记 `job-queue-backlog` | 值班确认 worker 存活，必要时扩容或限流；批准人确认降级策略 | 目录快照、worker 日志、告警截图 |
| 死信异常 | `dead/` 新增超过基线阈值（如 10 条/15 分钟） | 告警并冻结自动回放 | 双人审批后按批次回放或人工补偿 | dead 事件脱敏样本、审批记录、回放结果 |
| 调度漏触发 | 关键 cron 超过 1 个周期未触发 | 告警并写入 `scheduler-missfire` 事件 | 值班核查锁与时区配置，批准人决定是否手动补跑 | job_code/run_id、补跑记录、审计日志 |
| 调度重复触发 | 同一 job/window 出现重复 run | 告警并暂停该计划 | 值班核查防重锁；批准人确认恢复窗口 | 锁记录、运行记录、恢复审批 |

### 14.3 回放与补跑审批（强制双人）

1. 值班先提交影响评估：任务类型、影响订单范围、建议动作（回放/补跑/补偿）。
2. 批准人审核并选择策略：
	- `250` 队列故障：优先回放 dead-letter 或重试失败批次。
	- `260` 调度故障：优先执行补跑并校正计划参数。
3. 执行后必须登记证据：执行人、批准人、时间窗口、影响对象、结果。

### 14.4 与文档与后台映射

- 后台角色按 `70` 执行：`JOB_*` 仅处理队列面，`SCHED_*` 仅处理调度面。
- API 状态按 `04 §3.4`：`/api/v1/admin/jobs` 与 `/api/v1/admin/scheduler/jobs` 仍为 `Target` 时，仅可通过现有内部入口与运行证据执行处置。
- 文档冲突优先级：`04/14` 路由状态 > `260` 边界定义 > `250` 执行定义。

---

## 定稿时须填写项（未填则 Runbook 不可作为 Gate 闭合证据）

**P0 最小必填项**（上线/过门前**至少须填**以下 9 项，否则 Runbook 不可作为 Gate 闭合证据）：① 值班/批准人 ② 多签实质控制声明更新频率 ③ OFAC+稳定币冻结+Pause 冲突矩阵步骤表 ④ 法律突变 30 天内存量处理策略 ⑤ 收入归集路径或收益流图 ⑥ 协议终止与 graceful shutdown 步骤 ⑦ 多签权限矩阵或紧急多签可验证触发条件表 ⑧ 与 08-4 文末定稿日期+签字同步确认 ⑨ **协议强制关闭**（至少三种触发条件+关闭流程+存量订单终局+用户资金最终处理，§6）。**发版前须将以下 P0 九项全部填实（定稿时填），未填项不得视为门禁闭合。**详见 [08-2 定稿前检查](../docs/spec/08-2-附录-闭合工单表.md)。

**填写说明**：P0 九项每项须在定稿时填实；未填前可于「定稿时须填写」列或对应节内写「__________（定稿时填）」占位。

以下项由法务/风控/运营/运维在定稿时填实；留空则仅作骨架。

| 项 | 所在节 | 定稿时须填写 | 主责 | P0 |
|----|--------|--------------|------|-----|
| 值班/批准人 | §2 值班与批准链 | 具体联系人或代号（脱敏可）→ __________ | 运维 | ✅ P0 |
| 多签实质控制声明更新频率 | §10 | 如「每 12 个月」；未更新后果 → __________ | 法务 | ✅ P0 |
| OFAC+稳定币冻结+Pause 冲突矩阵步骤表 | §11 | 三者同时触发时的具体执行步骤表 → __________ | 风控/法务 | ✅ P0 |
| 法律突变 30 天内存量处理策略（含存量订单处理优先级、用户资金最终路径）| §6 | 停止新单后存量订单清算/退款/关停口径；存量订单处理优先级；用户资金最终路径（链上 Escrow 释放/退回）→ __________ | 法务 | ✅ P0 |
| 协议终止与 graceful shutdown 步骤 | §6 | 存量订单清算/退款、资金披露口径 → __________ | 法务 | ✅ P0 |
| 收入归集路径（仲裁费/罚没/手续费/罚款）或收益流图 | 治理文档或 08-4 | 运营账户/链上池/DAO/可分红；或架构图路径 → __________ | 法务/财务 | ✅ P0 |
| 多签权限矩阵 或 紧急多签可验证触发条件表 | §7 | 一页表 或 触发阈值/可验证条件写死 → __________ | 法务/架构 或 风控/法务 | ✅ P0 |
| 08-4 文末定稿日期+法务/运营签字或邮件确认 | 08-4 文末 | 与 Runbook 定稿同步 → __________ | 法务/运营 | ✅ P0 |
| 协议强制关闭（三种触发条件+关闭流程+存量订单终局+用户资金最终处理）| §6 | 至少三种明确触发条件、谁执行、存量订单终局路径、用户资金最终处理逻辑 → __________ | 法务/风控 | ✅ P0 |
| 异常争议率阈值与自动冻结规则 | §11 | 某类服务/地区争议率偏离阈值及动作 | 风控 | |
| 关联账户检测与处置流程 | §11 | 协作套利检测、处置步骤 | 风控 | |
| 收益流图/收益归集架构图（若未在 P0 收入归集项填） | 治理文档或 08-4 | 资金从争议/罚没/手续费到最终归宿路径 | 法务/财务 | |
| 会计确认 memo（或等效） | 财务/治理文档 | 每类收入确认时点、冲减规则 | 财务 | |
| 整体参数变更指数（防 param 绕开） | §10 或 08-3 | 30 天内映射 key 变更总数或等效规则 | 产品/风控 | |
| 时间优先级矩阵/冲突决策流程图 | §11 | block vs 证据时间 vs 服务器时间；回滚检测、不可篡改证明 | 运维/架构 | |
| 协议终止自动清算脚本或执行清单 | §6 | 存量订单最终路径、脚本或步骤表 | 法务/运维 | |
| 收益流图（一页闭环图）| 治理文档或 08-4 | 收益→归宿、是否分红、是否治理币分配、是否触发证券属性 | 法务/财务 | |
| 被认定为金融服务商时的应对路径 | Runbook 或治理文档 | 申请牌照/关停/迁移/业务收缩等 | 法务 | |
| 无运营时自然终局路径（自动 fallback/时间触发终结）| §6/§11 | 仲裁员/多签全消失时的终局逻辑 | 法务/运营 | |
| 协议死亡场景（公司破产/多签消失/团队退出/域名或 GitHub 不可用）终局路径 | §6 | 能否自然运行、用户能否完成存量订单、自然终局路径或明确无 | 法务/运营 | |
| 默认裁决连续偏向阈值与自动风控（如连续 N 单同向触发冻结/复核）| §11 或 08-3 | 连续偏差阈值、自动冻结/复核动作 | 风控 | |
| 仲裁员集体偏差阈值（如 80% 倾向某类/某城→冻结或强制复核）| §8 | 偏差指数阈值、自动冻结裁决/暂停争议/强制复核 | 风控/运营 | |
| 时间篡改攻击（双源时间差异阈值报警、时间不一致自动停机）| §11 | 回滚检测、backend vs 链差异阈值、自动停机条件 | 运维/架构 | |
| SLA 暂停滥用缓解（反复冻结触发 SLA 暂停的防滥用规则）| §11 或 08-3 | 单次冻结仅触发一次暂停/累计上限/异常告警 | 风控 | |
| 群体攻击（游客刷单/向导罢工/仲裁员集体拒绝/多签串谋）自动缓冲 vs 人工 | §11 | 协议级自动缓冲或仅人工干预写死 | 风控/运营 | |
| 经济战（大规模争议/投诉/链拥堵）自动降级 vs 崩溃 | §11 | 自动降级模式或系统崩溃写死 | 风控/运维 | |
| 控制权绝对封顶证明（无单点/组合路径改资金释放规则）| §7、08-4 | 与 08-4 协议终极边界声明一致 | 架构/法务 | |
| 链上升级强制 SSOT hash（enforce 机制）| 08-5、部署脚本 | 链上或部署管线强制校验 08-3 hash | 架构/运维 | |
| 10× 推演演练编号与复盘报告 | §4 演练历史、evidence | table-top 演练、编号、复盘 | 风控/运营 | |
| 系统级拥堵降级策略（限单/保证金/SLA）| §11 或 08-3 | 订单暴涨、链拥堵、RPC 不稳定时自动策略 | 风控/产品 | |
| 司法要求彻底删除 hash 时的 override 机制 | §9、隐私政策 | hash 可脱敏、法律 override 流程 | 法务 | |
| 数据主权/DPA/data controller | 隐私政策或 §11 | 数据分布司法域、法律适用地、控制者 | 法务 | |
| 公司结构/法律实体文件 | 法务/08-4 | 收益路径与法律实体对应、多签与法人隔离、实际控制披露 | 法务 | |
| 经济模型压力测试（坏账率/裁决偏差/黑天鹅损失上限/穿透质押池） | 风控/08-1 | 模型输入参数、最坏穿透结论 | 风控/产品 | |
| 叠加场景压力测试（仲裁偏差 30%×3 月、冻结+争议暴增+脱锚等） | 风控/08-1 | 多变量/叠加场景模拟 | 风控 | |
| 质押覆盖率公式（质押总额/在途风险暴露 ≥ X%） | 08-3 或本节 | 公式与阈值 X 写死 | 风控/产品 | |
| 多签权限矩阵（可改运营参数 vs 不可改资金终态逻辑）（若未在 P0 勾选） | §7 | 一页表或 Runbook 写死 | 法务/架构 | |
| 紧急多签可验证触发条件表（若未在 P0 勾选） | §7 | 触发阈值/可验证条件写死 | 风控/法务 | |
| 关键语义一致性审查列表（08-3 与 08-4 叙事） | 08-2/发版前 | 语义冲突项与结论 | 产品/法务 | |
| Gate 冲突矩阵/优先级规则图 | [08-2 发版前审查二](../docs/spec/08-2-附录-闭合工单表.md#发版前审查二gate-冲突矩阵与优先级规则) | 结构性防冲突 | 法务/架构 | |
| Immutable Core / Proxy / admin / override 边界 | 08-4、01/02 | 终极控制路径写死 | 架构/法务 | |
| 终极控制路径图（一页图：触发人→链上/链下→是否改资金终态）| §7、08-4 或 evidence | 企业级必补；画不出=风险 | 架构/法务 | |
| 不可逆结构图证明（一页图/文档：无路径可改变资金流向，或唯一例外封顶）| §7、01/02、08-4 监管穿透模拟 | 四块深水区证明之一；无=审计要求补齐 | 架构/法务 | |
| 时间权威证明（时间由谁定义+优先级矩阵+冲突解决图）| §11、08-3、08-4 四块深水区 | block/服务器/NTP/人工及 fallback；防时间操纵 | 运维/架构 | |
| 规模失控压力测试（10×争议+Gas+拥堵+恶意+投诉+挤兑；仲裁能力上限/容量模型/降级/排队公平）| §11 或 08-3 | 仲裁处理能力上限、仲裁员容量数学模型、自动降级、排队公平性算法 | 风控/运营 | |
| 文档 vs 链上 enforce（升级脚本 SSOT hash、部署校验 08-3 版本）| 08-5、部署脚本 | process-based vs protocol-enforced 写死 | 架构/运维 | |
| 质押覆盖率 worst-case（5 向导同时违约/单向导最大/同地区集中）| 08-3、Runbook 或风控 | 击穿则写死上限/动态风控/自动暂停 | 风控/产品 | |
| 收益流闭环图（一页：仲裁费/罚没/手续费→归宿；是否可分红）| 治理文档或 08-4 | 企业级审计必要求 | 法务/财务 | |
| 10× 争议触发阈值（SLA 延长/暂停/动态 arbFee）| §11 或 08-3 | 待裁件数或争议率阈值写死 | 风控/运营 | |
| 团队消失推演（至少一次 table-top 或 DR）| §6 | 多签失联+仲裁员退出+公司破产+服务器下线的终局与存量结算 | 法务/运营 | |
| 若被认定为 MSB/强制冻结/KYC 全覆盖的应对路径 | Runbook 或治理文档 | 法务定稿 | 法务 | |
| 治理币不可投票修改的条款（宪法级/supermajority/永远不可升级）| 治理文档或 08-4 | 若未来引入治理币 | 法务/治理 | |
| 声誉洗白防护（金额加权/违约永久或长期标记）| 03 或 Runbook、08-4 第 3 章 | 防小单积累再接大单违约 | 产品/风控 | |
| Escrow 数学封顶（哪些不可升级/须 timelock/须 N-of-M+timelock/是否可改历史订单逻辑）| §7、01/02 | 无 admin override/emergency withdraw/delegatecall 可换逻辑 | 架构/法务 | |
| reorg 后 disputeWindow 是否重算、时区证据冲突 fallback | §11 | 时间一致性攻击完整模型 | 运维/架构 | |
| 默认裁决击穿模拟（80%证据不足+退款优先时向导经济是否崩）| 08-3、Runbook 或风控 | 质押覆盖率压力测试、灰色证据比例高场景 | 风控/产品 | |
| 证据链攻击（S3/单云被封时仲裁能否进行、多地域/多云）| §11、08-4 第 3 章 | 证据可批量删、Hash与GDPR、司法override 写死 | 运维/法务 | |
| 叙事一致性（对外口径 vs 实际控制权下放程度）| 08-4 第 1/8 章 | 当前=混合治理态、非完全去中心化写死 | 法务/产品 | |

---

**文档版本**：v0.1（定稿时写死）  
**最后演练日期**：（首次演练后填写）

*与 [08-1-战略与合规风险检查清单](../docs/spec/08-1-战略与合规风险检查清单.md) B2、[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md) 配套。*
