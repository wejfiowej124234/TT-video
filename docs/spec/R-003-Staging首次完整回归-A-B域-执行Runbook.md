# R-003 · Staging 首次完整回归（A + B 域）— 执行 Runbook

**Version:** 1.2.9  
**Status:** **实战里程碑 SSOT** — 在 **真实 staging**（**已接 PostgreSQL**、**语义与部署一致**）按 **[R-002](R-002-回归执行闭环与发布准入.md)** 跑通 **第一次**「规范 → 证据 → 机读闸 → Gate」；**仓库内文档无法替代真跑**。  
**互指**：[93](93-全站功能验证矩阵-域别回归清单.md) · [R-001](R-001-全站回归报告模板与汇总JSON结构.md) · [R-002 §2 环境矩阵](R-002-回归执行闭环与发布准入.md) · [go-live-checklist §0.3](../go-live-checklist.md) · **下一阶段** **[R-004](R-004-R003之后的扩展回归路线图.md)**（**R-003 完成后**）

## 本轮唯一目标（执行流水线 · 禁止跳步）

**下一工作单元只做一件事**：按下列顺序完成 **R-003 首轮 staging 实战回归**，并产出 **首份**可审计的 **`report.json`** + **GO / PARTIAL_GO / NO_GO** 判定。

| 顺序 | 阶段 | 做什么 | 过关条件 |
|:----:|------|--------|----------|
| **1** | **阶段 0 — 环境自证** | 建 **`report.json` 壳**；按 **§2** 书面确认 staging；落盘 **`ENV-DB-PROOF/`**（**铁律 ①**） | **四元组真实** + **至少一次写后读**证明 PG 持久化可用 |
| **2** | **阶段 1 — 仅 A 域** | 按 **§1** 本轮计划跑完 **全部 A-***（证据目录齐） | 计划内 A 域条目 **100% `PASS`**（**无 `FAIL` / `BLOCKED`**）；不适用项须 **事先**约定为 **`N_A`/`NOT_RUN`**，**禁止**用「跳过」冒充 **PASS** |
| **3** | **门禁（A→B）** | 执行人 + 复核人 **口头/工单确认**：A 已绿、DB 佐证仍有效 | **未通过则禁止进入阶段 2**（**铁律 ②**）；需修环境或 **NO_GO** 并 **另起 `run_id`** |
| **4** | **阶段 2 — B 域** | **§2.0 五连** + **§2.1～2.4**（仅门禁通过后） | **`cases[]`** 含 B 域行；**`FAIL`/`BLOCKED`** 均有非空 **`notes`** |
| **5** | **收口** | 填 **`finished_at`**、**`release_gate`**、**`release_gate_reason`**（**93 §7.1**）；跑 **validate** | **`release_gate_reason`** 可复述判定依据；**`python scripts/validate-regression-report.py … --fail-on-no-go`** **exit 0** |

**首份 `report.json` 最低质量**：凡出现 **`FAIL`/`BLOCKED`**，**`notes` 不得为空**；**`release_gate_reason`** 与 **Gate 枚举**一致且 **可被 Release Owner 复核**（**铁律 ③**）。

**停机线（现场执行）**：**A 域**出现任一 **`FAIL`/`BLOCKED`** → **立即停止本轮**，整轮记 **`NO_GO`** 或 **另起 `run_id`**；**不得**继续跑 **B**。

<a id="r003-ab-core-acceptance"></a>

### A+B 核心链路：可控环境下的「真实跑通」唯一验收标准

在 **可控环境**（本地 **Docker+PG**、**staging** 等，**须**与 **`environment` 四元组**一致）中，除按上表跑 **A→B** 用例外，**端到端主链**须打通并满足 **下列三条同时成立**，方可视为 **系统已真实跑通**（**仅 HTTP 200 或仅内存态不算**）：

**主链顺序（语义）**：**注册** → **登录** → **`GET /api/v1/me`** → **市场**（**`GET /api/v1/discover/orders`** 或团队与 **04 §3.4** 一致的等价入口）→ **创建订单** → **订单详情/列表** → **消息**（与 **[93 §2](93-全站功能验证矩阵-域别回归清单.md)** 主路径一致）。

| # | 验收 | 说明 |
|---|------|------|
| **1** | **API 成功** | 各步为 **预期成功**（状态码与 body 与当前契约一致），**非**占位/mock 冒充。 |
| **2** | **数据落库** | 用户/会话/订单/消息等 **在 PostgreSQL**（或 **`report.json`** 已声明且 **R-002 §2** 允许的持久化真源）**可查询到**，与响应中的 **`id`/`order_id` 等** 可追溯对应。 |
| **3** | **可回读一致** | 对同一实体 **再次 GET** 或 **只读 SQL**，与首次写入 **一致**（字段范围按团队与 **93** 约定）。 |

