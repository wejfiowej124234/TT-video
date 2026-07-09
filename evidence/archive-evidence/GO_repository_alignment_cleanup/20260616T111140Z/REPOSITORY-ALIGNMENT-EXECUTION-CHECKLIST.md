# Repository Alignment & Cleanup Execution Checklist

**Program:** `TT_REPOSITORY_ALIGNMENT_CLEANUP_PROGRAM`
**Stamp:** `20260616T111140Z`
**Baseline SSOT:** GovFreeze V2 Clean Baseline
**Generated:** 2026-06-16T11:11:49Z

**纪律：** 一致性 · 追溯性 · 仓库清洁度 · **禁止**重复评估已通过治理逻辑

**Inventory:** ACTIVE=30 · LEGACY=108 · DELETE_CANDIDATE=14 · **P0 route drift open=0**
**Baseline addresses:** active=19 · legacy=8

---

## ACTIVE (30)

| ID | Category | Path | Summary | Action | Risk |
|----|----------|------|---------|--------|------|
| SSOT-BASELINE-FREEZE | baseline | `docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md` | GovFreeze V2 Clean Baseline 唯一经济真源 | 只读引用 | P0 |
| SSOT-MTM-146 | baseline | `docs/spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md` | 146 行执行真源 · Cert #1→#12 | 维护 Tier · 禁止新矩阵 | P0 |
| ADDR-ACTIVE-COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=0x2704566a6657dcbeebb71e43ceca381f16e1a8aa | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS=0x241948be49a778490c8a4ae8d98b7537fe001f63 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS=0x6b3391c0b6297a5866c0bb7ad06da99e08f0a3fb | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS=0xabe36f8ef43d544b9d0e1c0a5f9638dc37ed33d0 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOVERNANCE_TIMELOCK_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOVERNANCE_TIMELOCK_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOVERNANCE_TOKEN_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOVERNANCE_TOKEN_ADDRESS=0x2837ea0c50e27d59b88af617abbb231a040062c5 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOVERNANCE_VOTES_TOKEN_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOVERNANCE_VOTES_TOKEN_ADDRESS=0x2837ea0c50e27d59b88af617abbb231a040062c5 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOVERNOR_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOVERNOR_ADDRESS=0x847b00ddb6ffed71812abc358a407dad4b099fcb | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_GOVERNOR_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_GOVERNOR_ADDRESS=0x847b00ddb6ffed71812abc358a407dad4b099fcb | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS=0x7af15f98622b9282298ca3070a698ca4a96a4016 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS=0xc99776e980d33f1857d5bb9a57b35ab7669aad1f | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_STAKE_POOL_PROXY_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_TIMELOCK_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_TIMELOCK_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS=0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-PRIMARY_MARKET_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | PRIMARY_MARKET_ADDRESS=0x7af15f98622b9282298ca3070a698ca4a96a4016 | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-REGION_STEWARD_STAKE_POOL_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | REGION_STEWARD_STAKE_POOL_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS=0x3a89378bfad12d1028707dd37055294854c8784e | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-SEAT_REGISTRY_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | SEAT_REGISTRY_ADDRESS=0xc99776e980d33f1857d5bb9a57b35ab7669aad1f | 禁止替换为 LEGACY | P0 |
| ADDR-ACTIVE-TIMELOCK_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | TIMELOCK_ADDRESS=0x904a6c4c6aab698afbf08ec6151d317c393520cc | 禁止替换为 LEGACY | P0 |
| FE-GOV-ROUTES | frontend_routes | `frontend/app/governance/**` | 治理前端 SSOT 路由 13 条 | 冻结 UI · 仅数据链 | — |
| BE-GOV-GET | api_routes | `crates/api/src/routes/governance/**` | 治理 GET 契约 6 条 · read_contract guard | 与 MTM API 列对拍 | — |
| EVID-LATEST-GO_hat_r1_sepolia | evidence | `evidence/GO_hat_r1_sepolia/latest-stamp.txt` | latest=20260616T063612Z | 清理仅删非 latest 重复 stamp（Owner 确认） | P2 |
| EVID-LATEST-GO_tt_country_pool_revenue_enterprise_hat | evidence | `evidence/GO_tt_country_pool_revenue_enterprise_hat/latest-stamp.txt` | latest=20260616T084248Z | 清理仅删非 latest 重复 stamp（Owner 确认） | P2 |
| EVID-LATEST-GO_ai_pre_human_uat | evidence | `evidence/GO_ai_pre_human_uat/latest-stamp.txt` | latest=20260616T105001Z | 清理仅删非 latest 重复 stamp（Owner 确认） | P2 |
| EVID-LATEST-GO_ttg_cert | evidence | `evidence/GO_ttg_cert/latest-stamp.txt` | latest=20260616T100918Z | 清理仅删非 latest 重复 stamp（Owner 确认） | P2 |
| EVID-LATEST-GO_govfreeze_v2_human_screen_acceptance | evidence | `evidence/GO_govfreeze_v2_human_screen_acceptance/latest-stamp.txt` | latest=20260616T100918Z | 清理仅删非 latest 重复 stamp（Owner 确认） | P2 |
| ID-IA-HUB | multi_identity | `frontend/app/me/identities/**` | 多重身份 Hub · ME-IDENTITIES-UI-FREEZE | 与治理数据链隔离验收 | — |
| ADM-READONLY | admin_boundary | `frontend/app/admin/**` | Admin 只读/门闸 · 无 Treasury 直转 | Cert #3 walkthrough | P0 |

