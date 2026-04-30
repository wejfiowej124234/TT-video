# 22 · 横切 · 簇级 **verified** 证据模板（V-1 / V-2 / V-3）

**Version:** 1.0.15 · **最后更新：** 2026-04-29  
**受众**：Owner / Tech lead / 写 **handbook** 域篇与 **EVIDENCE-*** 的工程师  
**状态**：现行  
**与 spec 关系**：**How-to 母版**；规定 **簇级 `verified`** 在 **09 / 08** 的落盘方式；**不替代** **[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 表体；**不**构成删 **`docs`/`spec`** 依据。  
**来源**：抽象自 **[EVIDENCE-70-admin-cluster-verified](./EVIDENCE-70-admin-cluster-verified.md)** 与 **[09 §2b](./09-文档迁移覆盖审计报告.md#audit-verified-gate)**、**[08 §2a](./08-文档与spec迁移台账.md#mig-verified-gate)**。  
**与 spec 覆盖关系**：partial（**流程模板**；无单一 spec 表体）  

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

> **SSOT 边界（防误用）**：本文为 **簇级 `verified` 形态母版**；**`| METHOD | /path |` 机读**仍仅 **[04 §3.4](../../spec/04-后端与API.md)** + **`run-check-04-routes`**；**域矩阵与 PASS** 仍 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**。**禁止**以 **EVIDENCE-*** 或 **`verified` 计数**替代 **04/93** 或作为 **删 `docs`/`spec`** 依据（程序见 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**）。**`verified` / `partial` / `migrated` 词义**以 **[09 §1.2](./09-文档迁移覆盖审计报告.md)** 与 **[08 §1a](./08-文档与spec迁移台账.md#mig-coverage-semantics)** 为准。

**先读**：[09-文档迁移覆盖审计报告](./09-文档迁移覆盖审计报告.md)（**§2b～§2b.1**；后续 **§2b.2～§2b.11** 为各簇归档样例）· [08-文档与spec迁移台账](./08-文档与spec迁移台账.md)（**§2a**）· [06-工程模块技术文档编制契约](./06-工程模块技术文档编制契约与验证闭环.md)

---

<a id="vtpl-1-scope"></a>

## 1. 目的与适用范围（L1）

- **解决**：把 **「某叙事簇从 `migrated` 升到 `verified`」** 从口头变为**可复核的三段证据**（**V-1 / V-2 / V-3**），并与 **[09](./09-文档迁移覆盖审计报告.md#audit-quant-coverage)** **§2a**（**`Fv`** 计数）、**[08](./08-文档与spec迁移台账.md#mig-2-matrix)** 矩阵行同步。  
- **适用**：任意 **§3 叙事簇**（或 **08** 一行多 spec 源聚合）在 **handbook / corpus** 侧已 **migrated** 后，再申请 **verified**。  
- **不适用**：仅改 **04 §3.4 / 93** 表体而无 **handbook** 承接文变更（走 **02** 一票否决与 **04** 合入路径即可）。

---

<a id="vtpl-2-naming"></a>

## 2. 证据文件命名与放置（强制）

| 项 | 约定 |
|----|------|
| **文件名** | **`EVIDENCE-<cluster-id>-verified.md`**，`<cluster-id>` 为 **短横线** 小写 ASCII（例：`70-admin`、`94-market`、`07-wave`） |
| **目录** | 默认 **`docs/handbook/engineering/`**（与域篇同目录，便于 **相对链**）；若体积或涉密片段过大，可改为 **`evidence/GO_YYYYMMDD/`** 下文件并在 **EVIDENCE** 内 **只写指针** |
| **文首 SSOT（必读）** | **`EVIDENCE-*-cluster-verified.md`** 须在 **「母版」行**与**首个 `---` 分隔线**之间含与 **engineering/00～50** 主序篇首**同形**的 **blockquote**：以 **engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec** 起句，并链 **04 §3.4**、**93**、**14** + **`contracts/`** + **`check-55-s13`** 等脚本、**`crates/`·`contracts/`·`frontend/`** 与 **PR** 闭包（**机器门禁**校 **`不替代`** 字面 + **22** 母版链；**04/93** 表体仍不迁入 handbook）。 |
| **簇内域篇** | 每一篇参与 **verified** 的 **`NN-*.md`（NN≥10）** 须在 **§6** 后增加 **一行**：含 **§2b 证据** 指向 **`./EVIDENCE-<cluster-id>-verified.md`**（文件名中的 **`cluster-id`** 与 **§2** 表约定一致；锚可选；与 **70** 域篇 **§6** 后脚注同形） |
| **锚点** | **V-1 / V-2 / V-3** 各自 **`##`** 下首行设 **HTML 锚** `ev<id>-v1` / `ev<id>-v2` / `ev<id>-v3`（与 **70** 样例一致），供 **09 §2b.1** 表链 |
| **机读门禁** | **`bash scripts/check-handbook-engineering-content.sh`**（`scripts/gates/check-handbook-engineering-content.py`）对 **`EVIDENCE-*-cluster-verified.md`** 校验 **`-v1/-v2/-v3` HTML 锚**、**`## V-1`～`## V-3`**、**`22-横切-簇级verified证据模板`** 字面、**`不替代`**；与本文 §2～§5 对拍 |

---

<a id="vtpl-3-v1"></a>

## 3. **V-1** — PR / 本地运行证据（格式）

**最低要求**（与 **09 §2b** 同源）：可复制 **日志文本**（或 PR 内嵌截图），含 **`exit 0`**（或 **`test result: ok`**），且命令与 **簇内每一篇域篇 §6** 所列 **`bash scripts/…` / `cargo test …` / `run-check-04-routes`** **字面一致或可辩护等价**。

**集中复跑入口（各 `EVIDENCE-*` §V-1 命令并集）**：**`bash scripts/run-handbook-cluster-evidence-v1.sh`**（实现 **`scripts/gates/run-handbook-cluster-evidence-v1.sh`**）— 本地或 CI 一键串联当前仓库已登记的 **V-1** 相关门禁与 `cargo` 子集，用于**持续对齐**；**不替代**各 **`EVIDENCE-*-cluster-verified.md` §V-1** 内随 PR 粘贴的**簇专属**日志正文。CI：**`.github/workflows/handbook-cluster-evidence-v1.yml`**（`workflow_dispatch` + 变更证据/脚本时的 **PR**）。

**验收入口契约**：凡调整 **`EVIDENCE-*` §V-1** 主证列表、**union 脚本**、或 **`handbook-cluster-evidence-v1` workflow**，须 **`bash scripts/run-handbook-cluster-evidence-v1.sh` exit 0**；脚本末行 **`TT_EVIDENCE_V1_SUMMARY:`** 前缀与 **`OK steps=…` / `FAIL step=… exit=…`** 格式须**稳定可 `grep`**；并集步骤须与各 **`EVIDENCE-*` `## V-1`** **语义一致**。**若摘要不可 grep、格式漂移或与 §V-1 脱节，一律视为未完成**（与 **`check-handbook-engineering-content.sh`** 互补，**不替代**其结构校验）。

**推荐结构**（粘贴进 **`EVIDENCE-*.md`**）：

```text
=== V-1 capture <ISO8601 UTC> · cluster <cluster-id> ===
<UTC timestamp>
--- shared / <doc-A> ---
<command>
<exit or tail of output>
--- <doc-B> ---
…
```

**诚实性规则**：

- **依赖外部进程**（本机 API、Stripe、链 RPC）的步骤：若未满足前置条件，**须**写清「失败预期」与「补证方式」（见 **70 Admin** 样例中 **`curl (7)`** 写法），**禁止**伪称全绿。  
- **主证**优先：**`run-check-04-routes`** + **与 **93** 脚注同名的 `cargo test` 过滤串**（若簇无后端矩阵，须在 **EVIDENCE** 声明 **N/A** 并经 Owner ack）。

---

<a id="vtpl-4-v2"></a>

## 4. **V-2** — CI 具名 step（格式）

**最低要求**：在 **`.github/workflows/*.yml`** 中存在 **具名 `name:`** 的 step，其命令为 **§6** 所列之一，或 **仓库已采纳的等价门禁**（须在 **EVIDENCE** 表中显式写「**等价于** `…`」）。

**本仓库常用映射**（复制到 **EVIDENCE · §V-2** 表头即可改参数）：

| 域篇 **§6** 常见命令 | **CI** 参考（**`build.yml` · `jobs.build`**） |
|----------------------|-----------------------------------------------|
| **`bash scripts/check-handbook-frontmatter.sh`** | **`Handbook frontmatter (docs/handbook)`**（`python3 scripts/gates/check-handbook-frontmatter.py`） |
| **`bash scripts/check-handbook-engineering-content.sh`** | **`Handbook engineering content hygiene …`** |
| **`bash scripts/run-check-04-routes.sh`** | **`04 section 3.4 API table vs mounted routes (STRICT_WARNINGS)`**（`check-04-routes-vs-code.py`，**同目的**） |
| **`cargo test -p traveltrust-api <filter>`** | **`Run tests`**（`cargo test --workspace` 为**超集**）或 **`production-gate.yml`** · **`cargo test -p traveltrust-api`** |

**写法**：列出 **workflow 文件**、**job id**、**step `name:`**、**行号近似**（便于 Code 搜索），并写一句「**PR 须附** 成功 run **URL** 或 **run_id**」。

---

<a id="vtpl-5-v3"></a>

## 5. **V-3** — `Reviewed-by` 规则（Owner 签收）

**最低要求**（**08 §2a** / **09 §2b**）：参与 **verified** 的 **每一篇** **`engineering/[1-9][0-9]-*.md`（NN≥10）** 文内须有独立一行：

```markdown
**Reviewed-by:** <Name or @handle> <YYYY-MM-DD>（可选短注：委托关系 / 代码OWNER）
```

**规则**：

| 规则 | 说明 |
|------|------|
| **资格** | **须**为 **Owner** 或 **其书面委托的文档 Owner**（与 **09 §2b** 一致） |
| **占位** | 若 **`.github/CODEOWNERS`** 仅为占位（如 **`* @ghost`**），可暂用 **`@ghost`**，**但**须在 **EVIDENCE · §V-3** 写明「**真人 Owner 替换窗口**」与 **PR 链接** |
| **盲测（推荐）** | 在 **EVIDENCE** 附 **3～5 条**「只读本簇 handbook、能否找到 **§6 命令与 SSOT 外链**」的检查句；**不得**单独充当 **V-3**，仅辅助 Owner **签收** |

---

<a id="vtpl-6-09"></a>

## 6. 与 **09** 的联动（强制顺序）

**合并 PR 时建议按下序改**，避免 **§2a** 计数漂移：

1. **新建 / 更新** **`EVIDENCE-<cluster-id>-verified.md`**（**§3～§5** 齐全）。  
2. **簇内域篇**：各篇 **§6** 后 **§2b 链** + **`Reviewed-by:`**。  
3. **[09](./09-文档迁移覆盖审计报告.md)**：  
   - **§3** 对应簇行：**`migrated` → `verified`**；**handbook / corpus** 列补 **EVIDENCE** 链。  
   - **§2a**：**`Fv += 1`** 且若该簇原计在 **`X`**，**`X -= 1`**（**互斥**：**verified** 簇不计入 **`X`**）。  
   - **§2b.1**（或等价小节）：增 **一行表**，链三锚 **V-1 / V-2 / V-3**。  
   - **§4.1**（域篇质量表）：该簇各篇 **备注** 列更新为 **`verified`**。  
   - **§10c**（若有对应行）：**进度 / 簇态** 与 **§3** 对拍。  
4. **变更记录**：**09** 文首 **Version** 递增一行。

---

<a id="vtpl-7-08"></a>

## 7. 与 **08** 的联动（台账）

| 动作 | **08** 要求 |
|------|-------------|
| **覆盖度** | **`verified`** **不自动**升格 **`删除 spec=yes`**；**`full`** 仅表示 handbook 侧叙事完备，仍须 **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)** 五条件。 |
| **备注列** | 写明 **`verified`（09 §2b.1 + EVIDENCE-…）**；**04/93** 仍为机读 SSOT 时**必须**写出。 |
| **多 spec 源一行** | 允许 **handbook** 列 **多篇** + **EVIDENCE** 链（与 **70 Admin** 行同形）。 |

---

<a id="vtpl-8-ssot"></a>

## 8. SSOT、**04/93** 与「**不删 spec**」

- **`verified`** 只证明 **handbook 工程证据链**闭合，**不**改变 **[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 的 **Reference** 地位。  
- **禁止**以 **`verified`** 为由 ****`git rm`**（**spec 根**；须 Owner 程序）；删路径仍须 **Owner 指令 + SPEC-MIGRATION + 98 §2**（见 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR**）+ **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)**、**STATUS**、**98 §2**）。  
- **EVIDENCE** 内 **禁止**粘贴 **04 §3.4 / 93** 宽表；**只**允许 **命令输出**、**CI 表**、**Reviewed-by** 与 **外链**。

---

<a id="vtpl-9-refs"></a>

## 9. 参考（强制，只引用）

- [09-文档迁移覆盖审计报告](./09-文档迁移覆盖审计报告.md)（**§2a**、**§2b**、**§2b.1**、**§3**）  
- [08-文档与spec迁移台账](./08-文档与spec迁移台账.md)（**§1a**、**§2**、**§2a**）  
- [06-工程模块技术文档编制契约](./06-工程模块技术文档编制契约与验证闭环.md)  
- [EVIDENCE-70-admin-cluster-verified](./EVIDENCE-70-admin-cluster-verified.md)（**样例全文**）  
- [02-生产级文档约束与合入门禁](./02-生产级文档约束与合入门禁.md)

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.15 | 2026-04-29 | **§3（V-1）**：**`TT_EVIDENCE_V1_SUMMARY:`** + **`run-handbook-cluster-evidence-v1.sh`** 为 **verified 簇 §V-1** **唯一验收入口**契约（与 **CONTRIBUTING** / **scripts/README** / **AGENTS** / **`.cursor/rules`** 同源）。 |
| 1.0.14 | 2026-04-29 | **§3（V-1）**：回链 **`scripts/run-handbook-cluster-evidence-v1.sh`** 为各 **`EVIDENCE-*` §V-1** 集中复跑入口 + **CI** workflow。 |
| 1.0.13 | 2026-04-29 | **SSOT 边界**：删 **spec** 程序句与 **08 §3**/**09 §3**（**同 PR**）/**08 §2**/**STATUS**/**98 §2** 全文对齐（与 **engineering/README**/**spec/00 读前** 同源）。 |
| 1.0.12 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍补 **14** 句；**§2** 母版表「文首 SSOT」行同步 **14+contracts+脚本**（无簇态变更）。 |
| 1.0.10 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）；**§2** 表「文首 SSOT」行与上同键。 |
| 1.0.9 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.8 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering** 主序统一为 **engineering 不替代 spec** 全句；**§2**「文首 SSOT」行改写为同形口径（**04 §3.4** / **93** / **实现**）。 |
| 1.0.7 | 2026-04-29 | **§2** 表增 **文首 SSOT（必读）** 行（**`EVIDENCE-*`** 与主序篇首同键）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.5 | 2026-04-29 | 文首 **SSOT 边界** 引（**04/93**、**verified** 词义、**删 spec** 程序；与 **06/08/09** 同口径）。 |
| 1.0.4 | 2026-04-29 | **§2** 表增 **机读门禁** 行（**`check-handbook-engineering-content`** 与 **EVIDENCE-*** 对拍）。 |
| 1.0.3 | 2026-04-29 | **先读**：**09 §2b.2～§2b.11**（增 **§2b.10 订单**、**§2b.11 强异步** 样例带）。 |
| 1.0.2 | 2026-04-29 | **先读**：互指 **09 §2b.2～§2b.9** 样例带；与 **93·C §2b.9** 证据簇对拍。 |
| 1.0.1 | 2026-04-28 | **§2** 表「簇内域篇」行措辞修正（Markdown 嵌套反引号）。 |
| 1.0.0 | 2026-04-28 | 首版：簇级 **verified** 母版（V-1～V-3、**09/08** 联动、**04/93** 纪律）。 |

---

**上一篇**：[09-文档迁移覆盖审计报告](./09-文档迁移覆盖审计报告.md) · **下一篇**：[engineering README](./README.md) · **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**
