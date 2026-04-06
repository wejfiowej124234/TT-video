# Design Tokens + UI 数值体系（旅游 + Web3 融合版）v1.0

**Version:** 1.0.6  
**目标**：旅行有情绪、Web3 有可信度、视觉统一、金融区绝对克制；前端可直接按本文实现。与 [13-协议级UI设计宪法](13-协议级UI设计宪法.md)、[21-UI-3D-旅游Web3融合规范-v1.0](21-UI-3D-旅游Web3融合规范-v1.0.md) 一致；21 定「规则与等级」，本文定「可落地的 Token 与数值」。**Experience 视觉 SSOT** 为 **[86-UI-双系统未来风-风格与动效技术规格](86-UI-双系统未来风-风格与动效技术规格.md)**；**色谱须映射进本文变量名**（**§一点五**），**禁止**长期双轨 Hex。**Cinematic 叙事与 `/market` 结构** 见 [28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md)。**迭代口径**：**86→22 的映射落地**默认指 **只调整 Token 与样式类**，**不**作为改动页面功能、API 或路由的理由（与 **[86](86-UI-双系统未来风-风格与动效技术规格.md)** 篇首 **「定稿口径」** 一致；工程门禁另见 **[07](07-开发流程与顺序.md)** **§五 5.3**）。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **Travel/Trust 色板与 CSS 变量** | **§二** |
| **字体、间距、圆角、阴影** | **§三～§六** |
| **按钮体系** | **§七** |
| **动效 duration/easing 数值** | **§八** |
| **3D 与页面分区等级** | **§九、§十** |
| **工程落点（tailwind/globals）** | **[23 §一](23-UI交付物-Figma-Landing-Escrow模板.md)**、**[34](34-前端组件与Design-Tokens落地清单.md)** |
| **86 色谱 → 本文变量映射** | **§一点五** |

---

## 一点五、与 86 的 Token 映射（唯一赋值入口 · 禁止双轨）

与 **[86 §0.3 规则 2](86-UI-双系统未来风-风格与动效技术规格.md)**、**86 篇首「定稿口径」**（风格与表现层 vs 功能边界）一致：

1. **所有颜色只在** `globals.css`（或项目选定的单一令牌源）**赋值**；Tailwind / 组件 **只引用本文已定义的键名**，不散落裸 Hex；**优先**通过改变量完成「换肤」，避免为配色改版去改业务分支逻辑。  
2. **Experience / Travel 情绪轴**：将 **86 §2.1** 主色映射到 **`--travel-500` / `--travel-400` / `--travel-300`**（示例：以 **`#38BDF8`** 作为 **`--travel-500`** 锚点，梯度可重算）；**`--bg-main`** 等与 **`#F8FAFC`** 对齐。  
3. **Trust 轴（银行级控制台）语义不变**：**`--trust-500`～`--trust-700`** **不得**整体替换为高饱和蓝紫；Escrow / 订单控制台 **仍** 用深灰/暗底语义。  
4. **86 的 Web3 强调色（如 `#3B82F6`、`#8B5CF6`）** 用于 **Experience 渐变主 CTA** 时：在本文/代码中 **增设** **`--cta-gradient-start`**、**`--cta-gradient-end`**（或等价命名），**单独** 赋值；**不占用** `--trust-*`。  
5. **Protocol Dark 底**：**`--bg-dark-console` / `--trust-700`** 可与 **86 §2.2** 的 **`#0B0F1A` / `#111827`** 对齐，**一次**改写入表并留变更记录。

---

## 一、品牌风格定位（定稿）

我们定义这个风格叫：**Gentle Tech Travel**。

- **不是**：赛博朋克、极简黑白、炫技 3D  
- **是**：温和科技 + 空间旅行感 + 金融可信  

---

## 二、颜色体系（完整可实现）

分两条主轴。

### 1️⃣ Travel Axis（情绪轴）

**用于**：Landing、**`/market`**（含原 Discover 列表心智）、**`/discover` 短停**、Itinerary、图片叠层、轻视觉区域。

**主色（Travel Primary）**：
```css
--travel-500: #2E6FFF;
--travel-400: #4C82FF;
--travel-300: #7EA3FF;
```
「天空蓝」，有旅行感但不霓虹。

**辅助渐变（仅 Hero 可用）**：
```css
linear-gradient(135deg, #2E6FFF 0%, #00B3A4 100%);
```
**禁止进入 Escrow 页面。**

---

### 2️⃣ Trust Axis（金融轴）

**用于**：Escrow、Dispute、Governance、Signature Modal。

**主色（Trust Primary）**：
```css
--trust-500: #1F2937;   /* 深灰蓝 */
--trust-600: #111827;
--trust-700: #0B1220;
```
金融区必须偏冷、偏深。

---

### 3️⃣ 状态色（统一语义）

```css
--success: #16A34A;
--warning: #F59E0B;
--danger:  #DC2626;
--info:    #2563EB;
```

**规则**：只用于状态；不用于装饰；不做渐变。

---

### 4️⃣ 背景层级（空间感）

```css
--bg-main:         #F9FAFB;
--bg-soft:         #F3F4F6;
--bg-console:      #FFFFFF;
--bg-dark-console: #0F172A;
```

