# Admin Product Experience Audit · UX Findings Report

**Report ID:** APEA-ADMIN-SOAK-20260608 · **Completed:** 2026-06-08T11:00:41Z
**Scope:** 106 `/admin/*` pages · Operator first contact
**Goal:** Admin usable for daily ops without training before real-user UAT

## Grading

| Level | Meaning |
|-------|---------|
| **P0** | 看不懂 |
| **P1** | 容易误操作 |
| **P2** | 效率低 |

## Summary

| Severity | Count |
|----------|------:|
| **P0** | 10 |
| **P1** | 15 |
| **P2** | 15 |
| **Total** | 40 |

## P0 — 看不懂

### ADMIN-UX-P0-01 · Growth Center 与 Trust Growth 同名异义，运营无法区分

- **Group:** growth · **Surface:** /admin/growth vs /admin/trust-growth
- **Actual:** Growth 组 vs Governance 组 trust-growth 均含 Growth/增长；Home audit_finance 卡片再引入第三入口
- **Operator impact:** 首次运营不知道打开哪个控制台配置邀请码或 Banner

### ADMIN-UX-P0-02 · Operations「Guide onboarding」与 Official「Official Guides」导航无法区分

- **Group:** operations · **Surface:** /admin/guides vs /admin/official/guides
- **Actual:** Operations admin_guides_title=Guide onboarding；Official admin_shell_nav_official_guides=Official Guides
- **Operator impact:** 发布官方攻略时可能进入向导 KYB 台账

### ADMIN-UX-P0-03 · Community 首项 Nav「Community governance」实际指向举报队列

- **Group:** community · **Surface:** /admin/community/reports (first nav item)
- **Actual:** admin_shell_nav_community_hub=Community governance；无 /admin/community hub；H1=Community reports
- **Operator impact:** 运营找「治理台」却进入工单列表，或找「举报」对不上 Nav

### ADMIN-UX-P0-04 · P1 四平面深页 breadcrumb 仅显示 Workspace，丢失域上下文

- **Group:** cross_cutting · **Surface:** Content/Official/Growth deep pages breadcrumb
- **Actual:** adminShellContextForPath 缺少 content/official_ops/growth PREFIX_GROUPS；返回 null
- **Operator impact:** 深页运营不知道自己在哪个平面，无法回溯 Hub

### ADMIN-UX-P0-05 · 页面副标题大量 Sprint/模块代号，运营看不懂业务含义

- **Group:** cross_cutting · **Surface:** Page subtitles (M1, G-S7, O-S4, C-S1…)
- **Actual:** Content/Official/Growth 页 subtitle 含 M1–M10、G-S7、O-S4、C-S1 等代号
- **Operator impact:** 首次接触无法从标题理解页面职责

### ADMIN-UX-P0-06 · 两套 Analytics 指标来源不同但命名相近，指标定义未自解释

- **Group:** growth · **Surface:** /admin/growth/analytics vs /admin/conversion-analytics
- **Actual:** Growth analytics=server aggregates；Conversion analytics=localStorage PES；Registrations 一个有(30d)一个无
- **Operator impact:** 运营对比两页数字会得出错误结论

### ADMIN-UX-P0-07 · Geo validation 页展示原始 HOLD/GO、PASS/FAIL、环境变量名

- **Group:** content · **Surface:** /admin/content/geo-validation
- **Actual:** UI 渲染技术枚举与 env 名
- **Operator impact:** 非工程运营无法理解验证结果

### ADMIN-UX-P0-08 · Penalties/Appeals breadcrumb 引用缺失 i18n key，叶子标题不可读

- **Group:** community · **Surface:** Penalties/Appeals breadcrumb
- **Actual:** adminShellContextForPath 用 admin_community_penalties_title/admin_community_appeals_title，locale 不存在
- **Operator impact:** 面包屑显示 raw key 或空白，位置感丢失

### ADMIN-UX-P0-09 · Workspace Home 无 Content/Official/Growth 入口，四平面仅 Sidebar 可见

- **Group:** workspace · **Surface:** /admin home
- **Actual:** ADMIN_HOME_CARDS 无 P1 平面卡片；Command palette 亦不含；Home section 仍标 Community & content
- **Operator impact:** 无培训时运营不知道 CMS/Growth 在哪开始

### ADMIN-UX-P0-10 · Governance execution UAT 页为脚本/证据路径，非日常运营语言

