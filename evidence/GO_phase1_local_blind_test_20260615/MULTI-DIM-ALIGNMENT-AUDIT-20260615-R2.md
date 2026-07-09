# 深度多维对齐审计 R2（2026-06-15）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产  
**范围：** 仅 **①** 静态机读 + 活 API `:8080` + Anvil `:8545`  
**分支/commit：** `fix/local-anvil-stack-phase1` @ `0de2ee9d`  
**② soak：** 未触碰 `deploy-tt-web-staging.sh` @ `877a1e77`

---

## 总览矩阵

| 维度 | 状态 | 说明 |
|------|------|------|
| **759 `/meta` ↔ 根 `.env`** | ✅ PASS | `verify-root-env-vs-meta-chain-contracts.sh` 十三键 + `chain_id=31337` |
| **根 `.env` ↔ `frontend/.env.local`** | ✅ PASS | 核心质押/协议地址 **drift_count=0** |
| **Anvil bytecode（759 核心八址）** | ✅ PASS | `verify-anvil-local-bytecode.sh` + 语义 `pool.ttg()` |
| **55-S13 ABI 闸** | ✅ PASS | `contracts/abi` ↔ `frontend/dapp/abis` 子集 byte-identical |
| **Forge ABI multiset** | ✅ PASS | `verify-abi-forge.py` 全合约 OK |
| **align-api-abi-local -CheckOnly** | ✅ PASS | |
| **API 759 单测 + 前端 meta Vitest** | ✅ PASS | `chain_contracts_meta` + 96 tests |
| **机读烟测（质押/多身份）** | ✅ PASS | guide/provider stake + multi-identity closure |
| **Indexer 运行时水位** | ❌ DRIFT | `/meta` checkpoint **10676552** vs Anvil tip **69** |
| **治理栈链上** | ⚠️ ① 未部署 | governor/timelock/treasury **null**（759 已暴露键，值为 null） |
| **国家池/赎回/账本链上** | ⚠️ ① 未部署 | ABI 在 `contracts/abi`，**无** env 址、**无** Anvil bytecode |
| **P3 双轨 mock-pay** | ⚠️ 架构缺口 | `P3_CHAIN_OFF=0` @8080 → mock-pay **501**（BL-③-001） |
| **55-quick-verify `/metrics`** | ⚠️ 偶发 | 长跑默认 `localhost` 曾 **404**；`127.0.0.1` 复测 **200** |
| **SSOT / build 可观测** | ⚠️ 本地默认 | `build.git_sha=unknown`；`ssot.match=false`（未开 STRICT） |

---

## 1. API · `/meta` · 环境三层

### ✅ 已对齐（759 核心）

| 键 | 根 `.env` | `/meta` | Anvil code |
|----|-----------|---------|------------|
| guide_staking | `0x9fE467…fa6e0` | 同 | ✅ |
| staking_provider | `0xCf7Ed3…B0Fc9` | 同 | ✅ |
| governance_token | `0x0E801D…858bF` | 同 | ✅ |
| fee_router | `0x8A7916…C318` | 同 | ✅ |
| registry | `0xDc64a1…F6C9` | 同 | ✅ |
| escrow_factory | `0x5FbDB2…0aa3` | 同 | ✅ |
| region_steward_pool | `0x8f8640…E4Cf` | 同 | ✅ |
| settlement (USDC mock) | `0xe7f172…0512` | — | ✅ |
| chain_id | `31337` | `31337` | — |

托管块 `scripts/dev/.env.fundstack-anvil.local` 与根 `.env` **无漂移**。

### ⚠️ 759 已暴露但 ① 为 null（非错误）

- `governor_address` / `timelock_address` / `treasury_address` → JSON **null**（① 未部署治理栈，与 SKIP 验证一致）

### ❌ 未纳入 759、① 未部署（②/③ 合约）

以下在 `contracts/abi` + forge verify **存在**，但根 `.env` **未设址**，Anvil **无 bytecode**：

- `TravelTrustGovernor` / `GovernanceTimelock` / `GovernanceTreasury`
- `CountryPoolSubVaultsV0` / `CountryPoolRedemptionEpochV0`
- `COUNTRY_POOL_LEDGER_ADDRESS` / `SLASH_ROUTER` / `RESERVE_VAULT` / `REGION_VAULT`

**结论：** ① 本地栈 **刻意**只覆盖 FundStack + TTG 管家池 + Registry/Factory/FeeRouter；治理/国家池属 **② Sepolia 轨**，不冒充 ① 已闭。

---

## 2. ABI 多层

