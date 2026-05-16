# IR 主 Deck · 最小改动设计稿（已锁定页：04-4 / 04-5 / 04-9）

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR |
| **Version** | 1.0.0-design |
| **Status** | archived |
| **Classification** | internal |
| **Last Updated** | 2026-05-15 |
| **SSOT** | 实现已合入 `scripts/tools/build-investor-pitch-deck.py` 等；本页仅设计过程留档，**不**进投资人 zip |

**状态**：**已合入** `build-investor-pitch-deck.py` / `ir_deck_storytelling.py` / `ir_ic_appendix.py` 与 **04 / en-04 storyboard**（2026-05-15）；栈页标题已去掉「主链」二字以免误触发 `vector_loop` 机读闸（改为「落在同一单笔上」）。  
**允许改动**：标题、眉题（`EYEBROW_*`）、**屏内一句 framing**（见 §0）、讲者首句（Notes **仅首行前插**）、页序（15 页不变）。  
**禁止**：改图结构、改数字、改页数、改其余页的屏上正文要点（含 `04-6` 三行等）。

---

## §0 屏内一句 framing（实现约束）

当前 `build-investor-pitch-deck.py` 对 `vector_loop` / `vector_stack` / `vector_fee` **不消费** `SlideSpec` 的第二段 `vis`（矢量页 `vis` 为空时只画图）。因此 **在不改 builder 的前提下**，「页内一句」**只能**落在：

- **主标题字符串内**（推荐：用 **间隔号 `·` 或 `｜`** 接一句 framing，仍算单行 chrome 标题），或  
- **眉题**（更短，但信息密度低）。

若坚持「标题短 + 图下方独立 caption 一句」，需后续单点改 `ir_deck_design_system` / builder（本稿 **不**展开实现，仅登记为 **可选 B**）。

---

## §1 锁定页序（方案三 · 15 页）

| 新 `slide_idx` | 逻辑页 | 说明 |
|----------------|--------|------|
| 1–3 | 不变 | Cover / 主旨 / 痛点 |
| 4 | **04-4** | 矢量环 |
| 5 | **04-5** | 矢量栈 |
| 6 | **Why now** | 由原第 12 页前移 |
| 7–9 | 三句话 / 一笔订单 / 系统性优势 | 顺序随原稿 |
| 10 | **04-9** | FeeRouter 矢量 |
| 11–15 | 路线图 / GTM / 矩阵 / 旅程 / 收口 | 顺序随原稿 |

**合入代码时须同步**：`SLIDES_CN` / `SLIDES_EN` **整表同序重排**；`ir_deck_storytelling.py` 内 **`STORY_BEATS`、`EYEBROW_CN`、`EYEBROW_EN`、`_PARTNER_RETELL_NOTE_*`** 与 **新 `slide_idx` 一一对齐**（否则眉题与 macro rail 会错位）。

---

## §2 04-4：从「同一逻辑·环视图」锚到「履约闭环」

### 2.1 标题层（保留机读闸子串 + 屏内 framing）

`_slide_layout_kind` / PDF 回退绘图依赖标题子串 **`单笔订单对齐交付与争议`**（或 EN：`trip-order: align delivery and disputes` 等）。**不得删除**该子串。

**CN（推荐 · 单行复合标题）**

```text
单笔订单对齐交付与争议·履约闭环（同一单笔｜不讲费项拆分）
```

**EN（推荐）**

```text
Trip-order: align delivery and disputes · fulfillment loop (one trip; no fee unpack here)
```

### 2.2 眉题（新 slide_idx = 4）

| 语言 | 现稿（旧序 idx4） | 设计稿 |
|------|-------------------|--------|
| CN | 怎么走 | **闭环** |
| EN | FLOW | **LOOP** |

### 2.3 讲者首句（Notes **最前插一行**，其后保持原 `deck_detail`）

**CN**：`讲者首句：这一页只回答一单在履约侧怎么走通；不讲池子与比例。`  
**EN**：`Opening line: one screen = one trip’s fulfillment path; no pools or ratios on this slide.`

---

## §3 04-5：从「同一逻辑·栈视图」锚到「控制层」

### 3.1 标题层（保留机读闸子串）

栈页依赖 **`订单与规则分几层`** 或 **`协议栈`** / `protocol stack` 等（与现 `_slide_layout_kind` / PDF 分支一致）。推荐 **保留现有关键子串** 并加 framing：

**CN**

```text
协议栈·订单与规则｜责任切片·控制层（同一单笔｜规则/披露/环境如何落在同一单笔上）
```

