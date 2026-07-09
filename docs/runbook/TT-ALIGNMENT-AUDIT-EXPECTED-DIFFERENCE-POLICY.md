# 对齐审计 · Expected Difference vs Drift（长期维护规则）

**生效：** 2026-07-01  
**状态：** **ACTIVE** — 所有 ①↔② 对齐审计 **必须** 遵循  
**前置：** Phase ② Convergence **CLOSED** · 进入 Phase ③ 前固化  
**SSOT 层级：** 本文件为对齐审计 **分类真源** · 实现见 `emit-local-first-alignment-audit.mjs` · `gen-phase2-baseline-consistency-audit.py` · 企业审计报告模板

---

## 0 · 机读键

```text
ALIGNMENT_AUDIT_CLASSIFICATION: EXPECTED_DIFFERENCE_VS_DRIFT
PRE_PRODUCTION_GO_CLOSURE: FIX_REAL_ONLY_CONFIRM_EXPECTED
RISK_CLASSIFICATION: BLOCKING_VS_NON_BLOCKING
ALIGNMENT_AUDIT_SCOPE_PHASE12: ACTIVE
ALIGNMENT_AUDIT_SCOPE_PHASE3: PRODUCTION_READINESS_ONLY
PHASE3_PRODUCTION_READINESS_REVIEW: PENDING
PHASE3_PRODUCTION_GO: NO_GO
```

---

## 1 · Production GO 前闭合纪律（写死）

**在 Production GO 之前：**

| 类别 | 含义 | Production GO 前处置 |
|------|------|-------------------|
| **Defect** | 业务/功能缺陷（registry · P0/P1 及阻塞发布的 P2） | **全部修复并验证** |
| **Drift** | 同环境 SSOT 失配，或跨环境 **必须相同** 维度失配 | **全部修复**（或 S5 部署 + S6 验收取代） |
| **Conflict** | 文档/Sign-off/机读键/Registry 互相矛盾 | **全部收敛**（SUPERSEDED / ARCHIVED / 单一真源） |
| **Risk** | 运维/安全/发布未闭合项 | **必须消除**；见 **§3 Risk 分级** |
| **Expected Difference** | 环境设计上 **本来就应该不同** | **确认符合设计即可** · **禁止** 错误地修成一致 |

**一句话：** 真问题清零 · 预期差异只确认、不强求一致。

**禁止：**

- 为通过审计而把 Local 改成 Staging 的 chain_id / 合约地址 / host  
- 把 Expected Difference 登记为 Defect 或 Drift  
- 用 **接受风险** 替代 **Blocking Risk** 的修复  
- 在 `non_production_blockers > 0` 或 OPEN P0/P1 Defect 存在时宣称 Production GO Ready

---

## 2 · 核心分类原则

**任何不一致，先分类，再处置：**

1. **Expected Difference** — **CONFIRM_DESIGN** · **不** 修复为一致  
2. **Drift** — **FIX**  
3. **Defect / Conflict** — **FIX**  
4. **Risk** — **FIX** 或（仅 Non-blocking）**ACCEPT_WITH_OWNER**

**审计输出必须显式标注：**  
`classification: DEFECT | DRIFT | CONFLICT | RISK_BLOCKING | RISK_NON_BLOCKING | EXPECTED_DIFFERENCE`  
`disposition: FIX | CONFIRM_DESIGN | ACCEPT_WITH_OWNER`

禁止把 Expected Difference 混入「需修复问题」清单。

---

## 3 · Risk 分级（Blocking vs Non-blocking）

**Risk 必须消除。** 若 Production GO 前无法消除，须满足 **Risk 子类** 纪律：

| 子类 | 定义 | Production GO 前处置 |
|------|------|---------------------|
| **Blocking Risk** | **阻断上线** — 不修复则不得 GO | **必须关闭（FIX）** · **禁止** 以接受风险替代修复 |
| **Non-blocking Risk** | **不阻断上线** — 可延期、可运维兜底 | **优先 FIX** · 若无法消除 → **Owner 明确书面接受** 后方可 GO |

### Blocking Risk 示例（必须 FIX · 不可 ACCEPT）

