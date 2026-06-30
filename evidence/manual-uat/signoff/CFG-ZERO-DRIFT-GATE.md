# CFG Zero Drift Gate — Production Entry Review Signoff

**Phase:** ① Local (Configuration alignment · **not** ③ Production GO)
**Closed UTC:** `2026-06-30T12:37:39Z`
**Fix commit (tracked):** `422aadb9`
**Verifier:** `bash scripts/dev/verify-cfg-drift-closure.sh` (CFG_VERIFY_STRICT=1)

## Graduation criteria

| Criterion | Result |
|-----------|--------|
| CFG-001～CFG-028 | **28/28 CLOSED or VERIFIED** |
| Repository Drift | **0** (`scan-repository-cfg-drift.sh` exit 0) |
| Runtime Drift | **0** (health/meta/MinIO/Anvil/git_sha · ① local) |
| Script Drift | **0** (sync + smoke + vitest checks) |
| Template Drift | **0** (staging/production/preprod examples) |
| Document Drift | **0** (spec/38 · dev-local-smoke · CFG cross-links) |
| verify-cfg-drift-closure.sh | **PASS** (warns=0) |

## Machine line

```
TT_CFG_ZERO_DRIFT_GATE: PASS
```

## CFG item closure matrix

| ID | Status | Title |
|----|--------|-------|
| CFG-001 | CLOSED | INTERNAL_API_SECRET ① 与 ② 同值 |
| CFG-002 | CLOSED | 真实第三方密钥仅存 gitignore/Fly |
| CFG-003 | VERIFIED | ① DEPLOYMENT_PROFILE=production |
| CFG-004 | VERIFIED | NEXT_PUBLIC_API_BASE_URL 误指 3012 |
| CFG-005 | VERIFIED | frontend/.env.local 同步标记损坏 |
| CFG-006 | VERIFIED | MinIO :19000 未运行 |
| CFG-007 | VERIFIED | Anvil :8545 未运行且 P3_CHAIN_OFF=0 |
| CFG-008 | VERIFIED | P3_CHAIN_OFF 与 mock-pay UI 不一致 |
| CFG-009 | VERIFIED | meta.build.git_sha=unknown |
| CFG-010 | CLOSED | SSOT_VERSION=unset ① |
| CFG-011 | VERIFIED | Anvil 与 GovFreeze 块混放 |
| CFG-012 | VERIFIED | STEWARD pool proxy vs address |
| CFG-013 | VERIFIED | SEED_GUIDE_PUBLIC_MARKET 未写根 .env |
| CFG-014 | CLOSED | 社区 showcase 前后端变量不同 |
| CFG-015 | CLOSED | WALLETCONNECT 未配置 |
| CFG-016 | VERIFIED | Resend 与 SMTP 占位并存 |
| CFG-017 | VERIFIED | spec/38 Frontend :3000 |
| CFG-018 | VERIFIED | smoke-acquisition :3000 |
| CFG-019 | VERIFIED | E2E password123 |
| CFG-020 | VERIFIED | staging build.env.example GOVERNOR 漂移 |
| CFG-021 | VERIFIED | staging example 缺 API_REWRITE_TARGET |
| CFG-022 | VERIFIED | .env 重复 B-407 注释 |
| CFG-023 | CLOSED | Redis 仅 spec 规划 |
| CFG-024 | VERIFIED | CORS 缺 :3000 |
| CFG-025 | VERIFIED | DATABASE_URL localhost |
| CFG-026 | VERIFIED | ③ SEED_TEST_ACCOUNTS=0 |
| CFG-027 | CLOSED | ③ 硬化模板预演 |
| CFG-028 | CLOSED | ③ prod build.env 对拍 |

## Verify log (full)

