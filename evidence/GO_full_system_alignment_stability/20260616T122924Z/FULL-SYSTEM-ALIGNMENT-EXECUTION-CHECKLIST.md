# Full System Alignment & Stability — Execution Checklist

**Program:** `TT_FULL_SYSTEM_ALIGNMENT_STABILITY_PROGRAM`
**Stamp:** `20260616T122924Z`
**Baseline:** GovFreeze V2 Clean Baseline（只读 · 禁止重审计）
**Generated:** 2026-06-16T12:29:27Z

**纪律：** 一致性 · 追溯性 · 稳定性 · **禁止** Tokenomics/GovFreeze/MTM146 重复审计

**Inventory:** ACTIVE=62 · LEGACY=6 · DELETE_CANDIDATE=0 · BROKEN=0 · NEEDS_FIX=6
**Fix queue:** P0=0 · P1=6 · P2=0

---

## Batch 1 (18 items)

### NEEDS_FIX (1)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FE-GOV-STEWARD-ALIAS | `scripts/dev/capture-hat-r1-screenshots.mjs` | 脚本/e2e 引用 /governance/steward-region-workbench · 真入口 /governance?view=region（StewardRegion | P1 | 统一 redirect 或改脚本为 /governance?view=region |

### ACTIVE (17)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FE-PAGES-DISCOVERED | `frontend/app/**/page.tsx` | 发现 194 条 App Router 页面 | — | SSOT 页面树 |
| FE-FIVE-_ | `frontend/app/(home)` | 五主路由 / | — | FIVE-MAIN 冻结 |
| FE-FIVE-_traveltrust | `frontend/app/traveltrust` | 五主路由 /traveltrust | — | FIVE-MAIN 冻结 |
| FE-FIVE-_market | `frontend/app/market` | 五主路由 /market | — | FIVE-MAIN 冻结 |
| FE-FIVE-_did-rank | `frontend/app/did-rank` | 五主路由 /did-rank | — | FIVE-MAIN 冻结 |
| FE-FIVE-_community | `frontend/app/community` | 五主路由 /community | — | FIVE-MAIN 冻结 |
| FE-GOV-governance | `frontend/app/governance` | 治理页 /governance | — | — |
| FE-GOV-governance-params | `frontend/app/governance/params` | 治理页 /governance/params | — | — |
| FE-GOV-governance-proposals | `frontend/app/governance/proposals` | 治理页 /governance/proposals | — | — |
| FE-GOV-governance-proposals-new | `frontend/app/governance/proposals/new` | 治理页 /governance/proposals/new | — | — |
| FE-GOV-governance-proposals-[id] | `frontend/app/governance/proposals/[id]` | 治理页 /governance/proposals/[id] | — | — |
| FE-GOV-governance-delegate | `frontend/app/governance/delegate` | 治理页 /governance/delegate | — | — |
| FE-GOV-governance-fee-routes | `frontend/app/governance/fee-routes` | 治理页 /governance/fee-routes | — | — |
| FE-GOV-governance-vault-forwards | `frontend/app/governance/vault-forwards` | 治理页 /governance/vault-forwards | — | — |
| FE-GOV-governance-distribution-accruals | `frontend/app/governance/distribution-accruals` | 治理页 /governance/distribution-accruals | — | — |
| FE-GOV-governance-distribution-claim | `frontend/app/governance/distribution-claim` | 治理页 /governance/distribution-claim | — | — |
| FE-ROUTE-PROPOSALS-NEW | `frontend/app/governance/proposals/new/page.tsx` | 提案创建 SSOT = /governance/proposals/new | — | — |

## Batch 2 (16 items)

### NEEDS_FIX (3)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| API-PARITY-params | `/api/v1/governance/params` | FE=N BE=Y · /api/v1/governance/params | P1 | 补 BE handler 或 FE routes.ts |
| API-PARITY-:id | `/api/v1/governance/proposal-status/:id` | FE=N BE=Y · /api/v1/governance/proposal-status/:id | P1 | 补 BE handler 或 FE routes.ts |
| API-PARITY-:jurisdiction | `/api/v1/governance/country-ledger/:jurisdiction` | FE=N BE=Y · /api/v1/governance/country-ledger/:jurisdiction | P1 | 补 BE handler 或 FE routes.ts |

