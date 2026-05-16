# 36 — IR Pitch Deck Design System（机构级母版规范）

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / PM |
| **Version** | 1.0.0-ds |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-15 |
| **SSOT** | 代码真源 `scripts/tools/ir_deck_design_system.py` · 主 Deck 生成入口 `scripts/tools/build-investor-pitch-deck.py` · **IC 附录** `ir_ic_appendix.py` / `build-investor-ic-appendix.py` · 叙事边界仍以主 Deck 之 `SLIDES_*` 与对外 storyboard 为限（**不**在本文件新增经济数字） |

---

## 1. 目标与约束

- **视觉与节奏**：单页 **3–5 秒**可读；信息分层 > 装饰；与顶级 VC / Protocol 路演常见的 **大标题 + 低噪声正文 + 结构化对比** 一致（具体机构名仅为风格参照，**非**背书）。
- **内容边界**：**不**改变 Deck 文案、**不**新增或改写 **100% / 45% / 55%** 等已锁定口径；不扩展 Tokenomics 百分数。
- **Master 含义**：本仓库以 **Python 设计 Token + 布局原语** 为母版真源；若需在 PowerPoint 内手工维护 `.potx`，应将下表 **颜色 / 字号 / 边距 / 12 栏** 同步拷贝为「主题+版式」。

---

## 2. 颜色 Token（`DeckTokens`）

| Token | 用途 | Light（默认） | Dark（`TRAVELTRUST_DECK_THEME=dark`） |
|--------|------|---------------|---------------------------------------|
| `bg_deep` | 顶栏 / 封面底 | `#0A1628` | 同左 |
| `accent` | 强调、描边、脚注高亮 | `#2DD4BF` | 同左 |
| `canvas` | 内容区背景 | `#FCFDFF` | `#0A1628` |
| `surface` | 卡片 / 矢量图浅底 | `#F8FAFC` | `#0F1B30` |
| `surface_2` | 次级面板 / 封面 pill | `#F1F5F9` | `#16243E` |
| `ink` | 主文 | `#0F172A` | `#F1F5F9` |
| `ink_muted` | 页脚 / 次要 | `#64748B` | `#94A3B8` |
| `ink_on_dark` | 深色底上的标题字 | `#FFFFFF` | `#FFFFFF` |
| `border_subtle` | 卡片描边 | `#E2E8F0` | `#334155` |

---

## 3. 字体体系 · 中英双语

| 角色 | 中文（CN） | 英文（EN） |
|------|------------|------------|
| Display / 封面主标题 | Microsoft YaHei | Segoe UI |
| Body / 栏目标题 / 卡片 | Microsoft YaHei | Segoe UI |

**原则**：中西文混排以 **中文材料用雅黑、英文材料用 Segoe UI** 为主，避免同一页多字体并排超过 **2** 个家族。

---

## 4. 画布与 12 栏网格

| 量 | 值 |
|----|-----|
| 画幅 | **16:9**，宽 `13.333333"` × 高 `7.5"`（与 `python-pptx` 一致） |
| 左右边距 `MARGIN_X` | `0.48"` |
| 顶区（顶栏下内容起点由 `add_chrome_bar` 计算） | 顶栏约 `0.95"` |
| 底边距（页脚预留） | `0.62"` + 页脚条 |
| 列数 | **12** |
| 列间距 `GUTTER` | `0.14"` |
| 单栏宽 | \((W - 2·MARGIN_X - 11·GUTTER) / 12\) |

**span**：内容块宽度 `= span * col_w + (span-1) * GUTTER`。代码见 `Grid.x(col)` / `Grid.w(span)`。

---

## 5. 组件规范（与代码函数对应）

| 组件 | 行为 | 典型用途 |
|------|------|----------|
| **封面** `add_cover` | 保密眉批、短色条、主副标题层次、Release pill、深蓝底 | 第 1 页 |
| **顶栏** `add_chrome_bar` | 全宽海军条 + 可选 EYEBROW（PROTOCOL / ECONOMICS …）+ 大标题 | 第 2 页起 |
| **线性正文** `add_body_bullets` | 单栏段落列表，统一字号与段后距 | 短列表、2 条要点 |
| **双栏卡片** `add_bullet_cards_2col` | 圆角卡片 + 轻边框，**2×N 栅格** | 痛点四象限、多要点 |
| **能力条** `add_pillar_strip` | 单行多柱，加粗短句 | 「系统性优势」拆 `·` |
| **英雄句** `add_hero_statement` | 大号单段 | 「一句话」 |
| **竞争矩阵** `add_matrix_three_plus_note` | 三列：标题条 + 正文卡 + **统一脚注**（费口径不重写） | 竞争对比页 |
| **FAQ / DD** `add_faq_row_cards` | 横向多张卡 + 左侧青条 | DD Q&A |
| **路线图轨** `add_roadmap_tracks` | 全宽药丸条垂直堆叠 | 阶段与路线图、GTM、指标政策等多行 |
| **页脚** `add_footer` | 左对齐：合规短句 + `当前页/总页` | 除封面外（封面脚在 `add_cover` 内） |
| **矢量** `ir_brand_vector_charts` | 旅行主链 / 协议栈 / FeeRouter（**仅**既有百分数） | 指定标题匹配 |

---

## 6. 叙事节奏 · 动画 · 转场

