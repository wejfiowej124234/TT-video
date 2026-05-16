# LP 外发 · 已完成 / 未完成 一览 · v1（填表真源）

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR |
| **Version** | 1.1.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | **本页** = 日常补漏唯一填表处；合伙人摘要 [IR-LP-AUDIT-CLOSURE-001](../../IR-LP-AUDIT-CLOSURE-001.md) · 操作导航 [IR-OPERATOR-INDEX-001](../../IR-OPERATOR-INDEX-001.md) |

> **怎么用**：补完一项 → 改下表「已完成？」与「事实日期/证据」→ 跑对应命令 → **禁止**未发生事实前写「是」或设 ack 环境变量。

**Release**：`1.3` · **zip**：`dist/TravelTrust-Investor-Materials-v1.3.zip`

---

## 验收阶次（勿跳阶）

| 阶次 | 本页哪一段 |
|------|------------|
| **① 本地** | §1 已完成（机读）· §2 未完成（人工 · 定稿/preview） |
| **② 测试网** | §3 未完成（Pack A/B · 不进 zip） |
| **③ 生产** | **不在本页** |

---

## §1 已完成（① · LP 收件人面 · 机读）

> 下列项由脚本验收；**事实变更**（重打 PDF/zip）后须重跑命令并更新「末次机读」日期。

| # | 项 | 状态 | 末次机读 | 复验命令 |
|---|-----|------|----------|----------|
| 1 | 严格 LP 面（PDF/txt + zip 内 `signed-pdfs`；禁词/草稿标记/图例） | **是** | 2026-05-16 | `python scripts/gates/check-fundraising-lp-receiver-strict.py` |
| 2 | IR governance（对外洁净度 + 锚点 + CN/EN） | **是** | 2026-05-16 | `FUNDRAISING_IR_GATE_ENFORCE=1 python scripts/gates/check-fundraising-ir-governance.py` |
| 3 | Zip 结构与导读 | **是** | 2026-05-16 | `bash scripts/gates/verify-investor-zip-layout.sh` |
| 4 | 发前机读链 | **是** | 2026-05-16 | `bash scripts/gates/check-fundraising-lp-pack-pre-send.sh` |
| 5 | **Preview 外发**机读编排 | **是** | 2026-05-16 | `bash scripts/gates/ir-preview-send-preflight.sh` |
| 6 | 材料包产物 | **是** | 2026-05-16 | `dist/TravelTrust-Investor-Materials-v1.3.zip`（**无** demo mp4） |

**不构成**：Legal 签核、终版录屏、真实外发登记、**②** staging 全矩阵、**③** 生产 GO。

**状态机读（不替代本表）**：`bash scripts/gates/ir-outbound-status.sh`

---

## §2 未完成（① · 须人工 · 在此补）

### 2.1 定稿 final 外发（4 项 · 全做完才可对外称 final）

| # | 项 | 已完成？ | 事实日期 | 证据 / 登记 | 补完后 |
|---|-----|--------|----------|-------------|--------|
| 1 | **法务 PDF 签核** | **否** | | [internal/33](../../internal/33-投资人Data-Room导出包与IR法务终审清单.md) Legal 栏 | `export FUNDRAISING_LP_LEGAL_SIGNED=1` |
| 2 | **Demo 政策**（无片 / 含片） | **否** | | 无片：`DEMO_ACK=omit`；含片：终版 mp4 → 重打 zip → `=shipped` | `export FUNDRAISING_LP_DEMO_ACK=omit` 或 `=shipped` |
| 3 | **外发登记**（真实机构） | **否** | | [internal/19](../../internal/19-对外分发与访问登记.md) 新增一行 | `export FUNDRAISING_LP_DISTRIBUTION_LOGGED=1` |
| 4 | **IR 联系人**（包内非占位） | **否** | | 见 §2.2 | `FUNDRAISING_LP_IR_CONTACT_FILLED=1` 或重打 zip 后 txt 无 `________________` |

**定稿机读闸（四项事实发生后）**：