**结论（执行人必读）**：**(1)(2)(3) 未同时满足 → 整轮 `release_gate` 须为 `NO_GO`，** **阻断发布**（**不得**用 **GO** 或 **PARTIAL_GO** 掩盖本主链缺口）；须在证据（**`requests/`**、**`ENV-DB-PROOF/`**、**`summary.md`**）及 **`report.json`** 对应 **`cases[].notes`** 中**如实记录**。**(2)(3)** 未满足时同时适用 **铁律 ①**（见 **`evidence/r003_staging_first/README.md`**）。

**本地自动化烟测（非发版证据）**：API 已监听 **`API_BASE_URL`**（默认 **`http://127.0.0.1:8080`**）、且建议 **`SEED_TEST_ACCOUNTS=1`** 时，可运行 **`bash scripts/smoke-ab-core-chain.sh`** — 走 **注册→登录→/me→discover→下单→订单→消息**，并可选 **`DATABASE_URL`** 抽检 **`orders` / `users` / `order_messages`**（**`psql`** 或 **`docker exec traveltrust-postgres psql`**，见 **[开发验收基线](../dev-local-smoke-baseline.md)**）；**不替代** staging **`report.json`**。

---

## 铁律三条（防「假 PASS」· 执行人必读）

**背景**：第一次 R-003 极易出现 **`report.json` 机读通过、实际系统半通** —— 例如 **local / 半配置 staging**、**`DATABASE_URL` 未真正连上**、**`chain_off` 在跑却当「真链语义」**、**HTTP 200 实为 mock/占位**。以下三条为 **流程硬规则**（与 **[R-002 §2.1](R-002-回归执行闭环与发布准入.md)** 互指）。

### ① 没有 DB 持久化佐证的 PASS，一律不算 PASS

- **定义**：至少一条 **写路径**（注册/登录态、订单、消息、评价等）在 **服务端可二次验证** —— 例如 **DB 再查同一 `order_id` / `user_id` 行**、或 **运维认可的审计表/事件表** 与 API 响应 **一致**；**禁止**仅凭「当时 200 + 响应 body 像对」记 **PASS**。
- **若无法证明** staging PG 上有 **跨请求持久状态**：相关用例 **最高** **BLOCKED** 或 **FAIL**；整轮 **最高** **`PARTIAL_GO`**（须在 **`release_gate_reason`** 写明 **「无 DB 持久化自证」**）。**禁止**在此情形下对外宣称 **GO**。
- **自证落盘**：本轮证据包内须有 **`evidence/…/ENV-DB-PROOF/`**（或等价名）短 **`notes.md`**：**脱敏**说明「用哪条 API/哪张表/哪次二次查询」证明非内存假成功 —— **不必**提交连接串。

### ② A 域须先于 B 域：未 100% PASS 不得进入 B

- **原因**：**A 域**（会话、**/me**、鉴权）不稳时，**B / C / D 结果全部无效**（典型：**token 飘移**、**/me 偶发 401**、**session 丢失**）。
- **执行顺序**：**阶段 0 = 环境自证** → **阶段 1 = 仅 A 域**（§1 表内本轮计划条目）→ **门禁** → **阶段 2 = B 域**。**阶段 1** 要求计划内 A 条目 **100% `PASS`**（见上文 **「本轮唯一目标」** 表）；仅 **事先书面** 标为 **`N_A`/`NOT_RUN`** 者可例外。**禁止**「边跑 A 边记 B」、**禁止**同一 `run_id` 下交错执行。
- **若 A 出现 FAIL**：**停止** B 域；先修环境或记 **NO_GO**，**另起**一轮 `run_id`。

### ③ 首份 `report.json` 质量决定体系是否「活下来」

- **`environment`**（**[R-001 §2.1](R-001-全站回归报告模板与汇总JSON结构.md)** 四元组）须与 **真实部署**一致；若实际为 **`chain_off`**，**必须**写 **`chain_mode":"chain_off"`**，**禁止**写成 **`testnet`**「好看」。
- 每条 **FAIL** 须有 **`notes`**（或 **`blocker:true`** 与 **93 §7.1** 对齐）；每条 **BLOCKED** 须有 **`notes` 原因**；**`release_gate_reason`** 须 **可被** Release Owner **对照 93 §7.1 复述**，禁止一句空话。
- **机读通过 ≠ 业务通过**：**D2** 与 **①②③** 同时满足，本轮才算 **R-003 合格交付**。

