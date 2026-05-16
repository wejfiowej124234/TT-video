# IR · 融资材料维护冻结 · 001（审计后）

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | IR-MAINTENANCE-FREEZE-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 本页 · [fundraising/README.md](README.md)「后续口径」· [IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md) |

---

## 目的

LP 收件人视角 **多轮审计（①）** 的 **流程 / 机读闸 / IR 导航文档**（批次 **17–26**）已收口；**人工作业**（Legal、Demo、登记、**②** 真值）见 [IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md)。自本日起 **默认不再扩展** IR 基础设施，避免「融资材料长成操作系统」。

**不**改变：[internal/34](internal/34-融资分层冻结与单向流转.md) 的 **external/internal 分层**；**不**替代 **②** Runbook / **③** 生产门禁。

---

## 冻结（默认禁止，除非单独立项）

| 类别 | 冻结内容 |
|------|----------|
| **新文档 SKU** | 新增 `IR-*-00X.md`、新 audit 编号、新 runbook 专篇 |
| **新机读闸** | 新 `scripts/gates/check-fundraising-*.sh`（**缺陷修复**除外） |
| **新导出范式** | 新 zip 目录结构、新 registry 维度、默认 Build 必过项 |
| **PACK 膨胀** | 新增 §2.10+ 检查大类（**勘误/勾选措辞** 除外） |

**例外流程**：须 IR Owner **书面**说明「为何不能复用现有闸」+ 更新 [IR-OPERATOR-INDEX-001](IR-OPERATOR-INDEX-001.md) **一条**；**不**默认同批改 07/spec 完成度。

---

## 允许（日常维护）

| 类别 | 允许改动 | 收口动作 |
|------|----------|----------|
| **对外叙事** | `docs/fundraising/external/**/*.md`（含 `en/`） | 见下表「触达矩阵」 |
| **登记 / 证据事实** | [internal/19](internal/19-对外分发与访问登记.md) 实填；Runbook/Pack B **真值表**（**仅事实**） | 无自动闸 |
| **法务 / 财务实件** | `data-room/`、`legal/`（按 33/13） | 人工 |
| **缺陷修复** | 既有 gate/script **行为错误**（如 0 tests 假绿） | 同 PR 说明 |

---

## 触达矩阵（改了什么 → 跑什么）

| 你改了 | 最低命令（①） |
|--------|----------------|
| 仅 `external/**/*.md` 叙事 | `bash scripts/gates/fundraising-external-touch.sh` → 若发 zip 再 `release-investor-lp-pack.sh` |
| `export-ready/` 或 Deck/PDF 构建脚本 | `bash scripts/gates/release-investor-lp-pack.sh` |
| `investor_handoff_layout.py` / 导读逻辑 | `release-investor-lp-pack.sh`（会重写 `00-START-HERE.txt`） |
| 仅 `internal/` 登记或 Runbook 填表 | **无** 强制机读（**禁止**用填表冒充 ② 已验） |
| 准备真实外发 | `release-investor-lp-pack.sh` + [IR-PRE-SEND-MANUAL-001](IR-PRE-SEND-MANUAL-001.md) + [19](internal/19-对外分发与访问登记.md) |
| 查阻塞项（不发版） | `bash scripts/gates/ir-outbound-status.sh`（**信息**，非闸） |
| preview 外发（①） | `bash scripts/gates/ir-preview-send-preflight.sh`（`IR_PREVIEW_SEND_REBUILD=1` 可选重打 zip） |

---

## 与新 Release 立项

Bump **`registry/fundraising-external-numeric-anchors.v1.json` `release`** 时：

1. 同步改 **所有** `v{release}` 文件名与 zip 名。  
2. 跑 **`release-investor-lp-pack.sh`** 全量。  
3. 更新 [IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md) **产物行**（**不**自动提升 ②③ 结论）。

---

## 相关

- 合伙人摘要：[IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md)  
- 全索引：[IR-OPERATOR-INDEX-001](IR-OPERATOR-INDEX-001.md)

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-16 | 初版：审计后冻结 + 触达矩阵；`fundraising-external-touch.sh`（Win 须可用 `python`，勿依赖商店占位 `python3`）。 |
| 2026-05-16 | 触达矩阵增 `ir-outbound-status.sh`；**19**/**board** 外发五步与 **31↔33** 对拍。 |
