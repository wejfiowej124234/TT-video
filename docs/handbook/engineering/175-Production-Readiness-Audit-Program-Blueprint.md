# 175 · Production Readiness Audit Program Blueprint

**Version:** 1.0.0 · **最后更新：** 2026-06-08  
**受众**：工程 · SRE · 运营 · Owner  
**状态**：**ACTIVE · ② 测试网**  
**与 spec 关系**：**partial** — 发版前审计程序；**不替代** [147](./147-PI3-Closure-Program-Audit-Report.md) **`PRODUCTION_GO_DECISION: NO_GO`** 或 [148](./148-PI3-005-Production-Scope-Decision-Report.md) **Sepolia scope**。

> **SSOT（必读）**：本程序为 **Production Readiness Audit（PRA）** 唯一入口。**度量与裁定**见 [176 Production Readiness Audit Report](./176-Production-Readiness-Audit-Report.md)；**真实运营验证**并行消费 [173 ROV-01](./173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) / [174 ROV Report](./174-Real-Operations-Validation-Report.md)。**禁止**用 PRA gate 绿冒充 **③ Production GO**。

**程序 ID**：**PRA-01**  
**阶段**：**② 测试网 · Pre-Production Readiness**（**非 ③ Production GO**）  
**纪律**：**功能冻结** — 仅 ops harness · runbook · 证据采集；**零新增业务功能代码**  
**一键证据包**：`bash scripts/ops/pra-unified-release-evidence-pack.sh`  
**报告 SSOT**：[176-Production-Readiness-Audit-Report.md](./176-Production-Readiness-Audit-Report.md)

---

## 1. Executive verdict

| 裁定 | 判定 | 说明 |
|------|------|------|
| **L5 / BE / PI3 新 Sprint** | **STOP** | 继承 [173](./173-ROV-01-Real-Operations-Validation-Program-Blueprint.md) · 145/157/160–165/169/171/172 冻结顶 |
| **PRA-01 程序** | **ACTIVE** | Staging 全链路 · 压力 · 安全 · DR · ROV Wave-2 · 统一证据包 |
| **Production GO** | **NO** | 147 **`NO_GO`** · 158 **`HOLD` 58/100** · 148 **Sepolia only** |
| **代码变更边界** | **OPS ONLY** | `scripts/ops/pra-*` · `scripts/ops/rov-wave2-*` · 报告 175/176 |

**Gate 输出（统一证据包 · 权威）：**

```text
TT_UNIFIED_RELEASE_EVIDENCE_PACK: GO dir=evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z failures=0
```

> **说明**：PRA **overall GO** 表示 **六阶段 harness 全部 exit 0**；子阶段内部可为 **PARTIAL**（见 176 §3）。**不等于 Production GO**。

---

## 2. 六阶段审计矩阵

| 阶段 ID | 名称 | Harness | 消费基线 | ② 目标 |
|---------|------|---------|----------|--------|
| **PRA-STAGING-FULLCHAIN** | Staging 全链路 | `scripts/ops/pra-staging-fullchain.sh` | Fly `tt-api-staging` · R-003 | health/meta/register · Growth gap 文档化 · merchant smoke |
| **PRA-PRESSURE** | 压力 / 恢复 | `scripts/ops/pra-pressure-stress.sh` | B-477 · 163 | PG pool stress · recovery ≤180s |
| **PRA-SECURITY** | 安全 / 越权 | `scripts/ops/pra-security-privilege-escalation.sh` | 157 E3/E4 · 161 RBAC | RBAC escalation · 2FA · matrix（local PARTIAL 可接受） |
| **PRA-DR** | 灾备演练 | `scripts/ops/pra-disaster-recovery-drill.sh` | 163 · TT-DR | Fly staging DR 或 local docker pg_dump 回灌 |
| **ROV-WAVE2** | ROV T4/T5 | `scripts/ops/rov-wave2-evidence-pack.sh` | 144 O-S4 · 169 BE-GCM-01 | Cold Start deploy · CN country market → **live** |
| **PRA-158-DEEP-AUDIT** | 158 深审矩阵 | `scripts/check-production-readiness-deep-audit-execution.sh` | 158 | 程序 gate **GO**；矩阵裁定仍为 **HOLD** |

---

## 3. 与 ROV-01 的关系

| 程序 | Wave | 轨 | 关系 |
|------|------|-----|------|
| **ROV-01** | 1 | T1–T3 | 独立证据包 · `rov-wave1-evidence-pack.sh` |
| **ROV-01** | 2 | T4–T5 | **嵌入 PRA 统一包** · `ROV2_OUT_DIR=$PACK/rov/wave2` |
| **ROV-01** | 3–4 | T6–T7 | PRA 完成后继续 · **不**阻塞 PRA overall |

Wave-2 **前置**：local testnet spine `:8080` 须为 **当前编译** API（含 country-market 路由）；旧二进制会导致 T5 **404**。

---

## 4. 环境变量（可选）

| 变量 | 默认 | 用途 |
|------|------|------|
| `PRA_STAMP` | UTC 时间戳 | 证据目录 stamp |
| `PRA_UNIFIED_DIR` | `evidence/PRODUCTION_READINESS_AUDIT/unified-<stamp>` | 统一包根 |
| `PRA_RUN_STAGING_WEB` | `0` | `1` 时跑 Playwright staging web smoke |
| `PRA_SECURITY_API` | `http://127.0.0.1:8080` | 安全探针 API |
| `B477_RECOVERY_TIMEOUT_SEC` | `180` | 压力恢复超时 |
| `ROV_COUNTRY_ISO` | `CN` | T5 国别试点 |

---

## 5. 证据索引

| 资产 | 路径 |
|------|------|
| **统一发布证据包** | `evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z/` |
| Manifest | `…/unified_manifest.v1.json` |
| ROV Wave-1 指针 | `…/rov/wave1_pointer.txt` |
| ROV Wave-2 轨 | `…/rov/wave2/tracks/ROV-T4` · `ROV-T5` |
| ROV Wave-2 独立包 | `evidence/ROV_01/wave2-20260608T053055Z/` |

---

## 6. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-08 | 立项 · 六阶段 harness · 统一证据包 **GO** |