```bash
export FUNDRAISING_LP_LEGAL_SIGNED=1
export FUNDRAISING_LP_DEMO_ACK=omit          # 或 =shipped
export FUNDRAISING_LP_DISTRIBUTION_LOGGED=1
export FUNDRAISING_LP_IR_CONTACT_FILLED=1   # 若 txt 已填联系人可省略本行
bash scripts/gates/check-fundraising-lp-final-human-blockers.sh   # 须 exit 0
```

### 2.2 IR 联系人（填表栏 · 打 zip 前）

| 字段 | 值（填实） |
|------|------------|
| 姓名 | |
| 邮箱 | |
| 电话 / Signal / Telegram（可选） | |

**注入 zip（推荐）**：

```bash
export FUNDRAISING_IR_CONTACT_NAME="..."
export FUNDRAISING_IR_CONTACT_EMAIL="..."
export FUNDRAISING_IR_CONTACT_PHONE="..."   # 可选
bash scripts/gates/inject-ir-contact-repack.sh
# 或全量重打：bash scripts/gates/release-investor-lp-pack.sh
```

### 2.3 Preview 外发（① 当前允许 · 不等 §2.1 全闭）

| # | 项 | 已完成？ | 事实日期 | 备注 |
|---|-----|--------|----------|------|
| P1 | 机读 preflight | **可发** | 2026-05-16 | `bash scripts/gates/ir-preview-send-preflight.sh` |
| P2 | 邮件/IM 标 **preview** + **无 demo** | **政策已定** | 2026-05-16 | 模板 [IR-PRE-SEND §7](../../IR-PRE-SEND-MANUAL-001.md)；zip **无** `demo/*.mp4` 时正文须写明 |
| P3 | 外发登记（preview 也要记） | **否** | | [internal/19](../../internal/19-对外分发与访问登记.md) 备注含 `preview` |

### 2.4 PDF 目视 QA（① · 非机读 · 发前建议）

| # | 项 | 已完成？ | 事实日期 | 证据 |
|---|-----|--------|----------|------|
| Q1 | 按 [internal/35](../../internal/35-IR-PDF-出版-QA-02-05-06.md) 抽 **04 / 06 / 03**（+ 可选 01）翻页：免责、版本行、链接表述 | **否** | | 勾选表填于 **35** 或本表补日期 |
| Q2 | CN/EN 页差 **01**（6/7）、**03**（11/12）已知情并接受排版原因 | **是** | 2026-05-16 | [PACK §2.7](../../PACK-RELEASE-CHECKLIST-001.md) 登记行 |

---

## §3 未完成（② · 不进 zip · 另轨）

| # | 项 | 已完成？ | 事实日期 | 证据 |
|---|-----|--------|----------|------|
| 1 | **Pack A** staging 真值表（UI A–H + order_id 等） | **否** | | [RUNBOOK-III-PACK-A.v1.md](RUNBOOK-III-PACK-A.v1.md) **§1** |
| 2 | **Pack B** Legal / cap / fin | **否** | | [PACK-B-STATUS.v1.md](PACK-B-STATUS.v1.md) |
| 3 | Pack A **① 旁证**（B-409 等） | **是** | 2026-05-16 | Runbook **§0.1** · `logs/pack-a-preflight-*.txt` |

**② 前置命令**：`bash scripts/gates/runbook-iii-pack-a-preflight.sh`

---

## §4 补一项后的最短路径

| 你刚补了 | 接着做 |
|----------|--------|
| 仅改 `external/**/*.md` | `bash scripts/gates/fundraising-external-touch.sh` → 发 zip 前 `release-investor-lp-pack.sh` |
| 联系人 / PDF / zip | `bash scripts/gates/release-investor-lp-pack.sh` |
| 准备 preview 发 | `bash scripts/gates/ir-preview-send-preflight.sh` → IR-PRE-SEND §7 → **19** 登记 |
| 准备 final 发 | §2.1 全 **是** → `check-fundraising-lp-final-human-blockers.sh` **exit 0** → IR-PRE-SEND 全表 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-16 | v1：人工作业阻塞真值。 |
| 2026-05-16 | v1.1：**已完成 / 未完成**合并为填表真源；增 preview 行、Pack A 旁证、补漏路径。 |