**EN**（保留 `Trip-order & rules stack` 或改用 `Protocol stack` — 二者现均进 `vector_stack`）

```text
Trip-order & rules stack (figure) · control plane (same trip; rules/disclosure/env)
```

### 3.2 眉题（新 slide_idx = 5）

| 语言 | 现稿 | 设计稿 |
|------|------|--------|
| CN | 五步 | **控制层** |
| EN | STEPS | **CONTROL** |

### 3.3 讲者首句

**CN**：`讲者首句：仍是同一单笔；这一页回答控制面怎么分层——不是另一条业务流程。`  
**EN**：`Opening line: same trip—this slide is the control stack, not a second storyline.`

---

## §4 04-9：标题层从「协议经济」重锚为「披露边界」

### 4.1 标题层（保留 FeeRouter 机读 + 第一层）

矢量费项页依赖 **`feerouter`**（大小写不敏感）或现 **`协议经济·第一层`** / `protocol economics` + `layer 1`。重锚后 **建议去掉屏上「协议经济」主导词**，改用 **披露边界**，**保留** `FeeRouter` 与 **第一层**：

**CN**

```text
FeeRouter·披露边界（第一层｜屏上仅已发布口径）
```

**EN**

```text
FeeRouter · disclosure boundary (layer 1 · on-slide published path only)
```

> PDF 分支：`"feerouter" in title.lower()` 已满足，无需再写 `protocol economics`。

### 4.2 眉题（新 slide_idx = 10）

| 语言 | 现稿（旧序 idx9） | 设计稿 |
|------|-------------------|--------|
| CN | 经济 | **披露** |
| EN | ECON | **DISCLOSE** |

### 4.3 讲者首句

**CN**：`讲者首句：这是披露边界的第一层示意；先对齐分母，不讲营业账。`  
**EN**：`Opening line: published disclosure boundary (layer 1); align denominators—not operating P&L.`

---

## §5 方案三下全册眉题一览（与 §1 序一致 · 供一次改表）

> 仅 **4 / 5 / 10** 为本次重锚硬点；其余可与现稿保持接近，避免无关抖动。

| `slide_idx` | 眉题 CN | 眉题 EN |
|-------------|---------|---------|
| 1 | 开场 | OPEN |
| 2 | 主旨 | THESIS |
| 3 | 问题 | PROBLEM |
| 4 | 闭环 | LOOP |
| 5 | 控制层 | CONTROL |
| 6 | 时机 | NOW |
| 7 | 差异 | DIFF |
| 8 | 看一单 | ONE ORDER |
| 9 | 优势 | EDGE |
| 10 | 披露 | DISCLOSE |
| 11 | 窗口 | WINDOW |
| 12 | 增长 | GTM |
| 13 | 格局 | MARKET |
| 14 | 案例 | CASE |
| 15 | 收口 | CLOSE |

---

## §6 可机读验收（不做受众推演）

1. **04-4 / 04-5 标题**仍分别包含 **`单笔订单对齐交付与争议`** 与 **`订单与规则分几层`**（或 EN 等价子串），`kind` 仍为 `vector_loop` / `vector_stack`，PPTX/PDF 矢量分支不变。  
2. **04-9 标题**含 **`FeeRouter`**（建议大小写混排以利人读，机读用小写匹配），**不含**主导词 **`协议经济`**（CN）/ **`Protocol economics`** 作标题主语（可选保留在 Notes 深部，**非** chrome 主标题）。  
3. **眉题 idx10** ≠ `经济` / `ECON`。  
4. **页序**合入后 **`assert_story_aligned(15)`** 通过，且 **`len(EYEBROW_CN)==15`**。

---

## §7 与现 Notes 的衔接（最小）

- **不删**原 `deck_detail` 各条；仅在每条 Notes **正文块前**插入 **§2.3 / §3.3 / §4.3** 的「讲者首句」一行（或统一前缀 `讲者首句：`）。  
- 原「与上页为同一单笔逻辑，纵向重排」类表述：合入时可 **改为**「与上页同一单笔；**本页专答控制层**」**一句**（仍属 Notes，**非**屏上正文要点）；若严格「Notes 也零删」则仅靠前插首句区分，**材料内仍可能残留「同一逻辑」字样**——由 Owner 在「最小」与「Notes 单句纠偏」间二选一。

---

**维护**：融资叙事稿；不涉及 `docs/spec` 契约数字真源变更。合入 builder 时自测：`python scripts/tools/build-investor-pitch-deck.py`（或仓库既定入口）生成 PPTX/PDF 过版式宽度。
