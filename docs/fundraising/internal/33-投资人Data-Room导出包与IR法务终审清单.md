# 33 — 投资人 Data Room 导出包与 IR+法务终审清单

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / Legal |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 对外叙事源文件 `docs/fundraising/external/` · 导出 `scripts/tools/export-investor-dataroom.py` · 分发登记 [19-对外分发与访问登记](19-对外分发与访问登记.md) |

## 1. 交付口径（机构级）

| 对象 | 内容 |
|------|------|
| **投资人 / 路演 / 初阶 DD** | **仅**交付 **`dist/TravelTrust-Investor-Materials-v{release}.zip`**（**`release`** 见 `registry/fundraising-external-numeric-anchors.v1.json` 并与 zip 文件名一致；**当前以 registry `release` 为准，见对外 README Release**）。导出须使用 **`--omit-markdown`**。**不**开放 monorepo、**不**附 `internal/`、`registry/`、`scripts/` |
| **终稿形态** | **LP zip / `export-ready/` 根**：**仅 PDF** + `00-START-HERE.txt` + `demo/`（**无** `.pptx`、**无** `04-IC-Memo`）。**04** = `04-PitchDeck-v{release}-CN|EN.pdf`（**15** 页）；PPTX 维护于 [deck-editable/](deck-editable/README.md)（含可选 IC 附录 pptx，**不进** zip）。**演示视频**（若有）：`demo/TravelTrust-Product-Demo-v{release}.mp4`。**其余编号 PDF**：`01`–`03`、`05`–`08`（CN+EN 成对，除索引策略见 registry）。**叙事默认读序**：**04 Pitch → 03 FAQ**（[00-START-HERE.md](../external/00-START-HERE.md) / 包内 **`DEFAULT READ ORDER`**；**≠** 01→08 顺读）。**Markdown 仅仓库内真源**；外发 **`--omit-markdown`**。 |

**与 `internal/` / `external/` 分层**：交付物**只来源于** `external/`；分层冻结与禁止重复正文、跨层回流见 [34-融资分层冻结与单向流转](34-融资分层冻结与单向流转.md)。**本轮对外材料 Release** 以 `registry/fundraising-external-numeric-anchors.v1.json` 的 **`release`** 为准（当前 **1.3**），与 [14](14-核心指标与融资KPI.md) / [15](15-融资路线图与里程碑.md) 台账对拍后再外发。

## 2. 自动生成导出（仓库根）

```bash
bash scripts/gates/release-investor-lp-pack.sh
# 或分步（见 PACK-RELEASE §2.0）；终版 demo：RELEASE_LP_WITH_DEMO_BUILD=1 仅当接受占位片
```

**发前机读（①）**：`bash scripts/gates/check-fundraising-lp-pack-pre-send.sh` 覆盖融资门禁 + `00-START-HERE.txt` + CN/EN 页数对拍；**不**替代本表 **§3** 法务栏与 [PACK-RELEASE-CHECKLIST-001](../PACK-RELEASE-CHECKLIST-001.md) **§2.8** 目视项。**②** staging 证据：[RUNBOOK-III-PACK-A.v1.md](../data-room/evidence/RUNBOOK-III-PACK-A.v1.md)（**不进** zip）。

