# `/traveltrust` 首页重设计规格 v6.1.1 — 数字旅游 · Web3 顶尖（视频优先 · 动画撑场 · 极少字）

**阶段：** ① 本地（PI-1）  
**清单：** [issues-phase1-local.md §C](./issues-phase1-local.md#c--traveltrust-首页-ia-重设计-v5)  
**SSOT：** [87 五类角色](../../docs/spec/87-TravelTrust-角色体系技术文档-融合架构版.md) · [22 Gentle Tech Travel](../../docs/spec/22-Design-Tokens-旅游Web3融合体系-v1.0.md) · [86 Experience 动效](../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) · [25 叙事节奏](../../docs/spec/25-顶级UI标准-Landing-Discover-Itinerary.md)  
**85：** 实现以 **本 v5 + §C** 为准；[85 §三](../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) 旧 IA → **PH1-DOC-85** 台账后同步  

---

## 0. 设计目标（三轮审计定稿）

> **让用户 3 秒内感到：这是一个很厉害的数字旅游 Web3 网络——靠大片影像与流畅动效，而不是靠长篇文字或炒币界面。**

| 用户要求 | v5 落地口径（符合本项目） |
|----------|---------------------------|
| **数字旅游** | 五类角色身份（87）+ 旅行/向导/商铺/治理 **实景演示视频** |
| **简洁** | **版面简**：仅 3 段（Hero / 身份剧场 / 收口）；**不是动效简** |
| **尽量多视频** | **5 路视频位**：Hero 背景循环（可选）+ 五类身份主片（必选） |
| **尽量多动画** | **精品动画包**（§4）：入场编排、环境光、Tab/视频转场、Chip/CTA 微动效；**禁止** ICO 式数字跳、地图、代币长文 |
| **少文字** | **全页可见叙事 ≤约 120 汉字**（§5 字数预算）；无教学段落 |
| **Web3 顶尖** | 旅行情绪 + 可信科技（托管/链上）— **用影像与动效表达**，非 DeFi 仪表盘 |
| **体验增强** | 首屏 **1.2s 内** 完成 Hero→剧场入场；默认 **游客**；单手可达 CTA |

**与 v4 差异：** v4 强调「动效少而精、粒子减配」；v5 改为 **「字少、视频多、动画多（但在 86/25 允许范围内且非炒币类）」**。

---

## 1. 信息架构（极简三块 · 无折叠）

```
┌─────────────────────────────────────────────────────────┐
│  [可选] Hero 全宽静音循环视频 / 旅行摄影 + aurora 动画     │
│  LOGO 字标 + H1（≤12 字）+ Tagline（≤18 字）              │
│  [ 规划行程 ]     3×信任 Chip（各≤4 字，带入场动画）        │
├─────────────────────────────────────────────────────────┤
│  sticky：身份 | 开始                                      │
│  ┌──────────┬──────────────────────────────────────────┐│
│  │ 四身份    │  70vh+ 主视频区（当前身份）                 ││
│  │ Tab+图标  │  crossfade 切换 + 底边指示条动画            ││
│  │ +微动效   │  角色名 + 一词 + [ 进入 ]                   ││
│  └──────────┴──────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  全宽 CTA 条（轻 scroll-reveal）+ 页脚链（无法案长文）      │
└─────────────────────────────────────────────────────────┘
```

| `id` | 名称 | 视频 | 文字上限 |
|------|------|------|----------|
| `hero` | 品牌带 | 背景 loop 1 路（`hero-loop.mp4`） | H1+Tagline+3 Chip |
| `roles` | 身份剧场 | **4 路** 角色主片 | 每身份：名+1 词 |
| `start` | 收口 | 无 | CTA 按钮文案 + T2 **一行** |

**删除：** details、17 pill、文字教程、首屏 token/map/stats/demo、Sticky 第二条 CTA、可玩粒子网。

---

## 2. 视频系统（「尽量多视频」）

| 槽位 | 文件 | 说明 | 优先级 |
|------|------|------|--------|
| **V0 Hero 背景** | `public/media/traveltrust/hero-loop.mp4` | 全宽 **静音** loop，cover；无文件则用摄影图+aurora | P1 |
| **V1 游客** | `roles/traveler.mp4` | 规划/下单/托管操作录屏 | **P0** |
| **V2 向导** | `roles/guide.mp4` | 接单履约 | **P0** |
| **V3 商铺** | `roles/provider.mp4` | 供给侧 | **P0** |
| **V4 区域主理人** | `roles/region_steward.mp4` | 治理查看（无认购） | **P0** |

**Env：** `NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP`、`NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_<ROLE>`、`_POSTER_*`

**播放策略：**

- Hero loop：**自动播放 muted loop**（`playsInline`）；reduced-motion → 静态 poster  
- 身份主片：**不自动播**（用户点播放或 Tab 切换后 **fade in 已预载 poster**）；切换 Tab **crossfade 320ms**  
- 性能：仅 **当前 Tab + Hero** 挂载 `<video>`；其余 `preload="none"` + poster  

---

## 3. 字数预算（「少文字」硬指标）

| 区域 | 最多 | 示例 |
|------|------|------|
| H1 | 12 字 | TravelTrust 网络 |
| Tagline | 18 字 | 全球定制游，链上托管可信 |
| 信任 Chip ×3 | 各 4 字 | 托管订金·稳定币·纠纷保障 |
| 每身份 | 名 + 4 字标签 | 游客 · 定制行程 |
| 主/次 CTA | 各 8 字 | 规划行程 / 进入 |
| 页脚 T2 | 1 行 ≤40 字 | 08-4 定稿句 |
| **全页合计** | **≤约 120 汉字**（不含按钮「进入」重复） | 手验可 grep 可见中文 |

**禁止：** `traveltrust_intro` 长段、FAQ 列表、步骤 bullet、代币说明段落。

---

## 4. 动画包（「尽量多动画」· 86/25 合规 · 非炒币）

### 4.1 节奏（全站统一）

| 层级 | 时长 | 缓动 |
|------|------|------|
| 微交互 | **200ms** | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 组件 | **250～300ms** | 同上（`.motion-sub`） |
| 叙事/区块 | **600ms** | 同上（`.motion-main`） |
| 环境 | **8～20s 循环** | aurora / 粒子 / 航线 SVG |

`prefers-reduced-motion`：**关闭** loop、环境粒子、aurora、Tab crossfade、Chip stagger；保留静态海报与可读对比度。

### 4.2 首屏编排（「很厉害」第一印象 · ≤1.2s）

| 顺序 | 时间 | 动画 |
|------|------|------|
| 1 | 0ms | Hero 背景 video/图 **opacity 0→1** 600ms |
| 2 | 100ms | H1 **translateY 12→0** 600ms |
| 3 | 200ms | Tagline fade 400ms |
| 4 | 280ms | 主 CTA scale 0.96→1 250ms |
| 5 | 360ms | Chip **stagger** 80ms×3 |
| 6 | 500ms | `#roles` 剧场外框 **fade-up** 400ms（首屏露边，诱滚动） |

### 4.3 身份剧场（动效密集区）

| 元素 | 动画 |
|------|------|
| Tab 列表 | 选中：**travel 渐变底边** 滑动 200ms；图标 **opacity+scale** |
| Tab 切换 | 视频 **crossfade**；角色名 **slide-up 20px** 300ms |
| 视频框 | 常时 **极弱边框光晕** 呼吸（4s cycle，幅度≤8% opacity） |
| 进入 CTA | hover **brightness + 旅行轴 glow** 200ms；active scale 0.98 |
| 滚动进入 | 剧场 **once** reveal 600ms（不重复 whileInView 风暴） |

### 4.4 环境与 Web3 氛围（数字旅游，非交易所）

| 层 | 动画 | 参数 |
|----|------|------|
| `TravelTrustAmbientCanvas` | 慢速浮点粒子 | opacity **~55%**；`hidden` 暂停；**非**交互 |
| Hero `traveltrust-hero-aurora-*` | CSS 柔光漂移 | 与 **`/`** 旅行摄影气质同系 |
| **航线 SVG**（P1） | 2～3 条曲线 **gradient stroke-dashoffset** 12s loop | 表达「全球网络」，**非**资金流向 |
| 全页 | **极轻 film grain**（CSS noise 3%） | 电影感；reduced-motion 关 |

### 4.5 明确禁止的「假厉害」动画

| 禁止 | 原因 |
|------|------|
| 数字滚动 Stats、价格跳动 | 像交易所 |
| 可点击粒子网、全球地图脉冲 | 抢视频、像 crypto demo |
| 募资倒计时、ROI 条 | 非本项目 |
| 10+ 卡片 whileInView 弹跳 | 廉价 |
| 强蓝紫 ICO glow 主按钮 | 改 22 旅行轴 |

---

## 5. 视觉（顶尖数字旅游 Web3）

- **排版：** H1 大号字重；标签 `text-kicker` 全大写；**无** `text-small` 段落墙  
- **色：** 壳 `#14100d` + travel 渐变 CTA；cyan **仅** Tab 高亮/焦点  
- **视频框：** `min-h-[min(70vh,720px)]` 桌面；移动端 `56vh`；`rounded-2xl` + 轻 vignette  
- **厉害感来源：** 画幅、动效编排、五路影像、流畅切换 — **不是** 信息堆叠  

---

## 6. 组件清单

| 文件 | 职责 |
|------|------|
| `TravelTrustHeroCinematic.tsx` | loop 视频/摄影 + 入场编排 + Chip |
| `TravelTrustIdentityTheater.tsx` | Tab+图标+主视频+转场 |
| `TravelTrustRoleVideoPlayer.tsx` | 懒加载、crossfade、poster |
| `TravelTrustRouteAmbient.tsx` | 可选 SVG 航线（P1） |
| `traveltrustIdentityModel.ts` | 五路视频 env |
| `TravelTrustLandingNav.tsx` | ≤2 sticky 锚点 |
| `TravelTrustNetworkPageMain.tsx` | 三块组装 |
| `loading.tsx` | 电影宽屏 skeleton + shimmer |

---

## 7. 验收（①）

### P0 结构
- [x] 无 `<details>`；`#hero` `#roles` `#start`；四类 Tab+视频槽  
- [x] 字数预算 §3 达标（手测或脚本粗检）  
- [x] contract test（UI-37）  

### P1 体验（顶尖感）
- [x] **5 路视频位** 就绪或占位可见（含 Hero loop 可选）  
- [x] 首屏 **1.2s 编排** 可感知（FE-11）  
- [x] Tab 切换 **crossfade** + 底边动画；无 CLS（FE-10）  
- [x] 环境粒子+aurora+（可选）航线 **同时存在** 且不压过视频主体  
- [x] reduced-motion 降级完整  
- [x] 与 `/`、`/market` Token 一致（UI-25）  

### 截图
- `fe-browser-traveltrust-v5-hero.png`  
- `fe-browser-traveltrust-v5-roles-{traveler,mobile}.png`  
- `fe-browser-traveltrust-v5-reduced-motion.png`  

---

## 8. 三轮审计：v4→v5 修正项

| v4 问题 | v5 修正 |
|---------|---------|
| 「动效少而精」与用户「多动画」冲突 | 改为 **动画包 §4**（多但有编排） |
| 粒子 opacity~40% 偏寡淡 | 调至 **~55%** + 航线 SVG；仍禁止 Hero 交互粒子网 |
| 仅 4 路视频 | 增加 **Hero loop** 第 5 路 |
| 缺「厉害感」量化 | **1.2s 入场编排** + 剧场 **70vh** + FE-11 |
| 缺全页字数硬指标 | **§3 字数预算** + UI-42 |
| UI-38 可选 stagger 升格 | 纳入 **§4.2 必选**（Chip stagger） |

---

## 9. §C 问题 ID 映射（v5）

| ID | 主题 |
|----|------|
| 12～14,16,21,37 | P0 结构+视频+契约 |
| 22～27,29,36 | P1 气质与行业 |
| 31～35 | P1 动效（对齐 §4） |
| **39** | Hero loop 视频 |
| **40** | 剧场 70vh 视频主导 |
| **41** | 动画包 §4.2～4.4 整体验收 |
| **42** | 字数预算 §3 |
| 38 | 航线 SVG + 边框呼吸（合并进 41） |
| FE-08,10,**11** | 手验总验/动效/首屏编排 |

**维护日期：** 2026-05-18 v5（三轮审计 · 视频+动画增强 · 极少字）

---

## 10. Travel Web3 视觉签名（独创 · 有冲击 · 仍属本项目）

> **独创** = 用户能在 3 秒内认出「这是 TravelTrust 的数字旅游网络」，而不是任意紫渐变 Web3 模板或 OTA 白底站。

### 10.1 本项目已有、必须保留的「旅游 Web3」基因（代码真值）

| 元素 | 落点 | 含义 |
|------|------|------|
| **暖暗热带底** | `layout` `#14100d` + `bg-traveltrust-atmosphere` | 旅行夜航 / 定制游私密感，**非** 冷灰 DeFi |
| **日出珊瑚 + 深玉绿 aurora** | `TravelTrustHeroBackdrop` + `.traveltrust-hero-aurora-*` | 目的地温度 + 海洋/丛林，**非** 霓虹紫 |
| **ref-coral / ref-cyan / ref-teal** | 22/86 palette | Web3 科技点缀在 **旅行色** 上 |
| **旅行轴渐变 CTA** | `travel-500`→teal | 与 **`/`** 规划首页同脉 |
| **点阵场** | `bg-traveltrust-dot-grid` | 轻量「网络」感，**低于** 视频层级 |

**禁止套用：** 泛紫蓝 DeFi 渐变、矩阵绿、ICO 金棕、赛博粉紫网格（那是社区 `/community` 30 系，**不是** `/traveltrust`）。

### 10.2 v6 新增「独创视觉」模块（建议实现）

| 签名 | 说明 | 冲击点 | 清单 ID |
|------|------|--------|---------|
| **A. 地平线弧（Horizon Arc）** | Hero 底与 `#roles` 之间 **SVG 弧线**（earth curve），沿弧 **travel→teal 渐变描边** 慢速流动（14s） | 全球旅行 + 网络，**独有形状** | UI-43 |
| **B. 角色色晕（Role Aura）** | 四身份各 **accent**：游客 cyan-teal / 向导 coral / 商铺 amber / 主理人 jade；Tab 选中 + 视频框外晕 **同色** | 一切换即变色，**好记** | UI-43 |
| **C. 渐变字标（Display Type）** | H1 或「TravelTrust」字标 **`bg-clip-text`** 旅行轴渐变 + 轻 drop-shadow | 首屏 **视觉锤** | UI-43 |
| **D. 电影 letterbox** | 主视频上下 **2.5% 黑边** + 角 **2px 角色色** 内描边 + 极弱 vignette | 大片感 | UI-44 |
| **E. 玻璃信任三柱** | 3 Chip：**图标+≤4字**，玻璃 pill，`backdrop-blur`，stagger 入场 | 可信 Web3 **不看长文** | UI-45 |
| **F. 热带播放钮** | 自定义 **圆形玻璃 Play**（珊瑚环 hover），非浏览器默认控件皮肤 | 视频区 **品牌触点** | UI-44 |
| **G. 滚动暗示（无字）** | Hero 底 **双 chevron** 慢 bounce（1.6s），无「向下滚动」文案 | 动效引导 | UI-47 |
| **H. 与 `/` 的宇宙缝合** | 主 CTA hover 时 **-preview 式** 微缩摄影框 shimmer（可选）；色谱与 `bg-experience-landing-vignette` 同源 | 全站 **同一旅行世界** | UI-46 |

### 10.3 冲击力层级（从强到弱 · 实现优先级）

```
冲击 1（必做）:  Hero loop/摄影全屏 + 70vh 角色视频 + 渐变字标
冲击 2（必做）:  1.2s 入场编排 + 角色色晕 Tab + crossfade
冲击 3（P1）:    地平线弧 + 玻璃三柱图标 + 热带 Play
冲击 4（P2）:    航线 SVG + 边框呼吸 + film grain 3%
```

### 10.4 独特性自检（过则改）

| 问题 | 若出现则说明不够独特 |
|------|----------------------|
| 去掉 Logo 能否认出 TravelTrust？ | 应能（靠 **暖暗+珊瑚玉绿 aurora+角色色晕**） |
| 与 Stripe/Linear 差异？ | 我们是 **视频身份剧场 + 旅行色 Web3**，不是 SaaS 白底 |
| 与 `/community` 差异？ | 社区 **霓虹赛博**；本页 **热带电影 + 托管信任** |
| 是否像 ICO？ | **绝不能**（无价格、无倒计时、无 Buy widget） |

---

## 11. 第四轮审计：尚须提升项（已写入清单）

| # | 缺口 | 提升方向 | 清单 |
|---|------|----------|------|
| 1 | 缺少 **品牌级几何签名**（仅粒子/generic） | 地平线弧 + 角色色晕 | UI-43 |
| 2 | 视频框像通用 embed | letterbox + 角色色描边 + 热带 Play | UI-44 |
| 3 | 信任 Chip 仍偏「文字标签」 | 图标化玻璃三柱 | UI-45 |
| 4 | 与 **`/`** 视觉宇宙未写清缝合 | 暖暗热带 + 旅行轴 CTA 同源 | UI-46 |
| 5 | 滚动引导缺位 | 无字 chevron | UI-47 |
| 6 | 「冲击感」未单独手验 | FE-12 冲击力清单 | FE-12 |
| 7 | v5 未定义 **反模式**（紫 DeFi） | §10.1 禁止表 | 文档 |
| 8 | 移动端边缘冲击力 | 视频 **edge-to-edge** + safe-area | UI-49 |
| 9 | 性能预算未写 | 首屏 LCP：Hero poster；懒加载策略 §2 | UI-26 已有 |
| 10 | 英文站品牌感 | i18n 短句 + 显示字同样 gradient | UI-29 |

---

## 12. §C 映射增补（v6）

| ID | P | 主题 |
|----|---|------|
| UI-43 | P1 | 视觉签名：地平线弧+角色色晕+渐变字标 |
| UI-44 | P1 | 视频戏剧化：letterbox+热带 Play |
| UI-45 | P1 | 玻璃信任三柱（图标） |
| UI-46 | P1 | 与 `/` 旅行宇宙色谱缝合 |
| UI-47 | P2 | 无字滚动 chevron |
| UI-49 | P1 | 移动全幅视频+safe-area |
| FE-12 | P1 | 视觉冲击手验（§10.4 四问） |

**维护日期：** 2026-05-18 **v6**（四轮审计 · 独创视觉冲击 · Travel Web3 风格）



---

## 13. 电影级效果层（Cinematic Tier · 建议加入）

> **结论：要加。** 与 v5/v6 不冲突——电影感来自 **镜头语言 + 过渡编排**，不是再加一篇文字或 ICO 特效。  
> **边界：** 遵守 [86](docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) / [25](docs/spec/25-顶级UI标准-Landing-Discover-Itinerary.md)：**只动 transform/opacity**，`prefers-reduced-motion` 全关，**GPU 友好**。

### 13.1 电影级 vs 动画包（分工）

| 层 | 已有（§4 动画包） | 电影级增补（§13） |
|----|-------------------|-----------------|
| 节奏 | 200 / 300 / 600ms | **镜头感**：更长的 **8～20s** 环境循环（aurora、grain） |
| 主体 | Tab crossfade、Chip stagger | **场景转场**：幕布揭开、章节闪色、Ken Burns |
| 画面 | letterbox、边框呼吸 | **胶片质感**：grain、暗角、轻镜头光晕 |
| 叙事 | 1.2s 首屏编排 | **卷轴感**：顶栏进度细线、视差分层 |

### 13.2 建议实现的电影效果（按优先级）

#### Tier C1 · 必做（P1 · 与 UI-41/44 同批）

| 效果 | 说明 | 技术 |
|------|------|------|
| **胶片颗粒 Film Grain** | 全页覆盖 **2～3%** 噪点（CSS `background-image` 或轻量 canvas），统一「大片」质感 | `pointer-events:none` 固定层 |
| **电影暗角 Vignette** | Hero + 主视频径向暗角 **35～45%** 透明中心 | radial-gradient 叠加 |
| **Letterbox 遮幅** | 主视频上下黑边 **2.5%**（已在 UI-44） | CSS `::before/::after` |
| **幕布揭开 Curtain Reveal** | `#roles` 首次进入视口：剧场容器 **clip-path inset(0 0 100% 0)→(0)** **600ms** | once only |
| **角色章节闪（Chapter Flash）** | 切换身份 Tab 时，视频区 **150ms 角色色 fullscreen flash**（opacity 0.12）再 crossfade | 非刺眼 |

#### Tier C2 · 强烈推荐（P1）

| 效果 | 说明 | 技术 |
|------|------|------|
| **Hero Ken Burns** | 无 loop 视频时用 poster：**scale 1→1.06** 缓动 **22s** 循环 | `transform` only |
| **Hero 视差 Parallax** | 滚动时背景比前景 **慢 15%**（仅 Hero 区，≤40px 位移） | `scroll` + transform |
| **镜头光晕 Lens Leak** | Hero 右上 **珊瑚/金色** 大范围 blur 斑（**静态或 18s 漂移**） | 与 aurora 同层，更低 opacity |
| **视频启播动效** | 点 Play：**scale 0.92→1** 400ms + 按钮淡出 | 组件内 |
| **顶栏进度发光线** | 页面滚动 **travel→teal 2px** 顶线宽度 0→100% | 纯装饰，非真实进度条 |

#### Tier C3 · 加分（P2 · 不挡 PH-1）

| 效果 | 说明 |
|------|------|
| **航线粒子尾迹** | 地平线弧上 **缓慢移动的亮点**（3 个，12s 周期） |
| **CTA 微光扫过** | 主按钮 **shimmer** 每 8s 一次（低对比） |
| **身份图标呼吸** | 当前 Tab 图标 **scale 1→1.04** 3s ease（极弱） |

### 13.3 明确不做的「假电影」（旅游 Web3 仍须干净）

| 不做 | 原因 |
|------|------|
| 全屏闪白转场、抖动镜头 | 晕眩、廉价 |
| 自动有声、爆炸音效 | 打扰；视频仍 **muted 直到用户点 Play** |
| 3D 地球 / 可玩粒子网 | 像 crypto demo（86 已禁 Hero 交互粒子） |
| 长字幕叙事 / 预告片式多段文字 | 违反 ≤120 字 |
| 实时滤镜糊满视频 | 影响看清操作录屏 |

### 13.4 性能与降级（必须写进实现）

| 规则 | 要求 |
|------|------|
| 动画属性 | 仅 **`transform`、`opacity`**（grain/vignette 除外层） |
| 离屏 | `IntersectionObserver`：**离开视口暂停** Ken Burns、光晕漂移 |
| LCP | Hero **poster 优先**；grain 用 CSS 不重 canvas |
| reduced-motion | 关：grain、Ken Burns、parallax、chapter flash、curtain、顶线 |
| 目标 | Tab 切换 **≥55fps** 中端机；**FE-13** 录屏验证 |

### 13.5 与「旅游 Web3」风格的一致性

电影效果 **必须套旅行色**，禁止中性灰好莱坞模板：

- 闪色 / 光晕 / 进度线：**travel、teal、coral、jade**（= 角色色晕同源）  
- 颗粒暖色偏：**sepia 3%** 叠在暖暗底上，不要冷蓝噪点  
- 与 **社区赛博** 区分：无粉紫扫光、无故障 glitch  

---

## 14. §C 映射增补（电影级 · v6.1）

| ID | P | 主题 |
|----|---|------|
| UI-50 | P1 | C1 电影基础：grain + vignette + curtain reveal |
| UI-51 | P1 | Hero Ken Burns + 轻 parallax |
| UI-52 | P1 | 角色切换 chapter flash + 启播动效（补 UI-34） |
| UI-53 | P2 | 顶栏滚动发光线 + lens leak |
| UI-54 | P2 | Tier C3 加分动效（可选） |
| FE-13 | P1 | 电影级手验：grain/幕布/切换流畅；reduced-motion 降级 |

**维护日期：** 2026-05-18 **v6.1**（电影级层 · 叠加 v6）
