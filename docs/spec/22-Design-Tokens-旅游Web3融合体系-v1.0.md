# Design Tokens + UI 数值体系（旅游 + Web3 融合版）v1.0

**Version:** 1.0  
**目标**：旅行有情绪、Web3 有可信度、视觉统一、金融区绝对克制；前端可直接按本文实现。与 [13-协议级UI设计宪法](13-协议级UI设计宪法.md)、[21-UI-3D-旅游Web3融合规范-v1.0](21-UI-3D-旅游Web3融合规范-v1.0.md) 一致；21 定「规则与等级」，本文定「可落地的 Token 与数值」。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

---

## 一、品牌风格定位（定稿）

我们定义这个风格叫：**Gentle Tech Travel**。

- **不是**：赛博朋克、极简黑白、炫技 3D  
- **是**：温和科技 + 空间旅行感 + 金融可信  

---

## 二、颜色体系（完整可实现）

分两条主轴。

### 1️⃣ Travel Axis（情绪轴）

**用于**：Landing、Discover、Itinerary、图片叠层、轻视觉区域。

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
| Discover 卡片 | 16px |
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
| **Landing** | fade in | 0.6s ease |
| | hero parallax | translateY(6px) |
| | 3D rotation | max 3deg |
| **Discover** | 卡片 hover scale | 1.02 |
| | 阴影增加 | 10% |
| **Escrow** | opacity transition | 0.2s |
| | height collapse | 0.25s |
| | button loading spinner | 允许 |

**Escrow 禁止**：数字跳动、金额放大动画、发光。

与 [21](21-UI-3D-旅游Web3融合规范-v1.0.md) §5 一致。

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
