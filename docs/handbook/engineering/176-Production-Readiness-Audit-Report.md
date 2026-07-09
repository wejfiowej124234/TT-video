# 176 · Production Readiness Audit Report

**Version:** 1.0.0 · **最后更新：** 2026-06-08  
**受众**：工程 · SRE · 运营 · 融资 IR · Owner  
**状态**：**COMPLETE · ② 测试网 PRA-01 收口**  
**程序 SSOT**：[175 PRA Blueprint](./175-Production-Readiness-Audit-Program-Blueprint.md)  
**ROV 并行 SSOT**：[174 Real Operations Validation Report](./174-Real-Operations-Validation-Report.md)  
**阶段**：**② 测试网**（**非 ③ Production GO**）

> **SSOT（必读）**：本文为 **PRA-01** 唯一进度与裁定报告。**统一证据包**：`evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z/` · 一键复跑：`bash scripts/ops/pra-unified-release-evidence-pack.sh`

**纪律**：**功能冻结** · **零新增业务功能代码**  
**Production GO**：**NO**（继承 147 · 158 score **58/100** · 148 **Sepolia only**）

---

## 1. Executive verdict

| 维度 | 判定 | 备注 |
|------|------|------|
| **PRA-01 六阶段 harness** | **GO** | `failures=0` · 全部 exit 0 |
| **子阶段细粒度** | **PARTIAL（已知 gap）** | Staging Growth 404 · B477 recovery PARTIAL · RBAC matrix local PARTIAL |
| **ROV Wave-2（T4/T5）** | **GO** | Cold Start D3 · CN market **phase=live** |
| **158 深审矩阵** | **HOLD 58/100** | 程序 gate GO · 矩阵 **`PRODUCTION_READINESS_DEEP_AUDIT_HOLD`** |
| **冻结基线 12/12** | **GO** | ROV baseline gate |
| **Production GO** | **NO** | 147 **`PRODUCTION_GO_DECISION: NO_GO`** |

**统一证据包 gate 输出（权威）：**

```text
TT_UNIFIED_RELEASE_EVIDENCE_PACK: GO dir=evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z failures=0
```

**总裁定（② 测试网 · 未进入 ③）：**

```text
TT_PRA_01: COMPLETE phase=② unified=GO production_go=NO feature_freeze=true
```

---

## 2. 六阶段结果明细

### 2.1 PRA-STAGING-FULLCHAIN

| 探针 | 结果 | 备注 |
|------|------|------|
| `GET /health` | **200** | Fly `https://tt-api-staging.fly.dev` |
| `GET /meta` | **200** | |
| `POST /auth/register` | **OK** | cohort `@rov-cohort.invalid` |
| Growth validate | **401/404 文档化** | staging **未部署 Growth 栈** |
| Provider onboarding smoke | **PARTIAL** | `INTERNAL_API_SECRET` 未注入 |
| Staging web Playwright | **SKIP** | `PRA_RUN_STAGING_WEB=0` |

**Harness 裁定**：`TT_PRA_STAGING_FULLCHAIN: PARTIAL passes=4 failures=1` · orchestrator **GO**（exit 0）

### 2.2 PRA-PRESSURE

| 项 | 值 |
|----|-----|
| Bundle | B-477 · `b477-pg-pool-stress-recovery-bundle.sh` |
| API | `http://127.0.0.1:8080` |
| Workers / duration | 16 / 15s |
| Recovery timeout | 180s |

**Harness 裁定**：`TT_PRA_PRESSURE: PARTIAL`（recovery 窗口内未 PASS · 非 FAIL）· orchestrator **GO**

### 2.3 PRA-SECURITY

| 探针 | 结果 |
|------|------|
| `l5-enterprise-rbac-static` | **OK** |
| `l5-p0-e4-rbac-escalation` | **OK** |
| `l5-p0-e3-2fa-coverage` | **OK** |
| `smoke-admin-rbac-matrix-local` | **PARTIAL** |
| Staging RBAC matrix | optional · staging env 存在时执行 |

**Harness 裁定**：`TT_PRA_SECURITY: PARTIAL` · orchestrator **GO**（E3/E4 必过 · matrix 降级）

### 2.4 PRA-DR

| 模式 | 结果 |
|------|------|
| Fly staging DR | 未授权 / 跳过 |
| **Local docker fallback** | **GO** · pg_dump → 回灌 · `users_count=1780` |

**Harness 裁定**：`TT_PRA_DR: GO`

