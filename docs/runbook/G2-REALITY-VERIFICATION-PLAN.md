# G2 Reality Verification Plan

**Gate:** G2 · Production Hardening  
**Prerequisites:** `TT_G2_REALITY_FIX` evidence committed · `TT_G2_REALITY_AUDIT: COMPLETE`  
**SSOT（统一规范）：** [`TT-RELEASE-TRAIN-REALITY-VERIFICATION.md`](TT-RELEASE-TRAIN-REALITY-VERIFICATION.md) · [`TT-PRODUCTION-RUNTIME-IDENTITY-GUARD.md`](TT-PRODUCTION-RUNTIME-IDENTITY-GUARD.md)  
**G2 Fix baseline：** [`G2-REALITY-FIX-PLAN.md`](G2-REALITY-FIX-PLAN.md)

---

## Release Train（G1/G2/G3 同源 · 含 Verification 层）

```text
Reality Audit
        │
Reality Gap Report
        │
Reality Fix
        │
Reality Re-Audit（可选 · live 重探针）
        │
Reality Verification   ← 本轮
        │
Formal Acceptance
        │
TT_PRODUCTION_READINESS_G2_GATE: PASS
```

**Verification 职责：** 不再改代码逻辑 — 检查 **Evidence · Matrix · Registry · Runtime · Call Graph** 五真源一致，且无路由/热路径/Identity/告警链路遗漏。  
**Production Identity：** `TT_PRODUCTION_RUNTIME_IDENTITY` 强制 PASS（`PRM-SEC-B002`）· 见 Identity Guard runbook。  
**失败时：** Matrix 中误 CLOSED 的项 **REOPEN**（不假装永久关闭）。

---

## 四向一致性

| 维度 | 检查 |
|------|------|
| **Evidence** | `g2-reality-verification/<stamp>/` 分项目录齐全 |
| **Matrix** | `closed_evidence` 与证据路径一致 · 未 VERIFIED 不得 CLOSED |
| **Registry** | [`g2-internal-routes-ssot.v1.json`](../../registry/g2-internal-routes-ssot.v1.json) · [`g2-perf-hot-paths-ssot.v1.json`](../../registry/g2-perf-hot-paths-ssot.v1.json) |
| **Runtime** | Prod 探针复跑 · 与 Fix 声称一致 |

---

## 分项 Verification 标准

### PRM-SEC-B001

- 代码：`internal_api_secret_gate_layer` + `/api/v1/internal/` 前缀门闸
- **全部 SSOT internal 路由**（22 条）无 secret → **403/401**（非 200）
- Fly `INTERNAL_API_SECRET` 在列

### PRM-SEC-B002

- Prod `deployment_profile=production`（meta 或 Fly env）
- Staging `deployment_profile=staging` · 与 prod **可区分**
- `SEED=0` · seed POST → **403** · SHOWCASE/DEMO off

### PRM-PER-B001

热路径 SSOT（prod 只读）：

| ID | 路径 |
|----|------|
| community_feed | `/api/v1/community/feed` |
| discover_orders | `/api/v1/discover/orders` |
| market_provider_listings | `/api/v1/market/provider/listings` |
| guides | `/api/v1/guides` |
| campaign_surface | `/api/v1/official/cold-start/surfaces/home` |
| + `/health` · `/meta` | 基线 |

### PRM-MON-B001

- Prod synthetic 200
- Prom rules 脚本 PASS
- **Alert drill：** 无 secret → 403 · **有 secret** → `alerts/test-fire` + `incident/open` **200** + `incident.id`
- On-call runbook 路径 · incident 记录入库

**Alert drill 需本地：** `scripts/dev/.env.production.local` 含 `INTERNAL_API_SECRET`（不提交仓库）

---

## Verification 结果 · `20260704T021232Z`

| ID | Verification | 关键发现 |
|----|--------------|----------|
| **PRM-SEC-B001** | ✅ VERIFIED | **22/22** internal 路由无 secret → 403/401 · 代码层统一 gate |
| **PRM-SEC-B002** | ❌ FAIL | `deployment_profile=null` · Fly 缺 `TRAVELTRUST_DEPLOYMENT_PROFILE` → **Matrix REOPEN** |
| **PRM-PER-B001** | ✅ VERIFIED | 7 条热路径 SSOT 已采样（含 discover/market/guides/campaign） |
| **PRM-MON-B001** | ✅ VERIFIED | Synthetic 200 · alert fire + incident open（含 secret）· `INC-*` 记录 |

**Formal Acceptance：** `BLOCKED`（SEC-B002 未 VERIFIED）

---

## 命令

```bash
bash scripts/dev/run-g2-reality-verification.sh
node scripts/dev/validate-production-readiness-g2-gate.cjs   # 仅 Verification COMPLETE 后
```

**解除 SEC-B002（Production Profile）：**

```bash
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
bash scripts/dev/run-g2-reality-verification.sh
```

---

## 诚实边界

- Verification **REOPEN** ≠ 回归 Fix 失败 · 是 Matrix 真实性校正  
- Verification COMPLETE **≠** G2 PASS · 仍须 Formal Acceptance  
- ①② 绿 **≠** ③ Production GO

---

**Owner:** Sebastian Ward · 2026-07-04