```text
=== verify-cfg-drift-closure (strict=1) ===
root=/d/TravelTrust-V1.1 batch=ALL
=== scan-repository-cfg-drift 2026-06-30T12:36:53Z ===
OK   spec/38 Frontend 3012
OK   e2e passwords SSOT
OK   templates API base not 3012
OK   staging GOVERNOR GovFreeze V2
OK   staging example INTERNAL_API_SECRET empty
OK   no real secrets in tracked code
OK   smoke-acquisition FRONTEND_PORT
OK   verify-cfg-drift-closure.sh
OK   CFG registry JSON
=== scan-repository-cfg-drift exit 0 ===
OK   Repository Drift = 0
OK   GET /health
OK   GET /meta
=== verify-root-env-vs-meta-chain-contracts (759) ===
env_file=/d/TravelTrust-V1.1/.env
api_base=http://127.0.0.1:8080
OK   GUIDE_STAKING_ADDRESS == meta.chain.contracts.guide_staking_address (0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0)
OK   STAKING_PROVIDER_ADDRESS == meta.chain.contracts.staking_provider_address (0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9)
OK   GOVERNANCE_VOTES_TOKEN_ADDRESS == meta.chain.contracts.governance_token_address (0x959922be3caee4b8cd9a407cc3ac1c251c2007b1)
OK   FEE_ROUTER_ADDRESS == meta.chain.contracts.fee_router_address (0x8a791620dd6260079bf849dc5567adc3f2fdc318)
OK   REGISTRY_ADDRESS == meta.chain.contracts.registry_address (0xdc64a140aa3e981100a9beca4e685f962f0cf6c9)
OK   ESCROW_FACTORY_ADDRESS == meta.chain.contracts.escrow_factory_address (0x5fbdb2315678afecb367f032d93f642f64180aa3)
OK   REGION_STEWARD_STAKE_POOL_ADDRESS == meta.chain.contracts.region_steward_stake_pool_address (0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae)
SKIP GOVERNOR_ADDRESS / meta.governor_address (both empty)
SKIP GOVERNANCE_TIMELOCK_ADDRESS / meta.timelock_address (both empty)
SKIP TREASURY_ADDRESS / meta.treasury_address (both empty)
OK   CHAIN_ID == meta.chain.chain_id (31337)
verify-root-env-vs-meta: OK (759 fields aligned)
OK   verify-root-env-vs-meta-chain-contracts
OK   sync-frontend-env-local
OK   NEXT_PUBLIC_API_BASE_URL=8080
OK   DEPLOYMENT_PROFILE=local
OK   SEED_GUIDE_PUBLIC_MARKET=1
OK   DATABASE_URL 127.0.0.1
OK   CORS includes :3000
OK   no mock-pay UI flag
OK   MinIO :19000
OK   Anvil :8545
OK   meta/build git_sha set
OK   vitest api.browser-url
OK   spec/38 frontend 3012
OK   smoke-acquisition 3012
OK   e2e passwords
OK   docs CFG cross-links
OK   staging API_REWRITE_TARGET
OK   staging GOVERNOR
OK   staging secret isolation doc
OK   production SEED=0
OK   production preprod pointer
OK   production build.env pointer
OK   prod build.env.example
OK   CFG-027 evidence
OK   CFG-028 evidence
OK   CFG-002 evidence
OK   CFG-001 evidence
OK   smoke-ab-core-chain
OK   CFG registry 100% CLOSED/VERIFIED
OK   generate-manual-uat-dashboard
TT_CFG_ZERO_DRIFT_GATE: PASS
=== verify-cfg-drift-closure: exit 0 (warns=0) ===
```

## SSOT

- Registry: `evidence/manual-uat/summary/config-drift-registry.json`
- Human index: `evidence/manual-uat/summary/CFG-REGISTRY.md`
- Repository scan: `evidence/manual-uat/signoff/CFG-REPOSITORY-DRIFT-SCAN.log`
- Per-item signoffs: `evidence/manual-uat/signoff/CFG-001-*.md` … `CFG-028-*.md`

## Honest boundary

① Configuration Zero Drift Gate **≠** ② staging GO **≠** ③ Production GO.
Next focus: Manual UAT (C1–E2), business defect closure, regression.