- 支付错误 / 错账 / 重复扣款  
- 资金安全 / 托管逻辑错误  
- 数据丢失 / 不可恢复损坏 / 备份未验证  
- 权限绕过 / 未授权访问 admin 或 internal API  
- 生产密钥泄露或 staging 密钥上生产  
- 监控/告警完全缺失导致故障不可见（go-live 硬要求项）

### Non-blocking Risk 示例（可 FIX 或 Owner ACCEPT）

- 低优先级 UI/体验优化延期  
- 非关键路径性能优化未做  
- 文档/Runbook 次要章节滞后（主 SSOT 已闭合）  
- CDN/HLS 增强项在核心链路已可用时的锦上添花项（须 PI-3 条目明示）

**登记纪律：** 每项 Risk 须标注 `risk_class: BLOCKING | NON_BLOCKING` · Non-blocking 接受须 **Sign-off 条目**（Owner · 理由 · 缓解措施 · 目标关闭日）。

**Production GO Gate 机读：**

```text
OPEN_BLOCKING_RISKS: 0          # 硬闸 — 不接受 defer
OPEN_NON_BLOCKING_RISKS: 0       # 或每项 OWNER_ACCEPTED 已登记
```

---

## 4b · Configuration Alignment vs Runtime Validation（2026-07-03 · ENFORCED）

| 检查项 | 验证什么 | 不验证什么 |
|--------|----------|------------|
| **CONFIGURATION_ALIGNMENT** | Registry · Runbook · 配置 · 治理 SSOT 一致 | Local/Staging 进程是否启动 |
| **PHASE1_LOCAL_RUNTIME_VALIDATION** | Local API 运行态 | 仅配置/doc 一致性 |
| **PHASE2_STAGING_RUNTIME_VALIDATION** | Staging API 运行态 | Catalog 素材来源 |

```text
CONFIGURATION_ALIGNMENT PASS  ≠  Local Runtime Running
```

Local API 未启动 → `PHASE1_LOCAL_RUNTIME_VALIDATION=SKIPPED` → **仍可为** Enterprise SSOT PASS。  
SSOT：`registry/enterprise-ssot-alignment.v1.yaml` → `alignment_dimensions`

---

## 4 · Phase ① Local vs Phase ② Staging 对照表

| 项目 | Local | Staging | 必须一致？ | 分类 |
|------|-------|---------|------------|------|
| chain_id | 31337 (Anvil) | 11155111 (Sepolia) | ❌ | **EXPECTED_DIFFERENCE** |
| 合约地址 | Anvil 部署 | Sepolia 部署 | ❌ | **EXPECTED_DIFFERENCE** |
| API_BASE / WEB_BASE | 127.0.0.1 | *.fly.dev | ❌ | **EXPECTED_DIFFERENCE** |
| Git SHA（HEAD vs 已部署） | HEAD 可领先 | 已部署 SHA | ❌* | **EXPECTED_DIFFERENCE**（`LOCAL_AHEAD_UNDEPLOYED`） |
| E1 TrustGate 账号 | 本地专用 | 不存在/401 | ❌ | **EXPECTED_DIFFERENCE** |
| **ABI**（仓库内） | 同 HEAD | 同 HEAD | ✅ | **MUST_MATCH** · 失配 = **DRIFT** |
| **API Contract**（04/spec + 路由） | 同 HEAD | 同 HEAD | ✅ | **MUST_MATCH** · 失配 = **DRIFT** |
| **数据结构**（migration/schema 语义） | 同 HEAD | 同 HEAD | ✅ | **MUST_MATCH** · 失配 = **DRIFT** |
| **测试账号** C1–C4/E2 | Test123! | Test123! | ✅ | **MUST_MATCH** · 失配 = **DRIFT** |
| **/meta 字段** | 各自 env 自洽 | 各自 env 自洽 | ✅ | **INTRA_ENV_SSOT** · 环内失配 = **DRIFT** |
| build.env ↔ staging /meta | N/A | 必须对拍 | ✅ | **MUST_MATCH** · 失配 = **DRIFT** |
| root .env ↔ local /meta | 必须对拍 | N/A | ✅ | **INTRA_ENV_SSOT** |

