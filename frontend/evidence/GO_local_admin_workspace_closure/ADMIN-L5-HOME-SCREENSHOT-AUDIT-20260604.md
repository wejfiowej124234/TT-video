# Admin 首页 `/admin` · 截图 L5 视觉审计（2026-06-04 · ①）

**阶段口径：** **① 本地** → **② 测试网** → **③ 生产**

**截图条件：** `super_admin` · Shell 预览 · 聚焦待办（社区举报 78）· 经营快照折叠 · 侧栏社区 badge 78  
**证据图：** 用户走查截屏 2026-06-04（`super_admin` · 社区举报 78 聚焦场景；见会话附件）

| 项 | 结论 |
|----|------|
| **有没有收口（① 机读）** | **是** — `run-admin-l5-green.sh` exit 0 |
| **有没有 UI 冻结** | **否** — Admin 非五主；本审计为 **续扫 backlog** |
| **L5 目视是否达标** | **是（① 满分 · Vis-P0–P2 + companion/dedup 2026-06-04 续）** |

**诚实边界：** ① 绿集 **≠** ② staging 六角色验色 **≠** ③ Production GO。

---

## 总表（截图维度）

| 维度 | 结论 | 优先级 |
|------|------|--------|
| **字体层级** | 页头 hero 与区块标题差阶不足；`text-meta` 诚实 footnote 偏小 | P1 |
| **字色 / 对比度** | `ADMIN_TEXT_MUTED`（slate-400）在深底 footnote 贴 AA 下限 | P0 |
| **靠色（同色叠）** | 暖金 gradient 数字 + ref-sun 描边 + 橙金 CTA + 侧栏 badge 同屏四重 | P0 |
| **排版 / 套盒** | WarmL5 → focus inset → pending card 四层边框；首屏 chrome 占比过高 | P1 |
| **CTA 一致性** | 「打开收件箱」inline vs 「去处理」全宽 — 双 primary 扫视感 | P1 |
| **计数语义** | 78 在侧栏 badge / 聚焦条 / 队列大卡 / 动线 chip 重复出现 | P2 |
| **a11y** | ⌘K 提示无 `<kbd>`；折叠 summary 字色 token 分叉 | P2 |

---

## 清单（# | ID | 问题 | 状态 | 建议改法 | 未完成应在哪阶）

### A · 靠色与对比度（P0）

| # | ID | 问题描述 | 状态 | 建议改法 | 阶 |
|---|-----|----------|------|----------|-----|
| A1 | ADM-UX-VIS-10 | **Muted 字色贴 WCAG AA 下限** | ✅ | `ADMIN_TEXT_META` + `text-small` | — |
| A2 | ADM-UX-VIS-11 | **暖金家族靠色** | ✅ | outline 徽标 · focus outline CTA | — |
| A3 | ADM-UX-VIS-12 | **聚焦条 + 队列卡双 hero 数字** | ✅ | 聚焦条无 badge · 侧栏 focus dedupe | — |

### B · 字体与层级（P1）

| # | ID | 问题描述 | 状态 | 建议改法 | 阶 |
|---|-----|----------|------|----------|-----|
| B1 | ADM-UX-VIS-13 | **标题差阶** | ✅ | focus compact header | — |
| B2 | ADM-UX-VIS-14 | **数字 scale ≤ h2** | ✅ | hero + KPI cap | — |
| B3 | ADM-UX-VIS-15 | **合规句 text-small** | ✅ | `ADMIN_TEXT_FOOTNOTE_CLASS` | — |

### C · 排版与信息架构（P1）

| # | ID | 问题描述 | 状态 | 建议改法 | 阶 |
|---|-----|----------|------|----------|-----|
| C1 | ADM-UX-VIS-16 | **套盒过深** | ✅ | focus flat section + compact | — |
| C2 | ADM-UX-VIS-17 | **首屏 chrome 堆叠** | ✅ | compact header + defer preview | — |
| C3 | ADM-UX-VIS-18 | **侧栏 badge 对齐 + icon** | ✅ | 橙点 dedupe · `AdminShellNavIcon` | — |
| C4 | ADM-UX-VIS-19 | **KPI embedded 配重** | ✅ | accent bar + compact | — |

### D · CTA 与交互一致性（P1–P2）

| # | ID | 问题描述 | 状态 | 建议改法 | 阶 |
|---|-----|----------|------|----------|-----|
| D1 | ADM-UX-VIS-20 | **单 primary CTA** | ✅ | focus outline「去处理」 | — |
| D2 | ADM-UX-VIS-21 | **动线 chip 无 badge pill** | ✅ | plain tabular | — |
| D3 | ADM-UX-VIS-22 | **78 计数 dedupe** | ✅ | hero 唯一 · 侧栏橙点 | — |

### E · a11y / i18n（P2）

