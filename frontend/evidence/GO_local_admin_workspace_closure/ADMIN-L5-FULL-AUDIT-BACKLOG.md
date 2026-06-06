# Admin 工作台 · 全方位检查清单与分批优化（① 真源）

**阶段口径：** **① 本地** → **② 测试网/持久 Staging** → **③ 生产**

**范围：** `/admin` 及子路由（**非**五主路由 UI 冻结域；可迭代 UX/信息架构，须过 `run-admin-l5-green.sh`）。

**已有 ① 基建：** [`ADMIN-L5-AUDIT-TASKS.md`](ADMIN-L5-AUDIT-TASKS.md)（能力/RBAC/API 门闸已大量闭合）· 本文档补 **产品可读性 / 排版 / 业务动线 / ②③ 缺口**。

**① 批量收口（2026-06-04～05）：** … 绿集 **678+ tests**（`run-admin-l5-green.sh` · exit 0）；**2026-06-05 续**：系统概况数据诚实（**ADM-UX-SOV-01～06**）· **L5 危险写确认**（20 面）· **列表/详情 SWR**（41+11）· **手跑 smoke M-01～M-03** exit 0；正式收口 **`bash scripts/dev/run-admin-phase1-closure.sh`**。

---

## 总表

| 项 | 结论 |
|----|------|
| **有没有收口（① 产品+机读）** | **是（①）** — 主经营动线 + 运维列表 + L5 契约全绿 |
| **有没有 UI 冻结** | **否** — Admin 允许数据链/门闸/UX 迭代（与 FIVE-MAIN 不同） |

---

## 分批策略（建议执行顺序）

| 批次 | 目标 | 验收（①） |
|------|------|-----------|
| **A · P0** | 「能干活」：待办→队列→处置 主路径无断点 | 手工走通 + `smoke-admin-adm-u02-local` / 队列烟测 |
| **B · P1** | 子页 **L5 模板统一**（队列/列表/详情） | `run-admin-l5-green.sh` + 目视 5 条主路径 |
| **C · P2** | 社区治理 + 入驻 Onboarding 域体验 | 社区举报/处罚/申诉 + onboarding 枢纽 |
| **D · P3** | 资金/审计/合规/配置 **只读枢纽** 降噪 | 折叠/枢纽/去 API 文案 |
| **E · ②** | ADM-U01/U02 持久 Staging + 六角色矩阵 | `record-phase2-admin-adm-u01-then-u02.sh` |
| **F · ③** | 财务七件套深度 · 真 PSP · 2FA 强制生产 | spec 70 / `ADM-G01–G13` |

---

## 清单（按维度）

状态：**✅ 完成** · **🟡 部分** · **❌ 未完成** · **✅ 完成·已冻结**（仅指 ① 机读项，非全站 UI 冻结）

「未完成应在哪阶」：**—** = ① 可继续做 · **②** / **③** / **② / ③**

