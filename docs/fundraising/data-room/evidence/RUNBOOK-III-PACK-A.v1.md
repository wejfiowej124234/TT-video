# RUNBOOK-III-PACK-A.v1 — III Pack A（staging + explorer + ≥3 ID）

| **文档控制（IR）** | |
|------|------|
| **Owner** | Eng + IR |
| **Version** | 1.0.8-exec |
| **Status** | draft |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | **internal/50** · **§5.4.7 Pack A** · **Reality Synchronization：文档不领先现实** |

| **Runbook ID** | `RUNBOOK-III-PACK-A.v1` |
|----------------|-------------------------|
| **Pack A 已增强**（**§5.4.8 表 V2 全绿**） | `否` |
| **状态** | `draft` |
| **Pack** | **A** |

**Reality Synchronization Mode**：**禁止**文档早于事实。**仅**在对应 **真实事件已发生** 后，才允许写入：`order_id`、`request_id`、`tx_hash`、`explorer_url`、`log_snippet_path`。**空** 优于 **猜测**；**不**写计划值、目标 pp。**Markdown 只同步现实，不预测现实**。**III‑ΔInvest** 由 **internal/50 §5.4.1** **仅**根据 **已发生** 的增强与核验事实填写（本文件 **不**写 pp）。

**禁止**：staging 根 URL、密码、未脱敏 token **入库**。

---

## 0. 前置（② · 不进 LP zip）

| 项 | 说明 |
|----|------|
| **阶次** | 本 Runbook 为 **② 测试网** 投资级证据；**不得**用 **①** 本地机读绿或 LP zip 冒充已完成。 |
| **环境** | Staging 根 URL、只读访客账号、explorer 规则由 **IR/Eng** 经 NDA 或 Data Room 交付（**不入 Git**）；离库填写模板 [IR-STAGING-CREDENTIALS-TEMPLATE-001](../../internal/IR-STAGING-CREDENTIALS-TEMPLATE-001.md)。 |
| **工程入口** | 本地/测试网闭环参见 [TT-9618-onboarding-local-testnet](../../../runbook/TT-9618-onboarding-local-testnet.md)；订单主路径（**chain_off**）验收脚本见 [TT-B409](../../../runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)（`scripts/ops/b409-order-state-primary-acceptance.sh`）；杠杆排序见 [internal/50 §5.4.7](../../internal/50-企业级投资杠杆审计.md)。 |
| **冻结路径（MRC）** | 仅一条：**创建订单 → 托管/escrow 可见 →（可选）争议或释放分支之一**；**不**在本 Runbook 扩新功能。 |
| **LP 包边界** | `dist/TravelTrust-Investor-Materials-v*.zip` **不含**本文件；发前 **①** 见 [PACK-RELEASE-CHECKLIST-001](../../PACK-RELEASE-CHECKLIST-001.md) **§2.9**。 |
| **完成后** | 回填下方真值表 → 更新 [internal/50 §5.4.1](../../internal/50-企业级投资杠杆审计.md) **III‑Done** 一句（**仅**事实发生后）。 |
| **机读前置** | `bash scripts/gates/runbook-iii-pack-a-preflight.sh`（**①** B-409 + 可选 **②** 只读探针；**不**填真值表） |

---

## 0.1 ① 机读旁证（已发生 · **非** Pack A 完成）

| 字段 | 值 |
|------|-----|
| **日期** | 2026-05-16 |
| **命令** | `bash scripts/gates/runbook-iii-pack-a-preflight.sh`（**exit 0**）；同日 `RUNBOOK_PACK_A_INCLUDE_EXCEPTION=1` 重跑（**exit 0**） |
| **B-409 primary** | `p21_order_create_accept_mock_pay_confirm` — **1 passed** |
| **B-409 exception** | `p21_order_cancel_created` — **1 passed**（仅含 exception 重跑时） |
| **staging 探针** | **SKIP**（`TT_STAGING_API_BASE` 未设） |
| **旁证日志** | `data-room/evidence/logs/pack-a-preflight-2026-05-16.txt` |
| **Pack A 已增强** | **仍为 `否`** — 真值表与 A–H **未**填 |

**禁止误读**：本节 **不**写入 `order_id` / `request_id` / `tx_hash`；**不**将 **①** 旁证表述为 **②** staging 全矩阵已验。

---

## 1. Staging 跟跑命令清单（②）

