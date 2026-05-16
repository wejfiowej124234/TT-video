# IR · LP 材料收件人视角审计 · 收口一页纸 · 001

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | IR-LP-AUDIT-CLOSURE-001 |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | 本页为**收口摘要**；**填表 / 补漏真源** → [LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md) · 操作 [IR-OPERATOR-INDEX-001](IR-OPERATOR-INDEX-001.md) · 机读 [PACK-RELEASE-CHECKLIST-001](PACK-RELEASE-CHECKLIST-001.md) |

> **日常补一项、改「已完成？」** → 只改 **[LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md)**（§1 机读 / §2 人工 / §3 ②）。

---

## 验收阶次（必读）

| 阶次 | 本页结论适用范围 |
|------|------------------|
| **① 本地** | **适用** — 对外 zip、PDF/PPTX、导读、机读闸、IR 流程文档 |
| **② 测试网** | **未闭** — Pack A Runbook 真值表仍空；须 staging 实测后填 |
| **③ 生产** | **未验** — 真 PSP / 主网 / Production GO **不在**本页范围 |

**禁止假完成**：**① 机读绿**、窄切片 PDF 包、维护者文档齐全 **不得** 表述为「基金已可投 / staging 已验收 / 生产已 GO」。

---

## ① 基础设施线（文档 / 机读 · 已收口）

| 类别 | 状态 |
|------|------|
| LP zip 机读链 | **已就绪** — `release-investor-lp-pack` · `ir-preview-send-preflight` · governance · zip verify |
| IR 导航 / 冻结 / 登记流程 | **已就绪** — OPERATOR / FREEZE / 19 / board / PACK §2.9 |
| Pack A **① 旁证** | **已落盘** — Runbook §0.1 · `logs/pack-a-preflight-*.txt` |
| **人工作业项** | **未闭** — 下表 Legal / Demo / 19 实填 / **②** Pack A·B |

**后续默认**：不再新增 IR 流程 SKU / 机读闸（见 [IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md)）；仅 `external/` 叙事、登记事实、staging 真值。

---

## 给合伙人 / IC 的一句话

**对外投资人 zip（Release 1.3）** 已在 **① 本地** 完成 **LP 收件人视角** 口径收口（语言、读序、无 repo 泄漏、无对内俚语、PDF 链与机读闸）；**可发预览包** 前仍须 **Legal 签核**、**Demo 终版（若承诺含片）** 与 **外发登记**；**提升 Invest 概率的 ② 证据**（staging 可复跑订单+托管+ID）**另轨**，见 [internal/50 §5.4](internal/50-企业级投资杠杆审计.md)。

---

## 已完成（① · 可复述给 LP）

| 维度 | 状态 | 证据入口 |
|------|------|----------|
| **A 语言 / 边界** | 已收口 | 包内无 `monorepo`/连招/LP 主路径俚语；`00-START-HERE.txt` 机读 |
| **B 合规表述** | 源稿层 | 01–06 / FAQ 非要约；**PDF 目视 + Legal** 仍待签 |
| **C 叙事** | 已对齐 | Pitch→Memo→FAQ；Partner 深问仅 **IR only** |
| **D 一致性** | 维护者闸 | governance + CN/EN release 对拍 |
| **E 外发形态** | 脚本化 | zip 结构校验；单发模板在导读 txt |
| **F 机读** | 一键 | `release-investor-lp-pack.sh` + pre-send |

**现行产物**：`dist/TravelTrust-Investor-Materials-v1.3.zip`（`--omit-markdown`；`signed-pdfs/` 树）。

---

## 严格 LP 收件人审计（① · 机读 · 2026-05-16）

| 检查 | 结果 |
|------|------|
| `check-fundraising-ir-governance.py --enforce` | **PASS**（含 `external/00-START-HERE.md` 无 maintainer 父链泄漏） |
| `check-fundraising-lp-receiver-strict.py` | **PASS**（全部 `export-ready` PDF + `00-START-HERE.txt` 主路径 + zip） |
| `ir-preview-send-preflight.sh` | **PASS**（preview 机读链） |
| LP 禁词（monorepo / 连招 / 反杀 / bare `.md` / internal） | **未检出**（PDF/txt + zip） |
| 草稿标记（TODO/WIP/待补/placeholder/TBD/FIXME） | **未检出**（PDF/txt + zip） |
| CN Pitch 图例 | **1–5** 阿拉伯数字（非圈号） |
| zip 内 demo | **无 mp4**（与「无演示片」邮件口径一致） |

**不构成**：Legal 签核、终版录屏、真实外发登记行、**②** staging 真值表。

---

## 未完成（须标明 · 非阻塞 preview · 阻塞 final）

> **以下项无法由仓库机读代填**（Reality Sync：禁止猜测）。状态截至 **2026-05-16**。

| 项 | 阶次 | 状态 | 谁能完成 | 下一步 |
|----|------|------|----------|--------|
| **法务 PDF 签核** | ① | **阻塞 final** | **Counsel** | [33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) **§3** Legal **#3–5**；签章 PDF 置换 |
| **终版 Demo ~90s** | ① | **阻塞含片承诺** | **IR/产品** | [录屏表](internal/IR-DEMO-RECORDING-CHECKLIST-001.md) → `export-ready/demo/*.mp4` → `release-investor-lp-pack.sh` |
| **外发登记实填** | ① | **每次发送** | **IR** | [19](internal/19-对外分发与访问登记.md) 填**真实**机构行（勿用虚构示例） |
| **Pack A 真值表** | ② | **阻塞 III** | **Eng+IR+staging** | UI **A–H** + `order_id` 等；**①** 仅 B-409 旁证（Runbook **§0.1**） |
| **Pack B Legal/cap/fin** | ② | **阻塞 III** | **Legal/Finance** | [PACK-B 执行清单](data-room/evidence/PACK-B-STATUS.v1.md) |

