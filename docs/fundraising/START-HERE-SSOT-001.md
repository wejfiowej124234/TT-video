# START-HERE 真源与双入口 · 001

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | START-HERE-SSOT-001 |
| **Version** | 1.1.5-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 叙事入口 Markdown：[external/00-START-HERE.md](external/00-START-HERE.md) · 包内纯文本：`external/export-ready/00-START-HERE.txt`（由 `scripts/tools/investor_handoff_layout.py` 的 `start_here_text` / `zip_root_start_here_text` 生成） · 导出前检查：[PACK-RELEASE-CHECKLIST-001.md](PACK-RELEASE-CHECKLIST-001.md) |

---

## 1. 目的

**对外「默认阅读顺序」**只认一份 Markdown 真源，同时保留 zip 内 **`00-START-HERE.txt`** 的机器可读编目；**消除**旧版 **PARTNER SKIM** 与 **Pitch→Memo→FAQ** 并存的隐性双轨。

---

## 2. 主从关系（叙事真源 + 同口径纯文本）

| 对象 | 路径 | 角色 |
|------|------|------|
| **主（叙事与首读路径）** | [external/00-START-HERE.md](external/00-START-HERE.md) | **唯一对外叙事真源**：一句话、阶段、**04 Pitch → 03 FAQ**、Demo **~90s**（若有）、**08（Data Room 索引）NDA 期望**、**附件转发链**、联系占位、英文。 **Partner 深问顺序** 仅 IR 段（见 `.md` 与 PACK-RELEASE **§2.4**），**不**进 LP 默认路径。 |
| **从（包内纯文本）** | `external/export-ready/00-START-HERE.txt`；`--omit-markdown` zip 根另有 `00-START-HERE.txt`（`zip_root_start_here_text`） | **与主同源**：开篇 **中英阶段定性** + **RECOMMENDED READ ORDER**；**LP 可复制**外发模板（单发 Pitch/IC、zip、微信）；文末 **`IR only`** 块含 Partner 深问顺序备忘（**不**在 LP 主路径）；**READ IN ORDER** = 文件名编目，**非**第二套必读序。包内说明 **不含代码工程仓库**（无 monorepo 用语）。 |

**结论**：对外沟通、邮件与路演 briefing **只引用** **`external/00-START-HERE.md`**；说明「包内从哪打开」时指 **`00-START-HERE.txt` 开篇**（阶段句 + 默认读序），二者语义已对齐。

---

## 3. 导出责任

| 责任方 | 内容 |
|--------|------|
| **IR / 发布 Owner** | 改默认读序、**阶段定性**或 Demo 口径 → **先**改 **`external/00-START-HERE.md`**，再改 **`investor_handoff_layout.py`** 中英阶段模板与之同批，并跑导出使 **`00-START-HERE.txt`** 由脚本重写；发件前执行 [PACK-RELEASE-CHECKLIST-001.md](PACK-RELEASE-CHECKLIST-001.md)。 |
| **维护者** | **禁止**手改 `export-ready/00-START-HERE.txt` 冒充长期真源（易被下次 `write_start_here` 覆盖）；须改 **`investor_handoff_layout.py`** 内模板与 `.md` **同批**对拍。 |

---

## 4. 同步规则

1. **叙事 / 默认读序 / 阶段定性（公告+环境标签）/ Demo 时长（~90s）/ Data Room（08）NDA 期望** → 只改 **`external/00-START-HERE.md`** 与同概念英文段。  
2. **编目行、Release、文件名** → 改 **`investor_handoff_layout.py`** 中 `start_here_text` / `zip_root_start_here_text`（含包内 **中英阶段** 模板）与 **`00-README.md`** 表体一致，并重新生成 **`00-START-HERE.txt`**。  
3. **zip 不含 .md** → 邮件须指向 **`00-START-HERE.txt` 开篇**（阶段句 + 默认读序），并确认已与 `.md` 同源（见清单 §2.4）。

---

## 5. 禁止事项

- **禁止**对外再推「PARTNER SKIM 才是官方路径」等与 **00-START-HERE.md** 冲突的说法。  
- **禁止**在 **`external/*.md`** 中写入 `scripts/tools` 等仓库泄漏串（对外 Markdown 门禁）；本页为 **internal**，可指脚本路径。  
- **禁止**把 `internal/` 路径写进对外正文（[internal/34](internal/34-融资分层冻结与单向流转.md)）。

---

## 6. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-16 | **1.1.5**：维护者/IR 文档统一 **Partner 深问顺序 / deep-dive order**（**F24**、PACK **§2.4**）；LP 包内 **`IR only`** 块已用新用语（见 **1.1.4**）。 |
| 2026-05-16 | **1.1.4**：LP 口径收口—Partner 深问顺序移至包内 txt **`IR only`** 块；**无 monorepo**；对外 **03-FAQ PDF** 无 LP 侧题号连读导航；PDF 链指改为同包 PDF 名；**demo/** 外发仅 mp4。见 **PACK-RELEASE §2.8**。 |
| 2026-05-15 | **1.1.3**：**`ATTACHMENT FORWARD CHAIN`** 段首增 **Partner 连招 / Partner combo（FAQ）** 中英导航句（与 **Deck p13 / IC Notes / `03-FAQ`** 同序）；**`external/00-START-HERE.md`**「附件转发链」下增同义段；**`investor_handoff_layout.py`** 仍为唯一生成源；见 **PACK-RELEASE §2.4**、**46 · F24**、**LP-OUTBOUND §1**。 |
| 2026-05-15 | **1.1.2**：包内 **`00-START-HERE.txt`** 增补 **`ATTACHMENT FORWARD CHAIN (IR)`**（单发 Pitch/IC、zip 封面、微信一句等可复制模板）；**`external/00-START-HERE.md`** 增「附件转发链」互指；**`investor_handoff_layout.py`** 为唯一生成源。 |
| 2026-05-15 | **1.1.1**：**00-START-HERE** 增补 **08 / NDA** 期望段；**investor_handoff_layout** 编目 **00/08** 行与上文语义对齐；已重写 **`export-ready/00-START-HERE.txt`**。 |
| 2026-05-15 | **1.1.0**：DEFAULT 与 `.md` 对齐；废止 PARTNER SKIM 双轨叙述；Demo 统一 **~90s**；链 PACK-RELEASE-CHECKLIST-001。 |
| 2026-05-15 | 1.0.0：初版主从与「不改脚本」约束（已由 1.1.0 吸收：脚本模板已与真源对齐）。 |
