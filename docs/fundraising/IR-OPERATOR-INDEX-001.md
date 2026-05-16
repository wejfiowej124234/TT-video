# IR · 投资人材料操作索引 · 001

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | IR-OPERATOR-INDEX-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 本页为 IR 操作导航；**①** [PACK-RELEASE-CHECKLIST-001](PACK-RELEASE-CHECKLIST-001.md) · **②** [data-room/evidence/RUNBOOK-III-PACK-A.v1.md](data-room/evidence/RUNBOOK-III-PACK-A.v1.md) |

一页看清 **① LP 外发** 与 **② III 证据** 分工（**禁止跳阶**）。

**已完成 / 未完成填表（真源）** → [data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md)（补一项改表 → 跑 §4 命令）。合伙人摘要：[IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md)。

**单次外发（①）**：`ir-preview-send-preflight.sh`（推荐）或 `ir-outbound-status` → `release-investor-lp-pack` → [IR-PRE-SEND](IR-PRE-SEND-MANUAL-001.md) → 发 zip → [internal/19](internal/19-对外分发与访问登记.md)（跨境 [board/distribution-log](board/distribution-log.md)）

---

## ① 本地 · LP 包（可进 zip）

| 步骤 | 命令 / 文档 |
|------|----------------|
| 0 preview 编排 | `bash scripts/gates/ir-preview-send-preflight.sh`（`IR_PREVIEW_SEND_REBUILD=1` 重打 zip） |
| 1 重建 + 机读 | `bash scripts/gates/release-investor-lp-pack.sh`（或含于步 0） |
| 2 zip 结构 | `bash scripts/gates/verify-investor-zip-layout.sh`（或含于 release） |
| 3 人工勾选 | [IR-PRE-SEND-MANUAL-001](IR-PRE-SEND-MANUAL-001.md) |
| 4 清单 | [PACK-RELEASE-CHECKLIST-001](PACK-RELEASE-CHECKLIST-001.md) **§2.9 / §2.9a** |
| 5 录屏（若有 mp4） | [internal/IR-DEMO-RECORDING-CHECKLIST-001](internal/IR-DEMO-RECORDING-CHECKLIST-001.md) |
| 6 外发登记 | [internal/19-对外分发与访问登记](internal/19-对外分发与访问登记.md) |

**产物**：`dist/TravelTrust-Investor-Materials-v{release}.zip`（当前 **1.3**）

**叙事真源**：[external/00-START-HERE.md](external/00-START-HERE.md) · [START-HERE-SSOT-001](START-HERE-SSOT-001.md)

---

## ② 测试网 · III 证据（不进 zip）

| 步骤 | 命令 / 文档 |
|------|----------------|
| 凭证离库 | [internal/IR-STAGING-CREDENTIALS-TEMPLATE-001](internal/IR-STAGING-CREDENTIALS-TEMPLATE-001.md) |
| 机读前置 | `bash scripts/gates/runbook-iii-pack-a-preflight.sh` |
| UI + 真值表 | [data-room/evidence/RUNBOOK-III-PACK-A.v1.md](data-room/evidence/RUNBOOK-III-PACK-A.v1.md) **§1** |
| Pack B | [data-room/evidence/PACK-B-STATUS.v1.md](data-room/evidence/PACK-B-STATUS.v1.md) |
| 杠杆排序 | [internal/50 §5.4.7](internal/50-企业级投资杠杆审计.md) |

---

## 机读脚本速查

| 脚本 | 阶次 |
|------|------|
| `release-investor-lp-pack.sh` | ① |
| `check-fundraising-lp-pack-pre-send.sh` | ① |
| `verify-investor-zip-layout.sh` | ① |
| `runbook-iii-pack-a-preflight.sh` | ①旁证 + ②前置 |
| `check-fundraising-ir-governance.py --enforce` | 维护者改稿 |
| `fundraising-external-touch.sh` | **仅**改 `external/**/*.md`（不重建 PDF） |
| `ir-preview-send-preflight.sh` | **preview 外发**编排（status + zip 新鲜度 + pre-send + zip layout + **定稿阻塞一览**） |
| `check-fundraising-lp-final-human-blockers.sh` | **final 定稿**外发（人工作业 ack；**非** preview） |
| `ir-outbound-status.sh` / `print_ir_outbound_pending.py` | 未完成项状态（**信息**，非闸） |

**维护冻结**：[IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md)

**环境变量**： [PACK-RELEASE-CHECKLIST-001](PACK-RELEASE-CHECKLIST-001.md) **§2.9a**

---

## 未完成收口（一览）

**勿在此重复维护** — 真源表：[LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md)（§1 已完成 · §2 ① 人工 · §3 ② · §4 补完跑啥）。

机读快照：`bash scripts/gates/ir-outbound-status.sh`

---

## 边界口诀

- 对方只拿 **zip 内文件** — [LP-OUTBOUND-PACK-001](LP-OUTBOUND-PACK-001.md)  
- **① 机读绿 ≠ ② staging 全矩阵 ≠ ③ 生产** — 根 README / AGENTS.md
