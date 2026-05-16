# TravelTrust 投资者材料 — 单一目录说明

**TravelTrust 投资者材料** · 版本 **1.3** · 2026年5月

**读者对象**：机构投资人、基金侧、路演听众；法务/技术深度尽调相关方。**对外交付**以打 zip 后的 **`export-ready/`（包内多为 `signed-pdfs/`）** 为准——**仅 PDF/PPTX 等材料包**，**不含**代码工程仓库、内部工作区或未授权法档。

## 一套编号：改稿一处、外发一处

| 层次 | 放在哪里 | 哪份算「最好」 |
|------|----------|----------------|
| **正文（可审阅、可 diff）** | 本目录 `01`–`06` 的 `.md` 与 [en/](en/00-README.md) 双语 | **始终以 Markdown 为准**；有冲突时先改 `.md` 再重建 PDF。 |
| **外发成品（印刷/PPT/附件）** | 仅 [export-ready/](export-ready/README.md)（`v{release}-CN|EN`） | **PDF/PPTX 只认这里**；本目录根下**不再**放与 `.md` 平行的第二套 `.pdf`，避免两套脱节。 |

改完叙事后，按团队 **IR 导出清单**（internal 侧维护）中的命令集重建 `export-ready/` 再打 zip。

## 对外默认阅读顺序（唯一真源）

**对外承诺的「先读什么」只认一份**：[**00-START-HERE.md**](00-START-HERE.md)（Pitch → Memo → FAQ → Demo **~90s** 等）。邮件、路演前 briefing、zip 封面说明均须与此一致。

包内 **[export-ready/00-START-HERE.txt](export-ready/00-START-HERE.txt)**：**开篇**含中英阶段定性 + **DEFAULT READ ORDER**（由导出管线按发行版写入，与仓库内 [00-START-HERE.md](00-START-HERE.md) 同源）；**下表为文件名编目与重建顺序**，**不是**第二套「必读顺序」。

## 阅读顺序与外发文件名（00→08）

下表为 **`export-ready/` 成品文件名编目**（与 `00-START-HERE.txt` 中 **READ IN ORDER** 段一致）。**06** 白皮书为深度尽调，**非**冷启动首读；深读路径仍以 **00-START-HERE.md** 为准。

| 顺序 | 场景 / 对象 | 维护/改稿（本仓） | `export-ready/` 中的定稿 |
|------|-------------|-------------------|--------------------------|
| 00 | 包内导读 | — | `00-START-HERE.txt` |
| 01 | 首次接触 | [01-OnePager.md](01-OnePager.md) / [en/01-OnePager.md](en/01-OnePager.md) | `01-OnePager-v{release}-CN.pdf` / `EN.pdf` |
| 02 | 机构初筛 | [02-Investor-Executive-Summary.md](02-Investor-Executive-Summary.md) | `02-Executive-Summary-v{release}-…` |
| 03 | 会后答疑 | [03-FAQ.md](03-FAQ.md) | `03-FAQ-v{release}-…` |
| 04 | 路演主材料 | [04-PitchDeck-Storyboard.md](04-PitchDeck-Storyboard.md) | `04-PitchDeck-v{release}-CN/EN.pptx` 与同名 `.pdf`（**15** 页压缩主 Deck） |
| 04b | 合伙人会前 / IC 附录（可选） | 叙事与主 Deck / 06 对齐；构建与页序见 **internal** 侧 Pitch / 导出清单 | `04-IC-Memo-v{release}-CN/EN.pptx` 与同名 `.pdf` |
| 05 | 中度尽调 | [05-Litepaper.md](05-Litepaper.md) | `05-Litepaper-v{release}-…` |
| 06 | 深度尽调 | [06-Whitepaper.md](06-Whitepaper.md)（**片段**：摘要 → 第 06 节 → 第 11 节；全文仍非冷启动首读） | `06-Whitepaper-v{release}-…` |
| 07 | Web3 / 协议经济补充（矢量 PDF） | **叙述真源仍以 [06-Whitepaper.md](06-Whitepaper.md) 与 [03-FAQ.md](03-FAQ.md) 为主**；**不是**第二套 Tokenomics 故事。阅读指针（无新数字）：[07-Protocol-Tokenomics-Reader.md](07-Protocol-Tokenomics-Reader.md) | `07-Protocol-Tokenomics-v{release}-…` |
| 08 | NDA 后文件地图 | —（生成索引 PDF） | `08-Data-Room-Index-v{release}.pdf` |

另有 **demo**：`export-ready/demo/TravelTrust-Product-Demo-v{release}.mp4` — **默认读序**中与 [00-START-HERE.md](00-START-HERE.md) 一致：置于 **Pitch → Memo → FAQ** 之后；会议口播若需「看完 Deck 立刻看视频」，可紧接 Pitch（与 Storyboard **附录 A** 同节拍）。片长目标 **~90s**（15p 主 Deck **无**独立 Demo 页）；重建 zip 后须替换包内文件。**外发前**：占位成片须换真录屏；画面或口播须标明 **演示/测试网 vs 生产**。

## 两篇「一页」

**01** 偏市场与产品闭环；**02** 偏链上托管、费用与治理边界。按听众选用。

**English bundle** 与上表同序；中英文材料文首 **Release / 版本** 行须一致。

**外发 zip**：`--omit-markdown`，根目录另有带 `signed-pdfs/` 前缀的导读；条款与承诺以签署文本为准，公开材料不构成要约或业绩保证。
