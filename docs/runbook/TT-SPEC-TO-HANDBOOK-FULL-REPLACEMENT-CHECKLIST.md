# TT — spec → handbook/engineering 全量替代（任务清单 · 按优先级）

| 字段 | 内容 |
|------|------|
| **Version** | 0.5.2 |
| **最后更新** | 2026-04-30 |
| **清单类型** | Runbook · 执行勾单 |
| **项目阶段** | **开发中（未对外发布）** — 下文「发版级 / 企业级」条目 **默认不当作每日必做** |
| **读者** | Owner / 单维护者 |
| **ADR（Why）** | [ADR-20260430（proposed）](../adr/ADR-20260430-engineering-primary-read-path-vs-spec-ssot.md) |
| **真源互链** | [engineering/25 · 95/96/go-live 真源 + eng 替代 spec 路径](../handbook/engineering/25-横切-发版外验审计与CI真源及eng替代spec路径.md) · [engineering/README · 人读 vs 机读](../handbook/engineering/README.md#eng-human-read-vs-spec-mess) · [README · 发版/CI 一句话锚](../handbook/engineering/README.md#eng-spec-release-audit-ci-ssot) · [08 · 删 spec](../handbook/engineering/08-文档与spec迁移台账.md#mig-delete-policy) · [09 · 覆盖率](../handbook/engineering/09-文档迁移覆盖审计报告.md#audit-coverage) · [98 §2](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md) · [SPEC-MIGRATION-STATUS](../handbook/corpus/SPEC-MIGRATION-STATUS.md) · [盘点 §7](../spec-path-dependency-migration-inventory.md#inv-per-path-delete-keep) · [registry/README](../../registry/README.md) · [CONTRIBUTING](../../CONTRIBUTING.md) |

**性质**：本文件为 **How（执行顺序）**；**不**替代 **[04 §3.4](../spec/04-后端与API.md)**、**[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[14](../spec/14-合约-API-ABI-前后端对齐.md)**、**[07](../spec/07-开发流程与顺序.md)** 等**现行**契约真源——**除非**后续 Wave 已 **ADR `accepted` + 门禁与消费方全量迁移** 完成。

| 问 | 答 |
|----|-----|
| **本 Runbook 全部做完，是否 = 可以删 `docs/spec`？** | **否。** 本清单勾选完毕只说明**本 Runbook 范围内的动作**已按表执行；**是否允许删** `docs/spec`（或其中某路径）仍以 **[08 · 删 spec 策略](../handbook/engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[08 §3 矩阵「删除 spec」列](../handbook/engineering/08-文档与spec迁移台账.md#mig-2-matrix)**、**[SPEC-MIGRATION-STATUS](../handbook/corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**、**[盘点 / registry](../../registry/README.md)** 与 **脚本 / CI 消费方去硬编码** 等 **同批闭环** 为准（与 **[08 文首「缺一仍禁止删」](../handbook/engineering/08-文档与spec迁移台账.md)** 同条）。下文 **§14** 全量绿与 **`evidence/GO_*`** 是删径/大闸批次的**佐证材料**，**不**单独构成「整库可删」的充分条件。 |

---

## 0. 开发阶段（未发布）— 本清单怎么读（**你当前适用**）

| 项 | 开发期口径 |
|----|------------|
| **不必上的强度** | **未发布**阶段：**不**把「对外法务承诺、发版 CHANGELOG、分支保护策略、完整企业审计矩阵、条条 evidence」当作**每次 push 的硬门槛**；**Phase G**、**附录 A 大部** 标为 **发版或仓库冻结前再收紧** 即可。 |
| **仍建议保留的习惯** | **`git commit` → `git push`** 前工作区干净；**动到删 spec / 04 路由 / 合约 ABI** 时按 **[CONTRIBUTING](../../CONTRIBUTING.md)** 跑**相关**脚本；**默认禁止裸 `--force`**（防手滑丢远端提交）。 |
| **与仓库根纪律** | 根 **README / AGENTS** 里的**阶次（①②③）**仍在；本段只放宽**「未发布时的日常摩擦」**，**不**鼓励跳过 **删 spec** 程序链（**98 / STATUS / 08**）。 |

---

## 1. 独立开发 · CI 欠费 · 与「PR」无关的收口口径（**必读**）

> **Git 真源（本清单采用）**：在你完成本轮修改并已 **`git commit`** 之后，**以本机仓库为「最新」**——即 **`HEAD` 所在提交链**是你要保留的权威历史。**目标状态**是：**远程 Git 仓库的默认分支**（通常 **`origin/main`**）**与本地默认分支指向同一条已发布提交链**（远端与本地**一致**）。达成方式：在 **§1.1** 对账通过后，使用 **`git push origin <默认分支>`** 把**本地已有提交**送到远端；**不是**用未提交的脏工作区冒充「最新」。
>
> **OFFICIAL-FIRST 澄清（2026-08-22）：** 上文「以本机仓库为最新」仅指 **git 交付 / push 对账**，**≠** 产品 Living SSOT。非 Web3 产品真源 = Official Production **OPS-2026.08.20-v9**（[Dual Truth Planes](./TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md)）。Web3 仍以 FTB + Candidate 为准。

| 项 | 口径（本清单全文统一采用） |
|----|-----------------------------|
| **独立开发** | **Owner = 本人**；**「同批 / 对拍 / 合入门禁」** = **同一变更批次**内书面与脚本一致，可为 **连续若干本地提交**，**不要求**第二人审批（与 **[solo-dev-rhythm §7](../solo-dev-rhythm.md)**、**[SPEC-MIGRATION-STATUS](../handbook/corpus/SPEC-MIGRATION-STATUS.md)** 文首「无 PR UI」同条）。 |
| **CI 欠费 / Actions 不可用** | **不以** GitHub **workflow 顶栏绿** 为唯一收口。**开发期**：按 **[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)** **裁剪**跑与**本轮改动相关**的命令即可；**全量 + `evidence/GO_*`** 留在 **删 spec 批次 / 里程碑 / 准备发版** 再做（路径见 **§14**）。 |
| **不要 PR** | **不**强制使用 **GitHub Pull Request** 界面；允许 **`git push` 直连默认分支**（单人仓库常见）。**仍须**：删 spec 等高风险改动 **单独成批次**，**不夹带**无关功能提交。 |
| **「专提交」含义** | 指 **git 历史上一段可辨认的、仅服务删径/迁径/台账的提交序列**；**≠** 必须开 PR。 |
| **替换完成后的「主线对齐」** | **本地是最新的、远端须与本地一致**：**真源在本地已提交的 `HEAD`**；不走 **feature 分支**、**不走 GitHub PR**。在 **`git status` 干净**后 **`git fetch origin`** → **`git push origin <默认分支>`**，使 **`origin/<默认分支>` 与本地 `<默认分支>` 在 push 成功后指向同一提交**。**开发期**：**§14 全量**与 **`evidence/`** 仅在 **删 spec / 大文档闸 / 准备发版** 时强制；日常小改以 **CONTRIBUTING 裁剪 + 相关测试** 为主（与 **[solo-dev-rhythm §4](../solo-dev-rhythm.md)** 同精神）。 |
| **与强推的边界** | **默认禁止** `git push --force` / `--force` 覆盖远端：易丢失**仅存在于远端**的提交、破坏他人/未来机器上的审计链。若确属「远端必须丢弃」的极端情况，须 **书面原因 + 备份远端引用**；**优先** `git push --force-with-lease`，且 **确认** `origin/<默认分支>` 上**无**未拉取的独占提交。 |

### 1.1 直推主线 · 以本地为准（操作序）

**验收句（可自查）**：**`git fetch origin` 后**，若本地已包含要发布的全部提交，则 **`git rev-parse HEAD`** 应与 **`git rev-parse origin/<默认分支>`** 在 **`git push` 成功后**相等；此前 **`git log --oneline origin/<默认分支>..HEAD`** 列出的是**待送给远端、使远端与本地对齐**的提交。

| 步骤 | 动作 | 完成条件（DoD） |
|------|------|-----------------|
| 1 | **工作区干净** | **`git status`**：无未提交改动；**`??`** 若须进仓已 **`git add`** 决策完毕。 |
| 2 | **对账远端** | **`git fetch origin`**；**`git log --oneline origin/<默认分支>..HEAD`** 输出即**拟上送**提交列表（应为本次替换/台账/证据相关）。 |
| 3 | **门禁与证据** | **删 spec / 大文档闸 / 准备发版**：**§14** 全量 **`exit 0`** 且按需落 **`evidence/GO_*`**。**日常开发小改**：跑与改动相关的检查即可，**不强制**本轮写 `evidence`。 |
| 4 | **直推默认分支** | **`git push origin <默认分支>`** 成功；**未**创建 PR、**未**使用功能分支作为必经门槛。 |
| 5 | **`push` 被拒** | **先** `git fetch` 比对：若远端**领先**本地，**须** `merge`/`rebase` 消化后再推；**不**把「以本地为准」偷换成**无审查强推**。 |

### 1.2 多维风险（直推 / 以本地为准 · **发版前再收紧**）

> **开发期**：下表 **R3「审计可见性」**、**R2 分支保护** 等可**降级**为「有则更好」；**R1 / R4 / R5** 仍建议保留习惯。

| 风险 ID | 领域 | 现象 / 根因 | 缓解 |
|---------|------|----------------|------|
| R1 | **连续性** | 另一台电脑或旧 clone **仅有远端**上有提交 | 推前 **`fetch` + `log`**；重要节点 **`git bundle` 或裸仓备份** |
| R2 | **协作** | 未来引入第二贡献者后仍习惯强推 | **分支保护**打开后本表 **§1** 须复审；**禁止**默认 `--force` |
| R3 | **审计** | 直推无 PR 界面 → **证据链**更难被外人发现 | **合并说明**或 **`evidence/`** 写清命令与 **commit range** |
| R4 | **安全** | 误推含密钥 blob | 推前 **G3**；**`.gitignore`** / **secret scan** 与 **[CONTRIBUTING](../../CONTRIBUTING.md)** 同条 |
| R5 | **配置漂移** | 本地 `user.name` / 全局 git 配置与预期不符 | 推前 **`git log -1`** 看作者行是否符合项目署名策略 |

---

## 2. 任务表列说明（**全 Phase 统一**）

以下 **Phase A～H** 各节「任务表」列均为：

| 列名 | 含义 |
|------|------|
| **任务 ID** | 稳定键，如 `A1`、`B2`。 |
| **优先级** | `P0` 必须先做 → `P4` 可后置。 |
| **任务摘要** | 一句话可执行项。 |
| **完成条件（DoD）** | 可勾选、可审计的 **exit 0 / 书面 / 产物路径**。 |
| **先决依赖** | 须先完成的任务 ID 或 Phase。 |
| **证据 / 同批说明** | **删径 / 发版级批次**：本地输出 + **`evidence/GO_*`**。**日常开发**：可仅 **终端通过记录**；**同批**指与 **08/09/98/STATUS/盘点/registry** 书面一致时须全链；**不要求** PR。 |

---

## 3. L1～L4：「完全替代 spec」的可操作定义

| 层级 | 任务 ID | 含义（DoD 口径） | 与「删光 `docs/spec/`」 |
|------|----------|------------------|-------------------------|
| **L1** | `L1` | 日常 **默认只读** `engineering/` + `corpus/REG-*`，**按需**打开 **spec** 契约窗 | **否** |
| **L2** | `L2` | 非契约长文、重复索引、考古材料 **合并或迁出** `spec/`（可留 **兼容壳**） | **通常否** |
| **L3** | `L3` | **04 §3.4 / 93 / 部分脚本输入** 等 **迁出 spec** 且 **全部消费方** 已改读新真源 | **高风险**；须 **单独 Wave** |
| **L4** | `L4` | `docs/spec/` 仅剩 **A 类法定壳** 或 **归档只读 + 极薄入口** | **可能仍非空** |

**结论**：「完全替代」= **L1→L2→（可选）L3→L4** 阶梯；**不**建议把成功标准写成「`docs/spec/` 必须空目录」除非 **ADR + 法务/产品** 明确允许动 **04/93/14**。

---

## 4. Phase A — 治理与口径（P0）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| A1 | P0 | ADR-20260430 进入评审 | Owner 已读 `proposed`；列出 **不接受迁移** 的 spec 子集（初稿） | — | ADR 文内或合并说明可链 |
| A2 | P0 | ADR → `accepted`（若采纳两层模型） | 状态改为 `accepted`；**98 / 00 读前 / CONTRIBUTING** 与「仅导读」冲突句已 **同批** 修订或加例外 | A1 | 同批提交说明 |
| A3 | P0 | 冻结「口头替代」 | **合并说明 / 评审话术**：禁止写「engineering 已替代 04/93 表体」除非附 **V-1～V-3** + **04/93** 变更锚点；**不要求** GitHub PR | A2 或与之并行草案 | 可与 **`.github/PULL_REQUEST_TEMPLATE.md`** 同批（若仍使用 PR）；无 PR 则写入 **合并说明** |

---

## 5. Phase B — 盘点与机读地图（P0）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| B1 | P0 | 全量分类 `docs/spec/**/*.md` | 每文件或每簇 **A/B/C**（与 [盘点 §1](../spec-path-dependency-migration-inventory.md#inv-classification-abc) 同源）；产物路径 **写死**（建议 `registry/derived/spec-inventory-classification.v1.yaml` 或等效） | A1 | 产物入 Git；可选 validator |
| B2 | P0 | consumers 清单 | `scripts/`、`.github/workflows/`、`docs/`（spec 外）中 **`docs/spec` 字面量** 均已登记；**`python registry/scan-spec-consumer-refs.py --strict`** **exit 0** | B1 | 终端输出进 **`evidence/GO_*`** |
| B3 | P0 | registry 对拍 | **`python registry/validate-spec-path-dependencies-registry.py`** **exit 0**；**`python registry/audit-inv7-vs-registry-classification.py`** **exit 0** | B2 | 与 **盘点 §7** 无互斥 |

---

## 6. Phase C — 人读路径收口（P1 · L1）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| C1 | P1 | README 与 spec/00 主序列对拍 | **P0 路径** 可不打开 spec 根目录完成环境 + 真值栈；缺链已补 | B1 | **08/09** 矩阵无矛盾 |
| C2 | P1 | corpus/REG-* 与 01～04 | **09 §3**、**08 §3** 行级 **`删除 spec=no`** 仍成立 | C1 | 书面自检即可 |
| C3 | P1 | 「乱」合并计划 | 产出表：候选簇、Owner、**明确不动** 04/93/14 | C1 | Issue 或 `docs/` 内表均可 |

---

## 7. Phase D — 叙事迁出与双写（P2 · L2）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| D1 | P2 | 选第一批 C 类 / 考古簇 | **98 §2** 登记；**STATUS** 更新；**08 §3** 备注含 **回滚锚** | Phase B | 同批 |
| D2 | P2 | 双写期（若需要） | 旧路径 **兼容壳**；新正文在 **handbook/corpus**；链接不红；**回滚分支名或 tag** 已记录 | D1 | 与 **`evidence/GO_*`** 同记 |
| D3 | P2 | `git rm` 专提交批次 | **P-A～P-D** 全绿；**仅删径相关提交**；**无**功能夹带；**不要求** GitHub PR | D2 | **solo-dev §6.5** + STATUS 对拍 |

---

## 8. Phase E — 机读窗迁移（P3 · L3 · 可选）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| E1 | P3 | 选定单一机读窗 | ADR **accepted**；新载体 **schema** + **validator** 落地 | D 经验 + A2 | 单独 Wave |
| E2a | P3 | HTTP 消费方 | 触 **04 / 路由 / `frontend/app`** 时 **`bash scripts/run-check-04-routes.sh`** **exit 0** | E1 | 本地日志 |
| E2b | P3 | ABI 消费方 | **`bash scripts/check-55-s13.sh`**（及 **`forge test`** 若适用）**exit 0** | E1 | 本地日志 |
| E2c | P3 | PG / Onboarding 证据链 | 触 **96-18 / TT-9618** 时与 **[CONTRIBUTING](../../CONTRIBUTING.md)** 该节及 **`tt-9618-onboarding-pg-evidence.sh`** 对拍 | E1 | 见 CONTRIBUTING |
| E3 | P3 | spec 侧降级叙事 | 原节写 **「已迁移，真源见 X」**；若 bump **07** 则 **`bash scripts/check-07-version-triple.sh`** **exit 0** | E2a–E2c | 与 **spec/00** 对拍 |

> **默认**：**93 表体**、**04 §3.4**、**14 ABI 字节** 无强理由前 **保留在 spec**。

---

## 9. Phase F — 树最小化与归档（P4 · L4）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| F1 | P4 | spec 根目录极薄化 | **spec/00** 与物理树一致；**27-archived** 等不变量满足 | Phase D 多轮 | 书面 + 可选脚本 |
| F2 | P4 | 可选归档分支 | 只读镜像分支存在；默认分支策略已写 | 组织策略 | 合并说明 |
| F3 | P4 | 终验 | **STATUS P-D**、**96/98**、**盘点 §7** 书面闭合；**CI 欠费时** **solo-dev §6.5** 证据齐全 | 全部前置 | **`evidence/GO_*`** |
| F4 | P4 | CI 恢复后旁证（可选） | Actions 可用后复跑同一命令集；**不**推翻本地已收口结论 | F3 | Actions log URL 可选贴 |

---

## 10. Phase G — 企业级横切（P2 · **开发期可整段跳过**，发版/冻结前收紧）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| G1 | P2 | 删径审计表 | 字段含：路径、理由、98 行、STATUS 行 id、证据目录、回滚指针；与 **盘点 §7** 一一对应 | D3 前后 | 非代码表即可 |
| G2 | P2 | 外链与入站 | **`check-handbook-engineering-local-md-links`**（适用时）；**spec/00** 无死链到已删路径 | C3、D3 | 本地输出 |
| G3 | P2 | 安全扫尾 | **`git rm`** 目标路径 **密钥模式** 人工抽查；（可选）**gitleaks** | D3 | 记录结论 |
| G4 | P2 | 度量基线 | Wave 前后：**`scan` hits / unlisted**、断链数、P0 耗时 | B3 后任意 | 表或 `evidence` |

---

## 11. Phase H — 主线直推与远端对齐（**P0 · Wave / 替换批次收口**）

| 任务 ID | 优先级 | 任务摘要 | 完成条件（DoD） | 先决依赖 | 证据 / 同批说明 |
|---------|--------|----------|-----------------|----------|-----------------|
| H1 | P0 | 推送前 Git 对账 | **`git fetch origin`**；**`git log --oneline origin/<默认分支>..HEAD`** 与预期提交一致；**`git status`** 干净 | §14 绿、本 Wave DoD 已满足 | 终端输出可进 **`evidence/GO_*`** |
| H2 | P0 | 直推默认分支 | **`git push origin <默认分支>`** 成功；**无** feature 分支门槛、**无** GitHub PR 要件 | H1 | 与 **§1.1** 同序 |
| H3 | P1 | 被拒后的合流 | **`push` 被拒**时：`fetch` 后 **merge 或 rebase** 远端领先提交，再推；**记录**远端曾领先的 **commit id** | H2 失败时 | 合并说明 |
| H4 | P2 | 极端：force-with-lease | **仅**在书面确认「远端可丢」且已备份；**`git push --force-with-lease`**；**禁止**默认 `--force` | 书面 + Owner | 单独说明文件或 ADR 附录 |

---

## 12. 附录 A — 企业级多维自检（审计矩阵 · **发版/冻结前可选** · 开发期可跳过）

| 审计 ID | 维度 | 现状（清单内） | 缺口 / 优化动作 | 建议落入 |
|---------|------|----------------|-----------------|----------|
| X1 | GRC | Phase A | ADR **Decision log**；删径台账字段；法务/对外边界 | G1、A2 |
| X2 | BC/DR | Phase D/F | 回滚演练模板；RPO/RTO；归档分支保护；站外入站链 | D2、F2 |
| X3 | 工程门禁 | Phase E | **E2a–E2c** 已拆行 | E |
| X4 | 安全 | Phase G | gitleaks / 人工密钥抽查 | G3 |
| X5 | MQ | Phase G | KPI 基线 + Wave 对比 | G4 |
| X6 | 组织 | Phase C/B | **product-manager** 等若链 spec 须登记 consumers | B2、C3 |
| X7 | Git / 同步 | §1.1–H | **另一远端 / fork** 若存在：须声明以哪一 **`remote`** 为「主线」；多远端时防推错 | H1 |
| X8 | 运维 | §1.2 R1 | **裸备份**（`git bundle` / 镜像 clone）在**大删径或大强推**前是否做过 | H4 前 |
| X9 | 合规 | 直推无 PR | **CODEOWNERS / 分支保护** 若开启：直推是否仍被允许；若否则本表「无 PR」须改为「内网 PR 或本地审批记录」 | 组织策略 |
| X10 | 供应链 | `git` 钩子 / 签名 | 是否启用 **GPG/SSH commit 签名**、**pre-push** 钩子；与项目安全基线对拍 | CONTRIBUTING |
| X11 | 语义纠偏 | §1「以本地为准」 | 是否已向全员澄清：**以本地为准** = **正常 `push` 传播本地已提交历史**；**≠** 默认 **`--force` 覆盖远端** | §1.2、H4 |

---

## 13. 附录 B — 建议并入主表的补充键（与 §4～11 同 Phase 编号体系）

| 建议 ID | 任务摘要 | 落入 |
|---------|----------|------|
| S1 | B1 产物路径写死 + 可选机读校验 | B1 |
| S2 | D2 同存 **回滚 tag/分支名** | D2 |
| S3 | E2 拆 **E2a / E2b / E2c**（已在 **§9 · Phase E**） | — |
| S4 | F4 CI 恢复旁证（已在 §9） | — |

---

## 14. 每批次 / 每合并前必跑（**独立开发 · 无 CI**）

以下在仓库根执行。**开发期**：**删 spec / 迁机读 / 动 registry·盘点·handbook 大块** 时建议 **全跑**；**小改** 按 **[CONTRIBUTING](../../CONTRIBUTING.md)** **裁剪**。**准备发版 / CI 仍欠费** 时：以 **`exit 0`** 为准，**`evidence/GO_*`** 仅在 **里程碑 / 删径** 需要时落盘，**不以**远端绿替代。

```bash
python registry/validate-spec-path-dependencies-registry.py
python registry/audit-inv7-vs-registry-classification.py
bash scripts/check-handbook-frontmatter.sh
bash scripts/check-handbook-engineering-content.sh
python registry/scan-spec-consumer-refs.py --strict
# 触 HTTP / 04 / 前端路由 时追加：
# bash scripts/run-check-04-routes.sh
export CARGO_HOME="$(pwd)/.cargo-home-mig-evidence"
mkdir -p "$CARGO_HOME"
cargo test -p traveltrust-api
```

证据目录：**`evidence/GO_YYYYMMDD_*/`**（与 **[solo-dev-rhythm §3](../solo-dev-rhythm.md)** 同源）。

---

## 15. 维护

| 项 | 说明 |
|----|------|
| **Owner** | 单维护者 = 本人自检（**solo-dev §7**）。 |
| **本清单变更** | 改 **L1～L4** 或 Phase 含义时，**同批**更新 **ADR-20260430** 与 **engineering/README · `#eng-human-read-vs-spec-mess`**。 |
| **版本** | 见文首 **Version** 行。 |