---

## 三、字体体系（两套节奏）

### 1️⃣ 标题字体

**建议**：Inter、SF Pro、或 Manrope。

**尺寸体系**：

| 用途 | 尺寸 / 行高 |
|------|-------------|
| H1 | 48px / 56px |
| H2 | 36px / 44px |
| H3 | 28px / 36px |
| H4 | 22px / 30px |
| Body-L | 18px |
| Body | 16px |
| Small | 14px |
| Meta | 12px |

### 2️⃣ 金融区特殊规则

- **金额展示**：`font-weight: 600`；`letter-spacing: -0.5px`  
- **地址 / txHash**：`font-family: monospace`；`font-size: 13px`；`opacity: 0.7`  

---

## 四、间距系统（8px Grid）

```
4px / 8px / 16px / 24px / 32px / 48px / 64px / 96px
```

**规则**：
- 页面 padding ≥ 32px  
- Escrow 主面板内部间距 ≥ 24px  
- 卡片之间 ≥ 24px  

---

## 五、圆角系统（必须分级）

```css
--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 20px;
--radius-xl: 32px;
```

**使用规则**：

| 区域 | 圆角 |
|------|------|
| Landing 卡片 | 20px |
| 自由市场订单卡（`/market`） | 16px |
| Escrow 面板 | 12px |
| Signature Modal | 16px |

---

## 六、阴影系统（避免炫）

```css
--shadow-soft:   0 4px 12px rgba(0,0,0,0.06);
--shadow-medium: 0 8px 24px rgba(0,0,0,0.08);
--shadow-strong: 0 16px 40px rgba(0,0,0,0.12);
```

**规则**：
- Experience 可以 medium  
- Escrow 只能 soft  
- **禁止发光边框**  

---

## 七、按钮体系（非常关键）

### 1️⃣ 主按钮（Experience）

- `background: var(--travel-500)`  
- `color: white`  
- `radius: 12px`  
- `hover: brightness(1.05)`  

### 2️⃣ 主按钮（Escrow 金融区）

- `background: var(--trust-500)`  
- `color: white`  
- `radius: 8px`  
- `hover: opacity(0.92)`  

### 3️⃣ 危险按钮

- `background: var(--danger)`  

---

## 八、动效规范（数值级）

| 区域 | 允许 | 数值/说明 |
|------|------|-----------|
| **全站 切换/响应** | 可感知反馈 | **≤200ms** 内必有视觉反馈（路由、Tab、抽屉、弹窗、视图切换）；见 [13](13-协议级UI设计宪法.md) 第7条、[52](52-阶段开发技术文档.md) §7.5。 |
| **Landing** | fade in | 0.6s ease |
| | hero parallax | translateY(6px) |
| | 3D rotation | max 3deg |
| **Discover** | 卡片 hover scale | 1.02 |
| | 阴影增加 | 10% |
| **Escrow** | opacity transition | 0.2s |
| | height collapse | 0.25s |
| | button loading spinner | 允许 |

**可感知响应时间**：所有 UI/UX 的响应与切换（路由、Tab、抽屉、弹窗、视图切换）必须在 **200ms 内**完成可感知的展示；数据加载可滞后，但「系统已响应」的视觉确认不可延迟。

**Escrow 禁止**：数字跳动、金额放大动画、发光。**例外**：订单/Escrow 详情页内**协议控制台区**（53 阶段）以 [53+30-DID](53-阶段开发技术文档.md) 为准，允许 30-DID §4 规定的轻量光晕、边框高亮，仍禁止金额数字跳动与强闪烁。

与 [21](21-UI-3D-旅游Web3融合规范-v1.0.md) §5、[13](13-协议级UI设计宪法.md) 第7条 一致。

---

## 九、3D 风格落地规则

**允许主题**：地球轨迹线、抽象路径光线、柔和粒子流、旅行航线弧线。

**材质规则**：哑光、低反射、无高光金属。

**交互限制**：鼠标轻微偏移；不可拖拽、不可旋转。

与 [21](21-UI-3D-旅游Web3融合规范-v1.0.md) §6 一致。

---

## 十、页面分区强制视觉等级

| 页面 | 情绪 | 科技 | 严肃 |
|------|------|------|------|
| Landing | 高 | 中 | 低 |
| Discover | 高 | 低 | 低 |
| Itinerary | 中 | 低 | 低 |
| OrderFlow | 低 | 中 | 中 |
| Escrow | 低 | 中 | **高** |
| Dispute | 低 | 低 | **高** |

---

## 十一、UI 风格定位总结

**你做的不是**：旅游电商、也不是 DeFi 控制台。

**而是**：**有情绪的可信协议产品**。

与 [13](13-协议级UI设计宪法.md)、[21](21-UI-3D-旅游Web3融合规范-v1.0.md) 一致；实现时可直接将本文 Token 写入 CSS 变量或主题文件。

---

*本文与 [13-协议级UI设计宪法](13-协议级UI设计宪法.md)、[21-UI-3D-旅游Web3融合规范-v1.0](21-UI-3D-旅游Web3融合规范-v1.0.md)、[05-前端总览](05-前端总览.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
