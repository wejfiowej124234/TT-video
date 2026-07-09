# 阶段一 · ① 本地问题清单（PI-1）

**真源路径：** `evidence/GO_20260517/issues-phase1-local.md`  
**主表：** [TT-MASTER · PI-1](../../docs/runbook/TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-pi1-gate)  
**模板：** [GO_10DAY_PUBLISH-issues-phase1-local.md](../../docs/runbook/evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)  
**UI/UX 明细：** [issues-phase1-ui-ux.md](./issues-phase1-ui-ux.md)  
**`/traveltrust` 重设计规格：** [issues-phase1-traveltrust-home-redesign.md](./issues-phase1-traveltrust-home-redesign.md)  
**前端审计（2026-05-17）：** [issues-phase1-frontend-audit-20260517.md](./issues-phase1-frontend-audit-20260517.md)

**签字前硬条件：** 所有 **P0** 行 `状态=closed`（含 **PH1-FE-*** 浏览器手验）；**P1** 为 `closed` 或 **defer**。

> **2026-05-18 v6.1（含电影级层）：** §C = **数字旅游 Web3 顶尖** — 极简版面·五路视频·动画包·**独创视觉+电影级**（§10+§13）·全页≤约120字；符合 [22](docs/spec/22-Design-Tokens-旅游Web3融合体系-v1.0.md)/[86](docs/spec/86-UI-双系统未来风-风格与动效技术规格.md)/[25](docs/spec/25-顶级UI标准-Landing-Discover-Itinerary.md)。**PH-1** 须 §C **P0** 全闭。

> **分层：** **PH1-UI-*** = 实现/机读；**PH1-FE-*** = 阶段一浏览器手验。

---

## 图例

| 优先级 | 含义 |
|--------|------|
| **P0** | 挡 **PH-1** |
| **P1** | 应修；可 defer（须填 defer 列） |
| **P2** | backlog |

| 状态 | 含义 |
|------|------|
| open / triage / fix / verify / closed / defer / reopen | 见模板 |

---

## A · 实现 / 机读（社区等已收口；`/traveltrust` IA 见 §C）

| ID | 优先级 | 页面/路由 | 现象（用户） | 处理 / 证据 | defer | 状态 |
|----|--------|-----------|--------------|-------------|-------|------|
| PH1-UI-01 | **P0** | `/community?publish=1` | 视频类型无反应 | MinIO + 分片 180s + UX | | closed |
| PH1-UI-02 | **P0** | `/` 首页 | 白字看不清 | LandingHero 对比 | | closed |
| PH1-UI-03 | **P1** | `/traveltrust` | 内容过杂 | **reopen** → §C 全量重设计 | | closed |
| PH1-UI-04 | **P2** | `/traveltrust` | 视频区位置乱 | 并入 §C `#roles` 分角色视频槽 | | closed |
| PH1-UI-05 | **P0** | `/did-rank` | 奖金池撞色 | DidRankPrizePoolSection | | closed |
| PH1-UI-06 | **P1** | `/community/me` | 头像像网址 | 本地上传文案 + 护栏 | | closed |
| PH1-UI-07 | **P1** | `/community/me` | 信息密度高 | 账户 details 折叠 | | closed |
| PH1-UI-08 | **P1** | 发布抽屉 | 小字难读 | text-small 对比 | | closed |
| PH1-UI-09 | **P0** | `/community` Feed | 帖图 **401** 裂图 | API 匿名 GET + 测试；重启 API | | closed |
| PH1-UI-10 | **P1** | 发布抽屉 · 视频 | 封面只能填 URL | 本地上传按钮 + upload-media | | closed |
| PH1-UI-11 | **P1** | 全站 | `GET /meta` 408/500 | timeout + SSOT 跳过 RPC | | closed |
| PH1-DEV-01 | **P1** | 一键启动 | API 端口/旧二进制 | start-api-with-seed 6c–6e + verify script | | closed |

---

