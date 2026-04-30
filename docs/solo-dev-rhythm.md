# Solo Dev Rhythm（单人开发节奏）

> 一页内可读完；任务卡驱动；Web3 + 合约 + CI 仓库适用。  
> 与母表 / TT 索引配合使用，**不作为替代 spec 的细节源**。  
> **本文件仅定义节奏与门禁，不定义业务/协议细节（以 `docs/spec/` 与合约为准）。**

## 0. 真值在哪（单维护者，别被旧远端误导）

- **已提交**：以**本机当前分支 `HEAD`** 为准（`git log -1 --oneline`）。**不要**默认「`origin/main` 上最后一笔 = 我手里的最新」——`git status -sb` 若出现 **`[ahead N]`**，表示**本机已提交比 `origin/main` 至少新 N 笔**；**旧远端**只说明远端停在哪，**不**否定你磁盘上的提交链。
- **未提交**：以 **`git status`** 为准；**未 `commit` 的改动**和 **`??` 未跟踪文件**都是真实工作区状态，**不会**因为你看了一眼远端就出现或消失。
- **「多重身份」**：**Git `user.name` / `user.email`** 只影响**提交署名**，**不**改变源码字节；文档里的 **Owner / 四门对拍** 在单人模式下 = **你自己自检**（**§7**），**不是**运行时多账户。

### 0.a 开发期减负（全仓统一口径）

项目**未对外发布**时，不必把「每次 GitHub PR、完整企业审计、发版级全量闸」当作每轮必达；**日常**以 **commit → push**、按本轮改动**裁剪** **§6.5** 与 **[CONTRIBUTING · 提 PR 前](../CONTRIBUTING.md)** 脚本子集为主。**删 `docs/spec`、路径依赖 registry、改 `build.yml` 必过链** 等仍按专程序走，不因减负而跳过。权威句与表：**[TT — spec→handbook 全量替代清单 · §0](runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)**。

## 1. 开始前

- [ ] 明确本张任务卡的**单一目标**（单卡单目标，验收竖切）
- [ ] 写清**完成条件**（测什么、看什么绿）
- [ ] 确认**改动范围**（不死卡文件数，但不扩散无关模块）

## 2. 开发中

- [ ] 不顺手扩散、不混入无关重构
- [ ] 动到 **`contracts/`**、**`.github/workflows/`**、**子模块** 时，**尽快 push**（**CI 可用时**尽早暴露远端与本地差异；**CI 关闭时**见 **§6.5**，以本地命令 + 自留证据替代）
- [ ] 若改动涉及 **ABI / 状态机 / 资金路径 / 工作流** → **优先尽快 push**；**CI 可用**时用远端验证与本地是否一致，**否则** **§6.5**
- [ ] 本地能跑则跑：`cargo test -p traveltrust-api`、（有 `forge` 时）`forge test` 等与卡相关的命令

## 3. 封口

- [ ] **功能验证**完成
- [ ] **母表 / TT 索引** 按卡要求已补
- [ ] **Evidence 最小集已落盘**（关键日志 / 截图 / 产物路径等，**可审计**）
- [ ] **路径与命名符合约定**：目录 **`evidence/GO_YYYYMMDD/`**（8 位日期）；Forge 专验为 **`forge_B093.log`**、**`forge_B087.log`** 等（**`forge_*.log`**）；**禁止**随意别名（如 `test_log`、`final_final.log`）
- [ ] **Evidence 是里程碑记录，不是日志仓库**：**仅**在 **Release / B-xxx 封口 / 合约关键改动** 等节点把约定产物**入 Git**；**日常 CI** 输出用 **Actions artifact** 即可，不堆进仓库
- [ ] **两段 commit**：功能一段 + 证据/台账一段（便于回滚、审计、`git blame`）

**与 `.gitignore` 的统一策略（方案 A，勿与 `git add -f` 混用）**：全局忽略 **`*.log`**，仅 **`evidence/**/forge_*.log`** 白名单可进仓；其它证据类型（如 **`.md` / `.json`**）按路径正常 `git add`，无需 `-f`。

## 4. 推送

- [ ] **未 push 工作集**不要堆太久：至少**每天 push 一次**；合约/CI/子模块改动优先当日 push
- [ ] 已 **`git push origin main`**（单人直连时可不开 PR）
- [ ] **Push 后约 10 分钟内**打开 **GitHub Actions**，查看**首次结果**（或**首个失败 step**），避免「本地绿、CI 红」长时间未发现（**CI 关闭 / 欠费时跳过本条**，改做 **§6.5** 本地集 + 自留证据）

## 5. 失控信号（立即停）

- [ ] 出现「再优化一下」「顺手改别的」「不确定下一步」→ **停下**，说明任务卡边界失真
- [ ] 先**重写或收窄任务卡**，再动代码
- [ ] 若改动已跨 **2 个以上子系统边界**，或 CI 红时想「顺便一起修多处」→ **回到本节与第 6 节**，收窄后再动

## 6. CI 失败处理（最小策略）

