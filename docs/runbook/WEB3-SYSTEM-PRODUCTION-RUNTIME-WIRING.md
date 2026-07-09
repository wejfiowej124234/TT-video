# Web3 System · Production Runtime Wiring

**Goal:** `GET /meta` → `chain.contracts` **10/10** keys non-null and match `gov_freeze_v2_clean_baseline`.

**Probe:** `node scripts/dev/check-web3-system-production-meta-contracts.cjs`

**SSOT addresses:** `registry/protocol-convergence-deployments.v1.yaml` → `environments.gov_freeze_v2_clean_baseline.addresses`

---

## 当前 Prod 状态（2026-07-08 · P0-002 CLOSED）

| Key | Status |
|-----|--------|
| 全部 10/10 meta contract keys | ✅ **PASS** · `WEB3_SYSTEM_META_CONTRACTS_CLOSURE_PASS` |
| SSOT gov_freeze_v2 对拍 | ✅ **10/10 match** |

**Evidence:** `evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-META-CONTRACTS-CLOSURE-LATEST.json`

---

## 历史快照（接线前 · 5/10 wired）

| Key | Status | SSOT (gov_freeze_v2) |
|-----|--------|----------------------|
| `governor_address` | ✅ wired | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` |
| `fee_router_address` | ✅ wired | `0x81A8009210c5215100564c6E4123F672c4459306` |
| `escrow_factory_address` | ✅ wired | `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` |
| `registry_address` | ✅ wired | `0xc50913e154f850583D0afbE9158a75E0e2167AAb` |
| `staking_provider_address` | ✅ wired | (provider pool) |
| `timelock_address` | ❌ **null** | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| `governance_token_address` | ❌ **null** | `0x2837ea0c50e27d59b88af617abbb231a040062c5` |
| `treasury_address` | ❌ **null** | Treasury P4 cap proxy |
| `region_steward_stake_pool_address` | ❌ **null** | `0x3a89378bfad12d1028707dd37055294854c8784e` |
| `guide_staking_address` | ❌ **null** | `0x5bdACF35292bDd681103BBb50865d8D2Fd49653f` |

**治理执行链断裂：** Governor → ✗ Timelock → ✗ Execute → ✗ Treasury

---

## Step 2 · API Fly secrets（tt-api-prod）

自 `scripts/dev/.env.production.example` 与 gov_freeze_v2 填入 Fly secrets（**勿提交真实值**）：

```bash
# 治理执行链（P0 · 必须先接）
TIMELOCK_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc
GOVERNANCE_TOKEN_ADDRESS=0x2837ea0c50e27d59b88af617abbb231a040062c5
GOVERNANCE_TREASURY_P4CAP_ADDRESS=0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2
LEGACY_TREASURY_ADDRESS=0x6a8323fb2394A1e9655F7132F4E4B8222d2898be
REGION_STEWARD_STAKE_POOL_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e
GUIDE_STAKING_ADDRESS=0x5bdACF35292bDd681103BBb50865d8D2Fd49653f

# 已有 · 对拍
GOVERNOR_ADDRESS=0x847b00ddb6ffed71812abc358a407dad4b099fcb
FEE_ROUTER_ADDRESS=0x81A8009210c5215100564c6E4123F672c4459306
ESCROW_FACTORY_ADDRESS=0xbf746B6a330e61416c6D87aB9b0758f7107C8006
REGISTRY_ADDRESS=0xc50913e154f850583D0afbE9158a75E0e2167AAb
```

Deploy sync:

```bash
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
```

Verify:

```bash
node scripts/dev/check-web3-system-production-meta-contracts.cjs
curl -s https://tt-api-prod.fly.dev/meta | jq '.chain.contracts'
```

---

## Step 2 · FE build env（tt-web-prod）

对齐 `deploy/fly/tt-web-prod/build.env.sepolia-prod.example`：

```bash
NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=0x241948bE49a778490c8A4Ae8D98b7537fE001f63
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x2837ea0c50e27d59b88af617abbb231a040062c5
NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e
# + existing ESCROW_FACTORY / FEE_ROUTER / GOVERNOR / REGISTRY / GUIDE_STAKING
```

Redeploy web after alignment.

---

## 验收标准（SYS-W01）

- [x] 10/10 meta contract keys non-null  
- [x] Each address matches gov_freeze_v2 (case-insensitive)  
- [x] `steward/stake-quote?jurisdictions=CN` → 200  
- [ ] Indexer tick ingests Governor + Timelock events when configured  

---

*Configuration-only runbook · no business logic change*