**preview（① 允许）**：Legal **未**签、Demo **未**承诺含片 → 可发 **preview** zip；`bash scripts/gates/ir-preview-send-preflight.sh` + [IR-PRE-SEND §0/§7](IR-PRE-SEND-MANUAL-001.md) + 登记标 **`preview`** / **`无 demo`**。

**final（① 定稿）**：须上表人工作业**全部事实发生**后：

```bash
export FUNDRAISING_LP_LEGAL_SIGNED=1
export FUNDRAISING_LP_DEMO_ACK=omit    # 或 shipped（终版 mp4 已在 zip）
export FUNDRAISING_LP_DISTRIBUTION_LOGGED=1
export FUNDRAISING_LP_IR_CONTACT_FILLED=1
bash scripts/gates/check-fundraising-lp-final-human-blockers.sh
```

真值台账：[LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md)（**禁止**未发生事实前改「已完成」）。

---

## 日常命令（维护者）

| 场景 | 命令 |
|------|------|
| **preview 外发** | `bash scripts/gates/ir-preview-send-preflight.sh`（`IR_PREVIEW_SEND_REBUILD=1` 重打 zip） |
| 外发 / 重建 zip | `bash scripts/gates/release-investor-lp-pack.sh` |
| 仅改 `external/**/*.md` 叙事 | `bash scripts/gates/fundraising-external-touch.sh` → 发 zip 前仍跑 release / preview preflight |

人工：[IR-PRE-SEND-MANUAL-001](IR-PRE-SEND-MANUAL-001.md) → 发送 → [internal/19](internal/19-对外分发与访问登记.md)。

**② 前置（不进 zip）**：

```bash
bash scripts/gates/runbook-iii-pack-a-preflight.sh
```

---

## 审计后维护

**默认不再新增** IR 流程文档 / 机读闸 — 见 **[IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md)**（触达矩阵：`fundraising-external-touch.sh` vs `release-investor-lp-pack.sh`）。

## 相关索引

| 文档 | 用途 |
|------|------|
| [IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md) | 审计后冻结与日常触达 |
| [IR-OPERATOR-INDEX-001](IR-OPERATOR-INDEX-001.md) | 全步骤导航 |
| [PACK-RELEASE §2.8–2.9](PACK-RELEASE-CHECKLIST-001.md) | 发前快检 + 一页纸 |
| [LP-OUTBOUND-PACK-001](LP-OUTBOUND-PACK-001.md) | 首次/跟进/深聊发什么 |
| [START-HERE-SSOT-001](START-HERE-SSOT-001.md) | 双入口纪律 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-16 | 初版：① LP 收件人视角多轮收口后的合伙人可读摘要（非 spec 07 完成度）。 |
| 2026-05-16 | **未完成**表增状态/下一步；Pack A **§0.1** ① 旁证落盘（**非** ② 已闭）。 |
| 2026-05-16 | `print_ir_outbound_pending.py`；占位 demo mp4 机读拒收；preview 邮件模板 **IR-PRE-SEND §7**。 |
| 2026-05-16 | `ir-outbound-status.sh`；**19**/**board** 外发五步；**31↔33** Legal 对拍；LP-OUTBOUND preview 口径。 |
| 2026-05-16 | Runbook **A–H 打印附录**；`test_investor_handoff_demo_policy.py`；**00/13/board** 索引与 CONTRIBUTING 触达。 |
| 2026-05-16 | `.gitignore` staging 离库副本；`evidence/logs/README`；solo-dev **§6.5·14**；根 README/AGENTS 入口。 |
| 2026-05-16 | `ir-preview-send-preflight.sh`；**19** 实发登记区；Pack B↔**31** 对拍；Runbook 探针 `TT_PROBE_OUT`。 |
| 2026-05-16 | 探针报告模板；`.gitignore` `staging-probe-*.md`；全仓入口互指 preview preflight。 |
| 2026-05-16 | **① 基础设施线**声明；PACK **§2.9a** 环境变量；IR-PRE-SEND **§0** 一页纸；Demo 落盘五步。 |
| 2026-05-16 | **严格 LP 收件人审计**：`check-fundraising-lp-receiver-strict.py` + `00-START-HERE.md` 去 maintainer 链；人工作业项标明**不可机读代填**。 |
| 2026-05-16 | **定稿闸**：`check-fundraising-lp-final-human-blockers.sh` + [LP-HUMAN-BLOCKERS-STATUS](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md)；**① 机读已闭** / **final 仍 4 项人工作业**（preview 不受阻）。 |
| 2026-05-16 | **严格 LP 加深**：`check-fundraising-lp-receiver-strict` 扫描 zip 内 `signed-pdfs/*.pdf` + 双份 `00-START-HERE.txt`；`FUNDRAISING_IR_CONTACT_*` 打 zip 注入联系人（**不**代填 Legal/登记）。 |
| 2026-05-16 | `ir-preview-send-preflight` 增 zip layout + 定稿阻塞信息段；`verify-investor-zip-layout.sh` Win Python 探测与 release 链对齐。 |
| 2026-05-16 | `check-fundraising-lp-receiver-strict` 增 LP PDF 草稿标记扫描（TODO/WIP/待补 等）。 | |
