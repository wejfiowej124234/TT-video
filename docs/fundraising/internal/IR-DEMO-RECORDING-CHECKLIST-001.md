# IR · 投资人 Demo 录屏勾选表 · 001（打印用）

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | IR-DEMO-RECORDING-CHECKLIST-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | [04-PitchDeck-Storyboard](../external/04-PitchDeck-Storyboard.md) **附录 A** · `export-ready/demo/SCREEN-RECORDING-BRIEF.txt` |

**阶次**：**①** 外发资产；**非** **②** staging III 证据（III 见 [RUNBOOK-III-PACK-A](../data-room/evidence/RUNBOOK-III-PACK-A.v1.md)）。

**当前状态（2026-05-16）**：**未录制** — `export-ready/demo/` 仅有 `SCREEN-RECORDING-BRIEF.txt`；**现行** `TravelTrust-Investor-Materials-v1.3.zip` **不含** `TravelTrust-Product-Demo-v1.3.mp4`。外发须说明无演示片或完成本表后再打包。

---

## 录屏前

| ☐ | 项 |
|---|-----|
| ☐ | 环境为 **demo 或 staging**（非生产），凭证见离库模板 [IR-STAGING-CREDENTIALS-TEMPLATE-001](IR-STAGING-CREDENTIALS-TEMPLATE-001.md)（**勿**提交填好的文件） |
| ☐ | 输出路径：`external/export-ready/demo/TravelTrust-Product-Demo-v{release}.mp4`（当前 **1.3**） |
| ☐ | **一镜 ~90s**（可剪片头尾 ≤3s，**无**跳剪掩盖断点） |
| ☐ | 浏览器隐私窗；关闭通知；分辨率 ≥1080p 建议 |

## 分镜（对拍附录 A）

| ☐ | 时段 | 画面 |
|---|------|------|
| ☐ | **0:00–0:10** | 地址栏可见 + **demo/staging** 角标或口播 |
| ☐ | **0:10–0:40** | 市场进入 → **下单** → **订单详情**（同一会话） |
| ☐ | **0:40–1:10** | **托管 / Escrow** 状态可见（同一订单） |
| ☐ | **1:10–1:30** | **争议 / 评分 / 社区** 任选其一、最短一屏 |
| ☐ | **片尾** | 口播或字幕：与**已发布公告 + 环境标签**一致（非全面投产暗示） |

## 录屏后

| ☐ | 项 |
|---|-----|
| ☐ | 实际时长：_____ 秒（目标 **~90**） |
| ☐ | 已全片播放：画质可接受、音画同步 |
| ☐ | **无**未审计 GMV/订单/DAU 口播 |
| ☐ | `bash scripts/gates/release-investor-lp-pack.sh`（或至少 pre-send）**exit 0** |
| ☐ | [IR-PRE-SEND-MANUAL-001](../IR-PRE-SEND-MANUAL-001.md) Demo 栏已勾 |

**未就绪**：**不要**把占位 mp4 打进 zip；用 `00-START-HERE.txt` 外发模板说明无演示片。

---

## 落盘与打包（① · 终版 mp4 完成后）

| 步 | 动作 |
|----|------|
| 1 | 确认文件：`docs/fundraising/external/export-ready/demo/TravelTrust-Product-Demo-v1.3.mp4`（**非** `RELEASE_LP_WITH_DEMO_BUILD` 占位片） |
| 2 | 全片播放质检（~90s、staging/demo 角标、无未审计数字口播） |
| 3 | `bash scripts/gates/release-investor-lp-pack.sh`（**勿**设 `RELEASE_LP_WITH_DEMO_BUILD=1`） |
| 4 | `bash scripts/gates/ir-preview-send-preflight.sh` 确认 zip 含 mp4 且非占位 |
| 5 | [IR-PRE-SEND](../IR-PRE-SEND-MANUAL-001.md) Demo 栏 + [19](19-对外分发与访问登记.md) 登记 **含 demo** |

**分镜真源**：`export-ready/demo/SCREEN-RECORDING-BRIEF.txt`（**不进** zip）。

**签字**：IR __________ · 日期 __________
