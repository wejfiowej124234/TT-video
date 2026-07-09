# G2 Formal Acceptance Plan · Wave 2

**Gate:** G2 · Production Hardening  
**Prerequisites:** `TT_PRODUCTION_READINESS_G1_GATE: PASS` · **`TT_G2_REALITY_VERIFICATION: COMPLETE`** · **`TT_EVIDENCE_INTEGRITY_AUDIT: PASS`** · **`TT_WAVE2_FORMAL_ACCEPTANCE: READY`**  
**SSOT Matrix:** [`registry/production-readiness-master-matrix.v1.yaml`](../../registry/production-readiness-master-matrix.v1.yaml)  
**Reality baseline:** [G2-REALITY-GAP-REPORT.md](G2-REALITY-GAP-REPORT.md)

---

## 0. 目标

**前置：** Reality Fix + Re-Audit 已完成（四项 live VERIFIED · 无 Matrix 漂移）。

`validate-production-readiness-g2-gate.cjs` **exit 0** — 四项 G2 Blocker 全部 CLOSED + 证据入库。

**不等于：** Production GO（仍须 G3 PASS）。

---

## 1. 执行顺序

```text
Wave 2.0  Preflight（Verification COMPLETE · Integrity Audit PASS · TT_WAVE2_FORMAL_ACCEPTANCE: READY）
    ↓
Wave 2.0a Evidence Integrity Audit
    bash scripts/dev/run-evidence-integrity-audit.sh G2
    ↓
Wave 2.1  Security — PRM-SEC-B001 + PRM-SEC-B002
    ↓
Wave 2.2  Performance — PRM-PER-B001
    ↓
Wave 2.3  Monitoring — PRM-MON-B001
    ↓
Wave 2.4  Matrix sync + G2 gate validate + commit evidence
```

---

## 2. 分项验收（唯一事实来源）

### 2.1 PRM-SEC-B001 · Prod secrets / internal API hygiene

| 检查项 | 入口 | 通过标准 |
|--------|------|----------|
| Fly prod secrets 清单 | `scripts/dev/.env.production.example` + `phase3-production-fly-deploy-and-sync.sh` | `INTERNAL_API_SECRET` 非空 · 与 ①② 隔离 |
| Internal 路由门闸 | `POST https://<prod-api>/api/v1/internal/indexer-tick` 无 header | **403** |
| Meta 回读 | `GET /meta` → `internal_api_secret_configured` | **true** on prod |

**证据路径：** `evidence/GO_production_readiness/wave-2-g2/<stamp>/security-b001/`

**复用脚本：** `bash scripts/dev/run-phase3-production-go-audit.sh`（P3-INTERNAL-* 段 · prod-only 探针）

---

### 2.2 PRM-SEC-B002 · Prod seed / demo surface policy

| 检查项 | 入口 | 通过标准 |
|--------|------|----------|
| Fly env | `fly ssh console -a tt-api-prod` · `SEED_TEST_ACCOUNTS` | **0** / unset |
| Seed 端点 | `POST /auth/seed-test-accounts` on prod base | **403** `seed_test_accounts_disabled` |
| 政策文档 | `.env.production.example` + cutover runbook | 已在 G2 Reality 确认 · 本轮附 prod 探针 log |

**证据路径：** `evidence/GO_production_readiness/wave-2-g2/<stamp>/security-b002/`

---

### 2.3 PRM-PER-B001 · Prod performance / SLO evidence

| 检查项 | 入口 | 通过标准 |
|--------|------|----------|
| Load smoke 或 SLO baseline | TBD owner script（prod API base） |  documented p95 / error rate 或 PASS smoke |
| 不得复用 | ② staging soak / C7 report alone | — |

**证据路径：** `evidence/GO_production_readiness/wave-2-g2/<stamp>/performance-b001/`

**状态：** **待 Wave 2.2 实施** — G2 Reality Audit 已 REOPEN（原 Matrix 误 CLOSED）

---

### 2.4 PRM-MON-B001 · Prod synthetic monitoring / on-call

| 检查项 | 入口 | 通过标准 |
|--------|------|----------|
| Synthetic probes | Prod health/meta/community feed 探针 | 绿 · 可复现 |
| On-call path | `docs/runbook/PRODUCTION-OPS-RUNBOOK.md` + 签字 | Owner 书面确认 |
| 不得单独复用 | `evidence/.../community/C8/` ② 槽 | 可作旁证 · **不能**关 Blocker |

**证据路径：** `evidence/GO_production_readiness/wave-2-g2/<stamp>/monitoring-b001/`

**复用脚本（staging 预演 · 非收口）：** `bash scripts/dev/smoke-community-c8-staging-monitoring.sh`  
**Prometheus rules：** `bash scripts/gates/check-ops-monitoring-prometheus-examples.sh`

---

## 3. 编排脚本

| 脚本 | 作用 |
|------|------|
| `bash scripts/dev/run-production-readiness-wave-2-g2-formal.sh` | **主入口** · Formal Checklist · Evidence · Sign-off · G2 Gate |
| `validate-g2-formal-acceptance.cjs` | Formal signoff JSON |
| `sync-production-readiness-g2-matrix.cjs --mode formal` | `TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE` |
| `validate-production-readiness-g2-gate.cjs` | G2 PASS 硬闸 |

**G2 Reality Audit（本轮已完成 · `20260704T015213Z`）：**

```bash
bash scripts/dev/run-g2-reality-audit-closure.sh
```

---

## 4. Matrix 更新纪律

每完成一项 → 立即 `sync-production-readiness-g2-matrix.cjs` → 验证 `open_blockers` 下降。

**禁止：** 用 ② staging 探针或旧 go-audit JSON ** alone** 关闭 SEC/MON prod 条款。

---

## 5. 阶段口径

| 阶段 | Wave 2 可宣称 |
|------|----------------|
| **① 本地** | G2 Reality Audit 代码锚点 ✓ |
| **② Staging** | internal 403 · C8 旁证 ✓ · **非 G2 PASS** |
| **③ Prod cutover** | Wave 2 正式验收目标域 |

---

**Owner:** Sebastian Ward · 2026-07-04