- **转场**：生成阶段写入 **淡出（fade / med）**，便于 LibreOffice / PowerPoint 一致播放。
- **片内动画**：**不**在生成器里堆叠逐条飞入（避免 XML 体积与 LO 差异）；若需 **0.2s 淡入**，在桌面 PowerPoint 中对 **整块内容占位** 统一设置即可，**勿**改文案层数字。

---

## 7. 暗色主题开关

```bash
# Windows / bash
export TRAVELTRUST_DECK_THEME=dark   # 或 night
python scripts/tools/build-investor-pitch-deck.py
```

默认 `light`。**暗色**下 `canvas` / `surface` 与 `ink` 对调对比，**accent** 不变，避免 Brand 漂移。

---

## 8. 阅读路径与资料包

Deck 为 **`04`**；完整投片包顺序以 **`export-ready/00-START-HERE.txt`**（zip 根同名；**开篇**中英阶段定性 + **DEFAULT READ ORDER**）为准；白皮 **`06`** 仍为深度 DD，不作冷启动首读（叙事不改，仅在母版层强化提示结构）。

---

## 9. 维护者快速命令

```bash
pip install python-pptx
python scripts/tools/build-investor-pitch-deck.py
```

PDF 仍由 **LibreOffice** 从 PPTX 导出（与 IR 门禁一致）。

---

## 10. 与 storyboard 文档的关系

* **页序与上屏可见字符串（机读）**：`scripts/tools/build-investor-pitch-deck.py` 之 **`SLIDES_CN` / `SLIDES_EN`**。  
* **人类可读叙事与附录分镜**：`docs/fundraising/external/04-PitchDeck-Storyboard.md` 及 `en/` 镜像，与上项 **1:1 对拍**（见 04 文首「页码真源」表注）。  
* **视觉真源**：`ir_deck_design_system.py`。叙事改稿以 **`SLIDES_*` + storyboard** 同批；版式改 **`ir_deck_design_system.py` + builder**。

---

## 11. Investor Storytelling System（叙事层 · 与视觉 tokens / 数字口径解耦）

与「图标/色板」并列的第三层：**叙事节拍 + 投资人节奏 + 扫描路径提示**。**屏上可见正文** 以 `build-investor-pitch-deck.py` 之 `SLIDES_CN` / `SLIDES_EN`（三字段：`标题` · `屏上要点` · `Notes 附录段`）为准；**长叙事 / 附录级句子**进 Speaker Notes 与对外 storyboard 全文节，已披露数字仍不越界。

| 构件 | 脚本 | 作用 |
|------|------|------|
| 每页 story beat（Problem / WhyNow / WhyUs / WhyWin / DD …）与投资人「认知 / 相信 / 兴奋 / 尽调」 | `ir_deck_storytelling.py` | `STORY_BEATS` 与 `SLIDES_*` 顺序**锁死** |
| 左缘叙事 rail（薄条，全高） | `ir_deck_design_system.py` · `add_narrative_rail` | F/Z-pattern：视觉锚点 + 与页面内容区留白隔离 |
| chrome bar 眉题（英文/中文与 beat 对齐） | `ir_deck_storytelling.py` · `EYEBROW_*` | 单页主张的句首钩子 |
| Speaker Notes | `speaker_note_text(...)` | 弧光、扫描建议、**协议/流程动画口述提示**（**不**写入 PPTX timeline XML；Keynote / 手工动效另开工作项） |

**Partner 短句转述**：Notes 前 **10** 页含 `ir_deck_storytelling.py` 预制 `_PARTNER_RETELL_NOTE_*` 句（与 `SLIDES_*` 同序）；其后页仍走弧光模板。

运行 `build-investor-pitch-deck.py` 时自动 `assert_story_aligned(len(SLIDES_CN))`，防漏页或错序。

---

## 12. Slide Audit（构建时自动 QA 报告）

每次构建后，若设置环境变量 **`TRAVELTRUST_IR_SLIDE_AUDIT=1`**，则在内部路径 **`37-IR-Pitch-Deck-Slide-Audit-RUN.md`**（**不入库**）覆盖生成 **CN + EN** 审计表（含 DC 块）。**默认不写入**，避免本地反复生成未跟踪文件。

* **脚本**：`ir_deck_slide_audit.py`  
* **指标（启发式）**：标题字数与「单一观点」初筛、**正文词数**（storyboard 元组非空时用之；**矢量 / FeeRouter 空正文页**用幻灯片 **内容区** 文本框，不含 chrome 与 footer）、形状面积占比（视觉负荷）、图文比估计、估算阅读秒数与 **3–8s 目标**对比、macro arc / investor moment / page goal（认知 / 证据 / 尽调等）。  
* **用途**：QA triage 与路演前排练；**不**替代法务/合规签核；人工终稿仍以 storyboard 与 Data Room 为准。

---

## 13. IC / Partner Summary 附录（合伙人会前）

* **脚本真源**：`ir_ic_appendix.py`（正文元组）· `build-investor-ic-appendix.py`（生成入口，可**单独**运行）。  
* **产物**：`export-ready/04-IC-Memo-v{release}-CN|EN.pptx` 与 **PDF**；与主 **15 页** Pitch Deck **分立**，**不**改主 Deck 的 `SLIDES_*` / `STORY_BEATS`。  
* **默认编排**：`build-investor-pitch-deck.py` 成功后会 **自动** 再跑 IC 附录（设 **`TRAVELTRUST_SKIP_IC=1`** 可跳过）。  
* **披露**：附录为定性 + 已公开边界引用（如白皮书第一层 **100%/45/55%**）；**不**新增经济数字。