### 1 · 信息架构与工作流（「我该先点哪」）

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 1.1 | ADM-UX-IA-01 | 首页「今日待办」三队列 + 操作顺序指引 | ✅ | A | — |
| 1.2 | ADM-UX-IA-02 | 待办数字与 Shell「入驻」入口语义一致（避免双导航迷路） | ✅ | A | — |
| 1.3 | ADM-UX-IA-03 | **单一主路径文档**：商家→主理人→审批→社区 处置（1 页 README 动线图） | ✅ | A | — |
| 1.4 | ADM-UX-IA-04 | `admin` vs `super_admin` 能力差异在 UI 明示（不可批单时的下一步） | ✅ | A | — |
| 1.5 | ADM-UX-IA-05 | 首页模块折叠默认策略（入驻开/其余关）与角色相关 | ✅ | B | — |
| 1.6 | ADM-UX-IA-06 | ② 六角色 Console 视角切换（非仅 override 环境变量） | ❌ | E | **②**（① 已接线：`useAdminEffectiveShellRole` · 顶栏快切 · 暖金预览条 · `AdminAdmU01LocalPrepPanel` · 见 [`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](TT-ADMIN-PHASE1-FULL-CLOSURE.md)） |

### 2 · 视觉与排版（L5 设计系统）

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 2.1 | ADM-UX-VIS-01 | Admin 域统一宽度/间距（`TT_ADMIN_PAGE_INNER_*`）全子树 | ✅ | B | — |
| 2.2 | ADM-UX-VIS-02 | 列表页统一：**页头卡片 + 筛选区 + 表格 + 空态** | ✅ | B | — |
| 2.3 | ADM-UX-VIS-03 | 只读/可写/高权限标签策略（首页已弱化，子页仍需统一） | ✅ | B | — |
| 2.4 | ADM-UX-VIS-04 | 顶栏能力条降噪（技术 matrix 默认隐藏） | ✅ | A | — |
| 2.5 | ADM-UX-VIS-05 | 深色/品牌对比度抽检（控制台白卡 + travel 主色） | ✅ | C | — |
| 2.6 | ADM-UX-VIS-06 | 移动端 Shell 分组导航可滚动/可折叠 | ✅ | C | — |
| 2.7 | ADM-UX-VIS-07 | 统一 **处置/批准/驳回** 主按钮样式与位置 | ✅ | B | — |
| 2.8 | ADM-UX-VIS-08 | 控制台 **暖灰底 + 白卡**（`bg-bg-main`+vignette · 卡 `bg-bg-console` · 与 22 token 对齐） | ✅ | B | — |
| 2.9 | ADM-UX-VIS-09 | Admin 全域 **暖金 L5**（`AdminDetailContentPanel` 详情/队列处置 · 表格 `ADMIN_TABLE_*` · 筛选 `ADMIN_FILTER_CARD` · `adminWarmL5CoverageL5`） | ✅ | B | — |
| 2.10 | ADM-UX-VIS-10 | 深壳 footnote **muted 字色** 提至 `ADMIN_TEXT_META` + `text-small`（KPI/待办诚实句 · ⌘K 提示） | ✅ | Vis-P0 | — |
| 2.11 | ADM-UX-VIS-11 | **暖金靠色降噪**（gradient 数字 / outline 徽标 / CTA 同屏可区分） | ✅ | Vis-P0 | — |
| 2.12 | ADM-UX-VIS-12 | 聚焦模式 **单 hero 数字**（聚焦条去合计 badge · 队列卡保留 gradient 数字） | ✅ | Vis-P0 | — |
| 2.13 | ADM-UX-VIS-13 | 页内标题差阶（Shell 已有「工作台」时页头 h1 降噪） | ✅ | Vis-P1 | — |
| 2.14 | ADM-UX-VIS-14 | 待办/KPI 数字 **统一 scale ≤ text-h2** | ✅ | Vis-P1 | — |
| 2.15 | ADM-UX-VIS-15 | 合规诚实句 **禁止 text-meta** 承载 | ✅ | Vis-P1 | — |
| 2.16 | ADM-UX-VIS-16 | 聚焦套盒 **≤3 层描边**（`ADMIN_INBOX_TASK_PENDING_CARD_FOCUS_CLASS`） | ✅ | Vis-P1 | — |
| 2.17 | ADM-UX-VIS-17 | 聚焦模式 **合并 chrome**（capability/preview 顶栏 defer · 紧凑页头 · canvas 间距） | ✅ | Vis-P1 | — |
| 2.18 | ADM-UX-VIS-18 | 侧栏 pending badge **基线对齐** | ✅ | Vis-P2 | — |
| 2.19 | ADM-UX-VIS-19 | KPI embedded 折叠 **视觉配重**（accent bar / 满宽磁贴） | ✅ | Vis-P2 | — |
| 2.20 | ADM-UX-VIS-20 | 聚焦场景 **单 primary CTA**（队列卡改 ghost/secondary） | ✅ | Vis-P1 | — |
| 2.21 | ADM-UX-VIS-21 | 动线 chip 激活 **去掉内嵌 badge pill** | ✅ | Vis-P2 | — |
| 2.22 | ADM-UX-VIS-22 | 首页计数 **dedupe**（侧栏 vs 大卡 vs chip） | ✅ | Vis-P2 | — |

**截图真源：** [`ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md`](ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md)（2026-06-04 · super_admin · 社区 78 聚焦场景）

### 3 · 首页 `/admin`

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 3.1 | ADM-UX-HOME-01 | 去掉 Phase/API 面向用户的副标题 | ✅ | A | — |
| 3.2 | ADM-UX-HOME-02 | 待办大卡 + 「去处理」CTA | ✅ | A | — |
| 3.3 | ADM-UX-HOME-03 | KPI「经营快照」注明列表上限非全库 KPI | ✅ | — | — |
| 3.4 | ADM-UX-HOME-04 | API 构建/REST 对照默认折叠 | ✅ | D | — |
| 3.5 | ADM-UX-HOME-05 | 卡片数量过多（40+）→ 按角色隐藏 + 搜索/收藏 | ✅ | B | — |
| 3.6 | ADM-UX-HOME-06 | 首页「最近访问」或 pinned 队列 | ✅ | C | — |
| 3.7 | ADM-UX-HOME-07 | 今日待办区 **列表 API 上限** 诚实标注（与统一收件箱同源） | ✅ | A | — |
| 3.8 | ADM-UX-HOME-08 | 聚焦待办 **速览栏**（域健康 + 最近访问 + 经营链 · 消空屏） | ✅ | A | — |
| 3.9 | ADM-UX-HOME-09 | focus 模式 **域健康不双入口**（companion SSOT · 去掉 secondary 折叠） | ✅ | A | — |
| 3.10 | ADM-UX-HOME-10 | 工作台 focus **侧栏待办 dedupe**（hero 数字唯一 · 组级橙点） | ✅ | Vis-P2 | — |
| 3.11 | ADM-UX-HOME-11 | **速览 vs KPI 数字 dedupe**（companion 无 162/0 · 锚点 #home-kpi-snapshot） | ✅ | A | — |
| 3.12 | ADM-UX-HOME-12 | 侧栏 **线型图标** + `ADMIN_SHELL_SIDEBAR_LINK_CLASS` + footnote `slate-300` | ✅ | Vis-P2 | — |
| 3.13 | ADM-UX-SOV-01 | 系统概况 **memory/pg/样本** 标签诚实 | ✅ | A | — |
| 3.14 | ADM-UX-SOV-02 | 趋势图 **合法 HTML** + `text-small` 字号 | ✅ | B | — |
| 3.15 | ADM-UX-SOV-03 | 控制台角色 **求和标题** + 链 ID 人话化 | ✅ | B | — |
| 3.16 | ADM-UX-SOV-04 | 聚焦待办 **折叠 compact** + 隐藏趋势 | ✅ | A | — |
| 3.17 | ADM-UX-SOV-05 | 聚焦模式 **inbox pending 去重强调** | ✅ | Vis-P2 | — |
| 3.18 | ADM-UX-SOV-06 | 概况 **90s 会话缓存** + auth 失效 | ✅ | B | — |

**系统概况代码真源：** [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) · [`frontend/app/admin/README.md`](../../app/admin/README.md)

### 4 · Shell 顶栏与子导航

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 4.1 | ADM-UX-SHELL-01 | 分组导航（工作台/入驻/经营/社区/资金/治理） | ✅ | — | — |
| 4.2 | ADM-UX-SHELL-02 | 无权限的 Nav 项隐藏（capabilities） | ✅ | — | — |
| 4.3 | ADM-UX-SHELL-03 | 当前所在域高亮与面包屑一致 | ✅ | B | — |
| 4.4 | ADM-UX-SHELL-04 | 「① 本地」徽章对非维护者隐藏或改环境标签 | ✅ | D | — |
| 4.5 | ADM-UX-SHELL-05 | 社区域二级导航改「下拉/侧栏」替代子页顶部链接墙 | ✅ | C | — |

### 5 · 队列与审批（核心经营动线）

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 5.1 | ADM-UX-QUEUE-01 | 商家/主理人列表 `AdminQueueListPageChrome` | ✅ | — | — |
| 5.2 | ADM-UX-QUEUE-02 | URL `?status=` 可分享/刷新保持筛选 | ✅ | — | — |
| 5.3 | ADM-UX-QUEUE-03 | **审批列表** `/admin/approvals` L5 表格式 + 待批筛选默认 | ✅ | A | — |
| 5.4 | ADM-UX-QUEUE-04 | 审批详情：批准/驳回原因必填 + 幂等键提示人话化 | ✅ | A | — |
| 5.5 | ADM-UX-QUEUE-05 | 队列行内展示「等待多久/申请人」业务字段 | ✅ | B | — |
| 5.6 | ADM-UX-QUEUE-06 | 批量操作（批量通过/导出） | ✅ | A | — |

### 6 · 用户/订单/争议（经营查阅）

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 6.1 | ADM-UX-OPS-01 | 订单列表筛选语义化（少 UUID 默认暴露） | ✅ | B | — |
| 6.2 | ADM-UX-OPS-02 | 争议详情时间线/状态机图示 | ✅ | C | — |
| 6.3 | ADM-UX-OPS-03 | 用户详情：角色/控制台角色/收购 suspend 分区 | ✅ | B | — |
| 6.4 | ADM-UX-OPS-04 | 向导列表与 market 子站数据口径说明 | ✅ | C | — |

### 7 · 社区治理

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 7.1 | ADM-UX-COM-01 | 举报列表：业务副标题 + 面包屑 + 相关页折叠 | ✅ | C | — |
| 7.2 | ADM-UX-COM-02 | 举报 **处置抽屉/向导**（步骤：状态→备注→可选处罚） | ✅ | A | — |
| 7.3 | ADM-UX-COM-03 | 表格列本地化（reason_code 中英对照表） | ✅ | A | — |
| 7.4 | ADM-UX-COM-04 | 已应用筛选 JSON 改为人类可读摘要 | ✅ | A | — |
| 7.5 | ADM-UX-COM-05 | 申诉复核/处罚台账与举报工单交叉链接 | ✅ | C | — |
| 7.6 | ADM-UX-COM-06 | 其余社区子页套用 `AdminCommunitySubnav` | ✅ | C | — |

### 8 · 入驻与 Onboarding

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 8.1 | ADM-UX-ONB-01 | `/admin/onboarding` 枢纽卡片 | ✅ | — | — |
| 8.2 | ADM-UX-ONB-02 | 权益详情写操作与审批链提示 | ✅ | B | — |
| 8.3 | ADM-UX-ONB-03 | Webhook/DLQ 页运维向文案降噪 | ✅ | D | — |
| 8.4 | ADM-UX-ONB-04 | 准入费/Stripe ② 真 webhook 状态回显 | ❌ | E | **②**（① payload `stripe_echo` + `extractWebhookStripeEcho`） |

### 9 · 权限中心 / RBAC / 2FA

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 9.1 | ADM-UX-RBAC-01 | capabilities 驱动首页/Shell 过滤 | ✅ | — | — |
| 9.2 | ADM-UX-RBAC-02 | `/admin/permissions` 角色变更 **审批流** UI | ✅ | A | — |
| 9.3 | ADM-UX-RBAC-03 | 2FA 策略面板 + TOTP 注册流程人话指引 | ✅ | A | — |
| 9.4 | ADM-UX-RBAC-04 | 六角色矩阵预览 vs 当前角色差异高亮 | ✅ | B | — |
| 9.5 | ADM-UX-RBAC-05 | ② Staging 六角色 Shell 矩阵 Playwright | ❌ | E | **②**（① session + DB role e2e 预备） |
| 9.6 | ADM-UX-RBAC-06 | ③ 生产 2FA 强制 + 无 `ROLE_DIRECT` | ❌ | F | **③**（① `AdminPermissionsProductionSafetyPanel` + `console_role_direct_allowed`） |
| 9.7 | ADM-UX-RBAC-07 | 危险写 **L5 二次确认**（禁 `window.confirm` · 20 面） | ✅ | A | — |

### 10 · 资金 / 审计 / 合规 / 配置（只读为主）

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 10.1 | ADM-UX-FIN-01 | `/admin/finance-suite` 七件套枢纽 | ✅ | — | — |
| 10.2 | ADM-UX-FIN-02 | 财务七件套 **页内** ② 深度（非仅链接） | ❌ | F | **② / ③**（① 枢纽 + 七主模块 + **旁路 7 项** partial 工作台已接线） |
| 10.6 | ADM-UX-FIN-06 | 旁路区 **可折叠**（运维旁路 · 默认展开 · 7 项 grid） | ✅ | D | — |
| 10.7 | ADM-UX-FIN-07 | 枢纽 **去重**：主模块卡 → 快速 partial（折叠）→ 旁路区锚点 | ✅ | D | — |
| 10.3 | ADM-UX-AUD-01 | 审计日志检索：按操作类型/条数预设 | ✅ | D | — |
| 10.4 | ADM-UX-CMP-01 | DSAR 合规请求工作台流程 | ✅ | D | **②**（Staging 深度验） |
| 10.5 | ADM-UX-CFG-01 | Flags/Secrets 发布与审批叙事一致 | ✅ | D | **②**（真发布链） |

### 11 · 诚实边界 / 数据与错误态

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 11.1 | ADM-UX-HON-01 | Inbox/KPI 非全库 KPI 文案 | ✅ | — | — |
| 11.2 | ADM-UX-HON-02 | capabilities 503/未登录 不误报权限 | ✅ | — | — |
| 11.3 | ADM-UX-HON-03 | 列表 API 失败分 login/forbidden/5xx 文案 | ✅ | B | — |
| 11.4 | ADM-UX-HON-04 | 空态引导「下一步去哪」 | ✅ | B | — |
| 11.5 | ADM-UX-HON-05 | 列表/详情 **SWR 90s** + 概况缓存 + auth 失效 | ✅ | B | — |

### 12 · i18n / a11y / 机读

| # | ID | 清单项 | 状态 | 批次 | 未完成应在哪阶 |
|---|-----|--------|------|------|----------------|
| 12.1 | ADM-UX-A11Y-01 | 首页/队列 focus 环与 44px 触达 | ✅ | B | — |
| 12.2 | ADM-UX-A11Y-02 | 表格 thead/aria-sort/处置按钮 aria-label | ✅ | C | —（无 sortable 列 · aria-sort N/A） |
| 12.3 | ADM-UX-A11Y-03 | 中英文案 key 成对（zh/en）新 UX 键 | ✅ | A | — |
| 12.4 | ADM-UX-CI-01 | `run-admin-l5-green.sh` 随 UX 变更扩展 contract | ✅ | B | — |
| 12.5 | ADM-UX-CI-02 | ② `record-phase2-admin-adm-u01-then-u02` | ❌ | E | **②**（① `generate-phase2-admin-closure-skeleton.sh` NOT_MET 骨架） |
| 12.6 | ADM-UX-A11Y-04 | ⌘K 提示 **`<kbd>`** 语义 chip | ✅ | Vis-P2 | — |
| 12.7 | ADM-UX-A11Y-05 | 模块折叠 summary 字色统一 **`ADMIN_TEXT_BODY_CLASS`** | ✅ | Vis-P2 | — |
| 12.8 | ADM-UX-A11Y-06 | 聚焦条 vs 待办卡 **aria 计数去重** | ✅ | Vis-P2 | — |
| 12.9 | ADM-UX-CI-03 | ① 手跑 smoke **M-01～M-03**（RBAC · ADM-U02 · 页面 HTTP） | ✅ | A | — |

---

## 建议首批实施（Batch A · 你截图中的痛点）

| 顺序 | ID | 做什么 | 产出 |
|------|-----|--------|------|
| 1 | ADM-UX-QUEUE-03/04 | 重做 **审批列表+详情** L5 | 待批 11 条可逐条批/驳回 |
| 2 | ADM-UX-COM-02 | 举报 **处置向导** | 社区页不再「看不懂处置」 |
| 3 | ADM-UX-IA-03 | 一页 **管理员操作手册**（链到 README） | 团队共识动线 |
| 4 | ADM-UX-HOME-05 | 首页卡片 **搜索** 或「常用 6 项」 | 减少卡片墙焦虑 |
| 5 | ADM-UX-RBAC-03 | 权限页 2FA 步骤条 | 与 API 强制策略对齐说明 |

**Batch A ① 验收：** 维护者用 `tourist@test.com`（SuperAdmin）在 30 分钟内完成：登录 → 首页待办 → 批 1 条审批 → 处置 1 条举报 → 权限页查看能力。

---

## 与现有台账关系

| 文档 | 用途 |
|------|------|
| [`ADMIN-L5-AUDIT-TASKS.md`](ADMIN-L5-AUDIT-TASKS.md) | ① 已闭 API/RBAC/门闸 **勾选** |
| [`ADMIN-L5-PHASE-GAP-TASK-LIST.md`](ADMIN-L5-PHASE-GAP-TASK-LIST.md) | ①②③ 缺口总表 · M-01～M-03 smoke |
| [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) | 系统概况 **代码真源** |
| **本文档** | UX/产品 **分批 backlog**；做完一项把状态改为 ✅ 并注明批次 |
| [`ADM-U02-PHASE2-CLOSURE.md`](ADM-U02-PHASE2-CLOSURE.md) | ② 权限/2FA/审批 **Staging 闸** |
| [`docs/spec/70-管理员系统开发文档.md`](../../../docs/spec/70-管理员系统开发文档.md) | 契约真源（③ 深度） |

---

## 一句话结论

**① Admin 工作台 L5 ① 阶段满分** — 企业审计 **ADM-P0-01～P1-10 已清零**（[`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](TT-ADMIN-PHASE1-FULL-CLOSURE.md) · `run-admin-l5-green.sh` · M-01～M-03）；**②** Staging 六角色矩阵 / 真 webhook / 财务页内深度仍另闸 · **须 G-1/G-2 后开工**。
