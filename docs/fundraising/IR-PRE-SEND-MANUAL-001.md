# IR · LP 外发前人工勾选表 · 001

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | IR-PRE-SEND-MANUAL-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 机读闸：[PACK-RELEASE-CHECKLIST-001.md](PACK-RELEASE-CHECKLIST-001.md) **§2.0–2.9 / §2.9a** · 法务终审：[internal/33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) · 外发登记：[internal/19](internal/19-对外分发与访问登记.md) |

---

## 0. 一页纸（preview 外发 · 复制执行）

| # | 动作 |
|---|------|
| 1 | `bash scripts/gates/ir-preview-send-preflight.sh`（PDF 新于 zip → `IR_PREVIEW_SEND_REBUILD=1`） |
| 2 | 勾选本表 **§1–§6**（Legal **未**签 → 仅 **preview**） |
| 3 | 邮件 **§7**（无 demo 须写明） |
| 4 | 附件 **仅** `dist/TravelTrust-Investor-Materials-v1.3.zip` |
| 4a | （定稿前）`FUNDRAISING_IR_CONTACT_NAME` + `_EMAIL`（+ 可选 `_PHONE`）→ `release-investor-lp-pack.sh` 写入 `00-START-HERE.txt` |
| 5 | [internal/19](internal/19-对外分发与访问登记.md) + 可选 [board/distribution-log](board/distribution-log.md) |

---

## 0.1 阶次与边界

| 阶次 | 本表 |
|------|------|
| **① 本地** | **适用** — 打 zip / 邮件外发前由 IR 勾选 |
| **② 测试网** | **不适用** — 见 [data-room/evidence/RUNBOOK-III-PACK-A.v1.md](data-room/evidence/RUNBOOK-III-PACK-A.v1.md) |
| **③ 生产** | **不适用** |

**机读 ≠ 可外发**：**preview 推荐** `bash scripts/gates/ir-preview-send-preflight.sh` **exit 0**（= 阻塞一览 + zip 新鲜度 + pre-send）；或 `release-investor-lp-pack.sh` / **PACK §2.0** 分步等价。

---

## 1. 机读（① · 打勾前已跑）

| ☐ | 项 |
|---|-----|
| ☐ | **preview 外发（推荐）**：`bash scripts/gates/ir-preview-send-preflight.sh` **exit 0** |
| ☐ | **或** `bash scripts/gates/release-investor-lp-pack.sh` **exit 0**（governance + export + pre-send 分步） |
| ☐ | **仅改** `external/**/*.md`、**本轮不发 zip**：`bash scripts/gates/fundraising-external-touch.sh` **exit 0**（见 [IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md)） |
| ☐ | 外发文件仅为 **`dist/TravelTrust-Investor-Materials-v{release}.zip`**（或经 IR 书面同意的单 PDF；单发须用包内 **`00-START-HERE.txt`** 模板） |

**Release / 执行人 / 日期**：`v____` · IR：________ · 日期：________

---

## 2. 成品与叙事（人工）

| ☐ | 项 |
|---|-----|
| ☐ | **版本**：zip 名与各 PDF **`v{release}`** 与 `registry/fundraising-external-numeric-anchors.v1.json` 一致 |
| ☐ | **读序**：口头/邮件与 [external/00-START-HERE.md](external/00-START-HERE.md) 一致（**04 Pitch → 03 FAQ**；**非**按 01→08 文件名顺读；IC 附录**不进** LP zip 默认链） |
| ☐ | **Deck**：主 Deck **15** 页；抽检 **p4–p5** 协议栈图例为 **1–5**（非圈号）；Speaker Notes 无对内俚语 |
| ☐ | **FAQ / 导读**：包内 **无** `monorepo`、**连招**、裸露 `.md` 路径；`00-START-HERE.txt` 主路径干净 |
| ☐ | **08**：已说明 **NDA 后** 才开 Data Room 索引；未暗示 zip 含未授权经营明细 |
| ☐ | **单发 Pitch/IC/IM**：已粘贴 **`ATTACHMENT FORWARD CHAIN`** 或等效 briefing |
| ☐ | **IR 联系人**：包内 `00-START-HERE.txt` **无** `________________`（或 preview 邮件正文已写清联系人） |

---

## 3. Demo（若有 mp4）