> **凭证**：`STAGING_WEB_URL`、`API_BASE_URL`、测试账号、explorer 模板 **仅**在终端/密码管理器/NDA 附件中使用，**禁止**写入本仓库。

### 1.1 机读前置（仓库根 · 可先跑）

```bash
# ① 锚点（chain_off 订单主路径，非 staging UI）
bash scripts/ops/b409-order-state-primary-acceptance.sh
# 或等价：
cargo test -p traveltrust-api p21_order_create_accept_mock_pay_confirm -- --test-threads=1

# ①+② 编排（B-409 必跑；staging 探针见环境变量）
bash scripts/gates/runbook-iii-pack-a-preflight.sh
# 可选含取消链：RUNBOOK_PACK_A_INCLUDE_EXCEPTION=1 bash scripts/gates/runbook-iii-pack-a-preflight.sh
```

**② 只读探针（可选，需双 base）**：

```bash
export TT_STAGING_API_BASE=https://<staging-api-host>      # 无尾斜杠
export TT_PRODUCTION_API_BASE=https://<prod-api-host>    # 对比用；无则仅做 1.1 + UI A-H
# 可选：export TT_PROBE_BEARER=<readonly-token>
python scripts/ops/read_only_staging_prod_probe.py
```

报告可存 **`data-room/evidence/`**（脱敏）；**不**提交 URL/密钥进 Git。

**探针报告落盘（可选）**：

```bash
export TT_PROBE_OUT=docs/fundraising/data-room/evidence/staging-probe-$(date -u +%Y%m%d).md
python scripts/ops/read_only_staging_prod_probe.py
```

模板：[templates/TEMPLATE-staging-probe-report.md](templates/TEMPLATE-staging-probe-report.md)（`**staging-probe-*.md`** 已 **`.gitignore`**，勿提交含 URL/token 副本）。**不**写入真值表 ID。

### 1.1b 仅 Staging API（无生产对比）

```bash
export TT_STAGING_API_BASE=https://<staging-api-host>
bash scripts/gates/runbook-iii-pack-a-preflight.sh
```

**不**写入真值表；**不**证明 Pack A 已增强。完整探针仍建议同时设 `TT_PRODUCTION_API_BASE` 后跑 `read_only_staging_prod_probe.py`（见 **§1.1**）。

### 1.2 UI 跟跑（A–H · 与下表「Execution tracking」同步填写）

| 步 | 动作 | 命令/工具提示 |
|----|------|----------------|
| **A** | 隐私窗打开 staging 前端根 URL | 浏览器；URL 由 IR 提供 |
| **B** | 测试账号登录 | 账号来自 DR `product/` 或 NDA |
| **C** | **创建订单 → Escrow 可见**（MRC 冻结路径） | UI：`/orders` → 下单 → 接单 → mock 支付/托管；对照 [TT-B409](../../../runbook/TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md) 状态 **created→accepted→escrowed** |
| **D–E** | 抄 `order_id`、`X-Request-Id` | DevTools → Network → 选创建/支付请求 |
| **F–G** | `tx_hash` + explorer 完整 URL | 有链上步时；explorer 须第三方可开 |
| **H** | 同分钟脱敏 access log 片段 | 存 `data-room/evidence/` 旁文件；路径写入真值表 |

**旁证（非 III，可选）**：准入费 **②** 见 [TT-9618 §3](../../../runbook/TT-9618-onboarding-local-testnet.md)（`API_BASE_URL` + `scripts/dev/onboarding-webhook-local.sh`）— **与 Pack A 订单路径正交**，**不**替代 **C–G**。

### 1.3 完成后

1. 填 **Execution tracking** 与 **见证纪要**（文末）。  
2. 更新 [internal/50 §5.4.1](../../internal/50-企业级投资杠杆审计.md) **III‑Done**（一句事实）。  
3. **勿**将录像/日志默认放入 `TravelTrust-Investor-Materials-*.zip`。

---

## Execution tracking（真值一行表）

### 字段说明（填表前读）

