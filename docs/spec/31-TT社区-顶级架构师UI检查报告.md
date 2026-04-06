# TT社区 · 顶级架构师 UI 检查报告

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **维度结论摘要** | **§一** |
| **细则与建议** | **§二** 起 |
| **主规范 / Tokens** | **[31](31-TT社区页面设计.md)**、**[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**、**[25](25-顶级UI标准-Landing-Discover-Itinerary.md)** |

**视角**：顶级架构师 / 企业级 UI 一致性、无障碍、设计系统、可维护性  
**范围**：TT 社区（/community 及子路由）及与之共享的全局能力（Skip、Layout、Design Tokens）  
**依据**：31 系列规范、05 §9.0.5、WCAG 2.1 AA、22-Design-Tokens、25 极简 UI 规范。

---

## 一、检查维度与结论摘要

| 维度 | 结论 | 说明 |
|------|------|------|
| **设计系统与一致性** | ✅ 良好 | 社区内赛博风统一（cyan/fuchsia/slate）；与全站 Design Tokens 有分工（社区 30 §4 独立色板） |
| **无障碍（WCAG）** | ✅ 良好 | Skip、landmark、aria、焦点、键盘、焦点还原、prefers-reduced-motion 已覆盖；少量增强见 §五 |
| **响应式与安全区** | ✅ 达标 | safe-area-inset-t/b、safe-area-pb、触控 ≥44px、移动/桌面 Tab 与布局适配 |
| **状态与反馈** | ✅ 达标 | 骨架、错误边界、空态、Toast、加载中/失败重试、防连点 |
| **性能与资源** | ✅ 达标 | 图片 lazy、blob 回收、路由 loading；接 API 后需分页与懒加载深化 |
| **国际化** | ✅ 达标 | community_* / common_* 全量；根 layout 的 html lang 固定 zh-CN，见 §五 |
| **可维护性** | ✅ 良好 | 31 文档与实现对应清晰；组件职责单一 |

---

## 二、设计系统与一致性

### 2.1 已达标

- **社区内**：主色 cyan、强调 fuchsia、背景 slate-9xx，圆角（rounded-xl/lg）、边框（border-cyan-500/40）、动效（motion-sub）统一。
- **全站**：Design Tokens（--travel-*、--trust-*、--radius-*、--shadow-*）在 Landing/Escrow/DID 使用；社区采用 Tailwind 的 slate/cyan/fuchsia 与 30 §4 赛博风一致，**有意与主站 token 分工**，无需强行统一。
- **焦点样式**：全局 `:focus-visible` 使用 travel-500；社区内按钮/输入使用 `ring-cyan-400`，风格统一且对比度足够。

### 2.2 建议（可选）

- **设计 token 文档化**：在 22 或 31 中明确「社区色板」为 slate + cyan + fuchsia，与主站 travel/trust 的适用场景，便于后续扩展主题或多品牌。
- **间距尺度**：社区已用 space-y-6、gap-2、px-4 等，与 8px 网格兼容；若需更强约束可引入 spacing token（如 --space-block: 24px）。

---

## 三、无障碍（WCAG 2.1 AA）

### 3.1 已达标

- **跳过链接**：根 layout 提供 `ClientSkipLink` → `#main-content`，焦点可见、z-index 足够。
- **地标**：Feed 用 `<main aria-label={t("community_tab_feed")}>`，顶栏 `<header aria-label>`；子页（我的、帖子、收藏）均有 main/aria。
- **弹窗**：role="dialog"、aria-modal="true"、aria-labelledby/aria-label；打开时焦点入内、关闭时焦点还原；发帖抽屉带焦点陷阱。
- **键盘**：Esc 关闭所有弹层；Tab 在发帖抽屉内循环；按钮/链接可键盘操作。
- **动态内容**：错误条 role="alert" + aria-live="assertive"；字数 aria-live="polite"；提交中 aria-busy。
- **减少动画**：globals.css 中 prefers-reduced-motion 对 did-* 动画与 motion-sub 做了关闭/缩短。

### 3.2 建议（可选）

- **评论/详情抽屉**：可与发帖抽屉一致增加**焦点陷阱**（Tab 在抽屉内循环），优先级低。
- **Feed 列表**：若列表很长，可考虑「加载更多」按钮在加载中加 `aria-busy="true"` 与 `aria-label` 区分「加载更多」与「加载中…」。

---

## 四、响应式与安全区

### 4.1 已达标

- **安全区**：顶栏/底栏 safe-area-inset-t / safe-area-inset-b；列表底部 safe-area-pb；Toast 使用 safe-area-toast-bottom。
- **触控**：主要按钮与可点击区域 min-h/min-w ≥ 44px（发帖、评论、详情、登录、视频返回等已落实）。
- **布局**：Feed 移动端双列网格、桌面单列；Tab 移动底部、桌面顶部；发帖抽屉 max-w-2xl 居中。

### 4.2 建议（可选）

- **超小屏（&lt;360px）**：发帖抽屉顶栏已做小屏仅图标；其余列表/筛选若出现横向挤压可再收窄 padding 或字号。
- **横屏**：当前以竖屏为主；若需支持横屏观看视频，可考虑全屏 API 与安全区在横屏下的复核。

---

## 五、仍可优化项（按优先级）

### P1（建议尽快）

| 项 | 说明 | 状态 |
|----|------|------|
| **根 layout 的 html lang** | LocaleProvider 已在 `useEffect` 中设置 `document.documentElement.lang = LANG_MAP[locale]`（zh→zh-CN、en→en），与中英切换一致。 | ✅ 已实现 |
| **社区 loading 的读屏提示** | loading.tsx 已改为 `role="status"` + `aria-label="Loading"`，读屏可播报加载状态。 | ✅ 已实现 |
| **错误页与 Feed 按钮触控** | 错误边界内「重试」「返回首页」min-h-[44px] + aria-label + focus-visible；Feed「加载更多」min-h-[44px] + aria-label。 | ✅ 已实现 |

### P2（体验增强）

| 项 | 说明 | 状态 |
|----|------|------|
| **评论/详情抽屉焦点陷阱** | 与发帖抽屉一致，Tab 在抽屉内循环，避免焦点逃逸到背后列表。 | ✅ 已实现（CommentDrawer、PostDetailDrawer 增加 containerRef + 同一焦点陷阱逻辑） |
| **「加载更多」加载态** | 点击后短时显示「加载中…」并设 aria-busy、disabled，读屏播报 common_loading。 | ✅ 已实现（feedLoadingMore 态 + 350ms 后恢复） |
| **话题/目的地 pill** | 推荐/关注 Tab、最新/最热、类型、地区、目的地全部按钮已加 focus-visible:ring-2。 | ✅ 已实现 |

### P3（接后端后）

| 项 | 说明 |
|----|------|
| **表单字段错误** | 评论/私信若后端返回字段级错误，需在输入旁展示并 aria-invalid/aria-errormessage。 |
| **视频上传与时长** | 发帖端视频时长与大小校验 + i18n 错误文案。 |

---

## 六、与现有文档对应

- **31-TT社区-企业级检查报告-页面与发帖弹窗**：本报告在其基础上补充**架构师视角**（设计系统、全站一致性、WCAG 汇总、根 layout、loading/error 态）。
- **31-弹窗与页面全方位优化清单**：本报告 §三、§四 与清单 2.4/2.5 一致并做小结。
- **05 §9.0.5**：无障碍、状态与反馈、焦点管理、表单等与本报告 §三、§五 对应。

---

## 七、本次可执行的 Quick Wins（已纳入 P1）

1. **社区 loading.tsx**：增加 `role="status"` 与 `aria-label`（或占位文案「加载中」），去掉整块 `aria-hidden`，使读屏可播报加载状态。
2. **社区 error.tsx**：「重试」「返回首页」按钮增加 `min-h-[44px]`，必要时补 `aria-label`。
3. **Feed「加载更多」**：按钮增加 `min-h-[44px]` 与 `aria-label={t("community_load_more")}`（若与可见文案一致可省略，建议保留便于 SR 区分上下文）。

文档维护：实现或产品变更后同步更新本报告与 31 系列相关文档。