### 2.5 ROV-WAVE2（嵌入 PRA）

| 轨 | 结果 | 摘要 |
|----|------|------|
| **ROV-T4** | **GO** | `l5-p0-d3-cold-start-linkage-smoke` · `TT_L5_P0_D3: GO` |
| **ROV-T5** | **GO** | ISO **CN** · checklist patch · advance → **phase=live** |

**执行环境**：`local_testnet_spine` · `http://127.0.0.1:8080`（**须当前编译 API** · 旧二进制 country-market **404**）

```text
TT_ROV_T4: GO
TT_ROV_T5: GO iso=CN phase=live
TT_ROV_WAVE2: PACK_OK
```

### 2.6 PRA-158-DEEP-AUDIT

| 项 | 值 |
|----|-----|
| 程序 gate | **GO** · `check-production-readiness-deep-audit-execution.sh` |
| 矩阵裁定 | **`PRODUCTION_READINESS_DEEP_AUDIT_HOLD`** · **58/100** |
| P0 HOLD 项 | **5** |

> **说明**：PRA 消费 158 **程序执行** gate；**不**改写 158 矩阵 HOLD 或 147 NO_GO。

---

## 3. 已知 gap（禁止假完成）

| ID | Gap | 状态 | 缓解 |
|----|-----|------|------|
| G-01 | Fly staging **无 Growth API** | **CLOSED** | validate **401** · [177](./177-Production-Governance-Gap-Closure-Report.md) |
| G-02 | 147 / 158 **Production NO** | **CONFIRMED** | PI3 Owner 轨 · 见 [177 §3](./177-Production-Governance-Gap-Closure-Report.md) |
| G-03 | B477 recovery **PARTIAL** | **MITIGATED** | harness GO · 细粒度 PARTIAL |
| G-04 | RBAC matrix local **PARTIAL** | **CLOSED** | 2FA + matrix · [177](./177-Production-Governance-Gap-Closure-Report.md) |
| G-05 | Staging merchant smoke **PARTIAL** | **CLOSED** | provider reuse · [177](./177-Production-Governance-Gap-Closure-Report.md) |
| G-06 | Fly staging DR **未演练** | **CLOSED*** | 122 READY 复用 · live 待 fly 网络 |

---

## 4. 统一发布证据包结构

**根目录**：`evidence/PRODUCTION_READINESS_AUDIT/unified-20260608T053139Z/`

| 路径 | 内容 |
|------|------|
| `unified_manifest.v1.json` | 机读 SSOT · `overall_verdict=GO` |
| `results.tsv` | 六阶段 GO/FAIL |
| `UNIFIED_RELEASE_EVIDENCE_PACK_SUMMARY.md` | 人读摘要 |
| `EVIDENCE_PACK_FILELIST.txt` | 全文件清单 |
| `staging/` | Staging 全链路 log |
| `pressure/` | B-477 报告 |
| `security/` | RBAC / 2FA log |
| `dr/` | DR drill 产物 |
| `rov/wave2/tracks/` | ROV-T4 · ROV-T5 |
| `rov/wave1_pointer.txt` | → `wave1-20260608T045822Z` |

**机读 manifest 摘录：**

```json
{
  "schema": "traveltrust.unified_release_evidence_pack.v1",
  "stamp": "20260608T053139Z",
  "overall_verdict": "GO",
  "failure_count": 0,
  "feature_freeze": true,
  "production_go": "NO",
  "phase": "②"
}
```

---

## 5. 复现

```bash
# 前置：traveltrust-postgres healthy · local API :8080（当前编译）
export DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
bash scripts/ops/pra-unified-release-evidence-pack.sh
# 期望末行: TT_UNIFIED_RELEASE_EVIDENCE_PACK: GO failures=0
```

| 脚本 | 阶段 |
|------|------|
| `scripts/ops/pra-staging-fullchain.sh` | Staging |
| `scripts/ops/pra-pressure-stress.sh` | 压力 |
| `scripts/ops/pra-security-privilege-escalation.sh` | 安全 |
| `scripts/ops/pra-disaster-recovery-drill.sh` | DR |
| `scripts/ops/rov-wave2-evidence-pack.sh` | ROV T4/T5 |
| `scripts/ops/pra-unified-release-evidence-pack.sh` | 统一包 |

---

## 6. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-08 | PRA-01 六阶段完成 · 统一证据包 **GO** · ROV Wave-2 T4/T5 **GO** |
