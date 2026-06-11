# 22-补充：Design Tokens 完整实装映射 (v1.0 + 代码验证) 

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **22 主规范** | **[22-Design-Tokens-旅游Web3融合体系-v1.0](../22-Design-Tokens-旅游Web3融合体系-v1.0.md)** |
| **globals.css / tailwind 对照** | **§一** 起各 Token 节 |
| **与 Experience/Business/资金区** | **[86](../86-UI-双系统未来风-风格与动效技术规格.md)**（分区；**风格-only** 边界见篇首 **定稿口径**）、**[28](../28-Cinematic-Glassmorphism-Web3融合规范.md)**（叙事/组件）、**[29](../29-自由市场-撮合控制台规范.md)**、**[13](../13-协议级UI设计宪法.md)**、**[13-1](../13-1-UI产品级SSOT与页面规范.md)** |
| **`/` + `/market` 四页 ① 数据链** | **[LANDING-MARKET-PAGES-CODE-SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2～§3（**非** Token 键名与 **`useMarketPage`** 行为 SSOT 替代） |

**目的**：对齐 22-Design-Tokens-旅游Web3融合体系 v1.0 与前端代码实装（frontend/），确保所有Token的定义、映射、应用均100%准确。

**基础**：22 v1.0 已定稿；本补充基于 frontend/globals.css、tailwind.config.ts 的**实际代码扫描**。

**维护责任**：前端团队；22文档更新时应同步本补充。

**文档版本**：v1.0.4（2026-03-30；**86** 定稿口径互链；**22** 主规范 **1.0.6**）

---

## 一、Neutral色板（缺失项 - 需补充到22 §二.0）

### 1.1 完整定义（与tailwind.config.ts一致）

```css
:root {
  --ink-900:  #0B1220;   /* 最深，用于主文本 */
  --ink-800:  #111827;   /* 深文本 */
  --ink-700:  #1F2937;   /* 副标题、label（与--trust-500同）*/
  --ink-600:  #374151;   /* 次级文本 */
  --ink-500:  #4B5563;   /* 次级文本 medium */
  --ink-400:  #6B7280;   /* 占位符、disabled */
  --ink-300:  #9CA3AF;   /* 浅文本、边框提示 */
  --ink-200:  #E5E7EB;   /* 浅边框、分割线 */
  --ink-100:  #F3F4F6;   /* 浅背景（与--bg-soft同）*/
  --ink-50:   #F9FAFB;   /* 最浅背景（与--bg-main同）*/
}
```

### 1.2 Tailwind映射

```javascript
// tailwind.config.ts extend.colors
ink: {
  900: "#0B1220",
  800: "#111827",
  700: "#1F2937",
  600: "#374151",
  500: "#4B5563",
  400: "#6B7280",
  300: "#9CA3AF",
  200: "#E5E7EB",
  100: "#F3F4F6",
  50:  "#F9FAFB",
}
```

### 1.3 实际应用（代码中已见）

- `text-ink-900` → 主标题、主文本
- `text-ink-700` → 副标题、表单label
- `text-ink-500` → 次级说明
- `text-ink-400` → 占位符、禁用状态
- `border-ink-200` / `border-ink-300` → 边框、分割线
- `bg-ink-50` / `bg-ink-100` → 轻微背景

### 1.4 补充到22的建议措辞

在 **§二 颜色体系** 中，紧接 "分两条主轴" 之前添加：

> ### 0️⃣ Neutral（中性色板 - 与 ink 色阶一致）
>
> **用于**：文本、背景、边框、禁用、辅助信息。与 frontend/tailwind.config.ts 扩展色彩一致。
>
> 完整色阶：ink-50 (#F9FAFB) ~ ink-900 (#0B1220)，10 级精细控制。
> - 文本主色：ink-900/800
> - 文本副色：ink-700/600
> - 占位符：ink-400
> - 边框：ink-200/300
> - 轻背景：ink-50/100

---

## 二、状态色补充应用场景（缺失项 - 需补充到22 §二.3）

### 2.1 代码实装状态

```css
:root {
  --success: #16A34A;
  --warning: #F59E0B;
  --danger:  #DC2626;
  --info:    #2563EB;
}
```

### 2.2 Tailwind映射

```javascript
success: "var(--success)",
warning: "var(--warning)",
danger:  "var(--danger)",
info:    "var(--info)",
```

### 2.3 应用场景（补充到22）

| 状态 | 颜色 | 应用场景 |
|------|------|---------|
| Success | `--success` #16A34A | ✅订单确认、支付完成、表单验证通过、操作成功 |
| Warning | `--warning` #F59E0B | ⚠️ 待确认状态、接近期限、非关键提示、审核中 |
| Danger | `--danger` #DC2626 | ❌错误提示、删除操作、支付失败、争议中、超时 |
| Info | `--info` #2563EB | ℹ️ 信息提示、链接、选中状态、新增标记 |

### 2.4 禁止规则

- **不用于装饰**：仅用于状态表示
- **不做渐变**：只用 solid 色
- **Escrow区必须谨慎**：success/danger清晰，warning谨慎，禁止neon/glow

---

## 三、Sci-Fi 赛博Token（新增项 - 未在22中 - 需关联到22 §二.6）

### 3.1 定义（来自51文档）

```css
:root {
  --scifi-midnight: #1e1b4b;   /* 深紫-午夜 */
  --scifi-cyan:     #0c4a6e;   /* 青蓝-赛博 */
  --scifi-teal:     #134e4a;   /* 青绿-海底 */
  --scifi-canvas:   #050816;   /* 极深黑-画布 */
}
```

### 3.2 实装位置

- **globals.css** ✅ 已定义
- **tailwind.config.ts** ✅ 可扩展
- **应用现状** ✅ 在 Community/DID-Rank 页面使用中

### 3.3 隔离规则

- **禁止区**：Landing、**自由市场（`/market`；含原 Discover 叙事，非赛博主色）**、Escrow、Dispute、Governance
- **仅限区**：Community、Did-Rank（社区赛博风格）
- **原因**：与 Gentle Tech Travel 的 Escrow 金融严肃性冲突

### 3.4 补充到22的建议

在 **§二 颜色体系** 末尾添加：

> ### 6️⃣ Sci-Fi 赛博主题（社区/DID特化 - 与51文档一致）
>
> **可用区**：Community、Did-Rank 页面。
>
> **禁用区**：Landing、**自由市场（`/market`）**、Escrow、Dispute、Governance（保持 Gentle Tech Travel 严肃性）。
>
> 详见 [30-DID排行榜-页面规范](../30-DID排行榜-页面规范.md) 与 [31-TT社区页面设计](../31-TT社区页面设计.md)。

---

## 四、排版Token应用（补充到22 §三 细节）

### 4.1 Tailwind 类名映射

```javascript
fontSize: {
  h1:      ["48px", { lineHeight: "56px", letterSpacing: "-0.02em" }],
  h2:      ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
  h3:      ["28px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
  h4:      ["22px", { lineHeight: "30px", letterSpacing: "-0.01em" }],
  "body-l": ["18px", { lineHeight: "28px" }],
  body:     ["16px", { lineHeight: "26px" }],  // default
  small:    ["14px", { lineHeight: "22px" }],
  meta:     ["12px", { lineHeight: "18px" }],
}
```

### 4.2 实际使用方式

```html
<!-- 标题 -->
<h1 className="text-h1 font-bold text-ink-900">主标题</h1>
<h2 className="text-h2 font-semibold text-ink-800">副标题</h2>
<h3 className="text-h3 font-semibold">小标题</h3>
<h4 className="text-h4 font-semibold">卡片标题</h4>

<!-- 正文 -->
<p className="text-body text-ink-700">正文内容</p>
<p className="text-body-l text-ink-600">长文本段落</p>

<!-- 辅助文本 -->
<span className="text-small text-ink-500">说明</span>
<span className="text-meta text-ink-400">元信息</span>
```

### 4.3 金融区特殊

- **金额显示**：`font-semibold` (600) + `letter-spacing: -0.5px` + monospace
- **地址/Hash**：`font-mono` + `text-13px` + `opacity-70`

---

## 五、按钮完整规范（补充到22 §七 细节）

### 5.1 代码实装（.btn-console）

```css
/* globals.css */
.btn-console {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.btn-console:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.btn-console:active:not(:disabled) {
  transform: translateY(0);
}

.btn-console:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 5.2 Tailwind 组合示例

```html
<!-- Primary (Travel - Experience区) -->
<button class="btn-console rounded-md bg-travel-500 text-white px-4 py-2 font-medium">
  Search / Book
</button>

<!-- Primary (Trust - Escrow区) -->
<button class="btn-console rounded-sm bg-trust-500 text-white px-4 py-2 font-medium">
  Sign Escrow
</button>

<!-- Secondary (Standard) -->
<button class="btn-console rounded-sm border border-ink-300 text-ink-700 px-4 py-2">
  Cancel
</button>

<!-- Danger -->
<button class="btn-console rounded-sm bg-danger text-white px-4 py-2">
  Delete Order
</button>

<!-- Disabled -->
<button class="btn-console rounded-md bg-travel-500 text-white px-4 py-2 disabled:opacity-50">
  Loading...
</button>

<!-- With Focus Ring -->
<button class="btn-console rounded-md bg-travel-500 text-white px-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2">
  Accessible Button
</button>
```

### 5.3 补充到22的建议

在 **§七 按钮体系** 之后，新增小节：

> ### 按钮完整规范（与代码实装一致）
>
> #### 状态变化
> - **Normal**：基础背景，white 文本
> - **Hover**：2px 向上位移，shadow-soft
> - **Active**：回归 normal 位置
> - **Disabled**：opacity 50%，cursor not-allowed
> 
> #### 焦点与无障碍
> - **:focus-visible**：2px outline ring，offset 2px
> - **最小触摸目标**：44×44 px（WCAG 2.5.5）

---

## 六、Motion Token 应用详解（补充到22 §八 细节）

### 6.1 两个核心Class

```css
.motion-main {
  transition-duration: 600ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.motion-sub {
  transition-duration: 250ms;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### 6.2 应用映射

| UI元素 | Duration | Class | 例子 |
|-------|----------|-------|------|
| **页面切换** | 600ms | .motion-main | 路由变更时的navbar过渡 |
| **模态弹出** | 600ms | .motion-main | UnlockModal 显示 |
| **抽屉打开** | 600ms | .motion-main | 详情面板展开 |
| **卡片 hover scale** | 250ms | .motion-sub + transition-transform | OrderCard hover |
| **阴影增加** | 250ms | .motion-sub + transition-shadow | 卡片shadow变化 |
| **折叠展开** | 250ms | .motion-sub + transition-height | 内容collapse |
| **按钮反馈** | 200ms | .btn-console | transform + shadow |
| **输入框focus** | 200ms | 自定义 | border highlight |

### 6.3 代码示例

```html
<!-- Motion main: 整页过渡 -->
<div className="motion-main transition-opacity">
  {/* 页面内容 */}
</div>

<!-- Motion sub: 卡片hover -->
<article className="motion-sub transition-all hover:shadow-medium hover:scale-102">
  {/* 卡片 */}
</article>

<!-- 按钮: btn-console 自带反馈 -->
<button className="btn-console">Click Me</button>
```

### 6.4 可感知响应时间（≤200ms 确认）

与 [13-协议级UI设计宪法](../13-协议级UI设计宪法.md) §7 一致：所有UI变化（路由、Tab、弹窗、视图）必须 **≤200ms内** 给出 **可感知的视觉反馈**。

数据加载可滞后，但"系统已响应"的确认（如进度条出现、内容开始fade-in）不可延迟。

---

## 七、无障碍Token（补充到22 新增§）

### 7.1 焦点环定义（全局）

```css
:focus-visible {
  outline: 2px solid var(--travel-500);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
[tabindex="0"]:focus-visible {
  outline: 2px solid var(--travel-500);
  outline-offset: 2px;
}
```

### 7.2 最小触摸目标（WCAG 2.5.5）

```css
.min-touch {
  min-width: 44px;
  min-height: 44px;
}
```

应用于所有交互元素（button、link、checkbox、radio）。

### 7.3 旧版浏览器支持

- `:focus-visible` → 现代浏览器（Chrome 76+、Firefox 85+）
- Fallback `:focus` → 保留，但outline样式可能改变
- 建议搭配 Accessibility 工具检查（WAVE、Axe）

---

## 八、深色主题支持（补充到22 新增§）

### 8.1 .dark class 定义

```css
.dark {
  --bg-main: #0b1220;
  --bg-soft: #0f172a;
  --bg-console: #0f172a;
  --bg-dark-console: #0b1220;
  --bg-scifi-canvas: var(--scifi-canvas);
}
```

### 8.2 当前应用状态

- **可用性**：framework 已建，应用不完整
- **覆盖页面**：Home page (via tailwind dark: mode class)
- **待完善**：所有其他页面的dark mode适配

### 8.3 推荐实装

```html
<!-- 启用深色模式检测 -->
<html className={isDark ? 'dark' : ''}>
  {/* 内容自动适配 */}
</html>
```

---

## 九、完整Token实装检查清单（辅助表）

使用此表验证代码与文档的一致性：

| 类别 | Token 名 | 文档位置 | CSS/Tailwind映射 | 应用覆盖 | ✅/🟡/🟠 |
|-----|---------|---------|-----------------|---------|----------|
| **颜色-色轴** | Travel-500/400/300 | 22 §二.1 | ✅ 完整 | Landing/Discover | ✅ |
| **颜色-色轴** | Trust-500/600/700 | 22 §二.2 | ✅ 完整 | Escrow/Dispute | ✅ |
| **颜色-状态** | success/warning/danger/info | 22 §二.3+本补充 | ✅ 完整 | 各页 | ✅ |
| **颜色-中性** | ink-900~50 | 本补充§一 | ✅ 完整 | 所有文本 | ✅ |
| **颜色-背景** | bg-main/soft/console/dark | 22 §二.4 | ✅ 完整 | 页面/卡片 | ✅ |
| **颜色-SciFi** | scifi-* | 本补充§三 | ✅ 完整 | Community/DID | ✅ |
| **排版** | h1~meta | 22 §三 | ✅ 完整 | 所有标题 | ✅ |
| **排版-特殊** | 金额/地址 | 22 §三.2 | ✅ 完整 | Escrow显示 | ✅ |
| **圆角** | radius-sm/md/lg/xl | 22 §五 | ✅ 完整 | 卡片/按钮 | ✅ |
| **阴影** | shadow-soft/medium/strong | 22 §六 | ✅ 完整 | 卡片/按钮 | ✅ |
| **按钮** | .btn-console | 22 §七+本补充§五 | ✅ 完整 | 所有按钮 | ✅ |
| **动效-主** | .motion-main (600ms) | 22 §八+本补充§六 | ✅ 完整 | 页面/模态 | ✅ |
| **动效-次** | .motion-sub (250ms) | 22 §八+本补充§六 | ✅ 完整 | hover/collapse | ✅ |
| **焦点** | :focus-visible outline | 本补充§七 | ✅ 完整 | 所有交互元素 | ✅ |
| **无障碍** | .min-touch (44x44) | 本补充§七 | ✅ 完整 | 交互元素 | ✅ |
| **深色** | .dark mode vars | 本补充§八 | ✅ 框架存 | Landing + 待扩展 | 🟡 |
| **3D主题** | Three.js 材质/旋转 | 22 §九 | ✅ 基础 | Landing Hero | ✅ 基础 |
| **i18n** | 所有文案双语 | 05 + 本补充 | ✅ 框架 | 所有页面 | 🟡 60% |

**图例**：✅ = 完全实装，🟡 = 部分实装，🟠 = 缺失

---

## 十、维护指南

### 10.1 当22更新时

1. 更新本补充的关联章节
2. 验证 frontend/globals.css 与 tailwind.config.ts 是否需要同步
3. 检查 [05-前端总览](../05-前端总览.md) 是否需要补充应用说明

### 10.2 当代码更新时

1. 扫描新增的 CSS Variable 或 Token
2. 检查是否需要补充到本文或22文档
3. 更新检查清单表（第九部分）

### 10.3 相关文档链接

- [22-Design-Tokens-旅游Web3融合体系-v1.0](../22-Design-Tokens-旅游Web3融合体系-v1.0.md) ← 主文档
- [13-协议级UI设计宪法](../13-协议级UI设计宪法.md) ← Token应用约束
- [05-前端总览](../05-前端总览.md) ← 前端实现参考
- [86-UI-双系统未来风-风格与动效技术规格](../86-UI-双系统未来风-风格与动效技术规格.md) ← Experience/Business 外观与 **86→22** 映射
- [28-Cinematic-Glassmorphism-Web3融合规范](../28-Cinematic-Glassmorphism-Web3融合规范.md) ← 叙事/组件规范
- [30-DID排行榜-页面规范](../30-DID排行榜-页面规范.md) 与 [31-TT社区页面设计](../31-TT社区页面设计.md) ← SciFi 视觉与场景落点
- [前端代码](../../frontend/) ← globals.css、tailwind.config.ts

---

**版本**：补充 v1.0.3（2026-03-30）  
**基准**：22-Design-Tokens v1.0 + frontend/ 代码扫描  
**维护**：前端团队

*本补充与 [22-Design-Tokens-旅游Web3融合体系-v1.0](../22-Design-Tokens-旅游Web3融合体系-v1.0.md) 配套，详见 [61-前端实现代码扫描与文档对齐](../snapshots/61-前端实现代码扫描与文档对齐-20260306.md)。*