| # | ID | 问题描述 | 状态 | 建议改法 | 阶 |
|---|-----|----------|------|----------|-----|
| E1 | ADM-UX-A11Y-04 | ⌘K `<kbd>` | ✅ | `ADMIN_COMMAND_PALETTE_KBD_CLASS` | — |
| E2 | ADM-UX-A11Y-05 | 折叠 title token | ✅ | `ADMIN_TEXT_BODY_CLASS` | — |
| E3 | ADM-UX-A11Y-06 | 重复播报 | ✅ | 侧栏橙点 sr-only · 大卡 aria | — |

### F · 系统概况 · 数据诚实（P0 · 2026-06-05 代码已闭）

| # | ID | 问题描述 | 状态 | 代码锚点 | 阶 |
|---|-----|----------|------|----------|-----|
| F1 | ADM-UX-SOV-01 | memory 源仍标「全库」 | ✅ | `isAdminHomeMetricsPostgresSource` · i18n `users_memory` | — |
| F2 | ADM-UX-SOV-02 | 趋势图 invalid HTML / 字号过小 | ✅ | `AdminHomeSystemOverviewTrends` · grid 移出 `<ul>` · `text-small` | — |
| F3 | ADM-UX-SOV-03 | 「控制台角色（70）」误导 | ✅ | `console_roles_heading` · assignee total | — |
| F4 | ADM-UX-SOV-04 | 聚焦模式概况过高 | ✅ | `AdminHomeCollapsibleSection` compact · 隐藏 trends | — |
| F5 | ADM-UX-SOV-05 | 78 双重强调 | ✅ | `emphasizeInboxPending` + `focusInbox` | — |
| F6 | ADM-UX-SOV-06 | 概况无缓存 | ✅ | `adminHomeOverviewFetchCache` | — |

**代码真源详表：** [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md)

---

## 代码锚点（改时优先）

| 区域 | 文件 / token |
|------|----------------|
| 页头标题 | `AdminHomeClient.tsx` · `ADMIN_WORKSPACE_TITLE_CLASS` |
| 待办聚焦 | `AdminHomeInboxStrip.tsx` · `ADMIN_INBOX_FOCUS_*` · `ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS` |
| 动线 chip | `AdminInboxWorkflowQuickNav.tsx` · `ADMIN_INBOX_WORKFLOW_CHIP_*` |
| KPI 折叠 | `AdminHomeKpiStrip.tsx` · `embedded` · `ADMIN_KPI_SCOPE_NOTE_CLASS` |
| 侧栏 badge | `AdminShellSidebar.tsx` · `ADMIN_PENDING_COUNT_BADGE_CLASS` |
| **系统概况** | `AdminHomeSystemOverview.tsx` · `adminHomeSystemOverviewMetrics.ts` · `useAdminHomeSystemOverview.ts` |
| 字色 remap | `globals.css` · `[data-tt-admin-warm-l5-surface]` · `[data-tt-admin-zone-content-stack]` |
| Token SSOT | `frontend/lib/adminUi.ts` |

---

## 建议实施批次（① · 仅文档登记；代码另 PR）

| 批次 | ID 范围 | 目标 | 验收 |
|------|---------|------|------|
| **Vis-P0** | A1–A3 | 靠色降噪 + footnote 可读 | 截图同场景人工走查 + `run-admin-l5-green.sh` |
| **Vis-P1** | B1–B3, C1–C2, D1 | 套盒减层 + 标题/数字层级 + 单 primary | 聚焦待办 78 场景截图对比 |
| **Vis-P2** | C3–C4, D2–D3, E1–E3 | 侧栏对齐 + a11y + 计数 dedupe | Playwright ① 可选；a11y spot check |

---

## 与台账关系

| 文档 | 用途 |
|------|------|
| [`70 §3.0.1`](../../../docs/spec/70-管理员系统开发文档.md#301-首页-l5-视觉审计清单-2026-06-04--①) | 契约级检查项（已闭 + 本审计 **续增**） |
| [`70 §3.0.2`](../../../docs/spec/70-管理员系统开发文档.md) | 系统概况数据链 · L5 confirm · SWR（2026-06-05） |
| [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) | 系统概况代码真源 |
| [`ADMIN-L5-FULL-AUDIT-BACKLOG.md`](ADMIN-L5-FULL-AUDIT-BACKLOG.md) | UX backlog 状态同步 |
| [`ADMIN-L5-PHASE1-VIS-CLOSURE.md`](ADMIN-L5-PHASE1-VIS-CLOSURE.md) | ① 机读收口（**不**因本审计回退） |

---

## 一句话结论

**① 机读已绿，截图 Vis-P0–P2 + companion/dedup/icon/footnote 已全部 ✅（2026-06-04 满分续轮）。** ② 全子路由验色与六角色矩阵仍另闸。
