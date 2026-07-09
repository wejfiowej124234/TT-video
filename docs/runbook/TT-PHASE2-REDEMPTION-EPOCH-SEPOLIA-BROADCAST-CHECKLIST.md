# TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST

> **SUPERSEDED · READ-ONLY · LEGACY** — GovFreeze V2 **之前** redemption epoch broadcast 旁证；`Timelock (epoch owner)` 为 **LEGACY** `0x0359…`。**ACTIVE 读口：** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · `DeployCountryPoolRedemptionEpochV0` **CN 试点 · Sepolia broadcast 人工确认单**

**前置：** [TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY](./TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md) · 序 1～3 主脊 **PASS**

**最后更新：** 2026-06-05T09:45Z · **签发态：BROADCAST COMPLETE**（序 4 Sepolia 已播 · env/registry 已回填 · 链上终验 PASS · **≠ ③ GO**）

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **R-02 · owner** | `epoch.owner` = **`TIMELOCK_ADDRESS`** · **≠ deployer EOA** |
| **试点** | jurisdiction **CN** · `maxNavPctBps=1000` · `windowSeconds=1296000`（15d） |
| **结算资产** | ② 默认 **MockERC20**（`REDEMPTION_ASSET_ADDRESS` 未设时脚本 deploy）；**≠** ③ USDC 主网 |
| **Agent 代跑** | `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` → `phase2-sepolia-broadcast-redemption-epoch.sh` |
| **禁止** | 裸 forge broadcast · CI 默认 · **③ 主网** |

---

## 1 · 前置闸

| # | 检查项 | 命令 | exit |
|---|--------|------|------|
| P-00 | **主脊对拍** | `bash scripts/dev/phase2-sepolia-spine-audit.sh` | ☑ | **0** |
| P-03 | broadcast pregate | `bash scripts/gates/check-phase2-chain-broadcast-pregate.sh` | ☑ | **0** |
| P-05 | **redemption dry-run** | `bash scripts/dev/phase2-sepolia-redemption-epoch-dry-run.sh` | ☑ | **0** |
| P-06 | binding + 对拍 | verify `--from-log` + registry↔API | ☑ | **0** |

**摘要行：** `TT_PHASE2_SEPOLIA_SPINE_AUDIT: OK` · `TT_PHASE2_SEPOLIA_REDEMPTION_EPOCH_DRY_RUN: OK` · `REDEMPTION_BINDING_CHECK: OK`

### 1.1 机读记录（2026-06-05T09:27Z · ISSUED）

| # | 命令 | exit | 证据 |
|---|------|------|------|
| P-00 spine | `phase2-sepolia-spine-audit.sh` | **0** | `TT_PHASE2_SEPOLIA_SPINE_AUDIT: OK` |
| P-05 dry-run | `phase2-sepolia-redemption-epoch-dry-run.sh` | **0** | `evidence/GO_phase2_chain_sepolia/redemption-epoch-dry-run/latest/precheck.json` |
| P-06 bindings | verify `--from-log` | **0** | `REDEMPTION_BINDING_CHECK: OK` · epoch_owner_is_timelock true |

| 项 | 值 |
|----|-----|
| deployer | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212` |
| Timelock (epoch owner) | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| maxNavPctBps / window | **1000** / **1296000** (15d) |
| gas 估算 | ~**0.058 ETH** · deployer ~4.46 ETH |

### 1.2 广播记录（2026-06-05T09:33Z · BROADCAST COMPLETE）

| 项 | 值 |
|----|-----|
| forge 结论 | `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL` |
| `REDEMPTION_BINDING_CHECK` | **OK** |
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN` | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` |
| `REDEMPTION_ASSET` (MockERC20) | `0x4825693A7B333B8b2b73ad5632C60A9b7cAa51F9` |
| tx · MockERC20 | `0x858783a33de76d6504670fa81b6dcfdbe29815d4268dccef6b1a5479d57b3ba5` |
| tx · CountryPoolRedemptionEpochV0 | `0x88bfbd9ba028df7e7b7c5b02936924dbaa96410f8173d96afc1bf348b53ea11e` |
| broadcast RPC | `https://sepolia.drpc.org` |
| 链上终验 | `phase2-sepolia-redemption-epoch-verify-bindings.sh` · **10/10 PASS** · RPC `https://ethereum-sepolia-rpc.publicnode.com` |
| quote parity | `check-protocol-quote-parity.sh` · **OK** |
| 证据 | `evidence/GO_phase2_chain_sepolia/redemption-epoch-broadcast/latest/broadcast-20260605T093325Z.json` |

---

## 2 · 赎回规则（protocol-ssot lock_tiers）

| 参数 | SSOT | 链上 immutable |
|------|------|----------------|
| jurisdiction | CN | `jurisdiction()` = bytes2("CN") |
| max NAV % | 1000 bps (10%) | `maxNavPctBps()` |
| 窗长 | 15 days / quarter | `windowSeconds()` = 1296000 |
| 版本 | — | `country_pool_redemption_epoch_v0` |

**API 文档镜像：** `GET /api/v1/redemption/quote?jurisdiction=CN` · `redemption_max_nav_pct_bps=1000`

---

## 3 · broadcast

```bash
export CHAIN_RPC_URL=https://sepolia.drpc.org
export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
bash scripts/dev/phase2-sepolia-broadcast-redemption-epoch.sh
# → TT_PHASE2_SEPOLIA_REDEMPTION_EPOCH_BROADCAST: OK
```

---

## 4 · 播后 15 分钟内

| # | 动作 | ☑ |
|---|------|:-:|
| B-01 | 记录 `COUNTRY_POOL_REDEMPTION_EPOCH_CN` + `REDEMPTION_ASSET` | ☑ |
| B-02 | `.env.phase2-chain-deploy.local` + 根 `.env` Sepolia 段 | ☑ |
| B-03 | `registry` · `country_pool_redemption_epoch_cn_address` | ☑ |
| B-04 | `phase2-sepolia-redemption-epoch-verify-bindings.sh` cast 终验 | ☑ |
| B-05 | `check-protocol-quote-parity.sh`（含 epoch immutables） | ☑ |

**回填地址（2026-06-05）：**

| env 键 | 值 |
|--------|-----|
| `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` | `0x712050e4b1517C3f3ab39B32Cabb70CC0E1C0829` |
| `REDEMPTION_ASSET_ADDRESS` | `0x4825693A7B333B8b2b73ad5632C60A9b7cAa51F9` |

---

## 5 · 一句话结论

**序 4 CN 赎回窗 · Sepolia broadcast COMPLETE；owner=Timelock · MockERC20 结算 · 链上终验 + quote parity PASS。③ 主网仍 Owner-only。**

**诚实边界：** ② Sepolia MockERC20 结算资产 **≠** ③ 生产 USDC/PSP · **≠** staging 全矩阵 GO · R-01 audit **OPEN**。