`--omit-markdown`：包内**不含** `.md`；**zip 根目录**写 **`00-START-HERE.txt`**（路径带 `signed-pdfs/` 前缀）；**handoff 真读本**为 **`signed-pdfs/00-START-HERE.txt`**（同序、相对路径）；导出拷贝会**删除** `demo/_frames`、`demo/_segments`。主交付为 **signed-pdfs/** 下 01–08 成品与 **门禁禁止** 的 `TravelTrust-IR-*`、`TravelTrust-PitchDeck-*` 旧名（见 `check-fundraising-ir-governance.py` **export-ready** 检查）。

叙事 PDF（Pandoc→DOCX→LibreOffice）**出版级版式与 02/05/06 逐页人工 QA 清单**见 [35-IR-PDF-出版-QA-02-05-06](35-IR-PDF-出版-QA-02-05-06.md)（`reference-ir.docx`、章节分页 Lua）。

仅维护/复核叙事时可用不带 `--omit-markdown` 的导出（含全部 `.md`）。

导出前**默认**执行 `FUNDRAISING_IR_GATE_ENFORCE=1` 的融资门禁；导出目录内对 `.md` 做**二次泄漏扫描**（失败则删除半成品目录）。

包内将 `export-ready/` **重命名为** `signed-pdfs/`（投资人侧不出现「export-ready」运维词），并**重写**文内相对链。

## 3. 人工终审（IR + 法务）— 建议逐项打勾

| # | 检查项 | IR | Legal |
|---|--------|----|-------|
| 1 | 导出命令已跑通；包内**无** `docs/spec`、`internal`、`registry`、`scripts`、`| **Owner** |` 等痕迹 | ☑ | ☐ |
| 2 | 中英文 **Release / 版本** 与 `registry/fundraising-external-numeric-anchors.v1.json` 的 `release` 一致 | ☑ | ☐ |
| 3 | `06` / `en/06` 中 **45% / 55% / 100%** 已与协议经济定稿对拍（维护侧 registry 已登记） | ☑ | ☐ |
| 4 | 路演 Deck（若另存）与 `04` 叙事一致，**无**认购式 CTA | ☑ | ☐ |
| 5 | `signed-pdfs/` 内 PDF **命名可追溯**（日期、主题、版本），敏感件仅 NDA 渠道 | ☑ | ☐ |
| 6 | 外发后在 [19-对外分发与访问登记](19-对外分发与访问登记.md)（及必要时 [board/distribution-log.md](../board/distribution-log.md)）登记 | ☐ | ☐ |
| 7 | `01`/`04` **融资沟通快照（定性）**与 `03` Q18–Q22（数字路径、路线图非承诺）已同 **14/15** 对读，无口径冲突 | ☑ | ☐ |
| 8 | 单发 Pitch/IC/zip/IM 场景：已按包内 **`00-START-HERE.txt`** 段落 **`ATTACHMENT FORWARD CHAIN (IR)`** 选用模板（或等效 briefing）；其中 **Partner 深问顺序 / deep-dive order**（**`00-START-HERE.txt` `IR only`**）与 **`03-FAQ`**、**Deck ~p13**、**IC Notes** 同序（见 [LP-OUTBOUND-PACK-001](../LP-OUTBOUND-PACK-001.md)、[PACK-RELEASE-CHECKLIST-001](../PACK-RELEASE-CHECKLIST-001.md) §2.4、[START-HERE-SSOT-001](../START-HERE-SSOT-001.md)） | ☐ | ☐ |

**首轮执行注（2026-05-15）**：**IR / 维护者**侧已跑通门禁与导出路径；**当前**外发命名与 **`registry/fundraising-external-numeric-anchors.v1.json` 的 `release`**（**1.3**）一致，成品见 **`external/export-ready/*-v1.3-*`** 与 **`dist/TravelTrust-Investor-Materials-v1.3.zip`**（`--omit-markdown` 包内为 **`signed-pdfs/`** 树；详见 `external/export-ready/README.md`）。若团队曾另存 **1.2** 时代 PDF 仅作存档，**不得**冒充当前 zip 真源。**Legal** 栏须由**真人法律顾问**就辖区披露、要约用语、NDA 范围等**另行勾决**；需签字盖章的，以 counsel 归档 PDF 置换本文件夹对应件后再外发。**#6** 于**每次实际外发**后登记。

### 3.0 定稿外发阻塞（与 [IR-LP-AUDIT-CLOSURE-001](../IR-LP-AUDIT-CLOSURE-001.md) 同源）

| 阻塞项 | 阶次 | 状态 | 负责 | 解除条件 |
|--------|------|------|------|----------|
| Legal **§3 #3–5** 勾决 | ① | **待 counsel** | Legal | 辖区披露 / 要约 / NDA 书面 OK；签章 PDF 可置换敏感件 |
| 终版 Demo mp4 | ① | **未落盘** | IR/产品 | [IR-DEMO-RECORDING-CHECKLIST-001](IR-DEMO-RECORDING-CHECKLIST-001.md) 完成 + 重打包 |
| [19](19-对外分发与访问登记.md) 实填 | ① | **每次外发** | IR | 真实机构/媒介/NDA 行（**非**虚构示例） |
| Pack A 真值表 | ② | **① 旁证 only** | Eng+IR | staging **A–H** + [RUNBOOK §0.1](../data-room/evidence/RUNBOOK-III-PACK-A.v1.md) 后填 ID |
| Pack B 签核/财务 | ② | **draft** | Legal/Finance | [PACK-B-STATUS](../data-room/evidence/PACK-B-STATUS.v1.md) 执行清单 |

**preview**：机读 **①** 绿 + IR **§3 #1–2,7** 可支撑**预览**外发；邮件/登记须标 **preview**，**不得**称 Legal 已定稿。

**外发前机读（建议）**：`bash scripts/gates/ir-preview-send-preflight.sh` → [IR-PRE-SEND-MANUAL-001](../IR-PRE-SEND-MANUAL-001.md) **§0 / §7**。

**Counsel 交接**：签核项真源 [31-法务签核清单](31-法务签核清单.md)；zip 导出 **§3** IR 栏 + **§3.0** 阻塞表；**preview** 不得勾 Legal **#3–5** 冒充定稿。

### 3.0a Counsel 签核页（定稿 · 事实发生后填写）

| 字段 | 值 |
|------|-----|
| **Legal signed** | **否** |
| **Counsel 姓名 / 律所** | |
| **签核日期** | |
| **覆盖范围** | `TravelTrust-Investor-Materials-v1.3.zip` 内 PDF/PPTX（列编号） |
| **NDA / 辖区** | |
| **签章 PDF 归档路径** | `legal/` 或 counsel 卷宗（**不入**投资人 zip） |

签核完成后：IR 勾 **§3** Legal 栏 → `export FUNDRAISING_LP_LEGAL_SIGNED=1` → `bash scripts/gates/check-fundraising-lp-final-human-blockers.sh`

## 3.1 反馈回灌（首轮）

| 日期 | 投资人/机构（可代号） | 反馈摘要 | 纳入版本（registry `release`） | Owner |
|------|----------------------|----------|-------------------------------|-------|
| YYYY-MM-DD |  |  |  |  |

## 4. PDF 生成（工具中立）

Markdown → PDF 可使用团队既定工具链（如 Pandoc、Keynote/Slides 导出、Acrobat 汇编）；**不要求**投资人包内包含生成脚本。定稿 PDF **只进** `signed-pdfs/`，与 HTML/印刷校样一致后再盖章分发。

## 5. 与 31 的关系

细项条款与对外禁区仍可对照 [31-法务签核清单](31-法务签核清单.md)；**本页**专注**导出物形态**与**人不触达仓库**的交付纪律。
