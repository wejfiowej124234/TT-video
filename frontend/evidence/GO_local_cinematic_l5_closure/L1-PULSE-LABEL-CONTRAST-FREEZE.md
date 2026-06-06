# L1 公告标签簇 · 对比度收口冻结（① · 2026-06-03）

**阶段：① 本地** — **不**表示 ② 测试网 / ③ 生产 WCAG 审计已闭（见 [`DEFER-03-LIGHTHOUSE-WCAG.md`](./DEFER-03-LIGHTHOUSE-WCAG.md)）。

**互指：** [FIVE-MAIN-ROUTES](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [`app/traveltrust/README.md`](../../app/traveltrust/README.md) · [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md)

---

## 状态

| 项 | 值 |
|---|---|
| **路由** | `/traveltrust` L1 第二行 · **`TravelTrustPulseTicker` inline** |
| **可见文案** | **项目动态** · **全部** ›（i18n：`traveltrust_pulse_label` / `traveltrust_pulse_view_all`） |
| **收口日期** | **2026-06-03 · closed ①** |
| **类型** | **a11y / 对比度 bugfix**（**非** L1 结构或 layout lock 变更） |
| **机读锚点** | `data-tt-traveltrust-pulse-label-cluster-l5` · `data-tt-traveltrust-pulse-label-l5` · `data-tt-traveltrust-pulse-view-all` |

---

## 问题与根因

| 现象 | 根因 |
|------|------|
| 「项目动态 · 全部 ›」呈**近黑字**贴 `#0c0a09` 暗底，肉眼难辨 | **`TravelTrustHomeLandingNavSlot`** **portal → `document.body`**，继承全站 **`body.text-ink-900`** |
| `text-ref-sun/75` 等 Tailwind 透明度类**未生效** | `--ref-sun` 为 **hex** CSS 变量时，`text-ref-sun/NN` 的 opacity JIT **常失效**；链接再叠 **`a { color: inherit }`** |

---

## 已落地修复（代码 SSOT）

| 层 | 文件 | 要点 |
|----|------|------|
| L5 token | `lib/traveltrust/l5/landing-chrome.ts` · **`TT_PULSE_TICKER_L5`** | `inlineLabelClass` · `labelClusterClass` · `labelSeparatorClass` · `viewAllLinkClass` · `viewAllChevronClass` → 显式 **`rgba(249,215,121,…)`** |
| 组件 | `components/traveltrust/cinematic/TravelTrustPulseTicker.tsx` | 分隔符 `·` 与 `›` 走 token；**不改** marquee 结构 |
| 全局兜底 | `app/globals.css` | **`[data-tt-traveltrust-pulse-label-cluster-l5="1"]`** 压过 body 继承 + link inherit |

**勿回退：** 本簇**禁止**再仅用 `text-ref-sun/NN` 而无 `rgba` 或 globals 兜底。

---

## 冻结边界（与五主路由链路验证期一致）

| 允许 | 禁止 |
|------|------|
| 公告文案 **i18n** · 链接 **href** · **数据链**（公告源数组） | L1 **双行结构** · portal 策略 · marquee 时长/布局 |
| **a11y** 对比度 / focus ring **bugfix**（须跑下方绿集） | 用 **`text-ref-sun/NN` 单独**替代本批 rgba + globals 组合 |
| **`globals.css`** 本簇 selector **微调**（对比度 only） | 借「可读性」改 **章节 nav** pill / LIVE 行视觉 |

---

## 机读验收（①）

```bash
cd frontend
npx vitest run lib/traveltrustCinematicNonGlobeL5.closure.test.ts app/traveltrust/traveltrustNetworkPage.contract.test.ts
```

**目视：** 硬刷新 `/traveltrust` → L1 第二行左簇 **暖金可读**（非黑字）。

**②③：** Lighthouse / 全页 WCAG 逐条仍见 [`DEFER-03-LIGHTHOUSE-WCAG.md`](./DEFER-03-LIGHTHOUSE-WCAG.md) — **不**用本文件冒充闭卷。