| ☐ | 项 |
|---|-----|
| ☐ | 包内 **无** demo → 邮件/口头已说明「无演示片，可按导读继续」（录屏表 [internal/IR-DEMO-RECORDING-CHECKLIST-001](internal/IR-DEMO-RECORDING-CHECKLIST-001.md)） |
| ☐ | 包内 **有** `demo/TravelTrust-Product-Demo-v{release}.mp4` → **已播放**：约 **90s**、**一镜**、节拍与 Storyboard **附录 A** 一致、画面/口播标明 **demo 或 staging**（非生产） |
| ☐ | **禁止**：占位/标题卡长片未说明仍外发 |

---

## 4. 合规 PDF（法务 · 须真人）

| ☐ | IR | Legal |
|---|-----|-------|
| ☐ | 抽检 ≥**1** 份 PDF + ≥**1** 份 PPTX：**非要约 / 非投资建议** 仍在；版本行与 Release 一致 | ☐ |
| ☐ | 辖区披露、CTA、NDA 范围已与 counsel 对齐（见 [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md)） | ☐ |
| ☐ | 需签章件已用 counsel 归档 PDF **置换**后再发（非草稿冒充终稿） | ☐ |

**Legal 签字 / 日期**：________

---

## 5. 外发后（每次实际发送）

| ☐ | 已在 [internal/19](internal/19-对外分发与访问登记.md)（及必要时 `board/distribution-log.md`）登记：**包名**、**release**、媒介、NDA、是否含 **demo** |
| ☐ | （发前）`bash scripts/gates/verify-investor-zip-layout.sh` **exit 0**（或已含于 `release-investor-lp-pack.sh`） |

---

## 6. 签字

| 角色 | 姓名 | 日期 |
|------|------|------|
| IR 发件人 | | |
| Legal（若本轮需） | | |

---

## 7. Preview 外发邮件模板（① · 可复制）

> **须**与 [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) **§3.0** 一致：Legal **未**签核时 **仅 preview**；包内 **无** demo mp4 时须在正文说明。

**主题（CN）**：`TravelTrust · 投资人材料预览 v{release}（非最终法律定稿）`

**正文（CN）**：

```
您好，

附件为 TravelTrust 投资人材料预览包 TravelTrust-Investor-Materials-v{release}.zip（① 本地机读已生成）。

建议读序：04 路演 Deck → 03 FAQ（详见包内 00-START-HERE.txt）。合伙人 IC 附录不在本 zip 内，如需可在 NDA 后由 IR 另行提供。
本包当前不含产品演示视频（demo/ 无 mp4）；如需录屏可在 NDA 后另行安排。

本材料为 preview，不构成投资建议或要约；法律定稿与 Data Room 完整件在 NDA 后提供。

祝好，
{签名}
```

**主题（EN）**：`TravelTrust · Investor materials preview v{release} (not final legal sign-off)`

**正文（EN）**：与包内 `00-START-HERE.txt` 读序一致；注明 **preview**、**no demo mp4**（若适用）、**not an offer**.

**状态机读**：`bash scripts/gates/ir-outbound-status.sh`

### 7.1 会后跟进（preview · 全包）

**主题**：`TravelTrust · 会后材料 v{release}（preview）`

```
感谢今日交流。附件为投资人材料包 v{release}（preview，非最终法律定稿）。

建议读序：04 路演 Deck → 03 FAQ（详见 00-START-HERE.txt）。
{无 demo 则写：本包不含产品演示视频（demo/ 目录无 mp4）。}

期待您的反馈。
```

### 7.2 DD 节奏（NDA 后 · 仍须 Legal 对具体件）

**主题**：`TravelTrust · DD reading pack v{release}`

```
在 NDA 约定范围内，附上材料包 v{release}。深度阅读可从 05 Litepaper / 06 Whitepaper 切片开始；
Data Room 索引（08）与签核原件将按法务流程另行开通，不在本 zip 默认承诺范围内。
```

---

**② 证据（不进 zip）**：命令清单 [RUNBOOK-III-PACK-A.v1.md §1](data-room/evidence/RUNBOOK-III-PACK-A.v1.md) · 前置 `bash scripts/gates/runbook-iii-pack-a-preflight.sh` · 见 [internal/50 §5.4.7](internal/50-企业级投资杠杆审计.md)。