| 层 | 状态 |
|----|------|
| `contracts/abi` ↔ forge build | ✅ 全量 verify OK |
| `contracts/abi` ↔ `frontend/dapp/abis`（55-S13 子集） | ✅ md5 一致（含 Escrow/IDC 已同步） |
| 仅存在于 `contracts/abi`、未复制到 frontend | **11 文件**（治理/国家池/MockERC20 等）— **55-S13 设计如此** |
| Escrow 体积 | canon = frontend = 23963B（当前树已全量同步；55 仍允许 frontend 精简策略） |
| API Rust 内嵌 ABI | 走路由/chain 模块加载；**无**独立 `include_str!` 漂移检出 |

---

## 3. 链上 · Anvil · Indexer

### ✅ 语义校验

- 管家池 `ttg()` → `0x0E801D…858bF`（非 USDC 碰撞）
- Guide/Provider 池各有独立 bytecode（5364B）

### ❌ Indexer 运行时 vs 本地链 tip（**P1 ① 卫生**）

| 指标 | 值 |
|------|-----|
| Anvil `cast block-number` | **69** |
| `/meta.indexer.checkpoint.block_number` | **10676552** |
| `/metrics traveltrust_indexer_checkpoint_block` | **10676552** |
| 磁盘 `data/indexer_state.json` | **不存在**（仅进程内内存） |

**推断：** API 进程长期运行或曾在 **② RPC 水位**下跑过 `indexer_tick`，切回 Anvil 后 **未重启**，内存 checkpoint 未与 `31337`/tip 69 对齐。

**① 真人测建议（非代码改）：** 对齐后 **重启 API**；可选清 DB 链上投影或接受 ① 只验质押/多身份、不验 indexer 投影一致性。

**登记：** BL-③-008（见 BACKLOG 更新）— defer **③** 产品决策；① 规避 = 重启 API。

---

## 4. 运行时 / HTTP

| 探测 | 结果 |
|------|------|
| `/health` | 200 |
| `/meta` / `/meta/build` | 200 · 759 键序 OK |
| `/metrics` | 200（`127.0.0.1`）；quick-verify 长跑偶发 404 → **BL-③-009** |
| `P3_CHAIN_OFF`（根 `.env`） | **0**（chain-on） |
| `did_rank.chain_off_mounted` | **true**（= chain_off **子系统**挂载，≠ `P3_CHAIN_OFF=1`） |
| pause.factory/distribute | `eth_call` 可读（B-091） |

---

## 5. `.env` 卫生

| 项 | 状态 |
|----|------|
| Sepolia `CHAIN_RPC` / `CHAIN_ID` | 已注释 ✅ |
| 活跃 `11155111` | 仅 `TRAVELTRUST_ADMIN_BEARER_MINT_CHAIN_IDS=11155111,84532`（Admin mint 多链，**非**本地链配置） |
| 旧 Anvil 址 `0x9A9f2…` | **未检出** ✅ |

---

## 6. ③ Backlog 增量（只登记，不改 ②）

| ID | 优先级 | 现象 | 状态 |
|----|--------|------|------|
| BL-③-008 | P1 | Indexer 内存 checkpoint 10676552 vs Anvil 69 | open · ① 重启 API 规避 |
| BL-③-009 | P3 | `check-55-quick-verify` `/metrics` 偶发 404 | open · 脚本/主机 flake |
| BL-③-010 | P2 | 759 未含 country_pool/governor 等扩展键（仅 null 三治理键） | open · ③ API 面扩展评审 |

已有 BL-③-001～007 仍有效；002/003 已在 `0de2ee9d` **closed_①**。

---

## 7. 诚实边界

- ① 759 对齐 + Anvil 八址 bytecode **≠** ② staging GO **≠** ③ 主网真链  
- Indexer 高块号 **不**证明 Sepolia 已验  
- Chain B mock-pay 须 **独立** `P3_CHAIN_OFF=1` 会话（8081 已停，防混轨）

---

## 8. 机读命令摘要（本轮 exit 0 除非注明）

```bash
bash scripts/dev/verify-root-env-vs-meta-chain-contracts.sh   # 0
bash scripts/dev/verify-anvil-local-bytecode.sh             # 0
bash scripts/check-55-s13.sh                                # 0
bash scripts/run-verify-abi-forge.sh                        # 0
BASE_URL=http://127.0.0.1:8080 bash scripts/dev/check-55-quick-verify.sh  # 0
cargo test -p traveltrust-api chain_contracts_meta           # 0
```

**审计员：** 机读自动 + Agent 汇总 · **不**修改 ② soak 基线