- [ ] 只看**第一个失败 step**的**第一条 Error**
- [ ] **最小修复**（不扩散、不夹带无关改动）
- [ ] 本地或复跑 workflow **验证后再 push**（不要并行改多个未验证假设）

## 6.5 GitHub Actions 关闭或欠费期间（本地 = CI 替代）

**适用**：组织 **Billing 欠费**、**人为关闭 workflow**、或 **runner 长期不分配** —— **云端 CI 不可信 / 不可用**。恢复计费并重新打开 Actions 后，回到 **§4**「push 后看远端」与 **§6**。

**不等价于**：可以不做验证、可以跳过 **`CONTRIBUTING`** / **`engineering/02`** 里与改动相关的**本地脚本**、可以宣称 **③ 生产** 已验收。

**默认本地集（仓库根；按本张任务卡裁剪）** — 与 **`CONTRIBUTING.md`**「提 PR 前」脚本同源，**能跑则跑**：

1. **后端默认子集**：`cargo test -p traveltrust-api`
2. **动过 `docs/handbook/` 规范头**：`bash scripts/check-handbook-frontmatter.sh`
3. **动过 `docs/handbook/engineering/`（NN≥10 / `EVIDENCE-*` / 大量 spec 外链）**：`bash scripts/check-handbook-engineering-content.sh`
4. **动 04 §3.4 / `frontend/app` 正式路由 / 13-1 表 1**：`bash scripts/run-check-04-routes.sh`（须 **Python 3**）
5. **动 `docs/spec` 路径依赖或 `registry/spec-path-dependencies*.yaml` / 盘点文**：`python registry/validate-spec-path-dependencies-registry.py`，并视改动跑 **`CONTRIBUTING`** 所列同批 **`bash scripts/check-handbook-*.sh`**
6. **动合约 / ABI 对齐叙述**：`bash scripts/check-55-s13.sh`（场景适用时；见 **`engineering/50`** / **`CONTRIBUTING`**）

**留痕（欠费期必做）**：把上列已跑命令的 **终端可复制输出**（含 **`exit 0`** 行尾）或截图，放进 **`evidence/GO_YYYYMMDD/`** 等**里程碑目录**，或写入**合并说明 / 任务卡**；复开 CI 后便于与 **Actions log** 对拍。

**更重的组织级交付**：与 **`docs/runbook/TT-LOCAL-CI-DELIVERY-GATE-001.md`**（本地 / VPS 交付闸）对读；**L4 并行观测**旁证仍见 **`docs/runbook/TT-L4-PARALLEL-CI-001.md`**。

---

**一句话**：任务卡驱动 + 两段 commit + 定时/触发性 push + **（CI 可用则远端对齐；否则 §6.5 本地集 + 证据）**；远端红则 **§6**。

**入口互链**：`README.md`（内部协作约定表）、`docs/任务母表.md`（层级表）已指向本文件。

---

## 7. Handbook、`engineering/` 与删 `docs/spec/`（单维护者读法）

**工程入口（与删 spec 口径同页）**：[handbook/engineering/README.md · 独立开发](handbook/engineering/README.md#eng-solo-dev)（**`#eng-solo-dev`** 专节：**Owner=本人**、**`覆盖度 full` ≠ 可删 spec**、程序链不缩水）。

**谁算 Owner**：条文里的 **Owner**、**须等待 Owner** → 一律视为 **你自己**；没有第二个审批人时，**自检即闭环**。

**「四门」`pd-*` 是什么**：指 **08 §3.1c**、**98 §2.1**、**SPEC-MIGRATION-STATUS · pd 细目**、**96-索引 · pd 表** 四处表格 **同一组 `pd-*` 行结论一致**。单人开发时 = **你**在四处各改一遍（可同一天、同一小提交序列内完成），**不是**四个角色开会。

**删径变更批次**：**`SPEC-MIGRATION-STATUS` / `08` / `98` / `96-索引`** 已用 **「专提交 / 极短提交序列」** 表述（**v0.1.9+**）；单人 **不要求 GitHub PR UI**，但 **不要**把删 spec 与无关功能混在同一批里。

**本仓库树现状（务必知情）**：在 **`TT-Expedition/TT-Expedition`** 当前 **`origin/main`** 上，**`docs/handbook/` 往往为空或不完整**；你工作区若只有 **`engineering/08-…` + `corpus/SPEC-MIGRATION-STATUS.md`**，**不代表**「engineering 主序被删光」——更可能是 **从未合入/未推送/在另一远端或备份里**。若你确信另有一条分支「满箱 `engineering/NN-*.md`」：

1. `git remote -v`、`git branch -a` 找到它；  
2. **`git stash`** 或另开 clone **备份**当前未推送改动；  
3. 再 `merge` / `cherry-pick` 把那份树带回来。

**不变的红线**：**`engineering/` 导读不替代 `docs/spec/` 里 04/93/14/07 等契约真源**；删 **`docs/spec/`** 仍须 **盘点/registry/书面对拍**，**人数变少 ≠ 风险变低**。
