# TT-ENTERPRISE-SSOT-ALIGNMENT · 企业 SSOT 全量对齐

**机读 SSOT：** [`registry/enterprise-ssot-alignment.v1.yaml`](../../registry/enterprise-ssot-alignment.v1.yaml)  
**公开展示北极星：** [`TT-PUBLIC-CONTENT-PLATFORM.md`](TT-PUBLIC-CONTENT-PLATFORM.md) · [`registry/public-content-platform.v1.yaml`](../../registry/public-content-platform.v1.yaml)  
**审计脚本：** `scripts/dev/audit-enterprise-ssot-alignment.cjs`  
**Ops 对齐：** `scripts/dev/audit-operations-platform-local-staging-alignment.cjs`

---

## 边界约束（ENFORCED）

本次对齐 **仅允许**：治理 · Registry · Runbook · Evidence · 配置脚本 · 非生产元数据。  
**禁止：** 新功能 · 重开 RC/DDG/OOS · 改冻结 OCS 基线 · 生产数据变更。  
**策略：** `CLOSED_UNLESS_TOUCHED`

---

## Configuration Alignment ≠ Runtime Validation（ENFORCED）

**禁止混淆：** `CONFIGURATION_ALIGNMENT PASS` **不等于** Local API 当时已启动并验证。

| 检查项 | 含义 | 通过表示 |
|--------|------|----------|
| **CONFIGURATION_ALIGNMENT** | Registry · Runbook · 配置 · 治理一致 | SSOT/文档无 blocking 漂移 |
| **PHASE1_LOCAL_RUNTIME_VALIDATION** | Local API 启动且运行态一致 | 本地进程实际探针 PASS |
| **PHASE2_STAGING_RUNTIME_VALIDATION** | Staging 运行态探针 | Staging API 健康/能力 OK |

```text
CONFIGURATION_ALIGNMENT = PASS
        ≠
Local Runtime Running

Local API 未启动 → RUNTIME = SKIPPED → 仍可为有效 Enterprise PASS
```

**Legacy 别名（兼容旧报告）：**

- `PHASE1_LOCAL_ALIGNMENT` = **CONFIGURATION_ALIGNMENT**（非 runtime）
- `PHASE2_STAGING_ALIGNMENT` = **PHASE2_STAGING_RUNTIME_VALIDATION**

---

## 项目阶段总览（2026-07-03）

### Phase ① Local

| 项 | 状态 |
|----|------|
| 产品开发 | ✅ CLOSED |
| 数据治理 | ✅ CLOSED |
| 企业治理 | ✅ CLOSED |
| SSOT 配置对齐 | ✅ PASS |
| Runtime（按需复验） | 启动 Local API 后单独跑 runtime 探针 |

### Phase ② Staging

| 项 | 状态 |
|----|------|
| Staging | ✅ CLOSED |
| OCS | ✅ CLOSED |
| Workflow | ✅ CLOSED |
| Operations | ✅ CLOSED |
| Enterprise Alignment | ✅ PASS |

### Phase ③ PI3（当前推进）

| 项 | 状态 |
|----|------|
| 品牌域名 / DNS / TLS | 🟡 |
| Cloudflare R2 + CDN | 🟡 |
| Stripe Live | 🟡 |
| Security | 🟡 |
| Observability | 🟡 |
| Performance | 🟡 |
| Production Browser UAT | 🟡 |
| Go-Live | 🟡 |

---

## 治理层次

```text
Product → Operations → Data Governance (DDG/OCS/SOPCP/OCIP)
    → PI3 (Media Infra · Catalog Assets 解耦) → Catalog Assets
```

---

## 执行审计

```bash
node scripts/dev/audit-enterprise-ssot-alignment.cjs
# 可选：Local runtime 复验（须先启动 Local API）
LOCAL_API=http://127.0.0.1:8080 node scripts/dev/audit-enterprise-ssot-alignment.cjs
```

**通过标准：**

| 指标 | 要求 |
|------|------|
| `CONFIGURATION_ALIGNMENT` | **PASS** |
| `PHASE2_STAGING_RUNTIME_VALIDATION` | **PASS** |
| `PHASE1_LOCAL_RUNTIME_VALIDATION` | **PASS** 或 **SKIPPED**（Local 未启） |
| `ENTERPRISE_SSOT_ALIGNMENT` | **PASS** |
| `blocking_count` | **0** |

---

## 最新证据

| 项 | 路径 |
|----|------|
| Report | `evidence/GO_enterprise_ssot_alignment/20260703T153509Z/ENTERPRISE-SSOT-ALIGNMENT-REPORT.md` |
| Registry | `registry/enterprise-ssot-alignment.v1.yaml` |
| Sign-off | `evidence/manual-uat/signoff/ENTERPRISE-SSOT-ALIGNMENT-SIGNOFF-20260703T153509Z.md` |

---

## 相关 Runbook

- [`TT-OPEN-ISSUES-REGISTRY.md`](TT-OPEN-ISSUES-REGISTRY.md)
- [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md`](TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)
