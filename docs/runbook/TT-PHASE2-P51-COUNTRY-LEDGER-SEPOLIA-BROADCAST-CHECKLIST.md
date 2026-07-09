# TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · `DeployP51CountryLedger` **DE 试点 · Sepolia broadcast 人工确认单**

**前置：** [TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION](./TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md) · 序 1～4 主脊 **PASS**

**最后更新：** 2026-06-05T10:16Z · **签发态：BROADCAST COMPLETE**（序 5 Sepolia 已播 · env/registry 已回填 · 链上终验 PASS · **≠ ③ GO**）

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **R-02 · owner** | `ledger.owner` = **`TIMELOCK_ADDRESS`** · **≠ deployer EOA** |
| **试点辖区** | **DE**（`PILOT_JURISDICTION_HEX=0x4445`）· 与 P5-1-A 单测 / 部署脚本缺省一致 |
| **与序 4 正交** | 序 4 赎回窗 = **CN** · 序 5 账本 = **DE**（不同合约域） |
| **credit 权限** | 仅 **owner**（Timelock 治理路径）可 `credit()` · deployer **无** owner |
| **Agent 代跑** | `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` → `phase2-sepolia-broadcast-p51-country-ledger.sh` |
| **禁止** | 裸 forge broadcast · CI 默认 · **③ 主网** · 触碰 Anvil local 配置 |

---

## 1 · 代码 / 权限 / 对拍审查

### 1.1 合约 · 部署脚本

| # | 项 | 结论 |
|---|-----|------|
| C-01 | `CountryPoolLedgerV0` · `owner` + `pilotJurisdiction` immutable | ✅ |
| C-02 | `credit()` · `onlyOwner` · jurisdiction == pilot | ✅ |
| C-03 | `DeployP51CountryLedger.s.sol` · `resolveChainOwner()` → Timelock | ✅ |
| C-04 | `_assertLedgerBindings` · R-02 + pilot=DE + version | ✅ |
| C-05 | 机读摘要 `LEDGER_BINDING_CHECK: OK` | ✅ |

**真源：** `contracts/src/CountryPoolLedgerV0.sol` · `contracts/script/DeployP51CountryLedger.s.sol`

### 1.2 env / registry / API

| env 键 | registry 键 | API / 索引消费 |
|--------|-------------|----------------|
| `COUNTRY_POOL_LEDGER_PILOT_ADDRESS` | `country_pool_ledger_pilot_address` | ② 部署登记 |
| `COUNTRY_POOL_LEDGER_ADDRESS` | —（**= pilot 同址**） | `ChainConfig` · indexer · P5-1-C |
| `COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS` | — | **`GET /api/v1/governance/country-ledger/DE`**（② MockERC20 pilot） |

---

## 2 · 前置闸

| # | 检查项 | 命令 | exit |
|---|--------|------|------|
| P-00 | **主脊总验收** | [TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION](./TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md) **PASS** | ☑ **0** |
| P-03 | broadcast pregate | `check-phase2-chain-broadcast-pregate.sh` | ☑ **0** |
| P-05 | **P51 dry-run** | `PHASE2_SKIP_SPINE_AUDIT=1 phase2-sepolia-p51-country-ledger-dry-run.sh` | ☑ **0** |
| P-06 | binding + 对拍 | verify `--from-log` + registry↔API | ☑ **0** |
| P-07 | quote parity（静态） | `check-protocol-quote-parity.sh` | ☑ **0** |

### 2.1 广播记录（2026-06-05T10:15Z · BROADCAST COMPLETE）

| 项 | 值 |
|----|-----|
| forge 结论 | `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL` |
| `LEDGER_BINDING_CHECK` | **OK** |
| `COUNTRY_POOL_LEDGER_PILOT` | `0x63bD7d5eE5c5DdE707e5e65303f3876267C78e97` |
| `COUNTRY_POOL_LEDGER_ADDRESS` | `0x63bD7d5eE5c5DdE707e5e65303f3876267C78e97`（同址） |
| `COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS` | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63`（FundStack MockERC20） |
| broadcast tx | `0xa041bddd12015b31b16bf8f8ee2ef0c7596c06b5c8d57f8d5d4c833f092191f5` |
| broadcast RPC | `https://sepolia.drpc.org` |
| 链上终验 | `phase2-sepolia-p51-country-ledger-verify-bindings.sh` · **7/7 PASS** · RPC `https://ethereum-sepolia-rpc.publicnode.com` |
| 证据 | `evidence/GO_phase2_chain_sepolia/p51-country-ledger-broadcast/latest/broadcast-20260605T101358Z.json` |

| BINDING（链上） | 结果 |
|-----------------|------|
| `ledger.owner` → Timelock | PASS |
| `ledger.owner_not_deployer` | PASS |
| `ledger.pilot_jurisdiction` → DE | PASS |
| `ledger.version` → `country_ledger_ssot_v0` | PASS |
| env/registry/API alias | PASS |

---

## 3 · 部署内容（序 5 · 单合约）

| 合约 | 地址 | 控制面 |
|------|------|--------|
| `CountryPoolLedgerV0` | `0x63bD7d5eE5c5DdE707e5e65303f3876267C78e97` | **owner = Timelock** · pilot **DE** |

---

## 4 · broadcast 命令（已执行）

```bash
export CHAIN_RPC_URL=https://sepolia.drpc.org
export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
bash scripts/dev/phase2-sepolia-broadcast-p51-country-ledger.sh
# → TT_PHASE2_SEPOLIA_P51_COUNTRY_LEDGER_BROADCAST: OK
```

---

## 5 · 播后 15 分钟内

| # | 动作 | ☑ |
|---|------|:-:|
| B-01 | 记录 `COUNTRY_POOL_LEDGER_PILOT` 链上地址 | ☑ |
| B-02 | `.env.phase2-chain-deploy.local` + 根 `.env` Sepolia 段 | ☑ |
| B-03 | **`COUNTRY_POOL_LEDGER_ADDRESS`** = pilot 同址 | ☑ |
| B-04 | `registry` · `country_pool_ledger_pilot_address` | ☑ |
| B-05 | `phase2-sepolia-p51-country-ledger-verify-bindings.sh` cast 终验 | ☑ |
| B-06 | `COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS`（FundStack MockERC20） | ☑ |

---

## 6 · 一句话结论

**序 5 DE 国池账本 · Sepolia broadcast COMPLETE** — owner=Timelock · 无 deployer owner · env/registry/API 已回填 · 链上终验 PASS。**Phase ② 序 1～5 Sepolia 部署链已齐。**

**诚实边界：** ② Sepolia MockERC20 **≠** ③ 生产 USDC · HTTP `protocol-reference` 版本 WARN 仍可能存在 · **≠** staging/Production GO · R-01 **OPEN**。
