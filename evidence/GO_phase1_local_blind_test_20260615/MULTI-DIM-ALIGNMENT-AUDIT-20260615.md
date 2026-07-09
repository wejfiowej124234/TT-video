# ① 多维度对齐审计（2026-06-15）

阶段：① 本地 Anvil · chain-on @8080 · 未改 ② soak

## 总览

| 维度 | 结论 |
|------|------|
| 链上 bytecode | ✅ PASS |
| 链上语义绑定 | ✅ PASS |
| root .env ↔ frontend/.env.local | ✅ PASS |
| 759 /meta 核心地址 ↔ .env | ✅ PASS |
| forge ABI ↔ contracts/abi | ✅ PASS |
| 55-S13 协议 ABI 对拍 | ✅ PASS |
| Playwright meta-chain 759 | ✅ PASS |
| 旧脚本 verify-root-env-vs-meta | ❌ 工具漂移（假 FAIL） |
| 759 meta 覆盖缺口 | ⚠️ registry/factory/steward 不在 meta |
| Escrow/IDC 文件级 ABI | ⚠️ 有 drift（Escrow 超集；IDC 格式） |
| P3 chain-on vs mock-pay | ⚠️ 架构互斥 → BL-③-001 |
| check-55-quick-verify (Win bash) | ❌ /meta ~65KB echo 截断 |

## 已对齐（PASS）

### 1. 链上 ↔ .env
verify-anvil-local-bytecode.sh：Guide/Provider/Steward/TTG/USDC/Registry/Factory/FeeRouter 均有 bytecode；pool.ttg() 正确。

### 2. 链上语义
- Guide/Provider pool token() == SETTLEMENT_TOKEN
- Steward pool ttg() == GOVERNANCE_TOKEN_ADDRESS

### 3. 三层地址（质押轨）
759 键：guide/provider/fee/gov 在 .env、frontend、/meta 一致。

### 4. ABI 机读闸
- run-verify-abi-forge.sh：17 合约 OK
- check-55-s13.sh：Guide/Provider/Registry/EscrowFactory/FeeRouter/RegionVault 字节一致

### 5. 前端门禁
- vitest metaChainContracts759
- Playwright setup meta-chain-contracts 759 guard

## 未对齐 / 缺口

### A. 工具脚本漂移（非运行时）
verify-root-env-vs-meta-chain-contracts.sh 仍对拍 **旧 12 键**（staking_address、governance_votes_token_address、chain_id_configured），与 **759** 不一致 → 5 条假 FAIL。应用 759 键脚本或标注 deprecated。

### B. GET /meta 759 覆盖缺口（BL-③-003）
env 有值、meta **无键**：REGISTRY、ESCROW_FACTORY、REGION_STEWARD_STAKE_POOL。ChainConfig 有、759 未暴露。

### C. 治理栈（① 预期）
governor/timelock/treasury = null；PLAYWRIGHT_REQUIRE_GOVERNANCE_STACK=1 会失败。

### D. ABI 目录不对称
contracts/abi 22 个 JSON；frontend/dapp/abis 12 个。仅 contracts：Governance*、TravelTrustGovernor、RegionStewardStakePool、CountryPool* 等。治理/管家池用 **内联 TS ABI**（regionStewardStakeAbi.ts），非整文件同步。

### E. Escrow / IDC 文件 drift
- Escrow.json：contracts 为 forge 全量；frontend 为 **最小子集**（deposit/release/openDispute 均在）— 55-S13 允许
- InvestorDistributionClaim.json：md5 不同、函数数同为 10 — 可能仅格式/字段序

### F. stakingAbi.ts 最小 ABI
仅 stake/withdraw/MIN_STAKE 等；合约另有 identity/risk ledger 函数 — UI 未用则 OK，扩展链上写路径需补 ABI。

### G. 运行时双轨（BL-③-001）
P3_CHAIN_OFF=0：/meta+质押 OK，mock-pay 501。P3_CHAIN_OFF=1 @8081：Chain B OK。见 PLAYBOOK-DUAL-SESSION.md。

### H. check-55-quick-verify Windows
/meta ~65KB；Git Bash `echo "$mb"` 截断 → product_roles.strict_db_write 读空。API 实际为 false（node/jq 直读 OK）。

### I. 环境卫生
- B407_* PK 仍在 .env（测试用，非 Anvil 块）
- contracts/abi/FeeRouter.json.tmp 残留
- Sepolia CHAIN_ID 已注释 ✅

## 建议优先级（① 内）

| P | 项 | 动作 |
|---|-----|------|
| P2 | verify-root-env-vs-meta | 更新为 759 对拍 |
| P2 | BL-③-003 | 扩展 meta 或文档化 env 回退 |
| P2 | Escrow/IDC | 发版前 sync-abi-from-forge 到 dapp/abis |
| P3 | 55-quick-verify Win | 用临时文件代替 echo 传 jq |
| ③ | BL-③-001 | 产品级 chain-on 支付路径 |