\* HEAD 领先 staging 已部署 SHA 在 **S5 部署前** 为预期；**非祖先 SHA** 或 staging 运行版本与 **已声明 deploy SHA** 不符 = **RUNTIME_DRIFT**。

---

## 5 · 什么 **不是** Phase ③ 的「待修复」工作

- Local chain_id ≠ Staging chain_id  
- Local 合约地址 ≠ Staging 合约地址  
- `LOCAL_AHEAD_UNDEPLOYED`（无 runtime drift 证据时）  
- 混用 local/staging URL 导致的手测误报（纪律问题 · 非 Drift）

---

## 6 · Phase ③ 真正关注点（发布主轨）

对齐审计 **毕业** 后，工程注意力转向：

| 轨道 | 机读键 | 内容 |
|------|--------|------|
| **Production Readiness Review** | `PHASE3_PRODUCTION_READINESS_REVIEW` | 生产就绪评审 · PI-3 清单 · 运维证据 |
| **Production GO Gate** | `PHASE3_PRODUCTION_GO` | M-00 / go-live §0–§11 · `go_no_go.json` |
| **Mainnet / Production 准备** | `PRODUCTION_INFRASTRUCTURE_AUDIT` | 专用域名 · 生产密钥 · Stripe live · 监控 · Fly 备份 · 回滚 · CDN/HLS |

**入口 SSOT：** [PHASE3-PRODUCTION-PREPARATION.md](./PHASE3-PRODUCTION-PREPARATION.md) · [go-live-checklist.md](../go-live-checklist.md)

---

## 7 · Production GO 闸门检查清单（分类出口）

进入 **Production GO Gate** 前，须同时满足：

```text
OPEN_P0_DEFECTS: 0
OPEN_P1_DEFECTS: 0
DRIFT_BLOCKERS: 0
SSOT_CONFLICTS: 0
OPEN_BLOCKING_RISKS: 0            # 硬闸 — 禁止 ACCEPT 替代 FIX
OPEN_NON_BLOCKING_RISKS: 0        # 或每项 risk_class=NON_BLOCKING 且 OWNER_ACCEPTED
non_production_BLOCKERS: 0
production_only_BLOCKERS: 0       # 生产专属项逐项关闭（多为 Blocking Risk）
EXPECTED_DIFFERENCE: CONFIRMED    # 对照 §4 表 · CONFIRM_DESIGN · 无 FIX 项
```

**Registry SSOT：** `evidence/manual-uat/summary/defects-registry.json` · `phase3-ssot-registry.v1.json`

---

## 8 · 审计脚本与报告纪律

| 产物 | 要求 |
|------|------|
| 企业/基线对齐报告 | **Defect** · **Drift** · **Conflict** · **Risk（BLOCKING / NON_BLOCKING）** · **Expected Difference（CONFIRMED）** |
| `emit-local-first-alignment-audit.mjs` | `runtime_drift: false` + `LOCAL_AHEAD` → INFO · 非 P0 |
| `run-phase3-production-go-audit.sh` | `blocker_production_only` vs `blocker_non_production` 分计 |
| 新手测/Owner 报告 | 禁止「chain_id 不一致」作为修复建议 |

**报告模板：** `evidence/enterprise_alignment_audit/<stamp>/ENTERPRISE-ALIGNMENT-AUDIT-REPORT.md`

---

## 9 · 相关 SSOT

- [TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md) — LOCAL_AHEAD vs RUNTIME_DRIFT  
- [PHASE2-LOCAL-STAGING-PARITY-LOOP.md](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md) — S1–S6  
- [TT-LOCAL-TEST-ACCOUNTS-MATRIX.md](./TT-LOCAL-TEST-ACCOUNTS-MATRIX.md) — C1–E2  
- [TT-TEST-ACCOUNTS-QUICK-REFERENCE.md](./TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) — 日常一页  
- [registry/test-accounts-business-immutable.v1.yaml](../../registry/test-accounts-business-immutable.v1.yaml) — 邮箱机读真源  
- [docs/spec/14-合约-API-ABI-前后端对齐.md](../spec/14-合约-API-ABI-前后端对齐.md) — ABI/API Contract