---

## 0. 本 Runbook 的唯一交付物（验收标准）

| # | 交付物 | 合格标准 |
|---|--------|----------|
| **D1** | **首份「真实 staging」** `report.json` | **首选路径** **`evidence/r003_staging_first/run_<UTC>/report.json`**（与 **[`evidence/r003_staging_first/README.md`](../../evidence/r003_staging_first/README.md)** 一致）；或 **`evidence/GO_YYYYMMDD/report.json`**；**`environment.name` = `staging`**；**`database` = `enabled`**；**① DB 持久化自证**已落盘（见 **铁律 ①**） |
| **D1b** | **首份报告质量** | **③** 满足：四元组真实、FAIL/BLOCKED 有因、**`release_gate_reason`** 可审计 |
| **D2** | **机读硬校验** | **`python scripts/validate-regression-report.py <path> --fail-on-no-go`** **exit 0**（结构合法且 **`release_gate` ≠ `NO_GO`**） |
| **D3** | **正式 Gate 文本** | **`release_gate`** ∈ { **`GO`**, **`PARTIAL_GO`**, **`NO_GO`** } + **`release_gate_reason`** 与 **[93 §7.1](93-全站功能验证矩阵-域别回归清单.md)** 可逐条对照 |
| **D4** | **A + B 域已执行** | **阶段 0→1→门禁→2**（见 **「本轮唯一目标」**）：**A** 计划内 **100% PASS** + **DB 佐证**；**B** 在门禁后：**§2.0 五连** + **§2.1～2.4**（见 **§1 范围**） |
| **D5** | **会签留痕** | **Release Owner 双签** + **`report.json` 路径** + **`sha256`** + **`release_gate`/`release_gate_reason`**（与 **[go-live-checklist §0.3](../go-live-checklist.md)** **四样齐**） |

**说明**：若 staging 当时 **不具备**消息能力导致 **B-MSG-002** 为 **BLOCKED**，**允许** **`PARTIAL_GO`**，**但必须**在 **`release_gate_reason`** 写清 **与 R-002 §5 / 93 §2.0** 一致的原因。

---

## 1. 范围：本轮 **A 域 + B 域**（不含 C/D 全量）

| 域 | 必跑（最低） | 引用 |
|----|--------------|------|
| **A** | **A-ENV-001**，**A-LOG-001～003**，**A-ME-001**，**A-NEG-001～002**；其余 **A-*** 按资源勾选，未跑列 **NOT_RUN** | [93 §1](93-全站功能验证矩阵-域别回归清单.md) |
| **B** | **§2.0 五连**：B-MKT-001、B-GDE-001、B-ORD-001、B-ORD-003、B-MSG-002；**加** §2.1～2.4 主表 | [93 §2](93-全站功能验证矩阵-域别回归清单.md) |

**不纳入本轮必达**：C/D 全量、Admin 抽检（可在 `cases[]` 记 **NOT_RUN**）。

---

## 2. Staging 环境前置（与 **R-002 §2** 对齐）

执行前 **四人组**（QA + 后端 + 运维 + 前端）确认并 **书面**（可记在 **`evidence/…/ENV-DB-PROOF/notes.md`** 或团队 **`notes.md`**）：

| 检查项 | 期望（staging） |
|--------|-----------------|
| **非 local** | **`environment.name`** 在报告里必须是 **`staging`**；**禁止**用 **local** 报告冒充本轮（**R-002 §1**） |
| **API Base** | 浏览器/CI 可达的 **`NEXT_PUBLIC_API_BASE_URL`** 或同源代理指向 **staging API**（**非**仅本机 `localhost` 除非团队书面约定其为 staging 入口） |
| **`database`** | **`enabled`**：**`DATABASE_URL`** 指向 **staging PG**，迁移已应用；**须**完成 **连接性 + 至少一次写后读**（见 **铁律 ①**） |
| **`chain_mode`** | 与 **进程真实配置**一致：**testnet** / **mainnet** / **`chain_off`** 三选一如实填写；**禁止**「实际 chain_off、报告写 testnet」 |
| **`auth_mode`** | 记录真实：**cookie** / **bearer** / **mixed**（**93 §0.3**） |
| **测试账号** | 至少 **旅行者 + 向导**（**87 / 04** 角色一致） |
| **非 mock 语义** | 若某路径仅为占位实现，须在对应 **`cases[].notes`** 写明；**禁止**对占位路径记 **PASS** |
| **chain_off / 消息** | 若消息 **501**：**B-MSG-002** 记 **BLOCKED**，Gate **PARTIAL_GO** 路径见 **§0** |