## LEGACY (108)

| ID | Category | Path | Summary | Action | Risk |
|----|----------|------|---------|--------|------|
| ADDR-LEGACY-CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | CP_NET_PROFIT_LEDGER_OWNER_TIMELOCK=0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f · cutover/只读归档 | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_GOVERNANCE_TOKEN_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_GOVERNANCE_TOKEN_ADDRESS=0xac2e29ac7089e4863c21daf232cf8bbb025d91ca · cutover/只读归档 | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_GOVERNOR_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_GOVERNOR_ADDRESS=0xd5225ba81af40600c9802d20888898193861f161 · cutover/只读归档 | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_PRIMARY_MARKET_ADDRESS=0xc77f717c1c98d460e006266ecb20d870d05cb5c1 · cutover | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_REGION_STEWARD_STAKE_POOL_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_REGION_STEWARD_STAKE_POOL_ADDRESS=0xbf1f5b8c5b8a1cfc8e4458eb43c1a0ab2401280 | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_SEAT_REGISTRY_ADDRESS=0x87c77986c7de47131d02a6407308b974324cc6dc · cutover/ | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_TIMELOCK_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_TIMELOCK_ADDRESS=0x462c2351971707a8ceeb3ce789f268b8326c76a0 · cutover/只读归档 | 保留 · 禁止作活跃读口 | P1 |
| ADDR-LEGACY-LEGACY_PRE_GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS | contract_address | `scripts/dev/.env.phase2-chain-deploy.local` | LEGACY_PRE_GOV_FREEZE_V2_TREASURY_P4_CAP_ADDRESS=0xfa0796236aa350342ee71853c1d5593f48e55090 · cutove | 保留 · 禁止作活跃读口 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/ConfigureGovernanceTimelockViaSafe.s.sol/11155111/run-1780648562250.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/ConfigureGovernanceTimelockViaSafe.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/CpNetProfitSepoliaCutoverAndDrill.s.sol/11155111/run-1781598385426.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/CpNetProfitSepoliaCutoverAndDrill.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/run-1781576305373.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/run-1781576437815.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/dry-run/run-1781576260123.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/dry-run/run-1781576385820.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/run-1780652089707.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780651714044.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780652046602.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780741760100.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780742025755.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780749925803.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780751252584.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780760092047.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780790947319.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780800779945.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-1780802958253.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/run-1780649593519.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/dry-run/run-1780648992005.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/dry-run/run-1780649365196.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployFundStackUnderTimelock.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovernanceStack.s.sol/11155111/run-1780648298953.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovernanceStack.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovernanceStack.s.sol/11155111/dry-run/run-1780648212749.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovernanceStack.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/run-1781576689714.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/run-1781577470201.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/dry-run/run-1781576487716.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/dry-run/run-1781577262132.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV1Stack.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV2CleanBaseline.s.sol/11155111/run-1781583612876.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployGovFreezeV2CleanBaseline.s.sol/11155111/dry-run/run-1781583370923.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployP51CountryLedger.s.sol/11155111/run-1780654536854.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployP51CountryLedger.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployP51CountryLedger.s.sol/11155111/dry-run/run-1780653805508.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployP51CountryLedger.s.sol/11155111/dry-run/run-1780654503471.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployP51CountryLedger.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1780650662521.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781408050756.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781408210269.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781408385403.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781454255385.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781454297810.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781454337391.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-1781454529302.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/run-latest.json` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780650211184.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780650316632.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780650472678.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780650633021.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780741687137.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780741954862.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780749843513.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780751177337.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780759947496.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780790877630.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780800702376.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-1780802881471.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `contracts/broadcast/DeployRegionStewardStakePool.s.sol/11155111/dry-run/run-latest.json` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `docs/handbook/engineering/170-Business-Expansion-Sprint169-RS-DAO-Enterprise-Audit-Report.md` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `docs/runbook/TESTNET-PERFECT-VALIDATION-REPORT.md` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `docs/runbook/TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST.md` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0x0359d4fb | address_drift | `docs/runbook/TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST.md` | 引用 legacy 地址 0x0359d4fb9c4b9f69188a1e9ae2202abfed1fee8f 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| ADDR-REF-LEGACY-0xac2e29ac | address_drift | `docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md` | 引用 legacy 地址 0xac2e29ac7089e4863c21daf232cf8bbb025d91ca 无 LEGACY/cutover 上下文 | 改为 ACTIVE 或显式 LEGACY 注释 | P1 |
| … | … | … | *+28 rows in JSON* | … | … |

## DELETE_CANDIDATE (14)

| ID | Category | Path | Summary | Action | Risk |
|----|----------|------|---------|--------|------|
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/runbook/TT-GOVERNANCE-ENTERPRISE-HAT-REVIEW.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/01-对外白皮书-草案.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/03-对外材料-PPT与白皮书数据页摘抄索引.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/LEGAL-SIGNOFF-CHECKLIST.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/ttg-allocation-permissions-flows-ssot-v1.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/TTG-GOVERNANCE-ENTERPRISE-100-FINAL-GAP-AUDIT.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/ttg-primary-market-and-exit-policy-v1-draft.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| DOC-NARR-auto_dividend_primary | doc_narrative | `docs/spec/governance-token/TTG-TOKENOMICS-UI-ALIGNMENT-AUDIT-REPORT.md` | 旧分红/废止叙事残留 · auto_dividend_primary | 修订或移 LEGACY · 禁止 ACTIVE 引用 | P1 |
| EVID-STALE-GO_hat_r1_sepolia | evidence | `evidence/GO_hat_r1_sepolia/` | 14 旧 stamp 目录 · latest=20260616T063612Z | 压缩归档或删除重复 run（不删 latest） | P3 |
| EVID-STALE-GO_ai_pre_human_uat | evidence | `evidence/GO_ai_pre_human_uat/` | 6 旧 stamp 目录 · latest=20260616T105001Z | 压缩归档或删除重复 run（不删 latest） | P3 |

## Execution queue（写死顺序）

1. **P0** — 修复 ACTIVE 地址误引用 / 路由 drift（`proposals/create`→`new`）
2. **P1** — 文档旧叙事 · legacy 地址无注释引用
3. **P2** — 死代码 · superseded 矩阵/doc 标 LEGACY
4. **P3** — evidence 旧 stamp 压缩（保留 latest + baseline freeze 锚）
5. **禁止** — 删 `GOV-FREEZE-V2` env · 删 MTM · 重跑 enterprise hat audit

**Machine key:** `TT_REPO_ALIGN: ACTIVE=30 LEGACY=108 DEL=14 P0_ROUTE_DRIFT=0 BASELINE=V2`