- **Group:** governance · **Surface:** /admin/governance/execution-uat
- **Actual:** Sepolia script sequence + evidence pack 目录名
- **Operator impact:** Ops 误入后无法理解要做什么

## P1 — 容易误操作

| ID | Group | Title |
|----|-------|-------|
| ADMIN-UX-P1-01 | content | CMS 发布/Import 无 L5 确认对话框，与 Community 处置不一致 |
| ADMIN-UX-P1-02 | official_ops | Official 发布与冷启动 Deploy/Rollback 无确认与风险 Banner |
| ADMIN-UX-P1-03 | growth | Growth anti-fraud freeze/unfreeze 无确认 |
| ADMIN-UX-P1-04 | more | Conversion analytics「Clear local data」无确认对话框 |
| ADMIN-UX-P1-05 | content | Content Hub 链接网格遗漏 Country market（Sidebar 有） |
| ADMIN-UX-P1-06 | official_ops | Official Hub 副标题/正文锁死在 O-S4 冷启动，掩盖 M7–M9 模块 |
| ADMIN-UX-P1-07 | cross_cutting | Top bar 与 Sidebar 权限 SSOT 不一致，链接可见性可能不同 |
| ADMIN-UX-P1-08 | cross_cutting | Sidebar 组可见但子链按 capability 隐藏，无「权限不足」解释 |
| ADMIN-UX-P1-09 | growth | Growth analytics 展示 raw growth_fraud_status 枚举 |
| ADMIN-UX-P1-10 | more | Conversion analytics 漏斗矩阵显示 raw stage ID |
| ADMIN-UX-P1-11 | onboarding | 入驻三队列 Sidebar/Home/Operator guide 各用不同名称 |
| ADMIN-UX-P1-12 | workspace | Operator guide 仅 6 步 inbox 流，未覆盖 CMS/Official/Growth 日常任务 |
| ADMIN-UX-P1-13 | content | 多数 CMS 列表页空数据时仅空白表格，无引导空态 |
| ADMIN-UX-P1-14 | official_ops | Official 列表统一 ops_plane_empty「Nothing here yet.» 无下一步 |
| ADMIN-UX-P1-15 | finance | Finance summary 部分 KPI 以 raw JSON 块展示 |

## P2 — 效率低

| ID | Group | Title |
|----|-------|-------|
| ADMIN-UX-P2-01 | official_ops | Sidebar「Official Ops」vs Hub H1「Official Operations」 |
| ADMIN-UX-P2-02 | content | Sidebar 组「Content」vs Hub「Content Center」 |
| ADMIN-UX-P2-03 | community | Community 子项 Nav 缩写与 Page H1 长度不一致 |
| ADMIN-UX-P2-04 | finance | Finance suite / Finance · hub / reconciliation suite 三名混用 |
| ADMIN-UX-P2-05 | cross_cutting | Content/Growth 用 skeleton；Community/Operations 用文本 loading |
| ADMIN-UX-P2-06 | workspace | Home 三层 KPI（inbox / ops snapshot / system overview）口径未互链 |
| ADMIN-UX-P2-07 | growth | Growth Hub subtitle 仍引用 G-S7/S1 且 locale body 有过时 copy |
| ADMIN-UX-P2-08 | onboarding | Onboarding Sidebar 三队列在前、Hub 居中，与 mental model 相反 |
| ADMIN-UX-P2-09 | workspace | Operator guide 不在 Sidebar workspace 组，仅 Home/maintainer fold |
| ADMIN-UX-P2-10 | more | Observability overview 空态为 plain text 无 retry 组件 |
| ADMIN-UX-P2-11 | growth | KOL center 复用 analytics window label key，控件语义漂移 |
| ADMIN-UX-P2-12 | operations | Operations 列表空态缺少 Community 级 hintKey/nextLinks |
| ADMIN-UX-P2-13 | onboarding | Users 在 Operations 与 Onboarding Hub 意图标签不同 |
| ADMIN-UX-P2-14 | governance | Governance 组含 cross-check/drift/trust-growth，仅 execution-uat 在 governance/ 目录 |
| ADMIN-UX-P2-15 | workspace | Ops 角色 Home primary CTA 仅 provider/steward/reports，缺 Content/Growth |

## Post-audit sequence

1. Unified Admin UX optimization (P0→P1→P2)
2. Admin PEA spot-check
3. Real-user UAT
4. 33/33 GO → Token Debt → next testnet
