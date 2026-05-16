# 投资人材料包 · 导出前检查清单 · 001

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | PACK-RELEASE-CHECKLIST-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 对外阅读顺序：[external/00-START-HERE.md](external/00-START-HERE.md) · 双入口纪律：[START-HERE-SSOT-001.md](START-HERE-SSOT-001.md) · 编目与页数：[external/export-ready/README.md](external/export-ready/README.md) · Release 数字锚：`registry/fundraising-external-numeric-anchors.v1.json` |

---

## 1. 用途

在**打 zip / 外发前**由 IR（或发布执行人）逐项勾选；**不**替代法务终审（见 [internal/33](internal/33-投资人Data-Room导出包与IR法务终审清单.md)）。**不**修改 Deck / Storyboard / 对外 Markdown 正文——仅验收**成品文件与口径**。

---

## 2. 导出前检查（勾选）

### 2.0 机读闸（① · 打 zip 前）

```bash
bash scripts/gates/check-fundraising-lp-pack-pre-send.sh
```

| 覆盖 | 不覆盖 |
|------|--------|
| `check-fundraising-ir-governance.py`（对外文案泄漏、**export-ready** LP 表面、**demo/** 白名单、CN Pitch 关键字） | **②** staging 全矩阵、**③** 生产真链/真 PSP |
| `export-ready/00-START-HERE.txt` 存在 | 法务签核 PDF、Demo **播放**质检 |
| `ir_pdf_pagecount_diff.py`（CN/EN **>1 页差** 为 **WARN**；设 `FUNDRAISING_LP_PACK_PRE_SEND_STRICT_PAGECOUNT=1` 则 **FAIL**） | **§2.8 F** 目视抽检（须人工） |

**重建成品后**再导出：`python scripts/tools/build-investor-ir-pdf-pack.py` · `python scripts/tools/build-investor-pitch-deck.py` · `bash scripts/export-investor-dataroom.sh --zip --omit-markdown`。

### 2.1 版本与命名

| ☐ | 检查项 |
|---|--------|
| ☐ | `registry/fundraising-external-numeric-anchors.v1.json` 中 **`release`** 与包名 `TravelTrust-Investor-Materials-v{release}`、各文件 **`v{release}`** 一致。 |
| ☐ | `export-ready/` 根下**仅 PDF** + `00-START-HERE.txt` + `demo/` + [export-ready/README.md](external/export-ready/README.md)；**无** `.pptx`、**无** `_editable/`、**无** `04-IC-Memo-*.pdf`；PPTX 真源在 [internal/deck-editable/](internal/deck-editable/README.md)。 |
| ☐ | 存在 **`00-START-HERE.txt`**，且**开篇**含（1）**中英阶段定性**（与 [external/00-START-HERE.md](external/00-START-HERE.md) 融资阶段一致：正式公告 + 环境标签；演示/测试≠全面生产）及（2）**DEFAULT READ ORDER**（**04 Pitch → 03 FAQ**；Demo 若有则其后；**非** Pitch→Memo→FAQ）。 |

### 2.2 页数（与 README / 脚本声明一致）

| ☐ | 检查项 |
|---|--------|
| ☐ | 主路演 **`04-PitchDeck-v{release}-*.pdf`**（export-ready）：**15** 页（与 `internal/deck-editable/04-PitchDeck-v{release}-*.pptx` 同源导出）。 |
| ☐ | **`04-IC-Memo-v{release}-*.pptx`**（**仅** `internal/deck-editable/`，**不进** zip）：**8** 页；若合伙人会前单发 IC，须 IR 书面同意且**不**混入 LP 默认 zip。 |

### 2.3 Demo 时长口径

| ☐ | 检查项 |
|---|--------|
| ☐ | 对外口径：**~90s 一镜**（与 `00-START-HERE.md`、SCREEN-RECORDING-BRIEF、`04-PitchDeck-Storyboard.md` **附录 A** 分镜一致）；**不**再对外宣称「2–3 分钟」为包内默认目标。 |
| ☐ | 若包内含 **`demo/TravelTrust-Product-Demo-v{release}.mp4`**：时长与画质为**肉眼可接受**（须人工播放确认）；节拍与 [04-PitchDeck-Storyboard](external/04-PitchDeck-Storyboard.md) **附录 A** / `export-ready/demo/SCREEN-RECORDING-BRIEF.txt` 一致（**~90s 一镜**）；占位/标题卡长片**不得**冒充终版而未在邮件中说明。 |

### 2.4 阅读顺序（对外唯一）

| ☐ | 检查项 |
|---|--------|
| ☐ | 封面邮件 / 口头 briefing 所述「先读顺序」与 **[external/00-START-HERE.md](external/00-START-HERE.md)** 一致；**不**另起第二套「官方 PARTNER 路径」。 |
| ☐ | 若 zip **不含** Markdown：已在邮件或封面写明「默认读序见包内 `00-START-HERE.txt` **开篇**（中英阶段定性 + **DEFAULT READ ORDER**）」，且与 [external/00-START-HERE.md](external/00-START-HERE.md) 已同源（见 [START-HERE-SSOT-001.md](START-HERE-SSOT-001.md)）。 |
| ☐ | **附件转发链**：若外发形态为**单发 Pitch/IC PDF**、**仅 zip** 或 **IM 单文件**，已按包内 `00-START-HERE.txt` 段落 **`ATTACHMENT FORWARD CHAIN (IR)`** 选用中英模板粘贴至邮件/IM（或与模板等效的 briefing），避免默认读序与 Demo 政策在收件侧丢失。 |
| ☐ | **Partner 深问顺序 / deep-dive order（仅 IR）**：顺序 **28→3→23→29→30·p13·18→20→31·16** 与 **Deck p13 Speaker Notes**、**IC Notes**、包内 **`00-START-HERE.txt` `IR only`** 一致；**不**要求出现在对外 **03-FAQ PDF** 或 LP 默认读路径（见 **§2.8**）。 |

### 2.5 免责声明（源稿层抽检）

| ☐ | 检查项 |
|---|--------|
| ☐ | 对外 `external/01`–`06` 及 `en/` 对应 `.md` 文首 **不构成要约 / 非投资建议** 类免责仍在；若 PDF 由脚本加页眉页脚，**抽 1–2 份 PDF** 目视确认免责未丢、版本行与 **Release** 一致。 |

### 2.6 文件存在（`export-ready/` 最小矩阵）

| ☐ | 检查项 |
|---|--------|
| ☐ | `01`–`03`、`05`–`07`：`-CN.pdf` 与 `-EN.pdf` 成对存在（与本次发行策略一致）。 |
| ☐ | `04-PitchDeck-v{release}-CN.pdf` / `-EN.pdf` **仅此二份**（slot **04**）；**无** `04-IC-Memo` / **无** 根目录 `.pptx`。 |
| ☐ | `08-Data-Room-Index-v{release}.pdf` 存在。 |
| ☐ | **`demo/`**：若对外承诺包内含录屏，则 **`TravelTrust-Product-Demo-v{release}.mp4`** 存在且可播放。 |

### 2.8 LP 收件人视角口径（A–F · 发前快检）

| ☐ | 检查项 |
|---|--------|
| ☐ | **A 语言**：包内 `00-START-HERE.txt` **无** `monorepo` / `repo` / `SSOT` / `gate` / `P0`；**无** LP 主路径上的「连招/Combo/反杀」；**建议读序**与 **READ IN ORDER（编目）** 已区分。 |
| ☐ | **B 合规**：PDF 文首/页脚 **非要约** 仍在；阶段为 **已公告 + 环境标签**；**45/55/100** 不与旅资/仲裁混讲；**TTG** 与订单款分轨。 |
| ☐ | **C 叙事**：主 Deck 先 **旅行交易 + 托管/争议**；**03 FAQ** 接 Pitch 首读；IC 附录**仅**团队维护或 IR 单发，**非** LP zip 默认读序。 |
| ☐ | **D 一致**：01/02/04/06 产品 vs 协议分工一致；路线图与 FAQ「非承诺」一致；**08** 不暗示包内含未授权经营明细。 |
| ☐ | **E 外发**：单发 Pitch/IC 已用 `00-START-HERE.txt` **可复制段**；zip 内 txt 由脚本生成、未手改冒充真源。 |
| ☐ | **F 执行**：抽 1 PDF + 1 PPTX 目视免责/版本；Notes **无**工程指令；若改过 `.md` 已重打 PDF/PPTX；`demo/` zip **仅**终版 mp4（**无**维护用 brief/README）。 |
| ☐ | **PDF 链接**：抽检 01/03/02 — 正文**无**裸露 `*.md` 文件名（应为「同包 06 白皮书 PDF」类表述）。 |
| ☐ | **Deck 矢量**：抽检 04 主 Deck **p4–p5** 协议栈/闭环图例为 **1–5** 阿拉伯数字（**非** ①②③ 圈号）；Speaker Notes 为机构口吻（**无**对内俚语或旧「连招/反杀」式导航）。 |

### 2.7 Markdown 与 PDF 同步 + 页数对拍（P0 / P1）

| ☐ | 检查项 |
|---|--------|
| ☐ | 本轮若改过 `docs/fundraising/external/**/*.md`（含 `en/`）或 **`build-investor-ir-pdf-pack.py` / `build-investor-pitch-deck.py` / `ir_ic_appendix.py`**：已在**同一 `release`** 重跑相应脚本，`export-ready/` 内 PDF/PPTX **mtime** 不早于源稿提交时间。 |
| ☐ | 已运行 `python scripts/tools/ir_pdf_pagecount_diff.py`；若对 **CN/EN** 报告 **>1 页差**，已在发行备注或 **35** 勾选表写明原因并完成目视抽检。 |
| ☐ | **v1.3 已知 ≤1 页差（已登记）**：`01-OnePager` CN **6** / EN **7**；`03-FAQ` CN **11** / EN **12** — 排版换行所致；发前仍须按 **35** 抽 01/03/04/06 目视。 |

### 2.9 IR 发前一页纸（① · 可复制）

| 步 | 动作 |
|----|------|
| 0 | **仅改** `external/**/*.md` 叙事（未动 PDF/Deck/导出脚本）：`bash scripts/gates/fundraising-external-touch.sh`；**发 zip 前**仍须步 1 |
| 1 | **一键（推荐）**：`bash scripts/gates/release-investor-lp-pack.sh`（= PDF 包 + Deck/IC + zip + 结构校验 + pre-send 机读） |
| 2 | **或分步**：见 **§2.0** 重建命令 + `export-investor-dataroom.py --zip --omit-markdown` + `check-fundraising-lp-pack-pre-send.sh` |
| 3 | **人工**：[IR-PRE-SEND-MANUAL-001.md](IR-PRE-SEND-MANUAL-001.md)（§2.2 Demo · §2.5 免责 · §2.8 **F** · [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) Legal · [19](internal/19-对外分发与访问登记.md)） |
| 4 | **外发**：仅 `dist/TravelTrust-Investor-Materials-v{release}.zip`；登记 [19](internal/19-对外分发与访问登记.md) |
| 5 | **② 不进 zip**：staging 闭环填 [RUNBOOK-III-PACK-A.v1.md](data-room/evidence/RUNBOOK-III-PACK-A.v1.md)；凭证 [IR-STAGING-CREDENTIALS-TEMPLATE-001](internal/IR-STAGING-CREDENTIALS-TEMPLATE-001.md) **离库** |
| 6 | **Demo 录屏**：[IR-DEMO-RECORDING-CHECKLIST-001](internal/IR-DEMO-RECORDING-CHECKLIST-001.md)（附录 A） |
| 7 | **合伙人汇报**：[IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md)（**①** 收口摘要，**非** ②③ GO） |
| 8 | **阻塞一览**：`bash scripts/gates/ir-outbound-status.sh`（Legal/Demo/19/Pack A/B） |
| 9 | **preview 外发编排**：`bash scripts/gates/ir-preview-send-preflight.sh`（= 步 8 + zip 新鲜度 + pre-send；重打 zip：`IR_PREVIEW_SEND_REBUILD=1`） |

**跳过子步（维护者）**：见下表 **`RELEASE_LP_*`**。

### 2.9a 环境变量速查（维护者 · ①）

| 变量 | 脚本 | 作用 |
|------|------|------|
| `RELEASE_LP_SKIP_PDF=1` | `release-investor-lp-pack.sh` | 跳过 PDF 重建 |
| `RELEASE_LP_SKIP_DECK=1` | 同上 | 跳过 Deck/IC |
| `RELEASE_LP_SKIP_EXPORT=1` | 同上 | 跳过 zip 导出 |
| `RELEASE_LP_SKIP_PRE_SEND=1` | 同上 | 跳过 pre-send |
| `RELEASE_LP_SKIP_ZIP_VERIFY=1` | 同上 | 跳过 zip 结构校验 |
| `RELEASE_LP_RUN_DEMO_TESTS=1` | 同上 | 串跑 `test_investor_handoff_demo_policy.py` |
| `RELEASE_LP_WITH_DEMO_BUILD=1` | 同上 | 生成**占位** demo（**勿**外发；见下） |
| `FUNDRAISING_LP_ALLOW_PLACEHOLDER_DEMO=1` | governance / zip verify | **仅**内建：允许 &lt;800KiB 占位 mp4 |
| `FUNDRAISING_LP_PACK_PRE_SEND_STRICT_PAGECOUNT=1` | pre-send | CN/EN **&gt;1 页差** 时 **FAIL** |
| `IR_PREVIEW_SEND_REBUILD=1` | `ir-preview-send-preflight.sh` | 外发前重打 zip |
| `IR_PREVIEW_SEND_SKIP_PRE_SEND=1` | 同上 | 跳过 pre-send |
| `RUNBOOK_PACK_A_INCLUDE_EXCEPTION=1` | `runbook-iii-pack-a-preflight.sh` | 含 B-409 取消链 |
| `TT_STAGING_API_BASE` / `TT_PRODUCTION_API_BASE` | runbook preflight / probe | **②** 探针（**勿**提交 Git） |
| `TT_PROBE_BEARER` | `read_only_staging_prod_probe.py` | 只读 token（离库） |
| `TT_PROBE_OUT` | 同上 | 报告路径（建议 `staging-probe-*.md`，已 gitignore） |
| `FUNDRAISING_LP_LEGAL_SIGNED=1` 等 | `check-fundraising-lp-final-human-blockers.sh` | **定稿**外发前人工作业 ack（**非** preview） |
| `FUNDRAISING_LP_REPORT_FINAL_BLOCKERS=1` | `check-fundraising-lp-pack-pre-send.sh` | pre-send 末尾**打印** final 阻塞项（**不** fail；定稿仍须 final 闸 **exit 0**） |
| `FUNDRAISING_IR_CONTACT_NAME` / `_EMAIL` / `_PHONE` | `release-investor-lp-pack.sh` → `00-START-HERE.txt` | 打 zip **前**注入联系人（须**真实**；与 `FUNDRAISING_LP_IR_CONTACT_FILLED=1` 二选一） |

---

## 2.10 FINAL 外发 vs preview（投资人口径）

| 模式 | 机读入口 | 人工作业 |
|------|----------|----------|
| **preview** | `ir-preview-send-preflight.sh` | 邮件/登记标 **preview**；可无 demo、无 Legal 定稿 |
| **final** | 上表 + `check-fundraising-lp-final-human-blockers.sh` **exit 0** | Legal 签核、demo 政策、真实登记、IR 联系人已填 |

---

## 3. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-15 | 初版：导出前版本、页数、Demo ~90s、阅读顺序、免责、文件存在检查；**§2.4** 增 **Partner 连招** 与 Deck/IC/导读对拍勾选。 |
| 2026-05-16 | 增 **§2.7**：MD→PDF 同步闸 + `ir_pdf_pagecount_diff.py` 页数对拍。 |
| 2026-05-16 | 增 **§2.8**：LP 收件人视角口径快检（A–F）；**§2.4** Partner 深问顺序改为仅 IR（`IR only` 块用语）。 |
| 2026-05-16 | **§2.4/§2.8**：维护者文档与 **F24** 统一「深问顺序 / deep-dive order」；对外包仍禁 LP 路径出现旧俚语。 |
| 2026-05-16 | 增 **§2.0**：`check-fundraising-lp-pack-pre-send.sh` 发前机读闸。 |
| 2026-05-16 | 增 **§2.9** 发前一页纸 + `release-investor-lp-pack.sh` 一键编排。 |
| 2026-05-16 | **B-409** 验收脚本修正：`cargo test` 过滤器勿用错误 `--exact` 全路径（防 0 tests 假绿）。 |
| 2026-05-16 | **§2.9** 链 [IR-PRE-SEND-MANUAL-001](IR-PRE-SEND-MANUAL-001.md) 人工勾选表。 |
| 2026-05-16 | **§2.9** 增步 0：`fundraising-external-touch.sh`（仅叙事；发 zip 仍须步 1）。 |
| 2026-05-16 | **§2.9** 增步 9：`ir-preview-send-preflight.sh`（preview 外发编排）。 |
| 2026-05-16 | **§2.9a** 环境变量速查表。 |