## C · `/traveltrust` 首页重设计（v6 · 数字旅游 Web3 顶尖）

**规格（真源）：** [issues-phase1-traveltrust-home-redesign.md](./issues-phase1-traveltrust-home-redesign.md) **v6**

**一句话：** 很厉害 = **大片视频 + 流畅编排动画 + 极少字**；不是 ICO 仪表盘。

| 支柱 | 要求 |
|------|------|
| 数字旅游 | 87 五类身份，各一段操作演示视频 |
| 简洁 | **3 区块** UI，无折叠无 17 锚点 |
| 多视频 | **5 路**：Hero loop（P1）+ 4 角色主片（P0） |
| 多动画 | §4 动画包：入场 1.2s、Tab/视频 crossfade、环境光、Chip stagger、可选航线 SVG |
| 少文字 | 全页可见 **≤约 120 汉字**（UI-42） |
| Web3 顶尖 | 旅行轴视觉 + 托管信任 Chip；**禁止** Stats/代币/地图炒币动效 |

### C.1 · 结构（P0）

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-12 | **P0** | 无折叠 | 零 `<details>` | closed |
| PH1-UI-13 | **P0** | 导航过密 | sticky **≤2**：身份 / 开始 | closed |
| PH1-UI-14 | **P0** | Hero 字多 | H1≤12字+Tagline≤18字+1 CTA；删 intro | closed |
| PH1-UI-16 | **P0** | 文字教学 | `#roles` 剧场：4 Tab+主视频+1词+进入 | closed |
| PH1-UI-21 | **P0** | 无视频位 | 4 角色 mp4+poster；env | closed |
| PH1-UI-37 | **P0** | 契约旧 IA | contract test 对齐 v5 | closed |
| PH1-UI-42 | **P0** | 字太多 | 全页可见中文 **≤约120字**；无 FAQ 段 | closed |

### C.2 · 视频主导（P0/P1）

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-40 | **P0** | 视频不够抢眼 | 剧场主视频 **≥70vh** 桌面 / **≥56vh** 移动；画幅电影级 | closed |
| PH1-UI-39 | **P1** | 仅 4 路视频 | **Hero 背景 loop** `hero-loop.mp4` muted；无则摄影+aurora | closed |

### C.3 · 动画包 · 厉害感（P1 · spec v5 §4）

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-41 | **P1** | 动效寡淡不像顶尖 | §4 动画包 + **§13 电影级 C1**（与 UI-50～52 同批） | closed |
| PH1-UI-31 | **P1** | 节奏乱 | 200/300/600ms 分层；禁 whileInView 风暴 | closed |
| PH1-UI-32 | **P1** | 粒子不当 | 仅环境 Canvas+CSS aurora；**无** Hero 交互粒子网 | closed |
| PH1-UI-33 | **P1** | 像交易所 | 删 Stats 数字跳、Demo、Map 首屏 | closed |
| PH1-UI-34 | **P1** | Tab 糙 | travel 渐变指示条滑动+视频 crossfade 320ms | closed |
| PH1-UI-35 | **P1** | loading 不对 | 宽屏 skeleton+shimmer，无粒子 | closed |
| PH1-UI-38 | **P1** | 缺 Web3 旅行线 | 可选 **航线 SVG** 慢流动+视频框轻边框呼吸（4s） | closed |

### C.4 · 气质与一致（P1）

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-22 | **P1** | 像加密站 | 旅行摄影/loop；CTA **22 旅行轴** | closed |
| PH1-UI-23 | **P1** | 身份难认 | 五角色线性图标 | closed |
| PH1-UI-24 | **P1** | 信任太长 | 3 Chip 各≤4字+stagger 入场 | closed |
| PH1-UI-25 | **P1** | 两套皮 | 与 `/`、`/market` Token 对拍 | closed |
| PH1-UI-26 | **P1** | 性能 | 非当前 Tab 不挂 video；Hero+当前 preload | closed |
| PH1-UI-27 | **P1** | a11y | Tab 键盘；reduced-motion 全降级 | closed |
| PH1-UI-29 | **P1** | i18n | zh/en 短文案 key | closed |
| PH1-UI-36 | **P1** | 行业感 | 数字旅游+Web3 信任，视频主叙事 | closed |

