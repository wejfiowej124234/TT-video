# Epic F：发布前 E2E 三项包 — 阶梯稿（F-01～F-10）

**策略定位**：在 **不修改 B-115、B-116、P5、Epic A、Epic C、Epic D、Epic E 已封口语义** 的前提下，把 **[01 §9 发布与 E2E（P2）](../spec/01-总库总览.md)** 要求的 **三项**（**正常放款**、**争议三终态**、**三条超时路径**）收敛为可重复、可归档的 **证据包 + 命名规则 + CI 挂钩**；**本 Epic 默认不写新业务逻辑、不新增 E2E 用例代码**（用例与自动化在后续 F-08 等步按本阶梯单独开 PR）。

**互证（读者入口）**：

| 文档 | 作用 |
|------|------|
| **[01-总库总览 · 发布与 E2E](../spec/01-总库总览.md)** | 三项业务定义与发版关系（SSOT 之一）。 |
| **[07-开发流程与顺序](../spec/07-开发流程与顺序.md)** | 发版前勾选、**§二 2.1** 与 E2E 留痕要求。 |
| **[27-P14-实现记录 · P14-3](../spec/27-P14-实现记录.md)** | E2E 三项 + 资损 runbook 再次确认与闭环索引。 |
| **[evidence/README.md](../../evidence/README.md)** | **§07 §二 2.1** 发布前 E2E 三项 artifacts 命名与目录约定（含 **F-02** 全路径与 **manifest** 互证）。 |
| **[Epic-D-indexer-ops-readonly-ladder.md](./Epic-D-indexer-ops-readonly-ladder.md)** | 与 **E2E 三项并行、不互相替代** 的索引器/对账线；**推荐顺序 D → E → F**。 |
| **[Epic-E-finance-readonly-ladder.md](./Epic-E-finance-readonly-ladder.md)** | Admin 只读财务/对账视角（**非**本包替代物）。 |
| **[Epic-F-real-path-adr.md](./Epic-F-real-path-adr.md)** | **F-04** · **真实路径**载体二选一钉死、自动化项、**不得 mock** 范围（**仅引用 04 / GO_***）。 |
| **[Epic-F-e2e-three-pack.manifest-artifacts.example.json](./Epic-F-e2e-three-pack.manifest-artifacts.example.json)** | **F-05** · **`manifest.json` · `artifacts[]`** 三项最小字段示例（**`path`/`sha256`/`kind`**）。 |

---

## Epic F 全程硬边界

- **不修改** 已封口目录下的 **行为、路由契约或分配语义**（**B-115 / B-116 / P5**）及 **Epic A / Epic C / Epic D / Epic E** 已登记封口实现与叙事。
- **Mock**：E2E **允许** mock **非封口**外部依赖；**不得 mock** **B-115 / B-116 / P5** **已封口语义路径**上的行为与契约（与 **[Epic D 表 · F 行](./Epic-D-indexer-ops-readonly-ladder.md)** 一致）。
- **真实路径**：**必须至少保留一条**自动化或固定流水线覆盖 **真实状态机流转**（**本地链** 或 **仓库钉死的固定 fixture**，**二选一写死**）；**禁止**以「全 mock」冒充三项包收口。
- **主产出**：**Runbook**、**证据模板/命名**、**manifest 挂钩**、**静态校验脚本**、**CI 触发**；**不**在本 Epic 前期扩写新 API、新聚合或新订单/争议业务规则。
- **每步**：**≤5 文件** / PR；后续步骤以本表为准。

---

## 分批与风险（建议）

| 批次 | 步骤 | 风险 | 说明 |
|------|------|------|------|
| 第 1 批 | F-01～F-03 | 低 | 纯文档 + 模板壳 |
| 第 2 批 | F-04～F-05 | 低 | **真实路径** ADR + manifest 约定 |
| 第 3 批 | F-06～F-07 | 中 | 脚本 + CI（仍**不**断言业务结论） |
| 第 4 批 | F-08 | **高** | **一条真实路径** E2E 自动化（单独审查） |
| 第 5 批 | F-09～F-10 | 低 | 收口证据 + pre-release 轻量挂钩 |

