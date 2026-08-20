# TT · R-TTG · Etherscan Verify Params（Owner 手工 / forge --etherscan-api-key）

**STATUS:** `PARAMS_LOCKED · ETHERSCAN_VERIFY_FAIL_JSON_SCHEMA · RETRY_WITHOUT_compilationTarget · NO_REDEPLOY`  
**Stamp:** `2026-08-12T00:43:00Z`  
**禁止：** 重部署 TTG · 改合约 · 用新部署绕过 Verify 失败

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Verify FAIL 定位（本戳 · 非链上 mismatch）

| 类 | 结论 |
|----|------|
| compiler / opt / viaIR / paris | **未判为错**（页仍报 0.8.19 · opt 200） |
| constructor | 须用正确 ABI（勿粘 Transfer topic） |
| **metadata / Standard-JSON schema** | **ROOT CAUSE** · `settings.compilationTarget` = Foundry 键 · solc/Etherscan **未知键** → 无法产出 bytecode |
| 处置 | 重生 JSON **去掉** `compilationTarget` · 重传 · **禁止**重部署 |

## 已锁定（与链上 / Blockscout / Sourcify 一致）

| 项 | 值 |
|----|-----|
| Address | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` |
| Contract | `GovernanceVotesToken` · `contracts/src/GovernanceVotesToken.sol` |
| Compiler | `v0.8.19+commit.7dd6d404` |
| Optimization | **Yes** · runs **200** |
| viaIR | **Yes** |
| EVM | **paris** |
| License | MIT |
| Constructor | `(uint256 initialSupply, address initialHolder)` |
| Arg0 supply | `10000000000000000000000000` (= 10_000_000e18) |
| Arg1 holder | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| ABI-encoded args（UI 无 `0x`） | `0000…00000084595161401484a00000000000000000000000000000e1e732efbf9b010a9204054467256d3d93f3cdd4` |

## Explorer 现状

| 面 | 状态 |
|----|------|
| **Bytecode ↔ forge artifact** | **FULL_MATCH** |
| **Sourcify** | **exact_match** creation+runtime |
| **Blockscout** | **is_fully_verified=true** |
| **Etherscan.com** | **未 Verify** · step-2 待 Owner 上传 Standard-JSON + Turnstile Submit |

## 自动化边界（本戳）

- `forge … --verifier etherscan` → 缺 `ETHERSCAN_API_KEY`
- UI：step-1 已选 Standard-Json-Input / 0.8.19 / MIT；ctor 已填；**文件上传与 Turnstile 须人工**
- Standard-JSON：`evidence/GO_mainnet_money_path/R-TTG-ETHERSCAN-STANDARD-JSON-INPUT-LATEST.json`

## Owner 动作（仅此）

1. 上传 Standard-JSON → Confirm ctor → Turnstile → Verify and Publish  
   **或** 提供 `ETHERSCAN_API_KEY` 让 Agent 重跑 forge  
2. Verify **FAIL** → 登记 mismatch（compiler/viaIR/ctor/metadata）· **禁止**重部署  
3. Verify **PASS** → 只读复核 Verified + ABI 与 FULL_MATCH/Sourcify/Blockscout 一致 → 签发 **`TOKEN_TRUST_GATE_PASS`** → Hard Gate 重评  
4. 钱包「未开源」= 第三方重索引等待项  

**`TOKEN_TRUST_GATE_PASS ≠ TT_PRODUCTION_GO`** · **`TT_PRODUCTION_GO=NO_GO`**