### ACTIVE (13)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FE-API-PATHS | `frontend/lib/api/routes.ts` | FE 路径常量 135 条 | — | 与 04 §三对拍 |
| BE-ROUTES-RS | `crates/api/src/routes/**` | BE 路由字面量 639 条 | — | — |
| API-PARITY-pool | `/api/v1/governance/pool` | FE=Y BE=Y · /api/v1/governance/pool | — | — |
| API-PARITY-rewards | `/api/v1/governance/rewards` | FE=Y BE=Y · /api/v1/governance/rewards | — | — |
| API-PARITY-fee-routes | `/api/v1/governance/fee-routes` | FE=Y BE=Y · /api/v1/governance/fee-routes | — | — |
| API-PARITY-vault-forwards | `/api/v1/governance/vault-forwards` | FE=Y BE=Y · /api/v1/governance/vault-forwards | — | — |
| API-PARITY-protocol-reference | `/api/v1/governance/protocol-reference` | FE=Y BE=Y · /api/v1/governance/protocol-reference | — | — |
| API-PARITY-proposals | `/api/v1/governance/proposals` | FE=Y BE=Y · /api/v1/governance/proposals | — | — |
| API-PARITY-delegate | `/api/v1/governance/delegate` | FE=Y BE=Y · /api/v1/governance/delegate | — | — |
| API-PARITY-voting-power | `/api/v1/governance/voting-power` | FE=Y BE=Y · /api/v1/governance/voting-power | — | — |
| API-PARITY-investor-distributio | `/api/v1/governance/investor-distribution-accruals` | FE=Y BE=Y · /api/v1/governance/investor-distribution-accruals | — | — |
| API-PARITY-quote | `/api/v1/governance/ttg-exchange/quote` | FE=Y BE=Y · /api/v1/governance/ttg-exchange/quote | — | — |
| API-PARITY-state-machines | `/api/v1/governance/state-machines` | FE=Y BE=Y · /api/v1/governance/state-machines | — | — |

## Batch 3 (12 items)

### ACTIVE (12)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| DB-MIGRATIONS | `crates/api/migrations/` | SQLx migrations · 116 files · 133 tables | — | — |
| DB-TBL-governance_pool | `crates/api/migrations/*` | 治理表 governance_pool 存在 | — | — |
| DB-TBL-governance_reward_records | `crates/api/migrations/*` | 治理表 governance_reward_records 存在 | — | — |
| DB-TBL-governance_proposals_projection | `crates/api/migrations/*` | 治理表 governance_proposals_projection 存在 | — | — |
| DB-TBL-governance_mvp_proposals | `crates/api/migrations/*` | 治理表 governance_mvp_proposals 存在 | — | — |
| DB-TBL-governance_mvp_votes | `crates/api/migrations/*` | 治理表 governance_mvp_votes 存在 | — | — |
| DB-TBL-governance_mvp_delegations | `crates/api/migrations/*` | 治理表 governance_mvp_delegations 存在 | — | — |
| DB-TBL-investor_distribution_accruals | `crates/api/migrations/*` | 治理表 investor_distribution_accruals 存在 | — | — |
| DB-TBL-investor_distribution_accrual_lines | `crates/api/migrations/*` | 治理表 investor_distribution_accrual_lines 存在 | — | — |
| DB-TBL-p5_country_ledger_lines | `crates/api/migrations/*` | 治理表 p5_country_ledger_lines 存在 | — | — |
| DB-TBL-fee_router_routed_events | `crates/api/migrations/*` | 治理表 fee_router_routed_events 存在 | — | — |
| DB-TBL-region_vault_forwarded_events | `crates/api/migrations/*` | 治理表 region_vault_forwarded_events 存在 | — | — |

## Batch 4 (3 items)

### NEEDS_FIX (1)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| REG-LEGACY-NO-COMMENT | `registry/protocol-convergence-deployments.v1.yaml` | registry 含 legacy 地址 0xd5225ba8… 无 LEGACY 注释 | P1 | 添加 # LEGACY cutover 旁证 |

### ACTIVE (2)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| ENV-GOVFREEZE-V2 | `scripts/dev/.env.phase2-chain-deploy.local` | ACTIVE 地址 19 · LEGACY 8 | — | 禁止替换 LEGACY 为 ACTIVE |
| FE-GOV-ABI | `frontend/lib/governance/` | 治理 ABI 模块 4 个 | — | — |

## Batch 5 (3 items)

### ACTIVE (3)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| ADM-PAGES | `frontend/app/admin/**` | Admin 页面 107 条 | — | Cert #3 walkthrough |
| ADM-RBAC-API | `crates/api/src/routes/admin/admin_rbac.rs` | Admin RBAC route-matrix / capabilities | — | — |
| ID-HUB-PAGE | `frontend/app/me/identities/page.tsx` | 多重身份 Hub · ME-IDENTITIES-UI-FREEZE | — | — |

## Batch 6 (9 items)

