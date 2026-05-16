# LP 外发包 · 001（首次接触 / 跟进 / 深聊）

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | LP-OUTBOUND-PACK-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-15 |
| **SSOT** | 对外编号与 `export-ready/` 命名：[external/00-README.md](external/00-README.md) · 分层与禁止回流：[internal/34-融资分层冻结与单向流转.md](internal/34-融资分层冻结与单向流转.md) · 首印冻结与反馈入口：[LP-FIRST-IMPRESSION-REGISTRY-001.md](LP-FIRST-IMPRESSION-REGISTRY-001.md) |

---

## 1. 本文用途（读者）

**读者**：IR / 创始人侧执行外发的人。  
**不**：替代 [external/00-README.md](external/00-README.md) 的全量编目；不修改任何 Deck / Storyboard **正文**。

**目标**：把「第一次发什么、会后补什么、进入 DD 前给什么」拆成三张**可勾选清单**，并写死 **external（可进投资人 zip）** 与 **internal（绝不默认进包）** 的边界，避免把代码工程仓库、内仓路径或未授权法档发给对方。

**基金侧会前（对内）**：口头链 **Analyst→Principal→Partner→IC** 易把项目归成支付/OTA/币桶，防桶口播与 JSON 复盘样例见 **[internal/51](internal/51-基金内部四跳传播与误归类防护.md)**（**不**进 zip）。**Partner 深问顺序**（仅 IR 发件人备忘，顺序 **28→3→23→29→30·p13·18→20→31·16**）：与 **Deck p13** / IC Notes 同源—见 [PACK-RELEASE-CHECKLIST-001](PACK-RELEASE-CHECKLIST-001.md) **§2.4**；**不**写入对外 `03-FAQ` PDF 或 LP 默认读路径。

## 2. external 与 internal 边界（硬规则）

| 区域 | 谁能出现在「发给 LP 的附件 / zip」里 | 典型内容 |
|------|----------------------------------------|----------|
| **`docs/fundraising/external/`** | **可以**（仅通过 [export-ready/](external/export-ready/README.md) 等已终审导出物；见 [internal/33](internal/33-投资人Data-Room导出包与IR法务终审清单.md)） | `01`–`08` 叙事 Markdown 的真源；`export-ready/` 下 **v{release}-CN|EN** 的 PDF/PPTX/导读；demo 成片（若包内包含） |
| **`docs/fundraising/internal/`** | **不可以**默认进投资人包 | 决策、台账、导出清单、会议纪要、渠道复盘、任务母表、分发登记指针等 |
| **`data-room/`、`legal/`、`board/`** | **不可以**作为冷启动默认附件；**仅**在流程与 NDA 约定后按件提供 | 签核件、法档、投后运维与登记 |
| **`docs/spec/`** | **不可以**以路径或整仓形式外发；数字与参数真源仍在 spec，**对外句**只落在 `external/` 已发布正文 | 工程 SSOT |

**执行口诀**：对方手里只应出现 **zip 内可见文件**；zip 由导出脚本或 [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) 流程生成，**不是**把 `docs/fundraising/` 整棵给对方。

**发前（①）**：`bash scripts/gates/release-investor-lp-pack.sh` → 人工 [IR-PRE-SEND-MANUAL-001](IR-PRE-SEND-MANUAL-001.md) → [PACK-RELEASE](PACK-RELEASE-CHECKLIST-001.md) **§2.9**。

**preview vs final**：Legal **未**签 → **仅 preview**（邮件模板 [IR-PRE-SEND §7](IR-PRE-SEND-MANUAL-001.md)）；**无** demo mp4 → 正文写明「无演示片」。`python scripts/tools/print_ir_outbound_pending.py` 查看阻塞项。

**与首印台账关系**：首次外发主 Deck 若以 **v1.3 candidate** 为冻结锚，登记与回滚见 [LP-FIRST-IMPRESSION-REGISTRY-001.md](LP-FIRST-IMPRESSION-REGISTRY-001.md)；**本页不**改 Deck 内容，只约束**外发组合**。

---

## 3. 命名与版本

- **文件名**：与 [external/00-README.md](external/00-README.md) 一致，使用 `export-ready/` 内 **`{编号}-{主题}-v{release}-CN|EN.{pdf|pptx}`**（及包内 `00-START-HERE.txt`、demo 等）。
- **下文清单**以「**当前 Release**」表述；执行时把 `{release}` 换成当次 zip 的同一版本号（例如 **1.3**），并保证中英 **Release** 行一致。

---

## 4. 阶段一：首次接触（冷启动）

**preview / final**：Legal **未**签 → 仅 **preview**（[IR-PRE-SEND §7](IR-PRE-SEND-MANUAL-001.md)）；**推荐**发整包 `TravelTrust-Investor-Materials-v{release}.zip` + 邮件说明读序，或仅 **01** 单 PDF。**无** demo mp4 时正文写明（`python scripts/tools/print_ir_outbound_pending.py`）。

**目的**：让对方在 **5–10 分钟**内建立「赛道 + 你们是谁 + 为何值得回邮件」；**不**默认塞白皮书全文或 Data Room 索引。

