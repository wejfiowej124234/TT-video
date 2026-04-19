# TravelTrust · Production 对外发布说明（读者版）

**版本锚**：`GO_FINAL_20260416` · **日期**：2026-04-16  
**本页性质**：面向 **投资人 / 合作方 / 面试与复盘** 的**非技术摘要**；**技术真源与机读契约**以同目录 [`README.md`](README.md)、[`release_proof.json`](release_proof.json) 及仓库内 Runbook 为准。

---

## 1. 我们宣称什么

本仓库在 **「工程 + 治理观测 + 链上真实性」** 三条闭环上，采用 **可复跑脚本 + 可审计落盘记录** 的方式，给出 **Production Go-Live** 的**统一判定口径**：

**当且仅当** 目标环境中 **B-414（业务收益）**、**B-430（治理 API 观测）**、**B-431（合约层链上读数与 payload 对拍）** **均为 GO**，即视为达到 **Production Go-Live 标准**。

详见 [`README.md`](README.md) 第一节（上线判定）。

**四层闭环与 FeeRouter 边界（对外口径锁死，与 [`release_proof.json`](release_proof.json) 同源）**：

- **标准表述**：当前版本已完成源码、观测、测试网执行与治理栈运行时接线四层闭环；FeeRouter 因不在本次治理栈部署批次中，其 owner 对拍待全栈部署地址补齐后并入。
- **面试 / 展示加强版**：治理栈闭环已完整验证（源码 / 执行 / 观测 / 接线）；资金路由（FeeRouter）因独立部署批次未并入本次运行时校验。当前版本治理栈四层闭环已完整成立，FeeRouter 因独立部署批次未并入本次运行时校验，作为已知边界保留，不影响系统整体 Production 级成立。

---

## 2. 三条支柱（一句话）

| 支柱 | 含义（对外表述） |
|------|------------------|
| **业务 / Revenue** | 收益与订单相关数据路径经联调收口，有关键 **`closeout-record`** 可复核。 |
| **治理 / API** | 治理相关链上变更在后端 **对账与只读 overview** 面 **无分叉**（可审计 JSON）。 |
| **链上 / 合约** | **`execute`** 后 **链上状态** 与 **提案 calldata / Timelock 操作** 在 **Foundry** 中有 **SSOT 回归测试** 可对齐。 |

---

## 3. 我们不额外宣称什么（边界）

- **身份质押协议扩展线（母表 B-405～B-407）** 在本发布说明中 **不** 作为「已独立协议 GO」宣称；详见 B-433 机读 manifest 中的 **说明性** 条目。
- **B-431（Foundry）** **不** 替代 **测试网真实 `execute` 封口（B-417）**；完整托管链上证据链需按 Runbook **并列**使用。
- **「最新治理币 / 池子 / FeeRouter」链上地址**：**不以** **仓库内** **单测** **自动** **证明** **；** **运行时真值** **以** **部署环境** **`.env`** **与** **`GET /meta` → `chain.contracts`** **为准** **。升级部署后须重跑三支柱并做链侧自检，详见 **[RUNTIME_CHAIN_SSOT_CHECKLIST.md](RUNTIME_CHAIN_SSOT_CHECKLIST.md)** **。**

---

## 4. 单一入口（勿分叉）

**本仓库当前版本** 的 **唯一总入口** 为：

**[`evidence/GO_FINAL_20260416/README.md`](README.md)**

请勿在文档或对外材料中再发明平行的「Production 总入口」路径；**新版本** 以 **`GO_FINAL_YYYYMMDD`** **复制本目录结构** 并 **更新** **`evidence/README.md`** **锚点** 为准。

---

## 5. 英文摘要（optional）

**Single SSOT**: `evidence/GO_FINAL_20260416/`. **Production Go-Live** requires **GO** on **three pillars**: **B-414** (revenue/business closeout), **B-430** (governance API reconcile vs overview), **B-431** (on-chain reads vs payload, Foundry SSOT). **B-405–B-407** are **not** claimed as standalone protocol GO here. See [`release_proof.json`](release_proof.json) for machine-readable fields.
