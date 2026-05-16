# PACK-B-STATUS.v1 — III Pack B（Legal + cap + fin）

| **文档控制（IR）** | |
|------|------|
| **Owner** | Legal + Finance + IR |
| **Version** | 1.0.3-exec |
| **Status** | draft |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | **internal/50** · **§5.4.7 Pack B** · **Reality Synchronization：文档不领先现实** |

| **状态文件 ID** | `PACK-B-STATUS.v1` |
|-----------------|---------------------|
| **Pack B 已增强**（**§5.4.8 已增强 + Legal/cap/fin 签核齐**） | `否` |
| **Pack** | **B** |

**Reality Synchronization Mode**：**仅**在 **真实签核 / 真实落盘** 发生后写入：**Legal signed**、**cap table** 路径、**finance summary** 路径。**空** 优于 **猜测**；**不**写「将签」「拟路径」。**Markdown 只同步现实，不预测现实**。**III‑ΔInvest** 由 **50 §5.4.1** **仅**按 **已发生** 事实同步（本文件 **不**写 pp）。

---

## Legal memo（推广 / TTG 边界）

| 字段 | 值 |
|------|-----|
| **Legal 状态** | `draft` |
| **Legal signed**（**仅**签核事实发生后填） | |
| **实件路径（Git 内）** | |

---

## cap table（脱敏摘要）

| 字段 | 值 |
|------|-----|
| **cap table 状态** | `未落盘` |
| **cap table**（**仅**脱敏实件落盘后填路径） | |

> **模板指针**（**非** cap 实件、**不计**真值）：[`../templates/TEMPLATE-cap-table-summary-redacted.md`](../templates/TEMPLATE-cap-table-summary-redacted.md)

---

## finance summary（财务摘要）

| 字段 | 值 |
|------|-----|
| **finance summary 状态** | `未落盘` |
| **finance summary**（**仅**实件落盘后填路径） | |
| **与 06 对拍表**（**仅**存在对拍文件后填路径） | |

> **模板指针**（**非** finance 实件）：[`../templates/TEMPLATE-financial-summary.md`](../templates/TEMPLATE-financial-summary.md)

---

## 与 [31-法务签核清单](../../internal/31-法务签核清单.md) 对拍

| Pack B 执行项 | 31 签核项（摘要） |
|---------------|-------------------|
| Legal 一页 IC + 签核页 | 禁止性表述、FeeRouter、TTG、Country Pool |
| cap table v1 | （财务原件，非 31 叙事项） |
| 财务摘要 + 与 06 零冲突 | 对外披露包一致、FeeRouter 数字 |
| 本文件真值表 + 13 索引 | 发布渠道登记（DR/NDA） |

---

## 执行清单（Legal / Finance · 勾选 · 不进 LP zip）

| ☐ | Owner | 动作 | 落盘 / 登记 |
|---|--------|------|----------------|
| ☐ | Legal | 推广/KOL 禁区 + **TTG 可选**三句 + 多辖区原则 → **一页 IC 摘要 + 签核页** | `legal/` 或 DR；[13](../../internal/13-投资人数据室索引.md) **FINAL** |
| ☐ | Finance | 脱敏 **cap table** v1 | `finance/` 或 NDA 区；模板 [TEMPLATE-cap-table](../templates/TEMPLATE-cap-table-summary-redacted.md) |
| ☐ | Finance | **财务摘要** + **与 06 公开层零冲突表** | 同上；模板 [TEMPLATE-financial](../templates/TEMPLATE-financial-summary.md) |
| ☐ | IR | 更新本文件真值表 + [13](../../internal/13-投资人数据室索引.md) 索引行 | 仅事实发生后填路径 |

**机读（①，非 Pack B III）**：`bash scripts/gates/release-investor-lp-pack.sh` 仅验证 **LP 包**；**不**替代 Legal 签核。

**与 LP 定稿关系**：Pack B **未**闭 **不**阻塞 **preview** zip（**①**）；阻塞 **「定稿 / III Pack B 已增强」** 与 [IR-LP-AUDIT-CLOSURE-001](../../IR-LP-AUDIT-CLOSURE-001.md) 表中 **Pack B** 行。

---

## III‑ΔInvest（**仅**已发生事实 · 本文件不写数）

| **截至本文档版本，已发生的 III 事实** | **pp（由 50 §5.4.1 同步）** |
|----------------------------------------|---------------------------|
| **尚无**（`Pack B 已增强=否`，Legal/cap/finance summary 未落盘） | **0** |
