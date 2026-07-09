# TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001 · 前端全页面 **10 轮** UI/UX 深度缺口协议（生产取向 · 禁假 JSON）

**仓库路径：** `docs/runbook/TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md`  
**稳定锚：** [`#tt-96-20-ten-solo`](#tt-96-20-ten-solo) · [`#tt-96-20-ten-intro`](#tt-96-20-ten-intro) · [`#tt-96-20-ten-pages`](#tt-96-20-ten-pages) · [`#tt-96-20-ten-pages-sidecar`](#tt-96-20-ten-pages-sidecar) · [`#tt-96-20-ten-pages-nonpage`](#tt-96-20-ten-pages-nonpage) · [`#tt-96-20-ten-matrix-closure`](#tt-96-20-ten-matrix-closure) · [`#tt-96-20-ten-page-dod`](#tt-96-20-ten-page-dod) · [`#tt-96-20-ten-nomock`](#tt-96-20-ten-nomock) · [`#tt-96-20-ten-nomock-boundary`](#tt-96-20-ten-nomock-boundary) · [`#tt-96-20-ten-lexicon`](#tt-96-20-ten-lexicon) · [`#tt-96-20-round-exit`](#tt-96-20-round-exit) · [`#tt-96-20-ten-ci-matrix`](#tt-96-20-ten-ci-matrix) · [`#tt-96-20-ten-tier-map`](#tt-96-20-ten-tier-map) · [`#tt-96-20-round-01`](#tt-96-20-round-01) … [`#tt-96-20-round-10`](#tt-96-20-round-10) · [`#tt-96-20-ten-evidence`](#tt-96-20-ten-evidence) · [`#tt-96-20-appendix-a`](#tt-96-20-appendix-a) · [`#tt-96-20-appendix-b`](#tt-96-20-appendix-b) · [`#tt-96-20-appendix-b-min-axes`](#tt-96-20-appendix-b-min-axes) · [`#tt-96-20-appendix-b-controls`](#tt-96-20-appendix-b-controls) · [`#tt-96-20-appendix-b-tt-enum`](#tt-96-20-appendix-b-tt-enum) · [`#tt-96-20-appendix-c`](#tt-96-20-appendix-c) · [`#tt-96-20-appendix-c-grep`](#tt-96-20-appendix-c-grep) · [`#tt-96-20-appendix-e`](#tt-96-20-appendix-e) · [`#tt-96-20-appendix-e-controls-notes`](#tt-96-20-appendix-e-controls-notes) · [`#tt-96-20-appendix-e-tt-naming`](#tt-96-20-appendix-e-tt-naming) · [`#tt-96-20-appendix-e-bucket-refs`](#tt-96-20-appendix-e-bucket-refs) · [`#tt-96-20-appendix-e-vitest`](#tt-96-20-appendix-e-vitest) · [`#tt-96-20-appendix-f`](#tt-96-20-appendix-f) · [`#tt-96-20-appendix-g`](#tt-96-20-appendix-g) · [`#tt-96-20-appendix-d-skeleton`](#tt-96-20-appendix-d-skeleton) · [`#tt-96-20-appendix-d-script`](#tt-96-20-appendix-d-script) · [`#tt-96-20-appendix-e-validate`](#tt-96-20-appendix-e-validate) · [`#tt-96-20-appendix-e-data-align`](#tt-96-20-appendix-e-data-align) · [`#tt-96-20-appendix-e-merge`](#tt-96-20-appendix-e-merge) · [`#tt-96-20-appendix-e-fill-spec-matrix`](#tt-96-20-appendix-e-fill-spec-matrix) · [`#tt-96-20-appendix-e-audit-controls-vs-source`](#tt-96-20-appendix-e-audit-controls-vs-source) · [`#tt-96-20-appendix-e-fill-controls-from-source`](#tt-96-20-appendix-e-fill-controls-from-source) · [`#tt-96-20-appendix-d-env`](#tt-96-20-appendix-d-env)

**Version:** 1.0.28  
**Status:** `Active` — **① 本地 / ② 测试网** 执行协议；**不**替代 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**、**[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[31](../spec/31-TT社区-企业级UI检查-未完成与待优化.md)**、**[96-15](../spec/96-15-深度多维度检查与审计体系.md)** 正文；**不**把「十轮表填完」自动等同于 **③ 生产 GO**。

**阶次：** 每轮结论须标明 **① / ② / ③**；**禁止跳阶**（与 **[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)** 同源）。

---

<a id="tt-96-20-ten-intro"></a>

## 0. 读前：本协议解决什么

<a id="tt-96-20-ten-solo"></a>

### 0.0 **独立开发口径（无 PR · ① 自证）**

| 点 | 说明 |
|----|------|
| **收口不绑 PR** | **独立开发 / 单维护者**（**[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)** **第 14 条**、**[CONTRIBUTING · 推送前本地检查](../../CONTRIBUTING.md#pre-push-local)** 注释块、**[TT-LOCAL §2 / §2.2](../runbook/TT-LOCAL-CI-DELIVERY-GATE-001.md)**、**[CONTRIBUTING · GitHub Actions 不可用](../../CONTRIBUTING.md#github-actions-unavailable)**、**[缺口与待补-官方总表 · 独立开发期口径](../spec/缺口与待补-官方总表.md)** 同读）：本协议的 **十轮 / 附录 E / `merge`/`validate`** 以 **`evidence/`** 下 **`exit 0`**、**`round-r*.csv` / `round-r*-notes.md`**（或等价路径）**自留可复查**为**主真源**；**不**把「本轮必须 **开 PR / 等远端绿**」当作 **①** 十轮 UI 面收口的**前置条件**。 |
| **仍须诚实** | **禁**用仅填表、仅机读绿冒充 **②③** 或 **93 MANUAL 全文已手点**（**§0.2.1**、**[no-false-completion](../../CONTRIBUTING.md#no-false-completion)**）。 |
| **建议固定动作** | **R1～R9** 多文件时先用 **`bash scripts/tt-96-20-appendix-e-merge.sh -o …`**（**[附录 D.1.2](#tt-96-20-appendix-e-merge)**）合成 **一份合并 CSV**，再跑 **`bash scripts/tt-96-20-appendix-e-validate.sh --strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal …`**（与 **solo-dev §6.5·14** 同源；**`--help`** 见单开关）；**或** **`bash scripts/tt-96-20-appendix-e-generate-machine-stub.sh --bundle --out-dir …`** 一次生成分包 + merged + **Python 自校验**。**命令 + 末行输出**粘贴进 **`round-rN-notes.md`**，便于 **Owner=本人** 复核。 |

| 问题 | 本协议做法 |
|------|------------|
| **「全矩阵」太大、无从下口** | 固定 **10 轮**主题；每轮 **页面子集 + 维度清单 + 出口判据**，可并行由不同 Owner 执行。 |
| **深度多维 vs 自动化** | 每轮同时列 **Playwright / Vitest / 手验** 三类手段；**能自动化的写 spec**，**不能的写手验表**（与 **[96-15 §1](../spec/96-15-深度多维度检查与审计体系.md)** Tier 语义对读）。 |
| **mock 顶真栈** | 见 **§0.2**；与 **[TT-31 · mock 分轨](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-mock-reality)** 一致。 |

<a id="tt-96-20-ten-nomock"></a>

### 0.2 **禁止 mock（本协议默认 · Playwright 页面侧）**

| 禁止 | 说明 |
|------|------|
| **`page.route` 伪造 `200` JSON** 冒充矩阵 | **不**作为 **①②** 收口证据。 |
| **拦截真实 API 并返回静态体** 充当「已联调」 | 与 **生产级** 定义冲突。 |

| 允许（与 TT-31 分轨一致） | 说明 |
|---------------------------|------|
| **Vitest** 内 **`fetch` / `Response` 契约桩** | 仅用于 **client 解析 / mapXxxError** 单测，**不**顶替 **Playwright 全栈** 结论。 |
| **`request` 夹具直连 API**（**`PLAYWRIGHT_E2E_NO_WEBSERVER=1`** 等） | **真 HTTP**；可与 UI 轮次 **互补**，**不**冒充「每页每键已手点」。 |
| **仓库允许的链下 **`mock-pay` / `@e2e-chain-off-mock-pay`** | **真代码路径** + **真 API**；**②③ PSP** 仍须另证据。 |

<a id="tt-96-20-ten-nomock-boundary"></a>

### 0.2.1 **「全矩阵跑通」≠ 下列结论（防假完成）**

| **不**自动等价 | 说明 |
|----------------|------|
| **`npm run e2e:full-chromium` exit 0** | **chromium 全 spec** 边界见 **[TT-LOCAL-FULL-E2E-MATRIX-001](TT-LOCAL-FULL-E2E-MATRIX-001.md)**；**不**覆盖 **93 / 96-20** 文档矩阵每一 MANUAL 行。 |
| **`ci-local` / `local-delivery-expanded` 绿** | 与 **[TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)**、**[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** 同源：**机读绿 ≠ 每页每控件已验**。 |
| **十轮表「填完」** | 须 **附录 E** 每 **`page.tsx`** 有 **五态** + **失败项** 有 **issue / TT-GATE** 指针；空白行视为 **未完成**。 |

---

<a id="tt-96-20-ten-pages"></a>

## 0.3 **页面真源（全量枚举入口）**

- **Next App Router 页面文件**：`frontend/app/**/page.tsx`（**126** 个 **`page.tsx`** · **2026-05-27** `find` 实扫；以 **`git ls-files 'frontend/app/**/page.tsx' | wc -l`** 在 **HEAD** 上现数为准；**附录 A** 按目录归桶；**附录 E CSV 并集** 刷新 **另闸**）。
- **矩阵对拍**：**[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**（路由 × API × UI 职责）；**[13-1 表 1](../spec/13-1-UI产品级SSOT与页面规范.md)**。  
- **P0 机读子集**：`frontend/e2e/p0-routes.v1.json` + **[TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**。

<a id="tt-96-20-ten-pages-sidecar"></a>

### 0.3.1 **卫星路由文件（不单独占 123 行，但与 UI/UX 共验）**

与某 **`page.tsx` 同目录**（或上级 **`layout.tsx` 包裹链**）常见的 **`layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `template.tsx`**：**不**要求与 **`page.tsx` 1:1 额外 CSV 行**；若出现 **级联 skeleton**、**error 边界文案**、**404 壳**、**全屏 loading 闪烁** 等问题，须在 **附录 E** 对应 **`user_path`** 行的 **`gap_issue`** 或 **`round-rN-notes.md`** 写明 **文件路径 + 复现**，并由 **R10** 或 **附录 B** **`loading` / `http`** 轴向收口。

<a id="tt-96-20-ten-pages-nonpage"></a>

### 0.3.2 **非 `page.tsx` 但仍影响 UI/UX 的真源（主表外挂靠）**

| 对象 | 本协议做法 |
|------|------------|
| **`middleware.ts`**（常见 **`frontend/middleware.ts`**） | **重定向 / 401 壳 / locale cookie** 等与 **`http`**、**`i18n`** 交叉；**不**单独占 **附录 E** 行；在受影响 **`user_path`** 行的 **`gap_issue`** / **`key_api_or_ui_contract`** 写明 **`middleware`** 行为或 **issue**。 |
| **`app/**/route.ts`**（Route Handlers） | **不**计入 **`page.tsx` 126**；若某页 **唯一**依赖某 **`GET`/`POST` route**，在 **`key_api_or_ui_contract`** 写 **HTTP 方法与路径**，**96-20** 对拍。 |
| **`components/`**、**`hooks/`**、**`lib/`** | **不**逐文件进 **附录 E**；缺陷 **归因**到具体 **`user_path`** + **`appendix_b_axes`**。 |

<a id="tt-96-20-ten-matrix-closure"></a>

### 0.3.3 **文档「全矩阵」闭包（93 / 96-20 / 13-1：缺行须登记，禁静默 PASS）**

**目的：** **附录 E** 的每一 **`page.tsx`** 行，除 **B.2 功能面 + `controls_notes`** 外，还须能在 **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**、**[13-1 表 1](../spec/13-1-UI产品级SSOT与页面规范.md)** 中找到 **对应叙述**；若 **文档矩阵尚无该行**，**不得**假装已覆盖 — **须**走 **补矩阵** 或 **缺口登记**。

| 规则 | 做法 |
|------|------|
| **机读前缀** | 在 **`key_api_or_ui_contract`** 或 **`gap_issue`**（可 **`;`** 拼接多 token）写入 **`matrix:`** 前缀标签，便于 `rg '^matrix:' evidence/…/*.csv` 汇总。 |
| **已映射到 93** | **`matrix:93:<域或表意锚>`**（例：`matrix:93:community-feed`）+ 可选 **MANUAL 行号 / 小节** 仍写在人类可读尾部。 |
| **已映射到 96-20** | **`matrix:96-20:<文内锚或表名>`**（与 **96-20** 目录 / 表头可对 grep）。 |
| **已映射到 13-1** | **`matrix:13-1:<表1 行或页面类型>`**。 |
| **文档无行（本页 UI/UX 或按键在 93/96-20 中不可追溯）** | **`matrix:MISSING`** + **`gap_issue`** **须**含 **issue URL** 或 **`TT-GATE#…`**；**跟进动作** 为 **开 PR 补 93 / 96-20 / 13-1** 或 **产品确认 N/A**。**禁** **`status_93:PASS`** 且 **`matrix:MISSING`** 且无 **`gap_issue`**。 |
| **纯静态 / 重定向壳** | 可 **`matrix:N/A-doc-row`** 并在 **`gap_issue`** 或 **`round-rN-notes.md`** 一句说明 **为何无交互矩阵行**。 |

**与「每控件」关系：** **`matrix:`** 解决 **「全矩阵有没有这一页」**；**`controls_notes` + B.2** 解决 **「这一页有哪些可点入口已验」** — 两层 **都**要，才满足本节 **闭包** 口径。

<a id="tt-96-20-ten-page-dod"></a>

### 0.3.4 **逐页 Definition of Done（DoD · 每个 `page.tsx` · 可勾选 · 与「必须全覆盖」对读）**

**一行 = 一个 `page.tsx`。** 下列 **全部**满足，才视该页在本协议下 **「已收口」**（仍 **不**冒充 **②③** 或 **93 MANUAL 全文已手点** — 见 **§0.2.1**）。

| # | 检查项 | 通过口径 |
|---|--------|----------|
| **1** | **主键** | **`page_tsx_path`** **=** 仓库 **`git ls-files`** 中真实路径；**`user_path`** 与 **附录 E.1** 规则一致。 |
| **2** | **`matrix:`** | **`key_api_or_ui_contract`** 或 **`gap_issue`** 至少其一可被 **`rg 'matrix:'`** 命中；语义遵守 **[§0.3.3](#tt-96-20-ten-matrix-closure)**。 |
| **3** | **`appendix_b_axes`** | **含**与本页相关的 **`nav` / `cta` / `browse`**；确无则 **`NOT RUN`** + **`gap_issue`** 写清 **为何省略**（与 **[B.1](#tt-96-20-appendix-b-min-axes)** 不冲突）。 |
| **4** | **`controls_notes`** | 已走 **[B.3](#tt-96-20-appendix-b-tt-enum)**（**目录级** **`data-tt-*`**）并 **[B.2](#tt-96-20-appendix-b-controls)** 各 **功能面** 有 **`tt:`/`lbl:`** 或显式 **`NOT RUN`**；**禁** **`status_93:PASS`** 且 **`controls_notes`** 空（**§0.2.1** 已述例外：**`N/A` 无交互壳** 须在 **`gap_issue`** 说明）。 |
| **5** | **弹层 / URL 态** | **[B.2](#tt-96-20-appendix-b-controls)** **弹层与 URL 驱动 UI** 已在 **`controls_notes`** 或 **`round-rN-notes.md`**（本行 **`see:notes…`**）出现 **或** 标 **`N/A`** + 理由。 |
| **6** | **五态** | **`status_93`** 为 **93 §0.2** 之一；与 **2～5** 无逻辑矛盾（例：**禁** **`PASS`+`matrix:MISSING`+空 `gap_issue`**）。 |
| **7** | **证据链** | **`playwright_ref` / `d3_hand` / `vitest_ref`** 至少其一指向 **本轮可复查产物**，或 **`gap_issue`** 写明 **「全手验 / 无 spec」** 的 **Owner+日期**。 |
| **8（可选机读 · 数据对齐最小留痕）** | **`key_api_or_ui_contract`** | 收紧 **`bash scripts/tt-96-20-appendix-e-validate.sh --require-key-api-signal`** 时：须含 **`matrix:`** 或 **`GET`/`POST`/`PUT`/`PATCH`/`DELETE` + 空格 + **`/`** 路径（例：`GET /orders`），或 **`align:static` / `align:n/a` / `align:n/a-api`**；**确无 HTTP 面** 可在 **`gap_issue`** 写 **`align:waive-key-api:`** + 理由 — 见 **[E.2.3](#tt-96-20-appendix-e-data-align)**。**不**替代 **04 / 96-20** 正文对拍与 **真响应** 断言。 |

**十轮并集（全站 UI 面「全覆盖」）：** **`round-r1`～`round-r9` 附录 E CSV** 合并后，**`uniq(page_tsx_path)` 行数** **须等于** **`git ls-files 'frontend/app/**/page.tsx' | wc -l`**（**2026-05-27 实扫 126**；以执行日现数为准）。**缺页** → **十轮未闭**。**`round-r10` 附录 E** 可为 **横切抽样 + 缺口指针**，**不**替代 **R1～R9** 并集 **126** 行的 **DoD 1～7**（**附录 E CSV** 若仍 **123** 行 → **另闸** · **AC-05**）。**机读核对并集 + `matrix:`**：多文件时先 **[D.1.2](#tt-96-20-appendix-e-merge)** **`merge.sh`** 再 **[D.1.1](#tt-96-20-appendix-e-validate)** **`validate.sh`**（**`exit 0`**；可选 **`--strict-pass-controls`**、**`--require-controls-tag`**、**`--strict-b-axes`** — 见 **`--help`**）；**亦**可 **多个 CSV 一次传入** **`validate.sh`**（与 **D.1.2** 等价并集，**无** **`idx`** 重排）。

---

## 0.4 **十轮总览（每轮一条脊）**

| 轮次 | 主题 | 主要路由前缀（示例） |
|------|------|----------------------|
| **R1** | 公共壳 + 主导航 + 首屏数据就绪 | **`/`**、**`/market`**、**`/guides`**、**`/community`**、**`/discover`** |
| **R2** | 认证与账户恢复 | **`/auth/*`** |
| **R3** | 订单 / 支付入口 / 托管详情 | **`/orders/*`**、**`/escrow/*`**、**`/pay`** |
| **R4** | 社区消费与创作（Feed / 话题 / 活动 / 用户主页） | **`/community/*`**（含 **`messages`**、**`topic`**、**`user`**） |
| **R5** | 社区「我的」Hub 与分栏 | **`/community/me/*`** |
| **R6** | Me / 身份槽 / 安全 / 准入 | **`/me/*`**、**`/me/onboarding`**、**`/me/identities`** |
| **R7** | Admin 列表与筛选（可达性 + 403/401 语义） | **`/admin/*`**（列表类为主） |
| **R8** | Admin 详情 / 合规 / 审计 / 作业 | **`/admin/**/[id]`**、**`compliance`**、**`audit`**、**`scheduler`** |
| **R9** | 治理 / 质押 / DID 榜 / 静态与条款 | **`/governance/*`**、**`/staking`**、**`/did-rank`**、**`/privacy`**、**`/terms/*`**、**`/help`** |
| **R10** | 横切：**响应式 · 触控 · 键盘 · 焦点 · 弹层 · 性能 · 回归** | **全站抽样** + **96-16 D3** 手验 |

<a id="tt-96-20-ten-lexicon"></a>

### 0.4.1 **词表（防口语漂移）**

| 用语 | 本协议中的含义 |
|------|----------------|
| **全矩阵（UI/UX）** | **`page.tsx` 全量**（**§0.3**）在 **[附录 E](#tt-96-20-appendix-e)** 逐行登记 **×** **[附录 B](#tt-96-20-appendix-b)** **全部适用 `slug`**（含 **导航 / 按键与 CTA / 列表与浏览**；见 **[B.2](#tt-96-20-appendix-b-controls)**）**×** **`controls_notes`**（**[E.2.2](#tt-96-20-appendix-e-tt-naming)** 与 **`data-tt-*` 对齐命名**；源码枚举见 **[B.3](#tt-96-20-appendix-b-tt-enum)**）**×** **`matrix:` 文档闭包**（**[§0.3.3](#tt-96-20-ten-matrix-closure)**：**93 / 96-20 / 13-1** 有行或 **`MISSING`+缺口**）**×** **逐页 DoD**（**[§0.3.4](#tt-96-20-ten-page-dod)**：**R1～R9** 并集 **126** 行 · **2026-05-27 实扫**）**×** **R1～R10** 分工；**[B.1](#tt-96-20-appendix-b-min-axes)** 为 **按路由类型的最小轴向组合**；**附录 G** 为执行总表。 |
| **深度多维** | **自动化（Playwright / Vitest / `matrix:96-16:*`）** 与 **手验（R10 / D3 / Tier）** 并列；缺一类须标 **NOT RUN** 及原因（对齐 **[96-15](../spec/96-15-深度多维度检查与审计体系.md)** Tier 语义）。 |
| **生产级真实现** | **用户可见路径**走 **真实后端契约**（**禁 §0.2** 假 JSON）；合入纪律见 **[附录 C](#tt-96-20-appendix-c)**；**②③**（PSP / 主网 / 生产回调）**另表**验收。 |

<a id="tt-96-20-round-exit"></a>

### 0.4.2 **每轮出口判据（① · 可勾选）**

| 轮次 | **自动化最小集**（本轮路由交集） | **附录 E** | **手验 / Tier** |
|------|----------------------------------|------------|-----------------|
| **R1** | **`smoke`** / **`p0-spine`** + 与公共壳相关的 **`e2e:full-chromium`** 失败项清零或已登记 | 本轮涉及的 **`user_path`** 均有 **五态** | **D3** 至少 **2** 条关键路由（含 **`/`**） |
| **R2** | **`auth-*`** 相关 spec；**429** 已用 **`playwright429Backoff`** 或等价 | 全部 **`/auth/*`** **`page.tsx`** 行 | Vitest 契约与 **04** 对拍项无悬空 **FAIL** |
| **R3** | **`p02`～`p05`**、**`b467`**、**`53-main-path`**、**trust-gate-*** 中与本轮桶交集 | **`orders/`**、**`escrow/`**、**`disputes/`**、**`pay`**、**`itinerary`**、**`guide/`** 等行 | **mock-pay** 仅 **真路径**；**②** PSP **NOT RUN** 须写原因 |
| **R4** | **`smoke-community`**、**`section10-5-*`**、发帖竖切 spec | 全部 **`community/`**（除 **`me`** 子树可标 **R5**） | **TT-GATE** 社区段 **MANUAL** 有勾选或 **N/A** |
| **R5** | **`p0-spine`**、**`community-me-*`** | **`community/me/*`** 各行 | **Hub `?tab=`** 与 **GET** 手验或 spec 断言 |
| **R6** | **`p0-spine`**、**`me-security-*`**、**`me-onboarding-*`** | **`me/*`** 各行 | **Onboarding** 真按钮路径无 **仅壳** |
| **R7** | **`smoke-admin`**、**`93-matrix-admin-*`** | **`admin/`** 列表类 **`page.tsx`**（可按子目录分批） | **非 admin 403** 窄矩阵或 **NOT RUN** |
| **R8** | **`smoke`** Admin 深链 + 专项 spec（若有） | **`admin/`** **`[id]`** / **compliance** / **audit** / **scheduler** 等行 | **写路径**须 **审计 / 权限** 证据或 **BLOCKED** |
| **R9** | **`smoke-governance`**、**`release-flow`**、**`93-matrix-path-did-rank-*`** | **`governance/`**、**`staking`**、**`did-rank`**、**`terms`**、**`privacy`** 等行 | **链上全链** 仅 **②③** 证据，**禁**在 **①** 冒充已闭 |
| **R10** | **`matrix:96-16:all`** + **`test:a11y:ci`** / **`test:i18n:ci`**（本轮若改键） | 对 **R1～R9** 中 **FAIL / NOT RUN** 行补 **附录 B** 轴向勾选（**须**含 **`nav` / `cta` / `browse`** 中与本页相关的缺口）；**并**核对 **§0.3.4** **126 行并集**（**uniq `page_tsx_path`**）无漏 | **[TT-96-16-D3](TT-96-16-D3-hand-checklist-001.md)** 抽样表填满或 **N/A** 有理由 |

<a id="tt-96-20-ten-ci-matrix"></a>

### 0.4.3 **① 机读命令 ↔ 附录 B `slug` 速查（`frontend/`）**

下列 **不**替代 **Playwright 全栈**；与 **§0.2**、**附录 C** 同读。**`test:a11y:ci`** 默认打 **`http://localhost:3012`**，须 **Next 已监听**（与 **`package.json`** 脚本同源）。

| 命令 | 主要 **附录 B `slug`** | 典型轮次 |
|------|------------------------|----------|
| **`npm run test:i18n:ci`** | **`i18n`** | **R1**、**R2**、**R10** |
| **`npm run test:a11y:ci`** | **`focus`**（抽样）、与 **`http`** / **landmark** 交叉 | **R1**、**R10** |
| **`npm run matrix:96-16:all`** | **`responsive`**、**`touch`**、**`motion`**、**`media`**（**96-16** 机读矩阵） | **R10** |
| **`npm test`**（仓库 Vitest 默认） | **`form`**（契约 / `mapXxxError`）、部分 **`loading`** 组件逻辑 | **R2**、**R3**、**R6**（视本轮是否改到对应模块） |
| **`npm run test:regional:ci`** | **`i18n`**、与 **`http`** 交叉的 **地域/合规** 展示边界 | **R10**；触及 **市场 / 支付 / 条款** 文案时 **R1**、**R3**、**R9** |

<a id="tt-96-20-ten-tier-map"></a>

### 0.4.4 **与 96-15 Tier 的对读（本协议不替代 spec 正文）**

| **Tier（语义）** | **在本十轮协议中的落点（① 摘录）** |
|------------------|--------------------------------------|
| **A** | **Playwright / Vitest / `matrix:96-16:*`** 为主；**仍须** **[附录 E](#tt-96-20-appendix-e)** 对 **`page.tsx`** 做 **五态** 收口。**禁**把 **单闸绿** 口述成 **Tier A 已全闭** — 以 **[96-15](../spec/96-15-深度多维度检查与审计体系.md)** 为准。 |
| **B** | **R7**（RBAC 交叉）、**R8**（Admin 写路径）、**R4/R5**（社区深度）— **手验** + **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**。 |
| **C** | **R10**（横切）+ **[TT-96-16-D3](TT-96-16-D3-hand-checklist-001.md)** + **93 / 96-20 MANUAL** — **冻结 / 对外承诺** 前与 **96-15** 正文 **逐项**对拍。 |

---

<a id="tt-96-20-round-01"></a>

## **R1** · 公共壳 + 主导航 + 首屏数据就绪

| 维度 | 检查项（摘录） | 手段 | 缺口登记处 |
|------|----------------|------|------------|
| **路由可达** | 上表路由 **200**、无无限 **loading** | **`smoke.spec.ts`** / **`p0-spine-real-api`** / 手验 | **[TT-GATE §3](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md#tt-gate-cross-domain)** |
| **真 API** | **`skipIfApiDown`**；**`GET /meta`**、列表类 **GET 200** 与 UI 对齐 | Playwright **`waitForResponse`** 对 **真实 URL** | 同 **[TT-96-20 §3](TT-96-20-P0-E2E-LADDER-001.md)** |
| **i18n 壳** | 关键 **`aria-label` / `title`** 与中英文切换不断裂 | 手验 + **`npm run test:i18n:ci`**（若本轮触达文案键） | **96-13** / **96-16** |
| **a11y 基底** | **`h1`** 唯一、**`main`** landmark、**跳过链接** | **Lighthouse `test:a11y:ci`** 抽样 + 手验 | **96-16 D** |

---

<a id="tt-96-20-round-02"></a>

## **R2** · 认证与账户恢复

| 维度 | 检查项 | 手段 | 备注 |
|------|--------|------|------|
| **表单真提交** | login / register / forgot / reset / verify | **`auth-*`** specs；**禁** `page.route` | **429** 用 **`playwright429Backoff`** |
| **错误语义** | **401/403/422** 与 **`mapApiReadError`** 一致 | Vitest **`lib/apiClient/onboarding`**（**`onboarding.http.*.test.ts`**）等 **互补** | 与 **04** 对拍 |
| **会话载体** | Cookie / Bearer 与 **96-17** 一致 | **`96-17-header-identity-spine`**（**独立 project**） | **[96-17](../spec/96-17-多重身份与钱包真值.md)** |

---

<a id="tt-96-20-round-03"></a>

## **R3** · 订单 / 支付入口 / 托管

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **链下主脊** | 创单 → 列表 → escrow 详情 **`chain-sync-status`** | **`p02`～`p05`**、**`b467`**、**`53-main-path`** |
| **mock-pay 真路径** | 须 **`P3_CHAIN_OFF=1`** + **真实 POST** | **`b466`**、**`b468`**；**禁**假 JSON |
| **争议 / 证据** | trust-gate 四文件 + PG 双写边界 | **`trust-gate-*`** + **`matrix_93_b_tg_*`** |

---

<a id="tt-96-20-round-04"></a>

## **R4** · 社区消费与创作（Feed / 话题 / 私信 / 用户主页）

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **Feed 真数据** | **`GET /api/v1/community/feed`** **200** 后渲染 | **`smoke-community`**、**`section10-5-*`** |
| **发帖全链** | **`upload-media`** + **`POST …/posts`** + **`GET …/posts/:id`** | **`market-subsite-studio-and-community-publish`** |
| **视频** | 列表预览 / 抽屉内 **`<video>`**；**全屏播放器**见 **缺口** | **TT-GATE §2** 手验 + 未来专项 spec |
| **私信 / orderId 摘要** | **`/community/messages/*`** **53-S7** | **`smoke-community`** |

---

<a id="tt-96-20-round-05"></a>

## **R5** · 社区「我的」Hub 与分栏

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **`?tab=`** | posts / collects / likes / orders 与 **GET** 对齐 | **`p0-spine`**、**`community-me-hub-notes-drawer-ia`** |
| **DataState DOM** | **`data-tt-*`** 语义 | **`community-me-data-state`** |
| **赞藏关注持久化** | 刷新一致 | **手验** + **F-019** request 集；**TT-GATE §2** |

---

<a id="tt-96-20-round-06"></a>

## **R6** · Me / 身份槽 / 安全 / 准入

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **Me 与 Hub 跳转** | **`/me` → `/community/me`** | **`p0-spine`** |
| **安全页** | sessions / 密码入口 | **`me-security-community-hub`** |
| **Onboarding** | quote / intents / role-confirm **真实按钮** | **`me-onboarding-96-18-shell`** + Vitest |

---

<a id="tt-96-20-round-07"></a>

## **R7** · Admin 列表与权限语义

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **列表可达** | 各 **`/admin/...`** 列表 **200** | **`smoke-admin`**、**`93-matrix-admin-*`** |
| **非 admin** | **403** 语义（窄矩阵） | **`f029-f030-f031-request`** **F-030** |
| **RBAC 全交叉** | 多角色 × 多页 | **手验 Tier B**（**TT-GATE §3**） |

---

<a id="tt-96-20-round-08"></a>

## **R8** · Admin 详情 / 合规 / 审计 / 作业

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **占位详情** | **`[id]`** 路由壳 | **`smoke.spec.ts`** Admin 段 |
| **写路径审计** | 审批、发布、调度 **真实 POST**（若有） | **专项 spec** 或 **②** 手验 + 日志脱敏 |
| **内部工具** | **`/admin/internal-tools/*`** 暴露面 | **手验** + **权限** |

---

<a id="tt-96-20-round-09"></a>

## **R9** · 治理 / 质押 / DID / 静态与条款

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **治理只读** | proposals / fee-routes 等 **壳 + 关键 GET** | **`smoke-governance`**、**`release-flow`** |
| **质押页** | **`/staking`** **main landmark** | **`smoke`** / **`release-flow`** |
| **DID 榜** | 榜单壳 + 深链 | **`93-matrix-path-did-rank-boards`** |
| **链上积分全链** | **非**仅壳 | **②③** + **产品对账**（**本协议不冒充已闭**） |

---

<a id="tt-96-20-round-10"></a>

## **R10** · 横切：**响应式 · 触控 · 键盘 · 焦点 · 弹层 · 性能**

| 维度 | 检查项 | 手段 |
|------|--------|------|
| **320 / 768** | 关键弹层不裁切、可滚动 | **[TT-96-16-D3-hand-checklist](TT-96-16-D3-hand-checklist-001.md)** |
| **键盘** | Esc 关闭、Tab 顺序、焦点环 | 手验 + **Lighthouse a11y** 抽样 |
| **弹层 z-index** | **Hub / 市场 / escrow** 同屏冲突 | **`marketStudioModalLayout`** 变更走 **扩充闸** |
| **性能** | LCP 粗检、**真视频** 不阻塞主线程（**缺口**） | **96-16**、**TT-GATE §2** |
| **flake 治理** | 失败 **截图 + trace** 归档 | **Playwright** `--trace on` 策略见 **[TT-L4](TT-L4-PARALLEL-CI-001.md)** |

---

<a id="tt-96-20-ten-evidence"></a>

## 0.5 **每轮证据（最小集 · 与 93 §0.5 对齐）**

每轮结束须在 `evidence/GO_YYYYMMDD/`（或等价目录）留下：

1. **本轮路由清单**（`git ls-files` 子集或表格导出）。  
2. **`round-rN-appendix-e.csv`**（或等价名）：**附录 E** 全列（含 **`controls_notes`**）；**每行一个 `page.tsx`**；**禁止**整桶只写一行概括；**须**含 **`matrix:`** 闭包（**[§0.3.3](#tt-96-20-ten-matrix-closure)**，写在 **`key_api_or_ui_contract`** 或 **`gap_issue`**）。可由 **`bash scripts/tt-96-20-appendix-e-skeleton.sh`** 生成初稿后再改 **`user_path` / `playwright_ref` / `controls_notes` / `matrix:` / 五态**（见 **[附录 D.1 脚本锚](#tt-96-20-appendix-d-script)**）；**仅**需 **① 机读闸先绿** 时可用 **`bash scripts/tt-96-20-appendix-e-generate-machine-stub.sh`**（**`matrix:96-20:auto:*`** 占位，**`--bundle --out-dir …`** 同步 **R1～R9 分包 + merged**），**须**后续替换为 **文档真矩阵锚**（可用 **[D.1.3](#tt-96-20-appendix-e-fill-spec-matrix)** **`fill-spec-matrix.sh`** 半自动写入 **`matrix:96-20:` / `matrix:93:`** 等可读锚 + **附录 A 分桶** **`matrix:13-1:bucket-*`**）；**`controls_notes`** 可用 **[D.1.5](#tt-96-20-appendix-e-fill-controls-from-source)** **`fill-controls-from-source.sh`**（**`--summary`**）从 **`page.tsx` 同目录** **`data-tt-*`** 自动写 **`tt:`** / **`tt:shell-only`**，再跑 **[D.1.4](#tt-96-20-appendix-e-audit-controls-vs-source)** **`audit-controls-vs-source.sh`**（**`--strict`**）机读对拍（**[B.3](#tt-96-20-appendix-b-tt-enum)** / **[E.2.2](#tt-96-20-appendix-e-tt-naming)**）。**不**冒充 **93/96-20** 语义闭包。  
3. **`round-rN-notes.md`**（可选）：本轮环境变量、flake、**`test.skip`** 与 **BLOCKED** 原因。  
4. **Playwright / 手验** 结论表：**PASS / FAIL / BLOCKED / N/A / NOT RUN**（与 **[93 §0.2](../spec/93-全站功能验证矩阵-域别回归清单.md)** 五态同源）。  
5. **失败项**：issue 链接或 **TT-GATE** 登记指针；**禁**「仅口头全绿」。  
6. **Playwright 产物指针**（**FAIL / flake** 时）：在 **`round-rN-notes.md`** 或 **`gap_issue`** 写明 **`frontend/playwright-report/`**（HTML）及/或 **`frontend/test-results/`**（**trace.zip** / 截图）相对路径或归档 zip；与 **[TT-L4](TT-L4-PARALLEL-CI-001.md)**、**`playwright.config`** 输出目录对拍。  
7. **`vitest_ref` 真源**：见 **[附录 E.2.1](#tt-96-20-appendix-e-vitest)**；与 **附录 C**「双轨」同读。  
8. **附录 E 机读收口（推荐）**：**多 CSV** 时先用 **`bash scripts/tt-96-20-appendix-e-merge.sh -o evidence/…/round-r1-9-merged.csv …`**（**[附录 D.1.2](#tt-96-20-appendix-e-merge)**；**后 argv 覆盖**同路径重复行），再 **`bash scripts/tt-96-20-appendix-e-validate.sh …`**（**[附录 D.1.1](#tt-96-20-appendix-e-validate)**）；**exit 0** 才视为 **§0.3.4** **123 行并集 + `matrix:`** 机读关已过。**独立开发收口**建议直接用 **solo-dev §6.5·14** 全开关（**`--strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal`**）；亦可 **`--help`** 按需单开。**仍不**替代 Playwright / 手验。

---

<a id="tt-96-20-appendix-a"></a>

## 1. 附录 A · **`page.tsx` 按顶层目录归桶（HEAD 机读 · 与 R1～R10 映射）**

**计数命令（真源）：** `git ls-files 'frontend/app/**/page.tsx' | wc -l`（**2026-05-27 实扫 126**；以你本机 **HEAD** 现数为准）。

| `frontend/app/<桶>/` | **约**页数 | **主轮次** | 备注 |
|----------------------|-----------|------------|------|
| **`admin/`** | 57 | **R7**（列表闸）+ **R8**（详情/合规/审计） | **RBAC** 长尾见 **TT-GATE §3** |
| **`community/`** | 17 | **R4** + **R5** | Feed / me / messages / topic / user |
| **`governance/`** | 10 | **R9** | proposals / fee-routes / delegate 等 |
| **`market/`** | 5 | **R1** + **R3**（经 **`/orders/new`** 深链） | 与 **94** 子站、**b468** 对读 |
| **`me/`** | 5 | **R6** | onboarding / identities / security |
| **`auth/`** | 5 | **R2** | login / register / forgot / reset / verify |
| **`orders/`** | 3 | **R3** | list / new / `[id]` |
| **`escrow/`** | 2 | **R3** | **`[id]`** 主路径 |
| **`disputes/`** | 2 | **R3** | 列表 + 详情 |
| **`guides/`** | 2 | **R1** | 列表 + **`[id]`** |
| **`guide/`** | 2 | **R3** + **R6** | register 等 |
| **`terms/`** | 2 | **R9** | 条款 / 社区规范 |
| **其余单页桶** | 各 1 | **`(home)`→R1**；**`discover`→R1**；**`did-rank`→R9**；**`help`→R1/R9**；**`itinerary`→R3**；**`pay`→R3**；**`privacy`→R9**；**`staking`→R9**；**`traveltrust`→R1**；**`network`/`trust`→R1 或 R10**（壳/错误边界） | 每桶至少 **一次** **PASS/N/A** 标注 |

**用法：** 每轮开工时 `git ls-files 'frontend/app/<桶>/**/page.tsx'` 导出子清单，**逐文件**在 **[附录 E](#tt-96-20-appendix-e)** 表填行；**`appendix_b_axes`** 优先套 **[附录 B.1](#tt-96-20-appendix-b-min-axes)** → **`controls_notes`** 先按 **[附录 B.3](#tt-96-20-appendix-b-tt-enum)** **整段目录** 枚举 **`data-tt-*`** 再按 **[E.2.2](#tt-96-20-appendix-e-tt-naming)** 压成 **`tt:`** 标签 → 再按 **[B.2](#tt-96-20-appendix-b-controls)** 收口 **手点 / spec** → **`matrix:`** 闭包 **[§0.3.3](#tt-96-20-ten-matrix-closure)**；**NOT RUN** 必须写原因（环境 / 排期 / 角色未开通）。

---

<a id="tt-96-20-appendix-b"></a>

## 2. 附录 B · **UI/UX 深度多维「必查」面（每页至少过一眼）**

下列与 **96-16 / 96-13 / 96-15** 正交；**能自动化的**优先 **`data-tt-*` + Playwright**；**不能的**进 **R10 手验**。**`appendix_b_axes`** 列（**附录 E**）须使用下表 **`slug`**（**`;`** 拼接）。

| **`slug`** | 面 | 查什么（摘录） | 推荐手段 |
|------------|----|----------------|----------|
| **`http`** | 可达 + HTTP 语义 | **非**无限 skeleton；**401/403/404/429** 与 UI 文案一致 | 真 **`waitForResponse`**；**429** → **`playwright429Backoff`** |
| **`loading`** | Loading / Error / Empty | 三态可区分；**Empty** 有下一步 CTA | 手验 + 组件单测（若有） |
| **`form`** | 表单与校验 | 必填、格式、**禁用提交** 态、**aria-invalid** | Playwright + **Vitest** 契约（**不**顶替全栈） |
| **`focus`** | 焦点与键盘 | Tab 顺序、Esc 关层、**focus trap**（模态） | **R10** + **Lighthouse a11y** 抽样 |
| **`touch`** | 触控与 44px | 主 CTA **44×44**、**touch-action** 合理 | **[TT-96-16-D3](TT-96-16-D3-hand-checklist-001.md)** |
| **`responsive`** | 响应式 | **320 / 768 / 1280** 不断裂 | **D3 手验** + 关键页截图 |
| **`motion`** | 动效与减弱动效 | **`prefers-reduced-motion`** 路径不断裂 | **96-16** |
| **`i18n`** | i18n | 键缺失 **fallback**、切换语言后 **数字/日期** 合理 | **`npm run test:i18n:ci`**（本轮若改文案键） |
| **`media`** | 媒体与性能 | 图 **width/height**、视频 **poster**、懒加载 | **TT-GATE §2**（视频全链路另立项） |
| **`analytics`** | 可观测埋点 | 关键转化 **不**因 i18n 切换丢事件 | 产品台账 / **②** 对账 |
| **`nav`** | 导航与信息架构 | **主导航 / 侧栏 / 面包屑 / 返回**；**站内 `a` 深链** 可达；当前路由 **高亮**不断裂 | Playwright **`getByRole('link')`** 抽样 + **R10** 手验 |
| **`cta`** | **按键与 CTA（功能入口）** | **主/次按钮**、**`role=button`**、**图标按钮**；**`disabled` / `aria-busy` / loading** 与文案一致；**destructive** 须有 **确认** 或 **二次确认** | **`data-tt-*`** + Playwright；**`touch`** 与 **44px** 交叉 |
| **`browse`** | **列表 / 表格 / 浏览** | **排序、筛选、分页**；**行内操作**（编辑/删除/更多）；**空列表** CTA 与 **`loading`** 三态 | Playwright + 手验；Admin **R7/R8** 重点 |

**机读辅助（①）：** `cd frontend && npm run matrix:96-16:all`（与 **`package.json`** **`matrix:96-16:*`** 同源）— **不**替代页面手验。

<a id="tt-96-20-appendix-b-min-axes"></a>

### B.1 **按路由类型的建议最小 `appendix_b_axes`（全矩阵填表时优先贴齐）**

| **路由类型（自判）** | **建议最小 `slug` 串（`;` 拼接）** | 说明 |
|------------------------|-------------------------------------|------|
| **静态 / 条款 / 帮助** | **`http;loading;i18n;nav;cta;focus;responsive`** | 少 **`browse`**；**`cta`** 含下载/外链/语言切换等 |
| **Feed / 流式列表** | **`http;loading;browse;cta;nav;media;focus;i18n;responsive`** | **视频/图** 走 **`media`**；**`browse`** 含无限滚动或分页 |
| **表单主导（auth / onboarding / 创建）** | `http;loading;form;cta;focus;i18n`（视情况加 **`nav`**） | **提交/取消/步骤** 走 **`cta`+`form`** |
| **详情 + 抽屉 / 模态（订单、托管、向导）** | `http;loading;cta;focus;browse;form` + **`touch`** | **z-index** 见 **R10**；**`browse`** 含 Tab 内列表 |
| **Admin 列表 / 作业台** | **`http;loading;browse;cta;focus;nav;`** + **R7/R8** 权限 | **行操作**、**批量**、**筛选器** 全覆盖 **`browse`+`cta`** |

<a id="tt-96-20-appendix-b-controls"></a>

### B.2 **「每页功能与按键」PASS 口径（与 93 五态同表登记）**

**穷尽边界：** 以 **用户意图上的功能入口** 为准（主路径 + 本页承诺的次要操作）；**不**要求对 **每一 DOM 节点** 穷举 — 长尾须在 **`appendix_b_axes`** 标 **`NOT RUN`** 并指向 **TT-GATE** 或 **Tier B/C** 手验表。**已验入口**须在 **附录 E** 的 **`controls_notes`** 列（或 **`round-rN-notes.md`** 指针）留痕，与 **[E.2 `controls_notes`](#tt-96-20-appendix-e-controls-notes)** 同读。

下列为 **本页用户可点的功能面**；**能自动化的**写 **Playwright**；**不能的** **R10 手验** 并在 **`appendix_b_axes`** 含对应 **`slug`**。**PASS** 表示 **本轮已点过或已 spec 断言**；未覆盖须 **NOT RUN** + 原因或 **FAIL** + **issue**。

| 检查面 | 包含（摘录） |
|--------|----------------|
| **主路径 CTA** | 首屏 **Primary**、**Sticky** 底栏、**FAB**（若有） |
| **次要与危险操作** | **Secondary**、**Ghost**、**删除/驳回/撤销** 及 **确认对话框** |
| **导航控件** | **Header 菜单**、**Footer**、**返回**、**Tabs / Segmented**（与 **`nav`** 同登记） |
| **数据浏览** | **表头排序**、**筛选 chip**、**分页器**、**「加载更多」**（与 **`browse`**） |
| **内联与行级** | **行「⋯」菜单**、**展开行**、**复制/外链** 图标按钮 |
| **表单内** | **Submit / Reset / 上传 / 日期选择**（与 **`form`**；**禁用态** 与 **`cta`** 交叉） |
| **弹层与 Portal** | **Modal / Dialog / Drawer / Sheet / Toast / Command palette**；**打开 / 关闭 / Esc / 焦点陷阱**（与 **`focus`**、**R10**） |
| **URL 驱动 UI** | **`?tab=`**、**`?modal=`**、**`#hash`**、**深链打开某抽屉** — **须**各列一条 **`lbl:`** 或 **`tt:`** + **手点 / spec** |

**与 13-1 / 96-20 / 93 对拍：** 页面职责表见 **[13-1 表 1](../spec/13-1-UI产品级SSOT与页面规范.md)**；路由 × 能力见 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)**；域别回归见 **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)** — **本协议 CSV 不替代** spec 正文；**文档矩阵缺行** 时 **§0.3.3** **`matrix:MISSING`** **强制**缺口登记并推动 **补矩阵**。

<a id="tt-96-20-appendix-b-tt-enum"></a>

### B.3 **`data-tt-*` 枚举（① 辅助 · 写入 `controls_notes` 前）**

| 步骤 | 做法 |
|------|------|
| **1. 定文件** | 以 **`page.tsx`** 为入口；若 UI 在 **`…Client.tsx`** / **`loading.tsx`** / **`layout.tsx`**，**须**一并纳入同一 **`user_path`** 的 **`rg`** 范围。 |
| **2. 机读枚举** | **单文件：** **`rg -n 'data-tt-[a-zA-Z0-9_-]+=' frontend/app/orders/page.tsx`**。**整段路由树（推荐 · 防漏组件内按钮）：** 以 **`page.tsx`** 所在目录为根，例如 **`rg -n 'data-tt-[a-zA-Z0-9_-]+=' frontend/app/community/explore`**（把 **`explore`** 换成当前 URL segment 目录；**Admin** 大桶可按 **`frontend/app/admin/<子域>`** 分批）。**命中去重**后再写入 **`controls_notes`**。 |
| **3. 写入 `controls_notes`** | 按 **[E.2.2](#tt-96-20-appendix-e-tt-naming)** 把命中项压成 **`tt:…`** 短标签；**仅壳无按钮** 可写 **`tt:shell-only`** 并在 **`gap_issue`** 指 **13-1**。 |

**不**把 **`rg` 命中数** 自动等同 **PASS**；**仍须** **Playwright / 手验** 对 **关键 `data-tt-*`** 做 **可达 + 可点** 断言或 **NOT RUN**。

---

<a id="tt-96-20-appendix-c"></a>

## 3. 附录 C · **从缺口到「生产级真实现」的合入纪律**

| 纪律 | 说明 |
|------|------|
| **禁 `page.route` 假 JSON** | UI 结论 **须** **真实 API** 或 **明确 `test.skip`/`BLOCKED`** 并登记环境（与 **§0.2** 一致）。 |
| **优先补 `data-tt-*` + 稳定选择器** | 降低 flake；与 **`marketStudioModalLayout`** / **`smoke-nav`** 同仓库风格。 |
| **双轨验收** | **Playwright**（全栈）+ **Vitest**（纯函数 / `mapXxxError`）各干其活，**禁**互相冒充。 |
| **链与支付** | **mock-pay** 仅 **链下真路径**；**PSP/主网** **②③** 另证据。 |
| **Admin 写路径** | **须** **审计字段 / 权限** 与 **04** 对拍；**禁**仅「页面能打开」。 |
| **flake vs 真 FAIL** | 同源失败 **≥3** 次：先 **trace / 截图** 归档，再开 **issue（flake）** 或修 **选择器 / 竞态**；**禁**无 **`notes`** 说明批量 **`test.skip`** 顶绿。 |

<a id="tt-96-20-appendix-c-grep"></a>

### C.1 **合入 / PR 前 `rg` 自查（Playwright 禁假路由响应 · ①）**

**命中 ≠ 违规**：须 **逐文件**区分 **注释**、**Vitest**、**`request` 夹具**（**§0.2** 允许分轨）与 **`page.route` / `context.route` + `fulfill` 假 JSON 顶 UI 矩阵**（**禁**）。

```bash
# 仓库根；范围 **frontend/e2e** Playwright 源
rg -n 'page\.route\s*\(' frontend/e2e --glob '*.ts'
rg -n 'context\.route\s*\(' frontend/e2e --glob '*.ts'
rg -n 'request\.route\s*\(' frontend/e2e --glob '*.ts'
# 假体旁路（与 route 同文件出现时重点人工读）
rg -n '\.fulfill\s*\(' frontend/e2e --glob '*.ts'
```

**说明：** 当前 HEAD 上 **`page.route(`** 多出现在 **注释** 的「无 mock」承诺；**新增**调用点须在 **PR 描述** 或 **`round-rN-notes.md`** 写明 **为何不违反 §0.2**。无 **`rg`** 时可用 **`grep -rnF 'page.route(' frontend/e2e --include='*.ts'`** 等价粗扫。

---

## 4. 附录 D · **每轮开工命令模板（① · 可复制）**

```bash
# 0) 页面枚举（写入本轮 notes）
git ls-files 'frontend/app/**/page.tsx' > evidence/GO_YYYYMMDD/round-rX-pages.txt

# 1) 后端 + 路由机读（与扩充闸同口径）
env -u DATABASE_URL cargo test -p traveltrust-api

# 2) 前端静态
cd frontend && npm run lint && npx tsc --noEmit && npm test

# 3) 全栈 Playwright（chromium 全量；须 DATABASE_URL 已 migrate）
export DATABASE_URL='postgres://…'
npm run e2e:full-chromium

# 4) 96-16 矩阵机读（辅助）
npm run matrix:96-16:all

# 5) Playwright 禁假 JSON · rg 快扫（**须仓库根 cwd**；若上一步停在 frontend/ 则先 `cd ..`）— 全文见 **附录 C.1**
rg -n 'page\.route\s*\(' frontend/e2e --glob '*.ts'
rg -n '\.fulfill\s*\(' frontend/e2e --glob '*.ts'
```

<a id="tt-96-20-appendix-d-skeleton"></a>

### D.1 **生成附录 E CSV 骨架（`idx` + `page_tsx_path` + `layout_sidecar` + 空列）**

<a id="tt-96-20-appendix-d-script"></a>

**推荐（仓库脚本 · 与 E.2 表头对齐）：**

```bash
# 默认写入 evidence/GO_YYYYMMDD/round-appendix-e-skeleton.csv；或 argv1 指定输出路径：
bash scripts/gates/tt-96-20-appendix-e-skeleton.sh "evidence/GO_$(date +%Y%m%d)/round-r1-appendix-e.csv"
# 根路径薄转发（同源）：bash scripts/tt-96-20-appendix-e-skeleton.sh …
```

**可选 · ① 富化占位（`user_path` + `matrix:96-20:auto:*` + `nav;cta;browse` + 附录 G 默认 `playwright_ref` + `NOT_RUN`，**不**冒充 93/96-20 语义闭包）：** **`bash scripts/tt-96-20-appendix-e-generate-machine-stub.sh`**（默认 **`evidence/GO_YYYYMMDD/round-appendix-e-enriched.csv`**；**`-o`** 改单文件；**`--bundle --out-dir …`** 写 **R1～R9 + merged** 并 **Python 自校验 validate 全开关**）— 与 **[`scripts/README.md`](../../scripts/README.md)**、**`evidence/GO_YYYYMMDD/README-appendix-e.md`** 同段；生成后仍应 **`merge` → `validate`**（若未用 **`--bundle`**）并逐页替换为 **文档真 `matrix:` / `GET /…`**。

**`layout_sidecar` 机读规则（脚本内建）：** 仅当 **`page.tsx` 同目录** 存在 **`layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx` / `template.tsx`** 之一时为 **`Y`**，否则 **`N`**；**上级 segment** 的 **`layout` / `loading`** 须人手改表或写 **`round-rN-notes.md`**（与 **[§0.3.1](#tt-96-20-ten-pages-sidecar)** 一致）。

<a id="tt-96-20-appendix-e-validate"></a>

### D.1.1 **附录 E CSV 机读校验（`page.tsx` 并集 + `matrix:` · ①）**

**目的：** **R1～R9** 多文件合并时，自动核对 **`uniq(page_tsx_path)`** 是否 **等于** **`git ls-files 'frontend/app/**/page.tsx'`**，且 **每页至少一行** 在 **`key_api_or_ui_contract`** 或 **`gap_issue`** 含 **`matrix:`**（与 **[§0.3.3](#tt-96-20-ten-matrix-closure)**、**[§0.3.4](#tt-96-20-ten-page-dod)** 对读）。

```bash
# 仓库根；可传多个 CSV（并集）
bash scripts/tt-96-20-appendix-e-validate.sh evidence/GO_YYYYMMDD/round-r1-appendix-e.csv evidence/GO_YYYYMMDD/round-r2-appendix-e.csv

# 可选：PASS 行不得空 controls_notes（壳页例外见脚本 --help）
bash scripts/tt-96-20-appendix-e-validate.sh --strict-pass-controls evidence/GO_YYYYMMDD/round-r-merged.csv

# 可选：每行 controls_notes 须含 tt: 或 lbl:（按键/控件 mnemonic 留痕）
bash scripts/tt-96-20-appendix-e-validate.sh --require-controls-tag evidence/GO_YYYYMMDD/round-r-merged.csv

# 可选：appendix_b_axes 须含 nav;cta;browse（纯静态无列表时在 gap_issue 写 omit-browse: 理由）
bash scripts/tt-96-20-appendix-e-validate.sh --strict-b-axes evidence/GO_YYYYMMDD/round-r-merged.csv

# 全收紧（并集 + matrix + 控件标签 + B 轴 + 数据对齐信号；仍不替代 Playwright）
bash scripts/tt-96-20-appendix-e-validate.sh --strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal evidence/GO_YYYYMMDD/r1.csv evidence/GO_YYYYMMDD/r2.csv

# 可选：key_api 须含「数据对齐最小信号」（GET/POST/… 或 align:* 或 gap align:waive-key-api:）
bash scripts/tt-96-20-appendix-e-validate.sh --require-key-api-signal evidence/GO_YYYYMMDD/round-r1-9-merged.csv
```

**实现：** **`scripts/gates/tt-96-20-appendix-e-validate.py`**（**`csv` 模块**；须 **真 Python 3** — Windows **Store `python3` 占位** 不可用；薄封装 **`scripts/tt-96-20-appendix-e-validate.sh`** 会探测 **`python` / `py -3`**）。**`python3 scripts/gates/tt-96-20-appendix-e-validate.py --help`** 查看参数。

<a id="tt-96-20-appendix-e-merge"></a>

### D.1.2 **多轮附录 E 合并（`page_tsx_path` · 后 argv 覆盖）**

**目的：** **R1～R9** 若各写 **`round-rN-appendix-e.csv`**，合并为 **一份** **`round-r1-9-merged.csv`** 再跑 **[D.1.1](#tt-96-20-appendix-e-validate)**，避免 **§0.3.4** 手工数 **uniq** 出错。

```bash
# 仓库根；输入顺序 = 覆盖优先级（后者覆盖前者同路径）
bash scripts/tt-96-20-appendix-e-merge.sh -o "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged.csv" \
  "evidence/GO_$(date +%Y%m%d)/round-r1-appendix-e.csv" \
  "evidence/GO_$(date +%Y%m%d)/round-r2-appendix-e.csv"

# 合并后立刻机读校验（独立开发：exit 0 + 粘贴 notes 即可；与 solo-dev §6.5·14 同源全开关）
bash scripts/tt-96-20-appendix-e-validate.sh --strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged.csv"
```

**实现：** **`scripts/gates/tt-96-20-appendix-e-merge.py`**；薄封装 **`scripts/tt-96-20-appendix-e-merge.sh`**（Python 探测与 **D.1.1** 同源）。**输出**按 **`page_tsx_path`** 排序；**`idx`** 重排为 **1…N**。

<a id="tt-96-20-appendix-e-fill-spec-matrix"></a>

### D.1.3 **`matrix:96-20` / `matrix:93` / `matrix:13-1` 文档锚半自动填充（附录 A 分桶）**

**目的：** 将 **`matrix:96-20:auto:*`** 或 **`MACHINE-STUB`** 等占位，替换为可读 **`matrix:96-20:{§5子表}:{96-20 表内 URL}`**、**`matrix:93:{§5段落}:{user_path}`**，并附加 **`matrix:13-1:bucket-{附录A桶}`**（与 **[附录 A](#tt-96-20-appendix-a)** 的 `frontend/app/<目录>/` 分桶同源；**不**替代 **13-1 表 1** 逐行人工对拍）与 **`routes:`**（摘自 **96-20** §5 第二列，已去反引号与 Markdown 粗体星号）。**输入**须为已通过 **[D.1.1](#tt-96-20-appendix-e-validate)**（建议全开关）的 **附录 E CSV**；**`user_path`** 可与 **96-20** 表 **`[`param`]`** / **`:param`** 记法差异，脚本按 **`norm_url_key`** 对齐。

```bash
bash scripts/tt-96-20-appendix-e-fill-spec-matrix.sh \
  -i "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged.csv" \
  -o "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged-spec-matrix.csv" \
  --bucket-dir "evidence/GO_$(date +%Y%m%d)/appendix-a"
# 可选：--no-validate（不推荐）
```

**输出：** **`-o`** 覆写每行 **`key_api_or_ui_contract`** / **`gap_issue`** 中的 **`matrix:`** 与 **`routes:`**（保留原 **`GET`/`POST`/…** 或 **`align:*`** 尾段）；**`--bucket-dir`** 写出 **`bucket-<附录A名>-appendix-e.csv`** 与 **`bucket-all-appendix-e.csv`**（内部调 **[D.1.2](#tt-96-20-appendix-e-merge)** 同源 **merge**）。写毕建议再跑 **`validate.sh`**（**[D.1.1](#tt-96-20-appendix-e-validate)**）全开关。

**实现：** **`scripts/gates/tt-96-20-appendix-e-fill-spec-matrix.py`**；薄封装 **`scripts/tt-96-20-appendix-e-fill-spec-matrix.sh`**（Python 探测与 **D.1.1** 同源）。

<a id="tt-96-20-appendix-e-audit-controls-vs-source"></a>

### D.1.4 **`controls_notes` ↔ 源码 `data-tt-*` 机读核对（**B.3** / **E.2.2**）**

**目的：** 在 **`controls_notes`** 已写入 **`tt:…`**（与 **`data-tt-<…>`** 同名后缀）后，递归扫描 **`page.tsx` 同目录** 下所有 **`*.tsx`**，核对 **源码中出现的每一个 `data-tt-*`** 是否都在 **`controls_notes`** 的 **`tt:`** 列表中（默认 **WARN** 到 **stderr**；**`--strict`** → **exit 1**）。**仍跳过** **`generate-machine-stub`** 占位行（含 **`tt:appendix-e-enriched`** / **`lbl:placeholder`** / **`replace with real`**）。**`gap_issue`** 含 **shell-only** 且 **无** **`tt:shell-only`** 单元格时跳过（人手豁免）。**`tt:shell-only`** 行**会**审计：路由目录下**不得**再出现 **`data-tt-*`**，否则 **WARN / `--strict` FAIL**。**不**替代 **Playwright**、**B.2** 手点、**上级 segment layout** 下挂组件（见 **[§0.3.1](#tt-96-20-ten-pages-sidecar)**；脚本**仅**扫 **本路由目录树**）。

```bash
bash scripts/tt-96-20-appendix-e-audit-controls-vs-source.sh evidence/GO_YYYYMMDD/round-r1-9-merged-spec-matrix.csv
# 占位未清完前：audited=0、skipped=123 为预期；清完 tt: 枚举后加：
bash scripts/tt-96-20-appendix-e-audit-controls-vs-source.sh evidence/GO_YYYYMMDD/round-r1-9-merged-spec-matrix.csv --strict
# 可选：CSV 多写了源码不存在的 tt: 时 WARN
bash scripts/tt-96-20-appendix-e-audit-controls-vs-source.sh evidence/GO_YYYYMMDD/round-r1-9-merged-spec-matrix.csv --warn-extra-tt
```

**实现：** **`scripts/gates/tt-96-20-appendix-e-audit-controls-vs-source.py`**；薄封装 **`scripts/tt-96-20-appendix-e-audit-controls-vs-source.sh`**。

<a id="tt-96-20-appendix-e-fill-controls-from-source"></a>

### D.1.5 **从源码自动写 **`controls_notes`**（**B.3** 目录枚举 → **`tt:`** / **`tt:shell-only`**）**

**目的：** 一轮内把 **附录 E** 与 **真实 `frontend/app/**/page.tsx` 同目录树** 对齐：默认**仅**覆盖 **`generate-machine-stub`** 占位 **`controls_notes`**；递归收集 **`data-tt-*`**，写成 **`tt:<suffix>;…;lbl:B3-source-scan`**；若目录内**无** **`data-tt-*`** 则写 **`tt:shell-only;lbl:B3-source-scan`**（与 **[B.3](#tt-96-20-appendix-b-tt-enum)** 壳页口径一致）。**`--force`** 可覆写**全部**行（先备份）。写毕**默认**串联 **[D.1.1](#tt-96-20-appendix-e-validate)** 全开关 + **[D.1.4](#tt-96-20-appendix-e-audit-controls-vs-source)** **`--strict`**。**`--summary`** 输出 **R1～R9** 计数与 **`tt:shell-only`** 列表（**①** 十轮证据附件）。

```bash
bash scripts/tt-96-20-appendix-e-fill-controls-from-source.sh \
  -i "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged-spec-matrix.csv" \
  -o "evidence/GO_$(date +%Y%m%d)/round-r1-9-merged-spec-matrix-codebacked.csv" \
  --summary "evidence/GO_$(date +%Y%m%d)/ten-round-B3-code-controls-summary.md"
# 可选：--no-validate / --no-audit-strict / --force / --merge-lbl
```

**实现：** **`scripts/gates/tt-96-20-appendix-e-fill-controls-from-source.py`**；薄封装 **`scripts/tt-96-20-appendix-e-fill-controls-from-source.sh`**。

**兜底（仅两列 · 再手工 merge 表头）：**

```bash
mkdir -p "evidence/GO_$(date +%Y%m%d)"
git ls-files 'frontend/app/**/page.tsx' | awk -v OFS=',' '{print NR,$0}' > "evidence/GO_$(date +%Y%m%d)/paths-with-idx.csv"
# 将 paths-with-idx.csv 的两列作为 idx + page_tsx_path，再 prepend 附录 E.2 表头与其余空列（含 layout_sidecar）；user_path 按 E.1 手填；playwright_ref 可先套 E.4 分桶串再逐行改窄。
```

<a id="tt-96-20-appendix-d-env"></a>

### D.2 **① 环境变量与门闸（摘录 · 真源以各 spec / `playwright.config` / 根 README 为准）**

| 条件 | 用途（与轮次关系） |
|------|---------------------|
| **`DATABASE_URL`**（已 **migrate**） | **`e2e:full-chromium`**、多数 **全栈** Playwright |
| **`P3_CHAIN_OFF=1`** + **`mock-pay`** 文档路径 | **R3** 链下支付 **真代码路径**（**禁**假 JSON） |
| **`PLAYWRIGHT_E2E_NO_WEBSERVER=1`** 等 | **`request` 夹具** 真 HTTP（**§0.2** 允许分轨） |
| **`RUN_EPIC_F_E2E_REAL_PATH=1`** 等 | Epic / 竖切 spec 门闸（见 **Gap Map §2**） |

**Sepolia / 96-17** 不与 **`chromium` 全量**混跑命令行时，另开终端按 **[TT-L4 §3](TT-L4-PARALLEL-CI-001.md)**。

---

<a id="tt-96-20-appendix-e"></a>

## 5. 附录 E · **逐页 UI/UX 缺口登记表（模板 · 可贴表格 / CSV）**

### E.1 **`page.tsx` → 用户 URL 推导（Next App Router）**

| 规则 | 示例 |
|------|------|
| **`app/(home)/page.tsx`** | **`/`**（**无**根级 `app/page.tsx`；见 **`frontend/app/(home)/README.md`**） |
| **`app/(segment)/page.tsx`**（**路由组括号**） | **不出现在 URL**；例：**`app/(home)/page.tsx`** → **`/`** |
| **`app/foo/page.tsx`** | **`/foo`** |
| **`app/foo/bar/page.tsx`** | **`/foo/bar`** |
| **并列 `page.tsx` 与 `route.ts`** | 以 **96-20 / 13-1** 与 **`next` 实际路由**为准；本表以 **`page.tsx`** 为主键 |
| **动态段 `[param]`** | 例：**`app/orders/[id]/page.tsx`** → **`/orders/<uuid>`**；**`user_path`** 填 **本轮 E2E 使用的实参** 或 **`TEMPLATE:/orders/:id`**；用例名写在 **`playwright_ref`** 或 **`round-rN-notes.md`** |
| **可选捕获段 `[[...]]` / `[...]`** | 以 **Next 路由文档** + 本仓库 **`next`** 实际行为为准；**不确定**时标 **NOT RUN** 并指向 **96-20** 行 |

### E.2 **表头（复制到表格或 `*.csv`）**

```text
idx,page_tsx_path,layout_sidecar,user_path,primary_round,role_guess,key_api_or_ui_contract,appendix_b_axes,playwright_ref,vitest_ref,d3_hand,status_93,gap_issue,controls_notes
```

<a id="tt-96-20-appendix-e-controls-notes"></a>

- **`controls_notes`**（**v1.0.13+ 推荐 · 全矩阵「每页按键/功能」留痕**）：**同一单元格**内用 **`;`** 分隔 **短标签**；**与 `data-tt-*` 对齐命名**见 **[E.2.2](#tt-96-20-appendix-e-tt-naming)**；**源码枚举**见 **[附录 B.3](#tt-96-20-appendix-b-tt-enum)**。**长说明**放 **`round-rN-notes.md`** 并在此写 **`see:notes§3.2`** 等指针。**PASS** 且 **`controls_notes`** 仍空 → 视为 **「功能面未逐条登记」未完成**（除非 **`status_93`** 为 **`N/A`** 且 **`gap_issue`** 写明「无交互壳页」）。  
- **`layout_sidecar`**（**可选但推荐 v1.0.6+**）：与本 **`page.tsx` 同段目录链**是否存在值得单列的 **`layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx`** — 填 **`Y`**（已核对存在且本轮触达）、**`N`**（已核对无或无需）、或 **留空**（未查，须在 **R10** 或下一轮补 **`Y`/`N`**）。与 **[§0.3.1](#tt-96-20-ten-pages-sidecar)** 同读。  
- **`appendix_b_axes`**：用 **`;`** 拼接 **附录 B** **`slug`**（须含与本页相关的 **`nav` / `cta` / `browse`**；例：`http;loading;nav;cta;browse;focus`）。**按路由类型的最小串**见 **[附录 B.1](#tt-96-20-appendix-b-min-axes)**。  
- **`playwright_ref`**：`文件名:用例名` 或 **`—`**；**分桶缺省**见 **[E.4](#tt-96-20-appendix-e-bucket-refs)**。  
- **`status_93`**：**`PASS` / `FAIL` / `BLOCKED` / `N/A` / `NOT RUN`**（与 **[93 §0.2](../spec/93-全站功能验证矩阵-域别回归清单.md)** 五态同源）。  
- **`matrix:`（v1.0.16+ · 不增列）**：**须**在 **`key_api_or_ui_contract`** 或 **`gap_issue`**（或两列 **`;`** 混排）之一出现 **`matrix:93:…` / `matrix:96-20:…` / `matrix:13-1:…` / `matrix:MISSING` / `matrix:N/A-doc-row`** — **语义与禁则见 [§0.3.3](#tt-96-20-ten-matrix-closure)**；仓库汇总可 **`rg 'matrix:' evidence/…/*.csv`**。  
- **`gap_issue`**：**issue URL** 或 **`TT-GATE#`**；**`matrix:MISSING`** 时 **本列或 `key_api_or_ui_contract`** **须**能回到 **可执行缺口**（issue / TT-GATE）。走 **`bash scripts/tt-96-20-appendix-e-validate.sh --strict-b-axes`** 时，若某页 **确无** **nav / cta / browse** 之一，须在本列写 **`omit-nav:`** / **`omit-cta:`** / **`omit-browse:`** 前缀 + **理由**（与 **[附录 B.1](#tt-96-20-appendix-b-min-axes)** 静态壳口径一致）。  
- **`key_api_or_ui_contract`**：API 契约句与 **`matrix:…`** 可 **同单元格** 用 **`;`** 拼接（纯静态壳可 **`matrix:N/A-doc-row`** 或 **`align:static`**）；**数据对齐最小机读**见 **[E.2.3](#tt-96-20-appendix-e-data-align)** 与 **`validate.sh --require-key-api-signal`**。  
- **`d3_hand`**：**`Y`** / **`N`** / **空**；若手验，建议写 **`Y:YYYY-MM-DD`** 或指向 **`round-rN-notes.md`** 小节。  
- **`vitest_ref`**：建议 **`lib/...test.ts` 无 `frontend/` 前缀** 或与 **`npx vitest run …`**  argv **一致**，便于 **`rg`** 对拍。

<a id="tt-96-20-appendix-e-vitest"></a>

#### E.2.1 **`vitest_ref` 常用契约文件（`frontend/` · 摘录）**

| **`vitest_ref`（示例）** | **主要 `slug`** | **典型轮次** |
|--------------------------|-----------------|--------------|
| **`lib/mapApiReadError.complianceAndFallback.test.ts`**/**`delegationToOrderWrite.test.ts`**/**`retryAfterAndI18n.test.ts`** | **`http`**、**`form`** | **R2**、**R3**、**R6** |
| **`lib/apiClient/onboarding/`** | **`http`**、**`form`** | **R2**、**R6** |
| **`lib/mapAuthLoginSubmitError.test.ts`** | **`form`**、**`http`** | **R2** |
| **`lib/mapOrderWriteError.casesMatrix.test.ts`**/**`localeHttpAndCommunity.test.ts`**/**`fallback.test.ts`** | **`http`**、**`form`** | **R3** |
| **`lib/mapReviewSubmitError.test.ts`** | **`form`**、**`http`** | **R3** |

**说明：** 上表 **不**穷举 Vitest；**新增契约单测** 时在本表 **同小节** 或 **`round-rN-notes.md`** 追加一行即可。

<a id="tt-96-20-appendix-e-data-align"></a>

#### E.2.3 **`key_api_or_ui_contract` · 数据对齐最小机读（① · 与 `validate --require-key-api-signal` 对拍）**

**目的：** 在 **附录 E** 层为 **「页面 ↔ 后端 HTTP 面」** 留 **可 grep** 的锚，**补** **仅 `matrix:`** 不足以表达的 **主读/主写路径**；**仍须** 与 **96-20**、**04 §3.4**、**Playwright `waitForResponse`** 等 **真源** 对读 — **禁**用本列 alone 冒充 **②③** 已联调。

| 允许写法（**`key_api` 单元格**内 **`;`** 可拼接） | 何时用 |
|--------------------------------------------------|--------|
| **`GET /…` / `POST /…` / …**（**方法 + 空格 + `/` 路径**） | 本页首屏或主交互依赖的 **真实 API**（与 **R1～R3** **`waitForResponse`** 对拍时优先写 **列表页主 GET**） |
| **`matrix:…`** | 已有 **文档矩阵** 锚时，可与 **`GET /…`** 同格并存 |
| **`align:static`** | **纯静态** / 条款壳，**无**运行时 API |
| **`align:n/a`** | **占位路由组**等 **N/A**（与 **五态 `N/A`** 对读） |
| **`align:n/a-api`** | **壳页**当前轮次 **未** 拉 API，但 **非**纯静态（须在 **`round-rN-notes.md`** 注 **后续补 GET**） |
| **`gap_issue`** 内 **`align:waive-key-api:`** + 理由 | **重定向-only / middleware-only** 等 **确无** 可写 **`GET /`** 面时的 **显式豁免**（**须**人类可读理由） |

**机读闸：** **`bash scripts/tt-96-20-appendix-e-validate.sh --require-key-api-signal`** 校验上表 **之一** 成立（**`matrix:`** 可读 **`key_api_or_ui_contract`** 或 **`gap_issue`** 任一列；**仍推荐** 有读接口的页 **同格补** **`GET /…`** 以便 **`rg 'GET /'`** 与 **96-20** 对拍）。

<a id="tt-96-20-appendix-e-tt-naming"></a>

#### E.2.2 **`controls_notes` 与 `data-tt-*` 对齐命名（推荐 · 便于 `rg`）**

| 规则 | 示例 |
|------|------|
| **属性名 → 短标签** | 源码 **`data-tt-orders-load-more="1"`** → **`controls_notes`** 内写 **`tt:orders-load-more`**（**省略** **`=1`**） |
| **多值** | **`tt:orders-page;tt:orders-load-more;tt:orders-load-more-inline-retry`**（**`;`** 分隔） |
| **无 `data-tt` 的纯文案按钮** | 用 **`lbl:`** 前缀 + **稳定英文/键**（例：`lbl:submit-review`），并在 **`round-rN-notes.md`** 注 **i18n 键** |
| **与 Playwright 对拍** | spec 内已用的 **`[data-tt-…]`** 选择器应与 **`tt:`** 列表 **可交集**，避免 **「登记了但未测」** |

**仓库真实前缀摘录（填表时对照）：** **`data-tt-orders-*`**、**`data-tt-community-*`**、**`data-tt-market-*`**、**`data-tt-admin-app-page`** 等 — 以 **`rg 'data-tt-' <本页相关 tsx>`** 现数为准。

### E.3 **示例行（格式示意）**

| `idx` | `page_tsx_path` | `key_api_or_ui_contract`（含 **`matrix:`**） | `appendix_b_axes`（摘录） | `controls_notes`（摘录） | `status_93` |
|-------|-----------------|-----------------------------------------------|---------------------------|--------------------------|-------------|
| 1 | `frontend/app/community/explore/page.tsx` | `GET /community/explore;matrix:93:community-explore`（**数据面 + 矩阵**；路径以 **04/96-20** 为准） | `http;loading;nav;cta;browse;media;i18n` | `tt:community-explore-page`（**B.3** 目录枚举后再 **`;`** 拼 CTA / **`lbl:?tab=`**） | PASS / NOT RUN … |
| 2 | `frontend/app/orders/page.tsx` | `GET /orders;matrix:96-20:orders-list`（**API+矩阵** 同格 **`;`**） | `http;loading;browse;cta;…` | `tt:orders-page;tt:orders-load-more;tt:orders-inline-action-retry` | PASS … |
| 3 | `frontend/app/…/某新页/page.tsx` | `matrix:MISSING` | `http;loading;nav;cta;browse` | `tt:…;lbl:…`（**仍须**登记控件；**`MISSING`** 时 **`gap_issue`** **须**有 **issue** 或 **TT-GATE#**） | **禁**无 **`gap_issue`** 的 **PASS** |

<a id="tt-96-20-appendix-e-bucket-refs"></a>

### E.4 **`playwright_ref` 分桶最小模板（宽扫起点 → 再按文件改窄）**

下列为 **`frontend/e2e/*.spec.ts`** 习惯缩写（**不含**路径前缀）；**同一桶内不同 `page.tsx`** 仍须 **逐行**把 **`playwright_ref`** 收窄到 **具体用例** 或标 **`—`** + **手验**。

| **`frontend/app/<桶>/`** | **默认 `playwright_ref`（`;` 拼接多源）** |
|--------------------------|------------------------------------------|
| **`admin/`** | **`smoke-admin.spec.ts`**；**`93-matrix-admin-deep-batch.spec.ts`**；**`93-matrix-admin-domain-batch.spec.ts`**；**`e2e:full-chromium`** |
| **`community/`**（路径 **不含** **`/community/me/`**） | **`smoke-community.spec.ts`**；**`section10-5-login-community-feed.spec.ts`**；**`93-matrix-path-community-feed-post.spec.ts`**；**`market-subsite-studio-and-community-publish.spec.ts`** |
| **`community/me/`** | **`community-me-hub-notes-drawer-ia.spec.ts`**；**`community-me-data-state.spec.ts`**；**`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`** |
| **`me/`** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**；**`me-security-community-hub.spec.ts`**；**`me-onboarding-96-18-shell.spec.ts`** |
| **`auth/`** | **`auth-login-logout-me.spec.ts`**；**`auth-register-login-market-chain.spec.ts`**；**`p01-login-market-auth.spec.ts`**；**`smoke.spec.ts`** |
| **`market/`** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**；**`b468-market-discovery-full-ui-journey.spec.ts`**；**`smoke.spec.ts`** |
| **`orders/`**、**`escrow/`**、**`disputes/`**、**`pay`** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**；**`p02`～`p05` 竖切 spec**；**`b467-full-ui-order-journey.spec.ts`**；**`53-main-path.spec.ts`**；**`trust-gate-*.spec.ts`** |
| **`guides/`**、**`guide/`** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**；**`b469-guides-drawer-booking-convergence.spec.ts`**；**`smoke.spec.ts`** |
| **`governance/`** | **`smoke-governance.spec.ts`**；**`f029-f030-f031-request.spec.ts`**（权限交叉时） |
| **`terms/`**、**`privacy`**、**`staking`** | **`smoke.spec.ts`**；**`smoke-governance.spec.ts`**；**`release-flow.spec.ts`**（若涉发版叙事） |
| **`did-rank`** | **`93-matrix-path-did-rank-boards.spec.ts`**；**`smoke.spec.ts`** |
| **`(home)`**、**`discover`**、**`traveltrust`**、**`help`**、**`network`**、**`trust`**、**`itinerary`** | **`smoke.spec.ts`**；**`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**；**`e2e:full-chromium`** |

---

<a id="tt-96-20-appendix-f"></a>

## 6. 附录 F · **烟测 / P0 脊与 R1～R10 的「第一落点」**

| Playwright 资产 | 主要覆盖轮次 | 说明 |
|-----------------|--------------|------|
| **`e2e/smoke.spec.ts`** | **R1**、**R3**、**R6**、**R7**、**R8**、**R9**（大量 **Admin / 静态** 可达性） | **整站宽烟**；**不**等价每控件穷举 |
| **`e2e/smoke-community.spec.ts`** | **R4**、**R5** | 社区路由拆分烟 |
| **`e2e/smoke-admin.spec.ts`** | **R7**、**R8** | Admin 烟 |
| **`e2e/smoke-governance.spec.ts`** | **R9** | 治理 / 质押壳等 |
| **`e2e/p0-spine-real-api-public.spec.ts`** / **`e2e/p0-spine-real-api-session.spec.ts`** | **R1～R6**（**P0 子集**） | **`p0-routes.v1.json`** 机读对拍 |
| **`npm run e2e:full-chromium`** | **R1～R9**（**`chromium` 全 spec**）+ **R10** 部分（flake/稳定性策略） | 与 **[TT-LOCAL-FULL-E2E-MATRIX-001](TT-LOCAL-FULL-E2E-MATRIX-001.md)** 同集合 |
| **`npm run e2e:p0-spine`** | **R1～R6** | **`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`** 单列（与 **`e2e:full-chromium`** 子集互补） |
| **`npm run e2e:market-community`** | **R3**、**R4** | **市场竖切 + 发帖**（与 **TT-LOCAL** 扩充闸 **`e2e:market-community`** 尾段同源） |
| **`npm run e2e:b468-b469`** | **R1**、**R3** | **B-468 / B-469** 发现与向导抽屉 |
| **`npm run e2e:trust-gate`** | **R3** | **trust-gate** 竖切编排（见 **`package.json`** **`e2e:trust-gate`**） |

**填表策略：** 先为每桶 **填「烟测已扫」** 行，再对 **FAIL / NOT RUN** 行用 **附录 B** 开 **手验或补 spec**。

---

<a id="tt-96-20-appendix-g"></a>

## 7. 附录 G · **R1～R10 × 产物（一屏总表 · 与 §0.4.2 对读）**

| **R** | **附录 A 桶（主）** | **Playwright / npm（① 首选）** | **手验 / Tier** | **证据文件名（建议）** |
|-------|---------------------|----------------------------------|-----------------|-------------------------|
| **R1** | **`(home)`**、**`market`**、**`guides`**、**`discover`**、**`traveltrust`**、**`help`** | **`smoke.spec.ts`**、**`p0-spine-real-api-public.spec.ts`**、**`p0-spine-real-api-session.spec.ts`**、**`e2e:full-chromium`** | **D3** 抽样 | **`round-r1-appendix-e.csv`** |
| **R2** | **`auth/`** | **`auth-*`**、**`p01-*`**、**`93-matrix-path-f1-f4`**（若跑矩阵） | **04** 错误码对拍 | **`round-r2-appendix-e.csv`** |
| **R3** | **`orders/`**、**`escrow/`**、**`disputes/`**、**`pay`**、**`itinerary`**、**`guide/`** | **`p02`～`p05`**、**`b467`**、**`53-main-path`**、**`trust-gate-*`**、**`b466`/`b468`** | **mock-pay** 真路径声明 | **`round-r3-appendix-e.csv`** |
| **R4** | **`community/`**（**`me` 除外**） | **`smoke-community`**、**`section10-5-*`**、**`market-subsite-studio-and-community-publish`**、**`npm run e2e:market-community`**（竖切） | **TT-GATE §2** | **`round-r4-appendix-e.csv`** |
| **R5** | **`community/me/`** | **`p0-spine`**、**`community-me-hub-notes-drawer-ia`**、**`community-me-data-state`** | **`?tab=`** 手验 | **`round-r5-appendix-e.csv`** |
| **R6** | **`me/`** | **`p0-spine`**、**`me-security-community-hub`**、**`me-onboarding-96-18-shell`** | **Onboarding** 真交互 | **`round-r6-appendix-e.csv`** |
| **R7** | **`admin/`**（列表） | **`smoke-admin`**、**`93-matrix-admin-*`** | **403** 窄矩阵 | **`round-r7-appendix-e.csv`** |
| **R8** | **`admin/`**（详情 / 合规 / 审计 / 作业） | **`smoke`** Admin 段、专项 spec | **写路径审计** | **`round-r8-appendix-e.csv`** |
| **R9** | **`governance/`**、**`staking`**、**`did-rank`**、**`terms/`**、**`privacy`** | **`smoke-governance`**、**`release-flow`**、**`93-matrix-path-did-rank-boards`** | **②③** 链上另证据 | **`round-r9-appendix-e.csv`** |
| **R10** | **全站抽样**（跨桶） | **`matrix:96-16:all`**、**`test:a11y:ci`**、**`test:i18n:ci`** | **[TT-96-16-D3](TT-96-16-D3-hand-checklist-001.md)** + **§0.3.4** **123 行并集核对** | **`round-r10-appendix-e.csv`**（可只含 **R1～R9** 的 **FAIL/NOT RUN** 子集 + 抽样页） |

**并行建议：** **R1～R6** 与 **R7～R9** 可由不同 Owner 分轨；**R10** 建议在 **`e2e:full-chromium`** 之后收口，避免与 flake 排查混在同日笔记。**独立开发收口**：**R1～R9** 九份 CSV 建议 **`merge.sh`** → **`validate.sh`**（**[D.1.2](#tt-96-20-appendix-e-merge)** / **[D.1.1](#tt-96-20-appendix-e-validate)**）后再做 **§0.3.4** 并集核对。

---

## 8. 互指

| 文档 | 关系 |
|------|------|
| [TT-96-20-E2E-COVERAGE-GAP-MAP-001](TT-96-20-E2E-COVERAGE-GAP-MAP-001.md) | **P0 ↔ E2E** 执行表；可与每轮 **并行**维护 |
| [TT-GATE-COVERAGE…](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md) | **自动化外缺口** 真源 |
| [TT-96-20-P0-E2E-LADDER-001](TT-96-20-P0-E2E-LADDER-001.md) | Helpers / trust-gate **§3.1** |
| [96-15](../spec/96-15-深度多维度检查与审计体系.md) | **Tier A/B/C** 对外承诺时打开 |
| [96-16](../spec/96-16-全页面UI-UX优化方案总册.md) | **D1～D12** 抽样与矩阵脚本 **`npm run matrix:96-16:all`** |
| [96-13](../spec/96-13-UI-UX-i18n-a11y-性能走查.md) | i18n / a11y / 性能走查 **真源** |
| [13-1](../spec/13-1-UI产品级SSOT与页面规范.md) | 页面职责与 **`data-tt-*`** 约定 |
| [TT-31](TT-31-STRUCTURED-GAP-CATALOG-001.md) | **mock / 真栈** 分轨总表（与 **§0.2** 同键） |
| [93](../spec/93-全站功能验证矩阵-域别回归清单.md) | **域别矩阵 · 五态**；**`matrix:93:`** 闭包落点 |
| [31](../spec/31-TT社区-企业级UI检查-未完成与待优化.md) | 社区 **UI 深度** 与 **96-20** 交叉时的 **缺口真源** |
| [TT-LOCAL-CI-DELIVERY-GATE-001](TT-LOCAL-CI-DELIVERY-GATE-001.md) | **①** **`local-delivery-expanded`** / **`ci-local`** 与 **扩充闸**（含 **`e2e:market-community`** 等） |
| [solo-dev-rhythm.md](../solo-dev-rhythm.md) | 单维护者 **推送前本地命令集** 与 **§6.5**；**无 PR** 时 **①** 十轮证据见 **[§0.0](#tt-96-20-ten-solo)** |
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | **推送前本地**、**no-false-completion**、**GitHub Actions 不可用** 时 **①** 收口 |
| [scripts/README.md](../../scripts/README.md) | **`tt-96-20-appendix-e-skeleton` / `generate-machine-stub` / `merge` / `fill-spec-matrix` / `fill-controls-from-source` / `audit-controls-vs-source` / `validate`** 一行入口 |

---

## 9. 修订记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.28 | 2026-05-07 | **`fill-controls-from-source`**（**B.3** → **`tt:`** / **`tt:shell-only`** + **`--summary`** 十轮表）；**附录 D.1.5**；**D.1.4** 修订 **`tt:shell-only`** 审计语义；**稳定锚**、**`scripts/README`**、**Gap Map §3** 同步。**承** **v1.0.27**。 |
| 1.0.27 | 2026-05-07 | **`audit-controls-vs-source`**（**`controls_notes` `tt:`** ↔ **`page.tsx` 同目录 `data-tt-*`**；**`--strict` / `--warn-extra-tt`**）；**附录 D.1.4**；**§0.5·2**、**稳定锚**、**`scripts/README`**、**互指** 表同步。**承** **v1.0.26**。 |
| 1.0.26 | 2026-05-07 | **`fill-spec-matrix`**（**96-20 §5** + **93 §5** 启发式 + **附录 A 分桶** **`matrix:13-1:bucket-*`**）；**附录 D.1.3**；**`scripts/README`**、**稳定锚**、**互指** 表同步；**`registry/spec-path-dependencies`** 登记 **96-20** 消费方。**承** **v1.0.25**。 |
| 1.0.25 | 2026-05-07 | **`generate-machine-stub` 富化**：**`user_path`/`matrix:96-20:auto:*`/`appendix_b_axes`/`playwright_ref`**；**`--bundle`**（R1～R9 + merged + **跨平台 validate**）；**D.1.2** 合并后校验示例改 **全开关**；**§0.0** 固定动作链 **solo-dev** 同源 validate；**§0.5·2**、**`scripts/README`** 同步。**承** **v1.0.24**。 |
| 1.0.24 | 2026-05-07 | **`scripts/gates/tt-96-20-appendix-e-generate-machine-stub.py`** + 根 **`generate-machine-stub.sh`**；**附录 D.1** 链占位生成；**D.1.1** 全收紧示例补 **`--require-key-api-signal`**；**互指** **`scripts/README`**。**承** **v1.0.23**。 |
| 1.0.23 | 2026-05-07 | **`validate --require-key-api-signal`**（**数据对齐最小机读**）；**附录 E.2.3**；**§0.3.4 DoD·8**；**§0.5·8**、**D.1.1**、**E.3** 示例同步。**承** **v1.0.22**。 |
| 1.0.22 | 2026-05-07 | **§0.0** 链 **solo-dev §6.5·12**（**现** **§6.5·14** 附录 E 专项；条号以 **`solo-dev-rhythm` §6.5** 为准）、**CONTRIBUTING pre-push**、**TT-LOCAL §2/§2.2**（**①** 本地全跑通纳入 **附录 E 机读并集**；边界同 **TT-9628**）。**承** **v1.0.21**。 |
| 1.0.21 | 2026-05-07 | **`scripts/gates/tt-96-20-appendix-e-merge.py`** + **`scripts/tt-96-20-appendix-e-merge.sh`**；**附录 D.1.2**；**§0.0**、**§0.5·8** 链 **合并 → 校验**。**承** **v1.0.20**。 |
| 1.0.20 | 2026-05-07 | **§0.0** **独立开发 / 无 PR / ① 自证**（**`evidence/` + `exit 0`**）；稳定锚 **`#tt-96-20-ten-solo`**；**互指** **solo-dev** 补链。**承** **v1.0.19**。 |
| 1.0.19 | 2026-05-07 | 校验脚本增 **`--require-controls-tag`**、**`--strict-b-axes`**（**`omit-*:`** 豁免）；**§0.3.4**、**§0.5·8**、**附录 D.1.1** 同步。**承** **v1.0.18**。 |
| 1.0.18 | 2026-05-07 | **`scripts/gates/tt-96-20-appendix-e-validate.py`** + **`scripts/tt-96-20-appendix-e-validate.sh`**；**附录 D.1.1**、**§0.5** 第 **8** 条（附录 E 机读 **`matrix:`** + **123 并集**）。**承** **v1.0.17**。 |
| 1.0.17 | 2026-05-07 | **§0.3.4** 逐页 **DoD（7 条）** + **R1～R9 并集 = `page.tsx` 行数（123）**；**§0.4.1 / §0.4.2 / 附录 G** 链 **R10** 并集核对；**E.3** 增 **`matrix:` 列示例** 与 **`MISSING`** 禁则行。**承** **v1.0.16**。 |
| 1.0.16 | 2026-05-07 | **§0.3.3** **`matrix:`** 与 **93 / 96-20 / 13-1** 文档闭包（**`MISSING`+缺口** 禁静默 PASS）；**B.2** 增 **弹层/Portal、URL 驱动 UI**；**B.3** 增 **整段目录 `rg`**；**附录 E.2** **`matrix:` 列位说明**；**附录 A 用法**、**§0.4.1**、**互指** 链 **93**。**承** **v1.0.15**。 |
| 1.0.15 | 2026-05-07 | **附录 A 用法** 显式链 **B.3 → E.2.2 → B.2**；**E.3** 示例行改用 **`community/explore`** 真实 **`data-tt-community-explore-page`**；**§0.4.1 / E.2.2** 文面 **`对齐齐名`→`对齐命名`**。**承** **v1.0.14**。 |
| 1.0.14 | 2026-05-07 | **附录 B.3** **`data-tt-*` `rg` 枚举**；**附录 E.2.2** **`tt:`/`lbl:`** 与 **`controls_notes`** 对齐命名；**§0.4.1** 全矩阵词表；**E.3** 双行示例。**承** **v1.0.13**。 |
| 1.0.13 | 2026-05-07 | **附录 E.2** 增 **`controls_notes`** 列（**`#tt-96-20-appendix-e-controls-notes`**）；**§0.5**、**附录 B.2** 链控留痕；**`tt-96-20-appendix-e-skeleton.sh`** 输出 **14 列**。**承** **v1.0.12**。 |
| 1.0.12 | 2026-05-07 | **附录 B** 增 **`nav` / `cta` / `browse`**；**B.1** 按路由类型最小 **`appendix_b_axes`**；**B.2** 每页 **功能与按键** PASS 口径；**§0.4.1** 全矩阵词表与 **R10** 出口判据同步；**附录 A 用法**、**E.2** **`appendix_b_axes`** 说明更新。**承** **v1.0.11**。 |
| 1.0.11 | 2026-05-07 | **§0.5** 增 **Playwright 产物指针**、**`vitest_ref` 链**；**附录 E.2.1** 常用 **`vitest_ref`** 表（**`#tt-96-20-appendix-e-vitest`**）；**互指** 增 **CONTRIBUTING**。**承** **v1.0.10**。 |
| 1.0.10 | 2026-05-07 | **§0.4.3** 增 **`test:regional:ci`**；**§0.4.4** **96-15 Tier** 对读（**`#tt-96-20-ten-tier-map`**）；**附录 F** 增 **`e2e:p0-spine` / `e2e:market-community` / `e2e:b468-b469` / `e2e:trust-gate`**；**互指** 增 **TT-LOCAL**、**solo-dev-rhythm**。**承** **v1.0.9**。 |
| 1.0.9 | 2026-05-07 | **附录 C.1**：**`rg`** 自查 **`page.route` / `context.route` / `request.route` / `.fulfill`**（**`#tt-96-20-appendix-c-grep`**）。**承** **v1.0.8**。 |
| 1.0.8 | 2026-05-07 | **§0.3.2** 非 **`page.tsx`** 真源（**middleware** / **`route.ts`** / 组件挂靠）；**§0.4.3** **`npm run test:*` / `matrix:96-16:all`** 与 **附录 B `slug`** 速查；**附录 E.2** 补 **`d3_hand`** 写法。**承** **v1.0.7**。 |
| 1.0.7 | 2026-05-07 | **附录 D.1**：**`scripts/gates/tt-96-20-appendix-e-skeleton.sh`**（根 **`scripts/tt-96-20-appendix-e-skeleton.sh`** 转发）输出 **E.2 全表头** + **`layout_sidecar` 同目录启发式**；稳定锚 **`#tt-96-20-appendix-d-script`**。**承** **v1.0.6**。 |
| 1.0.6 | 2026-05-07 | **附录 E.2** 增 **`layout_sidecar`** 列；**E.3** 示例同步；**E.4** **`playwright_ref` 分桶最小模板**（稳定锚 **`#tt-96-20-appendix-e-bucket-refs`**）。**承** **v1.0.5**。 |
| 1.0.5 | 2026-05-07 | **§0.3.1** 卫星路由文件与 **page.tsx** 共验；**附录 E.1** 动态段 URL；**附录 D.1** CSV 骨架命令、**D.2** 环境摘录；**附录 C** **flake vs FAIL**；**互指** 增 **TT-31 / 31**。**承** **v1.0.4**。 |
| 1.0.4 | 2026-05-07 | **§0.2.1** 全矩阵边界（**full-chromium / ci-local / 填表** 防假完成）；**§0.4.1** 词表、**§0.4.2** 每轮出口判据；**§0.5** 增 **CSV/notes** 文件名；**附录 B** 列 **`slug`** 供 **附录 E** 引用；**附录 G** R×产物总表；**互指/修订** 顺延 **§8～§9**。**承** **v1.0.3**。 |
| 1.0.3 | 2026-05-07 | **附录 E～F**（接 **附录 D** 后）：**`page.tsx`→URL** 规则 + **CSV 表头** + 示例行；**smoke / p0-spine / full-chromium** 与 **R1～R10** 第一落点；**附录 A** 用法链 **附录 E**；正文附录序 **§1～§6**、**互指/修订** **§7～§8**。**承** **v1.0.2**。 |
| 1.0.2 | 2026-05-07 | **节号整理**：附录 **A～D** 为 **§1～§4**，**互指 / 修订** 为 **§5～§6**；**§0.3** 页数与 **附录 A** **123** 对拍。**承** **v1.0.1**。 |
| 1.0.1 | 2026-05-07 | **附录 A～D**：**`page.tsx`** 目录归桶 **123** + **R1～R10** 映射；**UI/UX 必查面**；**合入纪律**；**开工命令模板**；互指增 **96-13 / 13-1**。**承** **v1.0.0**。 |
| 1.0.0 | 2026-05-07 | 首版：**R1～R10** 协议 + **禁 mock** + **页面真源** + **证据** + 互指。 |

---

**文档结束**