| 字段 | 含义 | 从哪里抄 | 第三方如何核验 |
|------|------|----------|----------------|
| **order_id** | 本次 MRC 冻结路径上的订单 UUID | UI 订单详情 URL 或 Network 响应 JSON `id` | 同 ID 在录像、脱敏 log、（若有）只读 API 一致 |
| **request_id** | 同一会话关键请求的关联 ID | DevTools 头 `X-Request-Id` 或网关等价 | 与 **order_id** 同一次冷启跟跑；log 行可 grep |
| **tx_hash** | 链上交易哈希（**无链上则留空**） | 钱包/托管步骤或 API 返回 | **explorer_url** 可打开且与订单主张一致 |
| **explorer_url** | **完整可点击** 浏览器 URL | 模板 `https://<explorer>/tx/{tx_hash}` 或 mock 规则 | 冷启跟跑者**零**内部工具可复现 |
| **log_snippet_path** | 脱敏 access log **文件**相对路径 | 仓库内建议 `data-room/evidence/logs/pack-a-<UTC日期>.txt` | 时间戳与录像/OSD **同分钟**；**无**密码/token |

**禁止**：`N/A`、`TBD`、计划值、staging 根 URL、测试账号密码写入 Git。

| 字段 | 值（**仅填真实产出**；无则 **留空**） |
|------|----------------------------------------|
| **Runbook ID** | `RUNBOOK-III-PACK-A.v1` |
| **order_id** | |
| **request_id** | |
| **tx_hash** | |
| **explorer_url** | |
| **log_snippet_path** | |

---

## A–H 冷启（第三方跟跑 · 产出列只写实跑结果）

| 步 | 动作 | 产出（**无则空**） |
|----|------|---------------------|
| **A** | 隐私窗打开 staging 根（IR/DR 提供，**不入库**） | |
| **B** | 使用 DR `product/` 或 NDA 测试账号登录 | |
| **C** | 走订单 → Escrow 可见状态冻结路径 | |
| **D** | 自 DevTools Network 或 JSON 抄 `order_id` | |
| **E** | 抄 `X-Request-Id`（或网关等价） | |
| **F** | 若有链上步，抄 `tx_hash`；**无链上步则本步产出留空**（**不写** `N/A` 作占位） | |
| **G** | 打开 explorer 完整 URL | |
| **H** | 同 UTC 分钟 API access log 脱敏片段路径（另文件） | |

---

## Staging 验证

| 检查项 | 状态 |
|--------|------|
| **只读访客账号** 已提供 | `未验证` |
| **explorer** 为公共 indexer | `未验证` |
| **build/version** 与 UI 一致 | `未验证` |

---

## III‑ΔInvest（**仅**已发生事实 · 本文件不写数）

| **截至本文档版本，已发生的 III 事实** | **pp（由 50 §5.4.1 同步）** |
|----------------------------------------|---------------------------|
| **尚无**（`Pack A 已增强=否`，真值表全空） | **0** |

---

## 附录 · A–H 现场勾选（打印 · ②）

| ☐ | 步 | 产出（写实值） |
|---|-----|----------------|
| ☐ | **A** | staging 已开（隐私窗） |
| ☐ | **B** | 已登录测试账号 |
| ☐ | **C** | 订单 → Escrow 可见 |
| ☐ | **D** | `order_id`: ____________________ |
| ☐ | **E** | `request_id`: __________________ |
| ☐ | **F** | `tx_hash`: _____________________（无则空） |
| ☐ | **G** | `explorer_url`: ________________（无则空） |
| ☐ | **H** | log 文件路径: _________________ |

完成后抄入上方 **Execution tracking** 与 **见证纪要**；录像文件名: ____________________

---

## 执行前检查（② · Eng，跑 A–H 前）

| ☐ | 项 |
|---|-----|
| ☐ | Staging API/Web **可达**；测试账号由 IR/DR 提供（**不入库**） |
| ☐ | 环境角标/VO 计划写明 **staging**（非 production） |
| ☐ | 录屏工具与脱敏规则已按 [internal/50 §5.4.7](../../internal/50-企业级投资杠杆审计.md) W3 冻结 |
| ☐ | （可选）`chain_off` 主路径：`bash scripts/ops/b409-order-state-primary-acceptance.sh` **exit 0** 作 **①** 旁证，**不**替代本 Runbook 屏幕录像 |

---

## 见证纪要（② · IR/PM · 真跑后填写）

| 字段 | 值 |
|------|-----|
| **见证人** | |
| **日期（UTC）** | |
| **已独立跟跑 Runbook A–H** | ☐ 是 · ☐ 否 |
| **冷启录像文件名**（`data-room/evidence/` 或 DR 路径） | |
| **与真值表三 ID 一致** | ☐ 是 · ☐ 否 |
| **备注** | |

**完成后**：更新 [internal/50 §5.4.1](../../internal/50-企业级投资杠杆审计.md) **III‑Done** 一句；**不**把本表或录像默认放入 LP zip。