---

## F-01～F-10 任务表

| 步骤 | 目标 | ≤5 文件（典型） | 最小验收（摘要） |
|------|------|-----------------|------------------|
| **F-01** | 本 **Epic F** **Runbook** 创刊；互链 **01 / 07 / 27-P14 / evidence/README**。 | 本 `Epic-F-e2e-three-pack-ladder.md` + 可选 **Epic D** 互链一句 | `test -f docs/runbook/Epic-F-e2e-three-pack-ladder.md` |
| **F-02** | 钉死 **`evidence/GO_YYYYMMDD/artifacts/`** 下三项文件名：**`e2e-normal-release.md`**、**`e2e-dispute-three-terminals.md`**、**`e2e-three-timeouts.md`**；与 **manifest** / **sha256** 关系写入本文 + **evidence/README**。 | 本 ladder、**evidence/README**、可选 **01 / 27-P14** 索引行 | `rg` 三文件名与 ladder 一致 |
| **F-03** | 三项 **Markdown 模板**（仅章节与占位，无业务结论）。 | **`docs/runbook/e2e-*.example.md`** ×3 + 本 ladder **[F-03](#epic-f-f03-templates)** | **`test -f`** 三模板；**8** 个 **`##` 标题**齐全 |
| **F-04** | **真实路径** ADR：**fixture vs 本地链** 二选一钉死；写明 **不得 mock** 的路由族（引用 **04** 等入口，**不**改正文语义）。 | **[Epic-F-real-path-adr.md](./Epic-F-real-path-adr.md)** + 本 ladder + **[Runbook §12.6 B](../../ops/RUNBOOK.md#126-可验证发布-manifest-与-e2e-留痕p1-c)** 互指 | 能回答：**真实路径是哪条**；**自动化只跑哪一项**；**哪些禁止 mock** |
| **F-05** | **`manifest.json`** 的 **`artifacts[]`** 中 E2E 三项 **最小字段**（**`path` / `sha256` / `kind`**）；示例 JSON + 与 **Epic D-10** bundle 互证。 | 本 ladder **[F-05](#epic-f-f05-manifest-artifacts)** + **[manifest-artifacts.example.json](./Epic-F-e2e-three-pack.manifest-artifacts.example.json)** | **`jq . Epic-F-e2e-three-pack.manifest-artifacts.example.json`**；**`path`/`kind`** 与 F-02 三文件 **1:1** |
| **F-06** | **`scripts/check-e2e-three-pack-evidence.sh`**：**jq/bash** 校验目录与 manifest 登记（**不**校验业务是否通过）；支持 **SKIP=1 → exit 0**。 | **.sh** + **scripts/README** + ladder | 脚本在 SKIP/缺参下行为符合文档 |
| **F-07** | **CI workflow**（`paths` 过滤）：跑 F-06；**不**默认强依赖外链密钥。 | **[`.github/workflows/e2e-three-pack-evidence.yml`](../../.github/workflows/e2e-three-pack-evidence.yml)** + 本 ladder **[F-07](#epic-f-f07-ci)** | Workflow 语法合法；**不**混入 F-08 |
| **F-08** | **一条** Playwright（或现有 E2E）**真实路径** spec；**不得 mock** 封口路径；另两项仍以模板/手工为主。 | playwright 相关 **≤5** | 本地栈上单测命令通过（见该步文档） |
| **F-09** | **`evidence/GO_EPIC_F_E2E_THREE_PACK_CLOSE.md`** + **evidence/README** 锚点 + 根 **README** 索引。 | CLOSE + README ×2 + 可选 ladder | `test -f evidence/GO_EPIC_F_E2E_THREE_PACK_CLOSE.md` |
| **F-10** | **`pre-release-automation.sh`** / **`.ps1`** 可选挂钩 **F-06**（**`CHECK_E2E_THREE_PACK=1`** + **`EVIDENCE_GO_DIR`**）；默认**不**执行；**Runbook §12.6 §A 步骤 4**、**§12.5** 末段互指。 | 脚本 + RUNBOOK + ladder（+ **scripts/README**） | 不设 flag 时与历史 **pre-release** 一致；设 flag 时失败=**证据未就绪**非业务失败 |

---

## 连续顺序（Epic F 内）

**F-01 → F-02 → F-03 → F-04 → F-05 → F-06 → F-07 → F-08 → F-09 → F-10**

---

## 与「三项包」非替代关系

- **索引器 / DB 投影 / 对账留痕**：见 **[Epic D](./Epic-D-indexer-ops-readonly-ladder.md)**、**[Runbook §12.5](../../ops/RUNBOOK.md)**；**不替代** 01 §9 三项。
- **Admin 只读财务视角**：见 **[Epic E](./Epic-E-finance-readonly-ladder.md)**；**不替代** 01 §9 三项。

---

<a id="epic-f-f02-e2e-artifacts"></a>

## F-02 — E2E 三项证据：命名、落盘与 manifest（钉死规约）

以下路径中 **`GO_YYYYMMDD`** 为当次 Gate / 发版留痕日目录（与 **[evidence/README · 目录约定](../../evidence/README.md#目录约定)** 一致）；**相对 GO 根**的路径用于写入 **`manifest.json`** 的 **`artifacts[].path`**。

**全路径（复制用，与 [evidence/README · 07 §二 2.1](../../evidence/README.md#07-p0-e2e-three) 一致）**：

- **`evidence/GO_YYYYMMDD/artifacts/e2e-normal-release.md`**
- **`evidence/GO_YYYYMMDD/artifacts/e2e-dispute-three-terminals.md`**
- **`evidence/GO_YYYYMMDD/artifacts/e2e-three-timeouts.md`**

### 落盘位置（全路径范式）

| 相对 `evidence/GO_YYYYMMDD/` 的文件 | 用途（对应 01 §9 / 07 §二 2.1） |
|-------------------------------------|----------------------------------|
| **`artifacts/e2e-normal-release.md`** | **正常放款** 留痕：环境、日期、命令或 Playwright/入口、结论、执行人；链上 tx / 订单 id 等可检索指针（与 **[evidence/README](../../evidence/README.md#07-p0-e2e-three)** 表内「最少内容」一致）。 |
| **`artifacts/e2e-dispute-three-terminals.md`** | **争议三终态** 留痕：**Refunded** / **PartiallyRefunded** / **Slashed** 各至少一条可复现路径或指向已登记 SSOT/工单。 |
| **`artifacts/e2e-three-timeouts.md`** | **三条超时路径** 留痕：与 **01** / **53** 超时语义对齐的三类路径各一条（或引用已登记演练编号 **DR-***）。 |

**仓库内可复制对齐**：**`evidence/GO_20260407/artifacts/`** 下已存在同名三文件（**`e2e-normal-release.md`**、**`e2e-dispute-three-terminals.md`**、**`e2e-three-timeouts.md`**），正文结构可与 **[15 附录〇 · 机器预检](../spec/15-多维度文档与技术检查报告.md#发版前勾选总表)** 中对该目录的描述对照；**不**要求各次 GO 的 **`manifest.json`** 必须与 **`GO_20260407`** 当前检入片段逐字相同，但**正式过门**时应在 **`artifacts[]`** 中**登记**上述三路径及各自 **`sha256`**（见下段）。

### 与 `manifest.json`、`manifest.sha256` 的关系

- **`manifest.json`**：当次 bundle 的**清单 SSOT**；**每一项** E2E 留痕文件应在 **`artifacts`** 数组中占一条，至少含 **`path`**（如 **`artifacts/e2e-normal-release.md`**，相对 **`evidence/GO_YYYYMMDD/`**）与 **`sha256`**（对该文件内容的哈希，与 **[evidence/README](../../evidence/README.md#目录约定)**「产物清单」叙述一致）。**`kind`** 及三键完整约定见 **[F-05](#epic-f-f05-manifest-artifacts)**。
- **`manifest.sha256`**：对 **`manifest.json`** 本体校验（单行 **`<hex>  manifest.json`**，**`sha256sum -c manifest.sha256`**）；**不**替代各 **`artifacts`** 条目的 **`sha256`** 字段。
- **与现有 `GO_*` 示例**：**`evidence/GO_20260407/manifest.json`** 当前检入为**轻量 P0 dry-run** 示例，**未**列出三份 **`e2e-*.md`**；**完整发版留痕**时应将三文件路径与哈希并入 **`artifacts[]`**，并与 **`manifest.sha256`** 同批更新（与 **Runbook §12.6**、**go-live-checklist §10** 互证）。

---

<a id="epic-f-f03-templates"></a>

## F-03 — 三项 E2E 证据模板（仅结构）

模板位于 **`docs/runbook/`**（**`.example.md`**，**勿**与当次 GO 落盘 **`artifacts/e2e-*.md`** 混淆）：

| 01 §9 项 | 模板文件（复制后改名为 F-02 钉死文件名） |
|----------|------------------------------------------|
| **正常放款** | **[e2e-normal-release.example.md](./e2e-normal-release.example.md)** → **`evidence/GO_YYYYMMDD/artifacts/e2e-normal-release.md`** |
| **争议三终态** | **[e2e-dispute-three-terminals.example.md](./e2e-dispute-three-terminals.example.md)** → **`e2e-dispute-three-terminals.md`** |
| **三条超时路径** | **[e2e-three-timeouts.example.md](./e2e-three-timeouts.example.md)** → **`e2e-three-timeouts.md`** |

**固定章节（三级模板一致，缺一不可）**：**Environment**；**Date**；**Evidence status: draft | observed | verified**；**Request / order identifiers（x-request-id / order id 占位）**；**Steps performed**；**Observed result**；**Artifacts / screenshots / logs**；**Notes / limitations**。

**硬边界**：模板**禁止**预写已验证业务结论；执行人仅填**观测与可追溯指针**；**不**新增 E2E 自动化或业务代码。

**验收**：**`test -f docs/runbook/e2e-normal-release.example.md`**（另两个同理）；并确认上述 **8** 个 **`##` 标题**在各模板中均存在。

---

<a id="epic-f-f04-real-path-adr"></a>

## F-04 — 真实路径 ADR（钉死）

**主文档**（**不**收入本 ladder 附录，避免双源）：**[Epic-F-real-path-adr.md](./Epic-F-real-path-adr.md)**

**摘要（以 ADR 正文为准）**：

- **真实路径载体**：**本地链 + 本地 API**（**非**「固定 fixture + handler」作为钉死默认）。
- **自动化（F-08）**：**仅** **正常放款**；状态机 **下单 → … → 正常释放/结算完成**（细节以 **04** 与实现为准）。
- **不得 mock**：**B-115 / B-116 / P5** 已封口路径；**仅引用** **[04](../spec/04-后端与API.md)** 与 **`evidence/GO_*_CLOSE.md`** 等，**不**改正文。
- **其余两项**：**争议三终态**、**三条超时路径** — **当前仅模板 + 手工**，**本条不自动化**。

**运维互证**：[Runbook §12.6 · B. E2E 三项与资损演练](../../ops/RUNBOOK.md#126-可验证发布-manifest-与-e2e-留痕p1-c)

---

<a id="epic-f-f05-manifest-artifacts"></a>

## F-05 — `manifest.json` · `artifacts[]` 最小字段（E2E 三项）

当次 **`evidence/GO_YYYYMMDD/manifest.json`** 中，**每一项** E2E 留痕文件（与 **[F-02](#epic-f-f02-e2e-artifacts)** 钉死文件名一致）在 **`artifacts`** 数组内**至少**包含以下三键（**仅结构约定**；**不**修改 **`write-indexer-evidence.sh`** 等生成逻辑，**不**新增打包代码）：

| 字段 | 类型 | 说明 |
|------|------|------|
| **`path`** | string | 相对 **`evidence/GO_YYYYMMDD/`** 的路径；**必须**与 F-02 一一对应。 |
| **`sha256`** | string | 该文件内容的 **64 hex**（小写）；与 **`sha256sum`** / **`shasum -a 256`** 一致。 |
| **`kind`** | string | 机读分类，**Epic F** 钉死枚举如下表。 |

### `path` ↔ `kind` 钉死表（与 F-02 1:1）

| `path` | `kind` |
|--------|--------|
| **`artifacts/e2e-normal-release.md`** | **`e2e_three_pack_normal_release`** |
| **`artifacts/e2e-dispute-three-terminals.md`** | **`e2e_three_pack_dispute_three_terminals`** |
| **`artifacts/e2e-three-timeouts.md`** | **`e2e_three_pack_three_timeouts`** |

**说明**：同一 **`manifest.json`** 中可并存其它 **`artifacts`** 条目（如 **`artifacts/test.log`**、**Epic D** **`artifacts/epic_d_d05_*.json`** 等）；其它条目**不强制**带 **`kind`**，但 **E2E 三项** **必须**三键齐全，便于 F-06 静态校验与人工 diff。

### 示例 JSON 片段（独立文件）

**`jq` 可解析顶数组**：**[Epic-F-e2e-three-pack.manifest-artifacts.example.json](./Epic-F-e2e-three-pack.manifest-artifacts.example.json)**（占位 **`sha256`** 仅演示；落盘前须按真实文件重算）。

**合并方式**：将示例文件中的 **三个对象** **追加或并入** 当次 **`manifest.json`** 的 **`artifacts[]`**（与现有 **`gate` / `date` / `sign_off`** 等顶域并存）；然后按 **[F-02](#epic-f-f02-e2e-artifacts)** 重算 **`manifest.sha256`**。

### 与 GO bundle、Epic D-10 的关系（引用，不改正文）

- **`evidence/GO_YYYYMMDD/`** 为 **GO 日目录**；根级 **`manifest.json`** 列出本目录相关产物（见 **[evidence/README · 目录约定](../../evidence/README.md#目录约定)**）。
- **[Epic D-10](./Epic-D-indexer-ops-readonly-ladder.md#d-10--evidence-bundle-与-go-manifest-挂钩)**：**`epic_d_go_bundle_closure.json`** 的 **`payload.manifest`** **须与** 同目录 **`manifest.json`** **一致**（同形对象）。因此，一旦 **`manifest.json` · `artifacts[]`** 纳入上述 **E2E 三项** 条目，**D-10** 收口再生成 **`epic_d_go_bundle_closure.json`** 时，**`payload.manifest.artifacts`** 中**应可见**相同 **`path`/`sha256`/`kind`**（取决于当次 **`write-indexer-evidence`** / **`--epic-d10-post`** 是否已把最新 **`manifest.json`** 嵌入 **`payload.manifest`**；**行为以 Epic D 阶梯与脚本为准**，本 F-05 **只**定义 **E2E 三条目的最小字段**）。
- **Epic D** **`artifacts/*.json`**（**`traveltrust.ops_artifact.v1`**）与 **E2E `*.md`** **并列**存在于同一 **GO** 目录时，**同属** **`manifest.json` · `artifacts[]`** 所索引的文件族；**不**要求把 **`.md`** 正文塞进 **`epic_d_go_bundle_closure`** 的 **`payload`** 除 **`manifest`** 镜像外的其它槽位。

---

<a id="epic-f-f06-check-脚本"></a>

## F-06 — `check-e2e-three-pack-evidence.sh`（结构校验）

**脚本**：**[check-e2e-three-pack-evidence.sh](../../scripts/check-e2e-three-pack-evidence.sh)**（**bash**；**`jq`** 仅在 **`E2E_THREE_PACK_CHECK_MANIFEST=1`** 时必需；**不**读 **`.md`** 正文、**不**校验 **`sha256`** 真值、**不**推断业务是否通过）。

```bash
# 跳过（CI 占位）
E2E_THREE_PACK_CHECK_SKIP=1 bash scripts/check-e2e-three-pack-evidence.sh

# 仅检查三文件存在（示例目录）
bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407

# 另检查 manifest.json 的 artifacts[] 是否登记三条 path（须已存在 manifest）
E2E_THREE_PACK_CHECK_MANIFEST=1 bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407
```

**环境变量**：**`EVIDENCE_GO_DIR`** 与**第一个参数**等价，**参数优先**。

**退出码**：**0** 结构满足或 SKIP；**1** 缺文件或（若启用）**`manifest`** 未登记某 **`path`**；**2** 用法 / 目录无效 / 启用 **`MANIFEST`** 时缺 **jq**。

---

<a id="epic-f-f07-ci"></a>

## F-07 — CI 挂钩（静态证据门禁）

**Workflow**：**[`.github/workflows/e2e-three-pack-evidence.yml`](../../.github/workflows/e2e-three-pack-evidence.yml)**（**独立** job，**不**并入 **F-08** Playwright / 真实路径自动化）。

| 项 | 说明 |
|----|------|
| **做什么** | 仅 **`bash scripts/check-e2e-three-pack-evidence.sh evidence/GO_20260407`**（**默认**不设置 **`E2E_THREE_PACK_CHECK_MANIFEST`** → **不需要 `jq`**，与 **ubuntu-latest** 无额外系统依赖）。 |
| **何时不跑（skip）** | **路径未命中**：**`pull_request` / `push main`** 未触及 **`evidence/**`**、**`docs/runbook/Epic-F*.md`**、**`e2e-*.example.md`**、**`Epic-F-e2e-three-pack.manifest-artifacts.example.json`**、**`scripts/check-e2e-three-pack-evidence.sh`** 或本 **workflow** 文件时，本 workflow **整单不触发**（等价 skip）。**`workflow_dispatch`** 且 **`skip_check=true`** → 设 **`E2E_THREE_PACK_CHECK_SKIP=1`**，**exit 0**（仅应急 / 维护，**勿**作常态）。 |
| **何时必须跑** | 上述路径任一变更的 **PR** 或 **`main` push** 会触发；合并前须绿。 |
| **红代表什么** | **证据结构不满足**（缺 **`artifacts/e2e-*.md`** 或目录无效等），**不是**「订单业务失败」或 **E2E 用例未通过」。 |
| **刻意不做** | **不**跑浏览器；**不**起本地链；**不**读 **secrets**；**不**跑 **F-08** 真实路径 spec。 |

**Runner 前提**：**`ubuntu-latest`** + **`bash`**；本 job **不**安装 **`jq`**。若将来在 CI 中启用 **`E2E_THREE_PACK_CHECK_MANIFEST=1`**，须在 job 内 **`apt-get install -y jq`**（或等价）并改 workflow 注释。

---

<a id="epic-f-f08-real-path-playwright"></a>

## F-08 — 真实路径自动化（normal-release，单 spec）

**目标**：一条 **Playwright** 用例，经 **真实 HTTP** 走 **chain_off** 订单状态机：**created → accepted → escrowed（mock-pay）→ completed（confirm-completion）**；**不**使用 `page.route` 伪造 **B-115 / B-116 / P5** 相关契约；**不**覆盖争议 / 超时路径。

| 项 | 说明 |
|----|------|
| **Spec** | **`frontend/e2e/epic-f-normal-release-real.spec.ts`** |
| **标签** | **`@e2e-three-pack-real`**（`npx playwright test --grep @e2e-three-pack-real`） |
| **API 基址** | 环境变量 **`PLAYWRIGHT_API_BASE_URL`**，默认 **`http://127.0.0.1:8080`** |
| **API 环境** | **`SEED_TEST_ACCOUNTS=1`**（`tourist@test.com` / `guide@test.com` / `Test123!`）；**`P3_CHAIN_OFF=1`**（**`POST …/mock-pay`** 在实现上要求此项，见 `orders/mutations.rs`） |
| **CI 默认** | **`CI=true`** 且 **未**设 **`RUN_EPIC_F_E2E_REAL_PATH=1`** 时 **skip**（普通 PR **Build** 仍跑其它 E2E，本 spec 不计入失败） |
| **手动在 CI 跑** | 在 **Build** workflow 的 E2E job 增加 env **`RUN_EPIC_F_E2E_REAL_PATH=1`**（并保持 API 步骤含 **`P3_CHAIN_OFF=1`**，仓库 **`build.yml`** 已设）；或使用 **`workflow_dispatch`** 复制品类 job |
| **本地跳过** | **`PLAYWRIGHT_SKIP_EPIC_F_REAL_PATH=1`**（无 API 时） |

### 启动环境（最小）

1. **API**（示例，与 **F-04**「本地 API」一致）：
   ```bash
   export PORT=8080 SEED_TEST_ACCOUNTS=1 P3_CHAIN_OFF=1
   # DATABASE_URL 空则内存 chain_off（与 CI E2E job 一致）
   cargo run -p traveltrust-api
   ```
2. **跑 spec**（仅需 Playwright，无需起 Next；`request` 直连 API）：
   ```bash
   cd frontend
   npx playwright test epic-f-normal-release-real --project=chromium
   # 或
   RUN_EPIC_F_E2E_REAL_PATH=1 npx playwright test --grep @e2e-three-pack-real --project=chromium
   ```

**验收**：上述 API 就绪后，本地 **`npx playwright test epic-f-normal-release-real`** 通过；**GET** **`/api/v1/orders/:id`** 终态 **`order.status`** 为 **`completed`**。

---

<a id="epic-f-f10-pre-release-hook"></a>

## F-10 — `pre-release-automation` 可选挂钩（F-06）

**默认**：**不**设置 **`CHECK_E2E_THREE_PACK`** 时，**`pre-release-automation.sh` / `.ps1`** 行为与 **F-10 前**一致（**不**调用 **F-06**、**不**执行 **F-08** Playwright）。

**建议开启时机**：当次 **`evidence/GO_YYYYMMDD/`** 已准备合并或过门前，需机读确认 **F-02** 三份 **`artifacts/e2e-*.md`** 已落盘（及可选 **`manifest.json`** **`artifacts[]`** 已登记三条 **`path`**）。

```bash
CHECK_E2E_THREE_PACK=1 EVIDENCE_GO_DIR=evidence/GO_20260407 ./scripts/pre-release-automation.sh
# 可选：同时校验 manifest 登记（须 jq）
CHECK_E2E_THREE_PACK=1 CHECK_E2E_THREE_PACK_MANIFEST=1 EVIDENCE_GO_DIR=evidence/GO_20260407 ./scripts/pre-release-automation.sh
```

**失败代表什么**：**退出码 1 / 2** 表示 **证据结构或参数不满足**（缺 **`.md`**、缺 **`manifest`**、缺 **`jq`**、未设 **`EVIDENCE_GO_DIR`** 等）— **不是**「订单/托管业务测试失败」。**F-08** 真实路径仍须单独执行（见 **[F-08](#epic-f-f08-real-path-playwright)**）。

**Runbook**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md) **§12.6**「可验证发布 manifest 与 E2E 留痕」**§A 步骤 4**；**§12.5** 末段与 Epic F-06 可选挂钩互指。

---

## F-01 产物说明（本步）

- **新增**：本文 **`docs/runbook/Epic-F-e2e-three-pack-ladder.md`**。
- **不写**：业务代码、新 E2E 用例、对 B-115/B-116/P5 与 Epic A/C/D/E 封口行为的修改。