### C.5 · 下沉 / 文档（defer 可登记）

| ID | 优先级 | 处理 | defer | 状态 |
|----|--------|------|-------|------|
| PH1-UI-15 | P1 | 代币迁出→页脚 | ② | defer |
| PH1-UI-17 | P2 | 协议仅页脚一行 | | defer |
| PH1-UI-18 | P1 | 单 CTA 条+极简页脚 | | closed |
| PH1-UI-19 | **P1** | 删 LowerBody 演示栈 | | closed |
| PH1-UI-20 | P1 | tt-network-card 统一 | | defer |
| PH1-UI-28 | P2 | 五段视频统一 2s 片头 | ③ | defer |
| PH1-UI-30 | P2 | OG 图 v5 | ② | closed |
| PH1-DOC-85 | P2 | 85 §三 同步 v5 | 台账 | defer |

### C.6 · 视觉冲击与独创性（Travel Web3 风格 · v6）

**规格：** [§10～§12](./issues-phase1-traveltrust-home-redesign.md)  
**目标：** 有冲击、独特、仍是一眼 **旅游+Web3**（暖暗热带、珊瑚玉绿、托管信任），**不是** 泛 DeFi/ICO。

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-43 | **P1** | 像模板站 | **地平线弧** SVG + **五角色色晕** Tab/视频框 + **渐变字标**（§10.2 A～C） | closed |
| PH1-UI-44 | **P1** | 视频框平庸 | **Letterbox** + 角色色内描边 + **热带玻璃 Play** 钮（§10.2 D、F） | closed |
| PH1-UI-45 | **P1** | Chip 无图标 | **玻璃信任三柱**：图标+≤4字，blur pill（§10.2 E） | closed |
| PH1-UI-46 | **P1** | 与 `/` 割裂 | 色谱/CTA 与 **`/`** `experience-landing` **同宇宙**；**禁止** 泛紫 DeFi 主色（§10.1） | closed |
| PH1-UI-47 | **P2** | 不知如何往下滚 | Hero 底 **双 chevron** 动效，无文案 | closed |
| PH1-UI-49 | **P1** | 手机不震撼 | 视频 **edge-to-edge**；`safe-area`；剧场 ≥56vh | closed |
| PH1-FE-12 | **P1** | 冲击未验 | 手验 §10.4 四问+去 Logo 仍可辨认；截图 v6-impact | closed |
### C.7 · 电影级效果（Cinematic · v6.1 · 建议加入）