---

## 3. 执行顺序（建议 **同一日历日** 内完成 · **阶段 0 → 1 → 门禁 → 2**）

### 阶段 0 — 环境自证（壳子 + DB 佐证）

1. 打开 **[templates/regression-report.staging.min.json](../../templates/regression-report.staging.min.json)** 复制为 **`evidence/<你的目录>/report.json`**，填 **`environment`**（**四元组真实**）、**`executor`**、**`started_at`**。  
2. 完成 **§2** 检查清单与 **铁律 ①** 的 **`ENV-DB-PROOF/`** 落盘（**写后读**）。

### 阶段 1 — 仅 A 域（目标：**100% PASS** + DB 佐证仍成立）

3. 按 **93 §1** 跑完 **§1** 表内 **本轮计划** 的 **A-*** 用例；每条 **`evidence/.../A-xxx/`** 脱敏证据。  
4. 将 A 域结果写入 **`cases[]`**：计划内条目须为 **`PASS`**（或预先约定的 **`N_A`/`NOT_RUN`**，**不得**与 **PASS** 混用糊弄）。

### 门禁（A → B）— **未签字不得进入阶段 2**

5. **确认**：**①** **`ENV-DB-PROOF`** 仍描述当前环境；**②** 计划内 **A 域无 `FAIL`/`BLOCKED`**；**③** 无 **token / `/me` 401 / session 丢失** 未结案。  
6. **未满足** → **停止**；修环境或记 **NO_GO**，**另起 `run_id`**（**铁律 ②**）。

### 阶段 2 — B 域（仅门禁通过后）

7. 先 **§2.0 五连**，再 **§2.1～2.4**；订单 **id** 记入 **`notes.md`** 便于审计。  
8. **汇总**：**`cases[]`** 含 A+B；**`summary`** 与条数对齐；凡 **`FAIL`/`BLOCKED`** 必有非空 **`notes`**（**铁律 ③**）。  
9. 填 **`finished_at`**；按 **93 §7.1** 写 **`release_gate`** / **`release_gate_reason`**（与 **GO / PARTIAL_GO / NO_GO** 一致）。  
10. **硬校验**（**必须**）：  
   ```bash
   python scripts/validate-regression-report.py evidence/<你的目录>/report.json --fail-on-no-go
   ```  
   **若 `release_gate` 为 `NO_GO`**：本命令 **exit 1** —— **预期行为**，用于 **合并/发版阻断**。  
11. **会签**：Release Owner **双签** + 路径 + 可选 **sha256**。  
12. **回填仓库（可选）**：将 **脱敏后的 `report.json`** 提交 PR 或仅存 **Ops 对象存储**；**禁止**提交含真实 token 的原始响应。

<a id="r003-go-freeze-signoff"></a>

### 3.1 首轮 `release_gate` = **GO** 之后 — 冻结证据包并完成放行会签（唯一目标）

**当** `python scripts/validate-regression-report.py …/report.json --fail-on-no-go` **exit 0** 且 **`release_gate`** 为 **`GO`** 时，**下一工作单元只做下列顺序**；**`PARTIAL_GO`** 的收口以 **[93 §7.1](93-全站功能验证矩阵-域别回归清单.md)** 与 Release Owner 书面约定为准，其中 **①～③** 仍须落实，**④** 是否与 **GO** 等同进入合并闸由团队定义。

1. **立刻补全** **`ENV-DB-PROOF/notes.md`**：由具备 **staging PostgreSQL** 权限的人写完 **铁律 ①** 的写后读佐证（脱敏查询/结论，并与 **`phase2/b_domain_chain.redacted.json`** 等响应对齐）。**未补全前不得对外宣称本轮 GO 已闭环放行。**
2. **冻结本轮证据包**：**禁止**再覆盖本次 **`report.json`** 及同一 **`run_id`** 下本目录证据；若入 **Git**，以**该次提交**为锚点；必要时对 **`report.json`** 或整包 **tar** 记录 **`sha256`**（与 **§5** 表及 **[R-002 §1](R-002-回归执行闭环与发布准入.md)** 发版工单字段一致）。**会签通过后**，向 **`evidence/GO_20260418/`** 提交 **`.r003-go-frozen`** 标记文件（可为空文件或含单行 UTC / `run_id` 说明，**勿含密钥**），以 **启用** GitHub Actions **[`r003-go-staging-freeze-gate.yml`](../../.github/workflows/r003-go-staging-freeze-gate.yml)**：此后 **PR / push 至 `main`** 若修改该目录或 **`release_gate`≠`GO`**，门禁 **失败**（见 **§5** 将本 job 设为 **required**）。
3. **会签 / 放行**：向 **Release Owner** 提交 **`report.json` 路径**、**validate 命令及结果（exit 0）**、**证据根目录**、**`release_gate=GO`**（及可复述的 **`release_gate_reason`**）；取得 **双签**（或团队等效会签）后，再进入下游。
4. **合并 / 发布闸**：按流程开 **PR** 或继续 **go-live checklist**；**不要**为「整理证据」而重跑与本放行无关的脚本以致覆盖已冻结目录。
5. **扩面 / 下一轮**：**C / D 域**或后续回归须 **另起** 独立 **`run_id`** 与证据目录（见 **[R-004](R-004-R003之后的扩展回归路线图.md)**），**不得污染**本轮 **GO** 证据包。