| 勾选 | 外发物（external / export-ready） | 备注 |
|:----:|-----------------------------------|------|
| ☐ | `01-OnePager-v{release}-CN.pdf` 与/或 `01-OnePager-v{release}-EN.pdf` | 视对方语言；两页「一页」里先选 **01** 或按 [00-README](external/00-README.md) 听众表选用 **02**（见阶段二） |
| ☐ | 包内 **`00-START-HERE.txt`**（若本次 zip 含该导读） | **开篇**中英阶段定性 + **DEFAULT READ ORDER**；叙事真源 [00-START-HERE.md](external/00-START-HERE.md)，双入口纪律 [START-HERE-SSOT-001.md](START-HERE-SSOT-001.md) |
| ☐ | **demo mp4**（**仅当** `export-ready/demo/TravelTrust-Product-Demo-v{release}.mp4` 终版已落盘且已重打 zip） | **当前 v1.3 zip 默认无 mp4**；冷启动勿承诺「包内必有片」。有终版时：可第二封补 demo 或发含 mp4 的全包 |

**本阶段默认不发（除非对方明确索要）**：`04` Deck 全本、`05` Litepaper、`06` Whitepaper 全文、`07`、`08`、`04-IC-Memo`（IC 附录）。

**internal 侧（不进包）**：对方名单、话术草稿、渠道来源、[19](internal/19-对外分发与访问登记.md) 登记、法务备注——留在 `internal/` 或 CRM，**不**粘贴进 `external/` 正文。

---

## 5. 阶段二：跟进（会后 / 有互动未进 DD）

**目的**：补齐「主叙事 + 执行摘要 + 常见问题」，支撑二次会议或内部转述。

| 勾选 | 外发物（external / export-ready） | 备注 |
|:----:|-----------------------------------|------|
| ☐ | `04-PitchDeck-v{release}-CN.pdf` / `EN.pdf`（及视需要 `.pptx`） | **主路演材料**；页数与页序以 Storyboard 与导出为准，**本页不**改 Deck |
| ☐ | `02-Executive-Summary-v{release}-CN.pdf` / `EN.pdf` | 机构内转述优先 |
| ☐ | `03-FAQ-v{release}-CN.pdf` / `EN.pdf` | 会后答疑 |
| ☐ | `demo/TravelTrust-Product-Demo-v{release}.mp4`（若包内包含） | 与 [00-START-HERE.md](external/00-START-HERE.md) Demo 段一致（**~90s** 目标） |

**可选（视对方职级与合伙人会前节奏）**：`04-IC-Memo-v{release}-*.pdf` / `.pptx`（**04b**；与主 Deck 对齐，见 [00-README](external/00-README.md)）。

**本阶段仍默认不发**：`06` 全文作冷附件（可口述「需要时发 Litepaper / 白皮书节选」）、`08` Data Room 索引（**NDA 后**，见阶段三）。

**internal**：会议纪要、内部对对方基金的判断、下一步 owner——**仅** [internal/](internal/00-融资文档地图.md) 工作仓；外发邮件正文里**不要**出现 `internal/` 或 `docs/spec/` 路径。

---

## 6. 阶段三：深聊（进入中度 / 深度尽调节奏）

**目的**：在已建立信任与节奏的前提下，提供 **更长阅读** 与 **协议经济补充**；**Data Room 索引与原件**仍遵循法务与 NDA 流程，不通过「多塞附件」替代。

| 勾选 | 外发物（external / export-ready） | 备注 |
|:----:|-----------------------------------|------|
| ☐ | `05-Litepaper-v{release}-CN.pdf` / `EN.pdf` | 中度尽调 |
| ☐ | `06-Whitepaper-v{release}-CN.pdf` / `EN.pdf` | 深度尽调；阅读切片顺序见 [00-README](external/00-README.md) 对 **06** 的说明 |
| ☐ | `07-Protocol-Tokenomics-v{release}-*.pdf`（若包内生成） | Web3 / 协议经济补充；叙事真源仍以 **06** 与 **03** 为主（同 00-README） |
| ☐ | `08-Data-Room-Index-v{release}.pdf` | **默认在 NDA 后**与 data-room 流程配合；不替代签核原件 |

**本阶段仍由流程决定、不在此清单默认勾选**：`data-room/`、`legal/` 下具体签核 PDF；由 [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) 与法务出口统一。

**internal**：DD 问题清单、数据室填表、竞品对比表——留在 `internal/`；对方需要的**事实句**应已吸收进 `external/` 已发布正文，而不是把内表整段外贴（违反 [34 — 内→外禁止整段回流](internal/34-融资分层冻结与单向流转.md)）。

---

## 7. 最小组合（快速决策）

| 场景 | 最小 external 组合 |
|------|-------------------|
| 冷邮件首次触达（preview） | 全包 zip（推荐）或 **01**；邮件 [IR-PRE-SEND §7](IR-PRE-SEND-MANUAL-001.md) |
| 第一次视频会议后 24h 内 | 全包 zip 或 **04** + **02** + **03**；登记 [19](internal/19-对外分发与访问登记.md) |
| 对方明确进入 DD / 技术合伙人介入 | **05** + **06**（+ **07** 视赛道）+ **08**（**NDA 后**）+ 法务批准的 data-room 件 |

**外发前**：`bash scripts/gates/ir-outbound-status.sh` → `release-investor-lp-pack.sh` → [IR-PRE-SEND](IR-PRE-SEND-MANUAL-001.md)。

---

## 8. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-15 | 初版：三阶段外发清单 + external/internal 边界；不触及 Deck 正文 |