**规格：** [§13 电影级层](./issues-phase1-traveltrust-home-redesign.md#13-电影级效果层cinematic-tier--建议加入)

| ID | 优先级 | 验收要点 | 处理 | 状态 |
|----|--------|----------|------|------|
| PH1-UI-50 | **P1** | 缺大片质感 | **Film grain 2～3%** + **径向 vignette**（Hero+主视频）+ `#roles` **幕布 clip-path reveal** 600ms once | closed |
| PH1-UI-51 | **P1** | Hero 静态呆板 | **Ken Burns** poster 22s 循环；Hero **轻 parallax**（滚动≤40px）；reduced-motion 关 | closed |
| PH1-UI-52 | **P1** | 切身份像网页 | **Chapter flash** 150ms 角色色 wash + 视频 crossfade；**Play** scale-in | closed |
| PH1-UI-53 | **P2** | 缺卷轴感 | 顶栏 **travel 渐变进度细线**；Hero **lens leak** 暖斑 | defer |
| PH1-UI-54 | **P2** | 精致度 optional | Tier C3：航线光点、CTA shimmer、Tab 图标微呼吸 | defer |
| PH1-FE-13 | **P1** | 电影感未验 | grain/幕布/切换 **≥55fps**；录屏；reduced-motion 一张 | closed |

---

## B · 浏览器手验（阶段一必完成 · 挡 PH-1）

| ID | 优先级 | 页面/路由 | 现象 / 验收标准 | 处理 / 证据 | defer | 状态 |
|----|--------|-----------|-----------------|-------------|-------|------|
| PH1-FE-01 | **P0** | `/community` Feed | 有图帖正常；无 uploads 401 | fe01 截图 | | closed |
| PH1-FE-02 | **P0** | 发布 · 视频 | mp4+封面→发布→Feed 可播 | FE-02 | | closed |
| PH1-FE-03 | **P0** | 发布 · 图片 | 多图发帖可见 | FE-03 | | closed |
| PH1-FE-04 | P1 | 发布 · 文字 | 文字帖成功 | FE-04 | | closed |
| PH1-FE-05 | P1 | `/community/me` | 头像本地上传回显 | FE-05 | | closed |
| PH1-FE-06 | P1 | E2E | chromium 视频+封面用例 | `pi1-community-browser-acceptance*.spec.ts` | ② | closed |
| PH1-FE-07 | P1 | local-smoke | #7a～7f | local-smoke 已更新 | | closed |
| PH1-FE-08 | **P0** | `/traveltrust` | **v3 手验：** 无折叠；≤3 导航；五类身份 Tab+视频槽；Hero≤1句+CTA→`/`；默认游客 Tab | `artifacts/fe-browser-traveltrust-redesign-{desktop,mobile}.png`；[规格 §7](./issues-phase1-traveltrust-home-redesign.md) | | closed |
| PH1-FE-09 | **P1** | `/traveltrust` | Tab 键盘；reduced-motion 静态；三 Chip | 录屏或清单勾选 | | closed |
| PH1-FE-11 | **P1** | `/traveltrust` | **厉害感：** 首屏 **1.2s** 入场编排可感知（Hero→Chip→剧场露边） | 录屏 0～1.5s | | closed |
| PH1-FE-10 | **P1** | `/traveltrust` | 动画包：crossfade/底边/环境光；无 CLS；无数字跳 | 录屏 Tab 切换 | | closed |

---

## 建议处理顺序（§C · v6）

1. **P0：** UI-12 → 13 → 14 → 16 → 21 → **40** → **42** → 37  
2. **P1 视频+动画：** UI-39 → 41 → 31～35 → 38 → 34  
3. **P1 气质：** UI-22～27 → 29 → 36 → 25  
4. **P1 下沉：** UI-19 → 18 → 15  
5. **P1 视觉+电影：** UI-43～46、49 → **50～52** → 47、53～54  
7. **手验：** FE-08 → FE-12 → **FE-13** → FE-11 → FE-10  
6. **defer：** UI-28/30、DOC-85  
---

## 阶段一出口核对（签 PH-1 前）

- [ ] **P0** 全 **closed**（**PH1-FE-08** + **PH1-UI-12、13、14、16、21**；社区 FE-01～03 已闭）
- [ ] **P1** §C 含 **视觉独创**（UI-43～47、49、FE-12）与视频/动画包，已 closed 或 defer
- [x] `local-smoke.md` #7a/#7c～7f 已勾
- [ ] `phase-signoff.md` PH-1 待签

**清单维护者签字：** ________　日期：________

---

## 验收（local-smoke）

| # | 关联 ID | 要点 |
|---|---------|------|
| 7a | PH1-FE-01 | Feed 图 |
| 7b | PH1-UI-09 | 401 修复 |
| 7c | PH1-FE-02 | 视频帖 |
| 7d | PH1-FE-03 | 多图帖 |
| 7e | PH1-FE-04 | 文字帖 |
| 7f | PH1-FE-05 | 头像 |
| 7g | PH1-FE-08 | `/traveltrust` v3 重设计 |
| 7h | PH1-FE-09 | 身份 Tab a11y + 信任 Chip（可选同日） |

**机读：** `artifacts/pi1-closure-verify-20260517.log`