---

## 4. 与「4 类执行层问题」的对照

| 问题 | R-003 如何收口 |
|------|----------------|
| **1 真实环境** | **铁律 ①②** + 本文 **§2 + §3**：**staging**、**DB 真连**、**chain_mode 如实**、**A→B 串行**。 |
| **2 映射表维护** | 跑完后 **7 日内** 更新 **[R-002 §4](R-002-回归执行闭环与发布准入.md)**：标明 **AUTO-P0** 哪些 **已有** `crates/api` 测试 / 哪些仍 **缺**。 |
| **3 社区富媒体** | **本轮不挡 Gate**；若未测，在 **`release_gate_reason`** 单列 **「富媒体未验证」**（与 **R-002 §5** 一致）。 |
| **4 CI 默认闸** | 见 **§5**；**merge 前**建议至少 **手动** 跑 **validate**；**validate 通过不能替代 ①②③**（**铁律**）。 |

---

## 5. CI 与「必须执行」（可选落地 · 不阻塞本文完成）

| 动作 | 说明 |
|------|------|
| **GitHub Actions** | 仓库内 **[`.github/workflows/regression-report-validate.yml`](../../.github/workflows/regression-report-validate.yml)**：**`workflow_dispatch`** 输入 **`report.json` 路径**，跑 **`validate … --fail-on-no-go`**。 |
| **GO 冻结合并闸（§3.1）** | **[`r003-go-staging-freeze-gate.yml`](../../.github/workflows/r003-go-staging-freeze-gate.yml)**：当 **`main`** 上存在 **`evidence/GO_20260418/.r003-go-frozen`** 时，**PR / push** 不得修改 **`evidence/GO_20260418/`** 下任意文件，且 **`report.json`** 须 **`validate … --fail-on-no-go --require-go`**。**`main` 分支保护**须将 job **「R-003 GO staging freeze gate」** 设为 **required status check**（与 **IMP-EV-001** / **[`evidence-manifest-validate.yml`](../../.github/workflows/evidence-manifest-validate.yml)** 同模式；实现脚本 **`scripts/ci/r003-go-staging-freeze-gate.sh`**）。 |
| **PR 习惯** | 凡提交 **`evidence/**/report.json`** 的 PR，作者 **自证** 已本地通过 **validate**；Review 抽查命令。 |
| **发版工单** | **强制**字段：`report.json` **路径 + SHA256**（**R-002 §1** 已定义）。 |

**原则**：**R-003 里程碑完成** ≠ **CI 已默认全绿**；**CI** 是 **把「建议」变成「默认」** 的下一棒。

---

## 6. 完成后请关闭的「待办」（团队）

- [ ] **R-002 §4** 映射表更新一行：**「R-003 @ staging @ YYYY-MM-DD」**  
- [ ] **issues**（若尚无）：**「CI: validate report.json on dispatch / optional path」**  
- [ ] **进入第二阶段**：按 **[R-004](R-004-R003之后的扩展回归路线图.md)** 排 **C 域 → 富媒体 → Admin → 自动化补齐**（**非**与 R-003 并行）

---

## 7. 下一阶段（R-004 · 真正「第二阶段」）

**R-003 首轮会签之后**，才进入扩展面：**先**按 **[R-004](R-004-R003之后的扩展回归路线图.md) §2** 优先级 **逐项补齐 C 域与富媒体最小闭环**。**R-004** **阶段性完成**的硬门槛（**C1～C4、AUTO-P0 ≥ X%**）与 **登记方式**见 **[R-004 §4～§5](R-004-R003之后的扩展回归路线图.md)**。

---

**文档维护**：**93 / R-002** 变更 Gate 或环境矩阵时，同步 **§0～§2**；**R-003** 本身不因单次跑次改版本，除非 **验收标准（含铁律 / D1～D5）** 变更。
