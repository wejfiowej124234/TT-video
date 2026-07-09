# TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001 · 本地机读闸 × 深度多维 · 缺口登记真源

**Version:** 1.0.25  
**Status:** `Target`（登记用；**不**写入 **`ci-local-delivery-minimum`** / **`local-delivery-expanded`** 的 **exit 判据**）  
**Parent:** [TT-LOCAL-CI-DELIVERY-GATE-001](./TT-LOCAL-CI-DELIVERY-GATE-001.md) · [96-15-深度多维度检查与审计体系](../spec/96-15-深度多维度检查与审计体系.md) · [TT-9628 · 覆盖边界](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)

**稳定锚（深链）：** [`#tt-gate-intro`](#tt-gate-intro) · [`#tt-gate-local-proven`](#tt-gate-local-proven) · [`#tt-gate-31-community`](#tt-gate-31-community) · [`#tt-gate-cross-domain`](#tt-gate-cross-domain) · [`#tt-gate-96-15-tracks`](#tt-gate-96-15-tracks) · [`#tt-gate-backrefs`](#tt-gate-backrefs)

---

<a id="tt-gate-intro"></a>

## 0. 本文用途（读前）

| 项 | 说明 |
|----|------|
| **解决什么问题** | 避免把 **「① 本地三连 / 扩充闸 `exit 0`」** 误读为 **31 社区全文**、**96-15 Tier C**、**93 全矩阵** 或 **96-20 全路由 PASS** 已收口。 |
| **与 TT-LOCAL** | **[TT-LOCAL §2.1.1～§2.1.2](./TT-LOCAL-CI-DELIVERY-GATE-001.md)** 已列 **已纳入可选切片** 与 **A–H backlog**；**本篇**把「仍属未机读 / 未默认自动化」扩成 **可勾选登记册**，并映射到 **96-15** 执行面。 |
| **与 96-15** | 对外承诺 **「深度多维 / Tier C」** 时，须按 **[96-15 §1](../spec/96-15-深度多维度检查与审计体系.md)** **Tier A→B→C** 与 **[§3 P0 勾选](../spec/96-15-深度多维度检查与审计体系.md)** 留痕或书面 **N/A**；**本篇不替代** 96-15 正文。 |
| **与阶次** | 仅 **① 本地** 机读与登记；**② 测试网 / ③ 生产** 另闸；**禁止**用 **①** 冒充 **②③**（与根 **AGENTS.md**、**CONTRIBUTING#no-false-completion** 同源）。 |
| **与 B-179 / docs/README** | **`ci-local`/`local-delivery-expanded` 全绿** **≠** **31 / 96-15 Tier C / 93** **全文收口**（与 **[docs/00-文档索引.md](../00-文档索引.md)** **伴侣摘要**、**[docs/README.md](../README.md)** **篇首**、根 **[README.md](../../README.md)** **「内部协作约定」** **TT-GATE** 行 **同句**）。 |

> **工具链旁注（①）：** 常见 Markdown / 链接检查 **默认** **不验证** 目标文件内 **`#fragment`**。**可选** 机读：**`scripts/gates/check-doc-markdown-relative-links.py`** **默认** **仅** **验** **`.md` 相对路径**；**`DOC_AUDIT_LINKS_CHECK_FRAGMENTS=1`** **（** **或** **`--check-fragments`** **）** **可** **验** **ASCII** **稳定锚** **子集**（**细则** **见** **脚本** **docstring** **/** **`doc-enterprise-audit-machine-phases.sh`** **头** **Env** **）**；**`DOC_AUDIT_LINKS_ENFORCE=1`** **见** **脚本头**；编排见 **`scripts/gates/doc-enterprise-audit-machine-phases.sh`** **Phase 10**、**[runbook/README · §8.1](./README.md)**。**[TT-9628 · §0.0.4](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-4-doc-hygiene)** **`rg`** 互指包：**`bash scripts/gates/run-tt9628-doc-hygiene-rg-bundle.sh`**（**须** **`PATH`** **上有** **`rg`** **执行** **扫描**；**无** **`rg`** **默认** **skip** **`exit 0`**；**`RUN_TT9628_RG_STRICT=1`** **则** **`exit 1`**；**与** **§0.0.4** **fenced** **块** **同源**）；**`DOC_AUDIT_TT9628_RG=1`** **时** **串** **企业文档机读** **Phase 10b**（**`doc-enterprise-audit-machine-phases.sh`**）。**默认** **未** 接入 **每 PR 必跑** workflow。合入前仍按 **TT-9628** / **CONTRIBUTING** **手扫**；**勿**将「本篇已登记」误读为「已在 CI 硬闸覆盖」。

---

<a id="tt-gate-local-proven"></a>

## 1. 默认「本地跑通」实际证明了什么（摘要）

| 入口 | 默认证明范围（摘要） | 本文关心的「边界外」 |
|------|----------------------|----------------------|
| **`bash scripts/gates/ci-local-delivery-minimum.sh`** | **`cargo test -p traveltrust-api`** + **`run-check-04-routes`** + **元数据闸**（+ 条件 AI 索引） | **无** Playwright；**无** 全站 UI 穷举；**无** 社区 Feed 播放体验专验。 |
| **`bash scripts/gates/local-delivery-expanded.sh`** | 三连 + **`frontend` lint / tsc / npm test** + **PublishDrawer Vitest** +（条件）**`e2e/market-subsite-studio-and-community-publish.spec.ts`**、**`b468`/`b469`**、**`trust-gate-*.spec.ts`（四文件）** 等尾段；**可选** **`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX=1`** 再串 **`scripts/gates/local-e2e-chromium-full-matrix.sh`**（**`npm run e2e:full-chromium`**，与 **`build.yml`·`e2e`** 同 **`chromium`** 集合） | 尾段受 **`DATABASE_URL` / `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E`** 门闸；**即使**含 **全量 chromium** **仍不**覆盖下表「深度产品面」— **[TT-LOCAL-FULL-E2E-MATRIX-001](./TT-LOCAL-FULL-E2E-MATRIX-001.md)**、**[TT-96-20-E2E-COVERAGE-GAP-MAP-001](./TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**（**P0↔E2E**）。 |

**E2E 切片已覆盖的社区竖切（与 31 部分重叠，仍不等于「对标清单全 P0」）：** 纯文字发帖 **`POST/GET`**；**单图 / 双图** **`upload-media` + POST + GET**（含 **`media_urls` ≥ 2**）；**小视频 MP4** **`upload-media` + POST + GET**；抽屉内 **`<video>`** 本地预览可见；**session / ActionGate** 若干闸。真源：**`frontend/e2e/market-subsite-studio-and-community-publish.spec.ts`**（与 **TT-LOCAL §2.1** 同源）。

**① 可观测旁路（非 exit、不冒充 ②）**：进程 **`TT_COMMUNITY_MULTIPART_LOG=1`** 时 **`traveltrust-api`** stderr 与 **`GET …/media/capabilities`** JSON（**`public_video_spec_required`/`head_bucket_*`** 等）对拍，便于 **①** 留证与 **②** 日志关联；真源 **[COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md)**、**[local-release-ready](./local-release-ready-vs-testnet.md)**、**04 §三** **`GET …/media/capabilities`**。**不**替代浏览器 **PUT**、桶 **CORS**、**CDN** 的 **②** 举证。

---

<a id="tt-gate-31-community"></a>

## 2. 社区域（31）· 视频 / 媒体 / 互动 — **未**被默认本地闸「声明收口」的项

下列项的真源多在 **`docs/spec/31-*.md`**；**默认三连 / 扩充闸不将其列为 exit 条件**。实施后可改 **31** 表体或增 **E2E / 93 批次**，但**不以**「登记在本文」冒充已完成。

| 主题 | 缺口说明（登记） | 建议收口轨道（非本地 exit） |
|------|------------------|------------------------------|
| **Feed / 详情真实视频流** | 列表点击后的 **全屏层播放器**、进度条、静音/开声、可选 **Reels** 式体验 | **96-16** 抽样 + 专项 Playwright；**31** 对标清单 P0 行 |
| **横屏全屏** | 安全区、**Fullscreen API**、旋转策略 | **96-13** / **96-16** + 手验 |
| **评论 API 全形态** | 一级 + 二级 + 分页 + 排序（热度/时间） | **04 §三** 契约 + **93** 域用例；**Tier C** 手验 |
| **点赞 / 收藏 / 关注 全路径持久化** | 与 **刷新一致**、列表与详情 **数值同源** | **04** + **93**；非 **`market-subsite`** 单文件可证 |
| **举报与审核** | 后端记录、限流、**已受理 / 已隐藏** 展示 | **96-15** 范围触发时 **Tier B/C** + 产品策略 |
| **发现 / 搜索 / 话题 / 活动消息** | Explore、关键词搜、话题聚合 | **96-20** 路由矩阵 + **P2** 排期 |
| **上传安全全量** | 白名单、大小、时长与 **04** 体限 **端到端** 对拍（非仅 Vitest 桩） | **59** 九维安全行 + **API 契约测试** |
| **封面 / 转码 / CDN** | 自动封面、生产对象存储路径 | **②③** 另闸；**非** ① 默认 |
| **「我的」真数据** | 头像上传、资料编辑、浏览记录、**赞过**列表与隐私 | **96-17** 范围触发 + **31 §2.8** |
| **社区规范正文** | 法务定稿页，非占位 | **Tier C** 内容闸 / **G16** 类留痕 |
| **31 附录 × 04 路由表** | **`media_ids[]` / `media_urls[]` / video 字段** 与 **04** 正式表一致 | **04** SSOT + **`run-check-04-routes`** 长期对拍 |

---

<a id="tt-gate-cross-domain"></a>

## 3. 其他页面 / 功能 — **同类「机读绿 ≠ 深度收口」** 登记

与 **[TT-LOCAL §2.1.2 · A–H](./TT-LOCAL-CI-DELIVERY-GATE-001.md)**、**[TT-9628 · 覆盖边界](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)** 同口径：**下列域不因某一子集 E2E 绿而视为 93 / 96-20 已穷举。**

| 域 / 面 | 已有「①」机读或切片资产（摘录） | 仍属深度多维 / 全站矩阵缺口 |
|---------|----------------------------------|------------------------------|
| **市场收购支付 / escrow 全链** | 部分 **B-463～469**、request 用例；**①** 扩充闸尾段 **`trust-gate-*.spec.ts`**（Escrow/争议信任闸竖切，**`POST /auth/seed-trust-gate-e2e`**；有 **`DATABASE_URL`** 时 seed **best-effort upsert** 夹具 **`orders`**/**`disputes`**；**证据** 双写 **WARN** / **`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE`** 边界见 **[TT-96-20 §3.1](./TT-96-20-P0-E2E-LADDER-001.md#tt-96-20-trust-gate-pg-evidence-warn)**；**Rust 可选**：**`cargo test -p traveltrust-api matrix_93_b_tg_`**） | **② 测试网 mock-pay / ③ 生产 PSP**；**订单状态机** 长尾；**≠** **96-20** 全路由、**≠** 托管/支付全矩阵 |
| **Admin / internal / 治理写路径** | 矩阵子集、`cargo` 内 **admin** 相关测 | **RBAC 交叉**、**审计留痕** 全枚举 |
| **DidRank / 治理只读** | 烟测、部分 E2E | **全榜单 / 边界角色** 手验 + **96-20** |
| **Onboarding 96-18** | **`tt-9618-onboarding-pg-evidence`**、shell E2E | **PSP / webhook / ②** 另闸（见 **TT-9618**） |
| **全站 i18n / a11y** | **`npm test`**、部分 Vitest | **`test:i18n:ci`**、**96-13**、**96-16 D1～D12** |
| **订单步骤条 / 行程侧栏（窄屏）** | 组件或局部单测以仓库为准 | **96-16 D3**、专项 E2E |
| **个人中心 UX 一致** | **Hub / security** 部分自动化 | **笔记·收藏 vs 赞过·订单** 范式；**96-16** |
| **发现 / 消息 / 好友** 全边界 | **`smoke-community`**、部分 **`93-matrix-*`** | **93 §8.0** 声明的覆盖边界；手工长尾 |
| **链上读 + `/meta` 同压** | 各脚本已分散提示 | **全栈超时 / 408** 环境类；非功能回归混读 |

---

<a id="tt-gate-96-15-tracks"></a>

## 4. 执行映射：缺口应落在哪条「深度多维」轨道上

| 轨道 | 何时打开 | 硬输出 / 读法 |
|------|----------|----------------|
| **[96-15 §1 Tier C](../spec/96-15-深度多维度检查与审计体系.md)** | 对外承诺深度审计或合同要求 | **96-16** **D1～D12** 抽样 + **F 区**；与 **go-live · 96 维** 并联 |
| **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** | 路由级契约与 UI 矩阵 | **Phase D**；**未满 §0.2 不得对外称 PASS**（与 **CONTRIBUTING** 同键） |
| **[93 矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md)** | 域别回归、批次拆线 | **§8.0** 覆盖边界；与 **TT-9628** 合线纪律 |
| **[TT-9600 §3](../runbook/TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md)** | 本地打 **96 Hub** 包 | **96-15 N/A** 规则与 **P0/P1/P2** 表 |
| **[TT-96-16-D3-hand-checklist](./TT-96-16-D3-hand-checklist-001.md)** | 弹层 / 320·768 / 触控 | **①** 手验勾选，**不**替代 E2E |

---

<a id="tt-gate-backrefs"></a>

## 5. 互指索引（谁在链到本文）

| 文档 | 位置 |
|------|------|
| **[TT-LOCAL-CI-DELIVERY-GATE-001](./TT-LOCAL-CI-DELIVERY-GATE-001.md)** | **§2.1.3**、**§5** |
| **[96-15](../spec/96-15-深度多维度检查与审计体系.md)** | **§0**「与本地机读闸边界」 |
| **[TT-9628](./TT-9628-main-line-vs-branch-lines-delivery.md)** | **§0.0** 覆盖边界表（**① 本地机读** 行）；**§0.0.4** **`rg`** 触发句与扫描路径；段末 **根 README 对拍落点**（**`README.md`** **「内部协作约定」**/**`CI 与本地开发`**） |
| **[CONTRIBUTING](../../CONTRIBUTING.md)** | **GitHub Actions 不可用** 小节；**Handbook 一行对拍**（**TT-9628 §0.0.4** **`run-tt9628-doc-hygiene-rg-bundle.sh`** **/** **`DOC_AUDIT_TT9628_RG`** **Phase 10b**） |
| **[solo-dev-rhythm](../solo-dev-rhythm.md)** | **§6.5** 扩充闸读法 |
| **[scripts/README](../../scripts/README.md)** | **三连 / `local-delivery-expanded`** 编排段 |
| **[engineering/05 §3～§4](../handbook/engineering/05-本地环境与常用门禁速查.md)** | **§3** 矩阵 **`TT-GATE`/`TT-LOCAL`** 行（**v1.0.29** **`run-tt9628-doc-hygiene-rg-bundle.sh`** **/** **`DOC_AUDIT_TT9628_RG`** **Phase 10b**）；**§4** **TT-GATE** 入口 |
| **[TT-9600](./TT-9600-96-HUB-LOCAL-VERIFICATION-PACK.md)** | **§3.2** 文首 |
| **[runbook/README](./README.md)** | **§3** 主导航表；**§8.1** **TT-9628** **`rg`** **封装脚本** **速查**；**§10** **v0.2.102**（**0.2.102** **CONTRIBUTING** **/** **`engineering/05` v1.0.29** **伴侣**；**0.2.101**/**0.2.100**/**0.2.99**/**0.2.98**/**0.2.97**/**0.2.96**/**0.2.95**/**0.2.94** 承上）；**TT-9628** **v0.1.47** **§7**；**本篇** **v1.0.21** |
| **[TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](./TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)** | **R1～R10** 全页面 UI/UX 深度多维协议（**禁 `page.route` 假 JSON**；与 **§2～§3** 缺口对读） |
| **[TT-NEXT-BATCH-BACKLOG-001](./TT-NEXT-BATCH-BACKLOG-001.md)** | **S0～E** 下一批执行总表（与本文 §2～§3 同源登记；拆 PR 指针） |
| **[TT-31-STRUCTURED-GAP-CATALOG-001](./TT-31-STRUCTURED-GAP-CATALOG-001.md)** | **31** 线 **A～D** 结构化目录 + **429** 对齐说明（[`#tt-31-gap-catalog`](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-catalog)）；**真完成 / mock 分轨**见 **[`#tt-31-gap-mock-reality`](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-mock-reality)**；**代码对拍**见 **[`#tt-31-gap-reality`](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-reality)**（防将 **§B** 误读为「零实现」） |
| **[31-TT社区-企业级UI检查-未完成与待优化](../spec/31-TT社区-企业级UI检查-未完成与待优化.md)** | **读前摘要** |
| **[AGENTS.md](../../AGENTS.md)** | **Cross-doc hygiene**（**TT-9628 §0.0.4** 同清单）；**Solo maintainer** 扩充闸段 |
| **[`.cursor/rules/traveltrust-ai-collab.mdc`](../../.cursor/rules/traveltrust-ai-collab.mdc)** | **禁止假完成**、**叙事互指**、**GitHub Actions 不可用** |
| **[AI协作话术 §0.1～§0.2](../AI协作话术-减负与边界.md)** | 可贴块（**禁止假完成** / **多文互指**） |
| **[README.md](../../README.md)** | **内部协作约定** 表（**TT-GATE** 行；**多文互指** 行补 **TT-GATE** 触发词）；**CI 与本地开发** 段 |
| **[docs/00-文档索引.md](../00-文档索引.md)** | **Version** 伴侣行；**拆线叙事**；**§1** 表 **TT-GATE** 行 |
| **[docs/spec/00-文档索引.md](../spec/00-文档索引.md)** | **读前** **拆线叙事** 行；**版本表** **`docs/00` / `docs/README`** 伴侣行 |
| **[docs/README.md](../README.md)** | **Version** 文首 **TT-GATE** 短引 |

---

## 6. 变更记录（本篇）

| Version | 摘要 |
|---------|------|
| **1.0.25** | **§1**（**E2E 切片** 段末）：补 **①** **`TT_COMMUNITY_MULTIPART_LOG`** / **capabilities JSON** 对拍旁路；互指 **COMMUNITY-MEDIA**、**local-release-ready**、**04**。**承** **v1.0.24**。 |
| **1.0.24** | **§5** 互指表增 **[TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001](./TT-96-20-UI-UX-TEN-ROUND-DEEP-CHECKLIST-001.md)**。**承** **v1.0.23**。 |
| **1.0.23** | **§1** **`local-delivery-expanded`** 行末互指增 **[TT-96-20-E2E-COVERAGE-GAP-MAP-001](./TT-96-20-E2E-COVERAGE-GAP-MAP-001.md)**。**承** **v1.0.22**。 |
| **1.0.22** | **§1** **`local-delivery-expanded`** 行：**可选** **`CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX`** **全量** **`chromium`** Playwright；互指 **[TT-LOCAL-FULL-E2E-MATRIX-001](./TT-LOCAL-FULL-E2E-MATRIX-001.md)**。**承** **v1.0.21**。 |
| **1.0.21** | **§3** **escrow 全链** 行：seed **orders**/**disputes**；**Rust 可选** **`matrix_93_b_tg_*`**。**承** **v1.0.20**。 |
| **1.0.20** | **§3** **escrow 全链** 行补 **TT-96-20 §3.1** 深链（**evidence** 双写 **WARN** / **strict**）。**承** **v1.0.19**。 |
| **1.0.19** | **§3** **escrow 全链** 行补 **trust-gate** seed 在有 **`DATABASE_URL`** 时对夹具 **`orders`** 的 **upsert**（**`evidence_receipts`** FK）。**承** **v1.0.18**。 |
| **1.0.18** | **§1** 扩充闸尾段摘要补 **`trust-gate-*.spec.ts`**；**§3** **escrow 全链** 行补 **①** 竖切与 **≠** **96-20** 边界。**承** **v1.0.17**。 |
| **1.0.17** | **§5** **CONTRIBUTING** **/** **`engineering/05`** **行** **补** **v1.0.29** **手扫** **/** **矩阵** **互指**（**`run-tt9628…`/`DOC_AUDIT_TT9628_RG`**）；**runbook** **v0.2.102** **§10**；**TT-9628** **v0.1.47** **§7**；**spec/00** **`docs/00`/`docs/README`** **1.0.43**/**1.0.14**。**承** **v1.0.16**。 |
| **1.0.16** | **§0** **工具链旁注** **补** **`run-tt9628-doc-hygiene-rg-bundle.sh`** **+** **`DOC_AUDIT_TT9628_RG`** **（** **Phase 10b** **）**；**`docs/go-live-checklist.md`** **补** **`#go-decision-entry-point`**；**runbook** **v0.2.101** **§8.1·§10**；**TT-9628** **v0.1.46** **§7**；**spec/00** **`docs/00`/`docs/README`** **1.0.42**/**1.0.13**。**承** **v1.0.15**。 |
| **1.0.15** | **B-179** **去** **TT-GATE/TT-9628** **手抄** **版本号**；**增** **②③** **真值** **指针**（**缺口总表 P0** / **go-live** / **ops/RUNBOOK**）；**§0** **工具链旁注** **补** **`check-doc-markdown-relative-links.py`**；**runbook** **v0.2.100** **§10**；**TT-9628** **v0.1.45** **§7**；**spec/00** **`docs/00`/`docs/README`** **1.0.41**/**1.0.12**。**承** **v1.0.14**。 |
| **1.0.14** | **B-179** **伴侣摘要**：**修订链** **改** **「** **runbook §10** **/** **本篇变更记录** **/** **TT-9628 §7** **表顶·文首** **」** **真值** **指针**（**禁** **手抄** **B-179** **版本号** **滞后**）；**§0** **读前表** **增** **「** **与 B-179 / docs/README** **」** **行**（**`ci-local`/扩充** **≠** **31·96-15·93** **全文**）；**runbook** **v0.2.99** **§10**；**TT-9628** **v0.1.44** **§7**；**spec/00** **`docs/00`/`docs/README`** **1.0.40**/**1.0.11**。**承** **v1.0.13**。 |
| **1.0.13** | **`docs/00`（B-179）** **文首** **伴侣摘要** **拆句**（**可维护性**）；**TT-9628** **v0.1.43** **§7** **澄清** **「** **变更记录** **」** **=** **本篇** **「6. 变更记录（本篇）」**，**非** **TT-9628** **「7. 修订记录」**；**runbook** **v0.2.98** **§10**；**spec/00** **`docs/00`/`docs/README`** **1.0.39**/**1.0.10**；**§0** **工具链旁注**（**`#fragment` 机读** / **`rg` 包** **非** **默认 CI**）。**承** **v1.0.12**。 |
| **1.0.12** | 根 **README** **`00`** 条 **「** **上一条** **」** **→** **「** **文档** **索引** **节** **首条** **Runbook** **」**；**runbook** **v0.2.97** **§10**；**TT-9628** **v0.1.42** **§7**；**spec/00** **`docs/00`/`docs/README`** **1.0.38**/**1.0.9**。**承** **v1.0.11**。 |
| **1.0.11** | **§5** **runbook/README** 行补 **v0.2.95 §10** 伴侣指针（根 **README** **`spec/00`** 锚、**TT-9628 v0.1.40**）；根 **README** **文档索引** 条 **去双链**（同号节 **URL** 仅保留 **runbook** 条末）；**runbook** **v0.2.96** **§10**、**TT-9628** **v0.1.41** **§7**、**spec/00** **`docs/00`/`docs/README`** **1.0.37**/**1.0.8** 伴侣收口。**承** **v1.0.10**。 |
| **1.0.10** | **§6** 修订表：**v1.0.5** 行内 **TT-9628 v0.1.31** 加注为**当时对拍点**；**当前**以 **[TT-9628](./TT-9628-main-line-vs-branch-lines-delivery.md)** 文首 **Version** 为准。**承** **v1.0.9**。 |
| **1.0.9** | **§5** **TT-31** 行补 **`#tt-31-gap-mock-reality`**（真完成 / mock 分轨）。**承** **v1.0.8**。 |
| **1.0.8** | **§5** **TT-31** 行补 **[`#tt-31-gap-reality`](TT-31-STRUCTURED-GAP-CATALOG-001.md#tt-31-gap-reality)** 指针（与 **31 spec** 读前、**TT-31 §5** 同源）。**承** **v1.0.7**。 |
| **1.0.7** | **§5** 互指表补 **[TT-31-STRUCTURED-GAP-CATALOG-001](./TT-31-STRUCTURED-GAP-CATALOG-001.md)**（**31** 线结构化缺口目录）。**承** **v1.0.6**。 |
| **1.0.6** | **§5** 互指表补 **[TT-NEXT-BATCH-BACKLOG-001](./TT-NEXT-BATCH-BACKLOG-001.md)**（下一批执行总表）。**承** **v1.0.5**。 |
| **1.0.5** | **§5** **TT-9628** 行补 **根 README 对拍落点**；与 **TT-9628 v0.1.31**（**本条为当时对拍点**；**当前**以 **[TT-9628](./TT-9628-main-line-vs-branch-lines-delivery.md)** 文首 **Version** 为准）、**CONTRIBUTING**、**engineering/05 §3** 对拍。**承** **v1.0.4**。 |
| **1.0.4** | **§5** 互指表补 **根 README**、**docs/00**、**spec/00**、**docs/README**。**承** **v1.0.3**。 |
| **1.0.3** | **§5** 互指表补 **AGENTS**、**Cursor 规则**、**AI话术 §0.1～0.2**。**承** **v1.0.2**。 |
| **1.0.2** | **§5** 互指表补 **TT-9628 §0.0.4**；与 **CONTRIBUTING** / **engineering/05** 对拍。**承** **v1.0.1**。 |
| **1.0.1** | 增 **稳定锚**（`#tt-gate-*`）、**§5 互指索引**；正文节号顺延为 **§6**。 |
| **1.0.0** | 初版：**本地机读闸 × 96-15** 缺口登记；**31** 视频/互动/我的；**A–H** 同类域；**不**并入 **TT-LOCAL** exit 判据。 |

---

**End of TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001**