### NEEDS_FIX (1)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FLOW-STEWARD-WORKBENCH | `/governance?view=region` | 质押/Seat 工作台真入口 · 脚本 alias 漂移 | P1 | redirect 或更新 capture/e2e |

### ACTIVE (8)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FLOW-AUTH | `/auth/login · /auth/register · /me` | 注册/登录 → 个人中心 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-IDENTITIES | `/me/identities` | 多重身份 Hub · missing=none | — | 真人 UAT 待 Cert |
| FLOW-PROVIDER | `/provider/register · /auth/register` | 商家入驻 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-MARKET | `/market · /market/acquisition` | 自由市场 · 收购 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-GOV-PROPOSAL | `/governance/proposals · /governance/proposals/new` | 治理提案 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-GOV-CLAIM | `/governance/distribution-accruals · /governance/distribution` | 收益 · Claim 边界 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-ESCROW | `/escrow/[id]` | 订单托管页 · missing=none | — | 真人 UAT 待 Cert |
| FLOW-HOME | `/` | 首页 · missing=none | — | 真人 UAT 待 Cert |

## Batch 7 (5 items)

### ACTIVE (5)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| FIN-UI-params | `frontend/appgovernance/params` | Treasury/45-55 参数页 | — | — |
| FIN-UI-distribution-accruals | `frontend/appgovernance/distribution-accruals` | Accruals 只读 | — | — |
| FIN-UI-distribution-claim | `frontend/appgovernance/distribution-claim` | Claim 边界 | — | — |
| FIN-UI-fee-routes | `frontend/appgovernance/fee-routes` | FeeRouter 正交 | — | — |
| EVID-FOUR-LEDGER | `evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T` | 四账 reconcile · latest=20260616T084248Z · 只读引用不重跑 | — | — |

## Batch 8 (6 items)

### LEGACY (6)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| LEGACY-run-tt-governance-enterp | `scripts/dev/run-tt-governance-enterprise-hat-audit.sh` | 已通过治理逻辑 · 禁止本程序重审计 | — | 只读引用 |
| LEGACY-gen-ttg-governance-full- | `scripts/dev/gen-ttg-governance-full-coverage-matrix.py` | 已通过治理逻辑 · 禁止本程序重审计 | — | 只读引用 |
| LEGACY-run-g24-clean-baseline-0 | `scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh` | 已通过治理逻辑 · 禁止本程序重审计 | — | 只读引用 |
| LEGACY-assert-gov-freeze-v2-act | `scripts/dev/assert-gov-freeze-v2-active-baseline-only.sh` | 已通过治理逻辑 · 禁止本程序重审计 | — | 只读引用 |
| ARCH-UI-V1 | `frontend/archive/ui-v1` | 归档 UI v1 · 97 files | — | 禁止回流 runtime |
| DOC-FULL-COVERAGE-MATRIX | `docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-MATR` | 834 行矩阵 · MTM 146 取代 | — | — |

## Batch 9 (2 items)

### ACTIVE (2)

| ID | Path | Summary | Priority | Action |
|----|------|---------|----------|--------|
| PROBE-AI-PRE-UAT | `evidence/GO_ai_pre_human_uat/latest-stamp.txt` | 复用 AI 预验收 probe · 不重跑 GovFreeze assert | — | — |
| PROBE-LOCAL-API | `http://127.0.0.1:8080` | 本地 API 探针 · reachable=True | — | — |

## Fix queue

### P0


### P1

- **FE-GOV-STEWARD-ALIAS** · `scripts/dev/capture-hat-r1-screenshots.mjs` · 脚本/e2e 引用 /governance/steward-region-workbench · 真入口 /governance?view=region（Ste
- **API-PARITY-params** · `/api/v1/governance/params` · FE=N BE=Y · /api/v1/governance/params
- **API-PARITY-:id** · `/api/v1/governance/proposal-status/:id` · FE=N BE=Y · /api/v1/governance/proposal-status/:id
- **API-PARITY-:jurisdiction** · `/api/v1/governance/country-ledger/:jurisdiction` · FE=N BE=Y · /api/v1/governance/country-ledger/:jurisdiction
- **REG-LEGACY-NO-COMMENT** · `registry/protocol-convergence-deployments.v1.yaml` · registry 含 legacy 地址 0xd5225ba8… 无 LEGACY 注释
- **FLOW-STEWARD-WORKBENCH** · `/governance?view=region` · 质押/Seat 工作台真入口 · 脚本 alias 漂移

### P2


**Machine key:** `TT_FULL_SYS_ALIGN: ACTIVE=62 LEGACY=6 DEL=0 BROKEN=0 FIX=6 P0=0 P1=6 P2=0`