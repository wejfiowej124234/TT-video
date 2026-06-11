# AI 协作话术：减负与边界（TravelTrust）

与 [CONTRIBUTING.md](../CONTRIBUTING.md) 并列：**给人用的可复制话术** + **给 AI 的约束摘要**。详细工程门禁仍以 **07**、**scripts/README** 为准。  
**任务来源与执行**：Backlog 见 [任务母表.md](./任务母表.md)；可执行 TT 见 [AI任务卡索引.md](./AI任务卡索引.md)（说「执行任务卡 TT-XXX」即按索引条目执行）。

> **开发期（未发布）**：下文「分两批合并」等话术是**控 diff 体量**的工具，**不**等于「每轮必须走 GitHub 合并请求 UI」。是否建合并请求见 **[CONTRIBUTING · 单人 push](../CONTRIBUTING.md#solo-push-vs-pr)** 与 **[TT — spec→handbook 全量替代清单 · §0](runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)**。

---

## 极简版（复制这一条即可开场）

```
【TravelTrust · 本轮约束】先列将读文件清单（≤8）再改。代码范围：[填写]；禁止无关重构与删注释。文档默认只改 04 §3.4/§三；仅当我说「台账同批」时再改 07/00/缺口/27-archived tail。测试：cargo test -p traveltrust-api。若本轮改 docs/AI任务卡索引.md：push 前 bash scripts/check-ai-task-card-index-overview.sh docs/AI任务卡索引.md 须 exit 0（Win 勿单靠 PATH 首位 python3）；走 dev-preflight/ci-local 且未设 SKIP_AI_TASK_CARD_INDEX_OVERVIEW 时 maybe-run 条件串行同核。长 spec 用搜索定位段落，勿通读全文。纯文档审计勿改 07 文首（1）（2）完成度 %。禁止假完成：进度/已闭/GO 须标明 ①本地 / ②测试网 / ③生产；勿用文档勾选或本地绿冒充 ②③；见 CONTRIBUTING#no-false-completion 与 TT-9628#tt-9628-no-false-completion。拆线机读/段3报告路径：TT-9628#tt-9628-tt9627-gates-index · TT-9628#tt-9628-report-json-path-convention。双人并行时另见 TT-9628#tt-9628-dual-owner-split（话术 §13）。
```

---

## 0.1 禁止假完成（可贴一句）

```
【禁止假完成】宣称已验收须写清阶次 ①②③ + 证据路径或 report.json；勿把矩阵枚举、窄切片 GO、单测绿说成测试网/生产真实链路已闭。ISS-007 `gen-r002-iss007-prereport.py`：43 锚全过仍常 `PARTIAL_GO`，勿对本品单独 `validate-regression-report.py --require-go` 当 staging 全矩阵 GO；`evidence/GO_local_r002_verify/README.md`。CONTRIBUTING#no-false-completion · TT-9628 §0.0.5。机读闸/report 路径：TT-9628 §0.0.2a / §0.0.3。
```

---

<a id="ai-collab-doc-hygiene-0-2"></a>

## 0.2 多文叙事互指（可贴一句）

```
【多文互指】同轮若动到 CI 欠费旁证 / 覆盖边界 / report 段3 / 机读闸索引 / 双人拆线 / AI任务卡一览 / docs/00 / docs/README 的交叉叙述：合并前在仓库根跑 TT-9628 §0.0.4 所列 rg 互扫（CONTRIBUTING「Handbook 一行对拍」同清单；TT-9628#tt-9628-0-0-4-doc-hygiene）。
```

**读链**：[TT-9628 · §0.0.4](runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-4-doc-hygiene) · [runbook/README · 步 10e-c](runbook/README.md)

<a id="ai-collab-five-main-routes-doc-only"></a>

## 0.3 五主路由 · `/` + `/market` 文档对齐代码（仅文档 · 不改前端）

```
【五主路由 · 文档对齐】本轮只改文档，禁止改 frontend/ 源码。UI 壳 SSOT：FIVE-MAIN-ROUTES-PHASE1-FREEZE → 88 §一 → 86 §6.0。四页数据链 SSOT：LANDING-MARKET-PAGES-CODE-SSOT（`/` 1×POST · ITINERARY_CARD_COUNT=1 · landingItinerarySession = localStorage 跨 tab · getOrder 预览解锁；/market useMarketPage 300ms debounce · 收藏 localStorage + F-020 best-effort（marketTravelBookmarksSync）→ ② SLA；MARKET-L5 仅 /market 主）。全仓仅 frontend/ 现行树；非 archive/ui-v1、非根 app/page.tsx。五路由：/、/traveltrust、/market、/did-rank、/community/*。完成度仅标 ①；勿冒充 ②③ GO。07/00 勿动，除非「台账同批」。
```

**读链**：[FIVE-MAIN-ROUTES](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · **[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · [88 §一](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [frontend/README](../frontend/README.md)

<a id="ai-collab-provider-onboarding-doc-only"></a>

## 0.3a 多重身份 · 商家入驻 · 文档对齐代码（仅文档 · 不改前端）

```
【商家入驻 · 文档对齐】本轮只改文档，禁止改 frontend/ 与 crates/ 源码。SSOT 链：frontend/app/provider/register/README.md → app/provider/README.md → PROVIDER-REGISTER-UI-FREEZE → 88 §1.2 → 04 §3.4「商家入驻 · ① 实现真源」→ 96-17 §0.3.3 → 13-1 表 1 Identity 行 → 93 §2.1a B-MKT-004/005。五步：/auth/register?role=provider → /provider/register?step=1..3 → /me/onboarding → /admin/provider-applications（列表）→ /admin/users/[id]（AdminProviderApplicationReviewCard 审核）→ /market/provider。① 烟测 bash scripts/dev/smoke-provider-onboarding-local.sh（dev-local-smoke-baseline §8 · TT-9618 §2.1）；Vitest providerRegisterValidation + providerRegisterL5.contract。完成度仅标 ① 本地；勿用烟测 exit 0 或文档勾选冒充 ②③ GO。07/00 版本三线勿动，除非我说「台账同批」。93 B-MKT-005（入驻全链）≠ 95 历史 B-MKT-005（F-021 listing 目录 PG IT）。
```

**读链**：[provider/register README](../frontend/app/provider/register/README.md) · [PROVIDER-REGISTER-UI-FREEZE](../frontend/evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) · [88 §1.2](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [TT-9618 §2.1](runbook/TT-9618-onboarding-local-testnet.md)

<a id="ai-collab-acquisition-pd009-doc-only"></a>

## 0.3b 多重身份 · 旅行收购 PD-009 · 文档对齐代码（仅文档 · 不改代码）

```
【旅行收购 · 文档对齐】本轮只改文档，禁止改 frontend/ 与 crates/ 源码。SSOT 链：frontend/app/me/identities/README.md → frontend/app/market/acquisition/README.md → app/market/README.md → 88 §1.3 → 04 §读前 + 正文「旅行收购 · ① 实现真源」→ acquisition-publish-trust-rules v1 §8.1 → identity-unified-model §3.5 → 96-17 §0.3.3 → 93 §2.1b B-MKT-006～012。路径：/me/identities「进入子站」→ /market/acquisition 绑主钱包 → POST …/me/acquisition/publish-bond（或信用免押）→ POST …/market/acquisition/listings（agree_escrow_copy）→ 目录/草稿/创单（order_kind=acquisition_listing）。门闸 acquisition_publish_gate.rs（非 region_steward / 非 96-18 准入费 / 非 onboarding_entitlements）。① 烟测 bash scripts/dev/smoke-acquisition-pd009-local.sh（dev-local-smoke-baseline §9）；cargo test -p traveltrust-api market_subsite_catalog matrix_pd009_*；frontend vitest acquisitionL5/meTrust。完成度仅标 ① 本地 PD-009 竖切 CLOSED；勿用烟测 exit 0 或文档勾选冒充 ②③ GO。07/00 版本三线勿动，除非我说「台账同批」。
```

**读链**：[me/identities README](../frontend/app/me/identities/README.md) · [market/acquisition README](../frontend/app/market/acquisition/README.md) · [acquisition-publish-trust-rules §8.1](../spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) · [88 §1.3](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [dev-local-smoke-baseline §9](dev-local-smoke-baseline.md)

---

## 1. 限定范围

```
请在本轮只处理以下范围，其它文件一律不要动：
- 代码：[路径或模块]
- 文档：仅当 API/路由变更时再改 04 §3.4 对应行；不要批量改 07/缺口/tail，除非我明确说「跟台账同批」。
请先列出你将要读取的文件清单（≤8 个），我确认后再改。
```

---

## 2. 长对话防失忆（每轮可贴）

```
【本轮上下文】
- 目标：[一句话]
- 已完成：[上一批要点或 commit]
- 约束：不重构；不删注释；风格与邻行一致；单测必须绿。
- 必跑命令：cargo test -p traveltrust-api（或我只允许：……）

请基于以上执行，不要从头复述整个项目架构。
```

---

## 3. 文档分两批 PR（减单轮体量）

```
实现代码与单测后，文档请分两批 PR：
PR-A：仅 04 §3.4（及 §三 若有新契约句）+ 必要 Rust 注释。
PR-B（我单独说「合台账」时再开）：07 §6.4/6.5/读前摘要、00 版本表、缺口官方总表、27-archived tail。
若 PR-A 必须动 07 版本三线，请只改 Version + §6.5 顶行 + 00 的 07 行，不要动 6.4 整表。
```

---

## 4. 超大 Rust 文件（仅机械拆分）

```
admin.rs / health_meta.rs 等仅允许「机械拆分」：
- 用 mod 子文件搬函数，签名与 pub 不变；
- 不改行为、不加新功能、不「顺便优化」；
- 拆完 cargo test -p traveltrust-api 全绿；若动路由则 bash scripts/run-check-04-routes.sh。
请先给出拆分计划（新文件路径 + 每个文件搬哪些 fn），再改代码。
```

---

## 5. 测试与预检（控制耗时）

```
本轮预检只允许：
cargo test -p traveltrust-api
不要 cargo test --workspace / 不要 npm test，除非我写上「全量」。
若编译慢，优先 cargo test -p traveltrust-api <具体测试名>，全量由我本地再跑。
```

动 **07 版本** 或治理链时补充：

```
bash scripts/check-07-version-triple.sh && bash scripts/run-check-04-routes.sh && bash scripts/check-governance-doc-linkage.sh
```

---

## 6. 清理构建产物（须人工确认）

```
若建议清理构建产物，请只说明命令与风险，不要擅自删仓库内目录：
- Rust：cargo clean 对 target 的影响；
- 前端：删 node_modules 后如何重装；
- Windows：杀毒/Defender 排除 build 目录是否可能提速。
不要执行破坏性命令除非我回复「确认执行」。
```

---

## 7. 新开对话（避免全库探索）

```
这是 TravelTrust 仓库续任务，不要探索全库。
必读：docs/spec/07-开发流程与顺序.md 仅读「Version」「§六 6.4 顶行」「§六 6.5 顶行」（用搜索定位，不要通读全文）。
任务：[具体任务]
代码入口：[文件路径]
请先 grep 再读文件，禁止无目标地广撒网。
```

---

## 7.1 Build 新红链（先看 CI 日志提示）

```
【Build 红链】在 Actions 先读 e2e job 的 baseline regression hint（diff_conclusion），再读末尾 go-no-go-hint 的 go_no_go_status；默认按相对 stable baseline（24139191178 / 2364f55）的新问题/回归分流，不先怀疑 baseline 抖动。判读细则：evidence/GO_20260408_BUILD_CI_CLOSURE.md#ci-hint-chain-usage-rules
```

---

## 7.2 Build 新红链 · 首诊模板（复制填空）

```
【Build 新红链 · 首诊】Run URL：
1) regression hint → diff_conclusion=（e2e job 内 BASELINE REGRESSION CHECK）
2) go_no_go_status=（go-no-go-hint job）
3) 首个失败 job= / 首个红 step=
4) 是否开新卡：是/否；若开卡标题草稿：
固定顺序与表意：evidence/GO_20260408_BUILD_CI_CLOSURE.md#new-red-chain-triage-flow
```

---

## 7.3 CI 新红链 · 强制规则（入口统一）

```
【强制规则 · Build/CI 新红链】凡遇 GitHub Actions「Build」（build.yml）新红链，必须先按 §7.2 完成首诊模板（四项填实，或粘贴同次 Run 的日志锚点/截图等价信息）。未完成该流程前：禁止新开任务卡/TT；禁止分析业务代码、禁止提交修复补丁或重构建议。台账唯一入口：evidence/GO_20260408_BUILD_CI_CLOSURE.md#new-red-chain-triage-flow · evidence/GO_20260408_BUILD_CI_CLOSURE.md#ci-red-chain-single-entry
```

**违规示例与提示（软门禁）**

- **违规示例**：收到「Build 红了」后**未按 §7.2 填首诊四项**（或等价日志锚点），就直接 **grep/读业务源码、猜根因、给 patch**。
- **拉回提示（可复制给 AI/协作者）**：

```
【流程纠正】当前话题属于 Build 新红链，须先完成 §7.2 首诊模板后再分析代码。请先停下代码级推理，按顺序补：Run URL、diff_conclusion、go_no_go_status、首个失败 job/step；完成后再继续。模板见上文 §7.2。
```

---

## 8. 纯文档 PR 与完成度快照

```
若本轮无新业务代码合入，禁止修改 07 文首完成度快照（1）（2）表的百分比数字；
仅文档与台账时，按 07 §6.6 复审注处理。
```

---

## 9. 综合版（默认大任务）

```
【综合约束】
1) 先列将读文件清单（≤8），再动手。
2) 代码改动范围：[填写]；禁止无关重构与删注释。
3) 文档：默认只改 04；07/00/缺口/tail 仅当我说「台账同批」时一起改。
4) 测试：cargo test -p traveltrust-api（或指定测试名）。
5) 动 07 版本或治理文档链时：bash scripts/check-07-version-triple.sh && bash scripts/run-check-04-routes.sh && bash scripts/check-governance-doc-linkage.sh
6) 长 spec 用 grep 定位段落编辑，不要整文件加载进思路。
```

---

## 10. AI 低负载执行规则（Low-Latency Mode）

> 目标：降低单轮 token、减少重复推理与无白名单扫描，缓解 **对话侧** 迟滞（与机器 CPU/磁盘卡顿不同）。

1. **一次只做一件事**  
   - 每条消息只允许 **1 个**任务卡；禁止同消息多目标（例如 error + loading + toast 打包）。

2. **限制上下文**  
   - 读取文件 **≤8**；**禁止**无白名单的「全站扫描」——审计/排查必须给出 **路径白名单**。

3. **使用极简任务卡**  
   - **首卡**：可用完整模板（约束 / 范围 / 验收 / 非目标）。  
   - **后续卡**：只写 **路径 + 目标 + 一行验收**；勿重复整张模板。

4. **禁止重复信息（含 AI 回复）**  
   - 默认可省：「修复前后对比」、完整文件清单、重复验收说明；**仅**在行为有变或用户明确要求时展开。

5. **强制状态锚点（建议每轮用户消息携带）**  
   - **已封口：** …  
   - **本轮仅改：** …  
   - **禁止再分析：** …  

6. **禁止系统级理解**  
   - 不要求「分析整个项目」「重新总结架构」；任务应落到 **具体路径与差异**。

7. **优先执行而不是解释**  
   - **默认**输出：**改动点 + 关键理由**（可极短）；展开说明仅当用户要求。

可复制开场（粘贴到用户消息顶部）：

```
【状态锚点】已封口：… | 本轮仅改：… | 禁止再分析：…
【Low-Latency】单卡单目标 | 读≤8 文件 | 路径白名单：… | 产出：改动点+理由（不展开对比/清单除非我要求）
```

**Step 2（执行约定）**：从下一条任务起，用户侧**不再粘贴完整 Task Card**；改用上方锚点 +「任务 / 验收」极简两行即可。AI 侧默认按 §10 第 4、7 条收敛回复。

---

## 11. 仓库内「卡顿」常见来源（自检）

| 类型 | 说明 |
|------|------|
| `target/` 体积大 | Rust 编译产物；全量编译与杀毒扫盘会变慢。 |
| `frontend/node_modules` | 安装与 TS/IDE 索引耗时。 |
| 超大单文件 | 如 `admin.rs`、`health_meta.rs`、长 **07/04/tail** — 编辑与 diff 更重。 |
| Next + Web3 + 3D | `dev`/`build` 基线重于纯静态站。 |
| 全量测试 + 多脚本 | 每批合并的固定墙钟时间。 |

详见日常排障仍以 **07 读前摘要**、**scripts/README** 为准。

---

## 12. 迭代期 vs 发版闸（开发期减负）

| 场景 | 口径 |
|------|------|
| **功能迭代、仓库未对外发布** | **不必**以 **full production gate** 或「完整企业审计矩阵全文」作为**每轮**完成标准；日常以快速检查 + 受影响单测 / E2E + **[solo-dev-rhythm §6.5](solo-dev-rhythm.md)** 裁剪为主。 |
| **删 `docs/spec`、改 `build.yml` 必过链、里程碑封口、准备对外发版** | 按 **CONTRIBUTING**、**07**、**TT 清单 §14** 等**专程序**；**不因「开发期」而跳过**。 |
| **权威一句** | **[TT — spec→handbook 全量替代清单 · §0](runbook/TT-SPEC-TO-HANDBOOK-FULL-REPLACEMENT-CHECKLIST.md)**（与根 **AGENTS**、**CONTRIBUTING** 文首 **开发期** blockquote 同源）。 |

三层门禁与话术变体仍可与 **§7.x（CI 新红链）** 联用；区别是：**§7** 排障，**§12** 定「本轮要不要扛发版级全量」的预期。

### 12.1 全站主题 V1（marketDark 三页 · 可贴一句）

```
【全站主题 V1】按 docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md：① only；不 PR；213 closed 后改代码。每页须 §1.6 页面 UI L5 + §2.4 逐路由勾选（≠ /traveltrust 电影 L5）。/ + L0 锁死；scope=market/did-rank/community/*；marketingUi+壳；D2/D3 defer 书面登记；§6.1+§6.2 各路由 POST 截图；212 前 §2.4 全行 L5 closed。≠ archive/ui-v1。
```

---

## 13. 双人拆线（后端 / 前端分 Owner，可复制）

**规范真源**：[TT-9628 · §0.0.2b](runbook/TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-dual-owner-split)。

```
【双人拆线 · 本轮】
- Owner A（我）：[角色，例：后端 / 社区支线] | 负责：[API+DB+本域 96-20 URL 行+证据路径]
- Owner B（搭档）：[角色，例：前端 / Admin 支线] | 负责：[页面+E2E/手点+96-20 另一侧]
- 全局顺序：TT-9627 段 [1～6 中本轮段号]；本人映射 TT-9626 阶段 [0～6 中本轮阶段]；进度只报 ①②③；未完成本段/本阶不宣称下一段/下一阶已闭。
- 文档并联：只改本人 scope 内 96-20 / 93 / go-live / 缺口 P0 行；不替对方改 04、不打对方终局勾。
- 证据：evidence/[owner]-[batch]-[run_id]/ ；若共用 staging 写库：[书面 env/库划分 或「已书面划分」]
- 96-15：若本轮触发对外深度审计/合同附录义务 → 触发方按 96-15「何时必跑」Tier+P0 留证并与 TT-9627 段 4～6 同周对拍；否则 N/A 一句写明范围。
- 合线/发版：主持人 [姓名] 按 go-live + 缺口 P0 + R-002 差集补跑 + 一份终局索引（禁止两人各写一份矛盾「已全站闭」）。
```
