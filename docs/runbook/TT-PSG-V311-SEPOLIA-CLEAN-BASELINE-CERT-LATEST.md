# TT · PSG Certification · V3.1.1 Sepolia Clean Baseline（②）


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**Machine:** `TT_PSG_V311_SEPOLIA_CLEAN_BASELINE_CERT`  
**Registry:** [`registry/psg-v311-sepolia-clean-baseline-cert.v1.yaml`](../../registry/psg-v311-sepolia-clean-baseline-cert.v1.yaml)  
**Evidence:** [`evidence/GO_phase2_v311_sepolia_clean_baseline/psg-cert/`](../../evidence/GO_phase2_v311_sepolia_clean_baseline/psg-cert/)  
**Status:** **PASS · LOCKED for RC Preparation** · Stamp `20260718T095658Z`  
**Phase:** **② Sepolia** · **唯一 ② 基线** · **非** `TT_PSG_SEPOLIA_FREEZE` · **非** Production GO  

**Next track:** [TT-PSG-SEPOLIA-RC-PREPARATION-LATEST.md](./TT-PSG-SEPOLIA-RC-PREPARATION-LATEST.md) · `TT_PSG_SEPOLIA_RC_PREPARATION: ACTIVE`  

**Locks:** 禁止新增协议功能 · 禁止修改 ACTIVE 地址矩阵 · 漂移 → 撤销 RC 候选并重认证。

---

## 0 · 唯一基线（写死）

| 项 | 值 |
|----|-----|
| Matrix | **PASS 48 / GAP 0** |
| `TT_V311_VERIFY` | **PASS** |
| Full Alignment | **PASS** |
| ACTIVE first-wins | **`v311_sepolia_clean_baseline`**（V3.1.1） |
| `gov_freeze_v2_clean_baseline` | **LEGACY_SUPERSEDED** |
| Production GO | **NOT CLAIMED** |

---

## 1 · 一致性复核层

Contracts · Backend · Frontend · Indexer · Runtime · Registry · Docs · Evidence — 本轮复核 **PASS**（见 Evidence pack）。

漂移修复：Master Matrix / Runtime Activation / Asset Denomination / protocol-ssot ACTIVE 指针曾误留 V2 → **先撤销收口** → Cutover 指针 → 再认证。

---

## 2 · ACTIVE 合约地址表（V3.1.1 · Sepolia · 写死）

**链：** Sepolia `11155111` · **部署戳：** `20260718T092622Z`  
**机读真源：** [`registry/v311-sepolia-address-matrix-freeze.v1.json`](../../registry/v311-sepolia-address-matrix-freeze.v1.json)（**FROZEN** · 禁止改 ACTIVE）

| 角色 | 合约 | 地址 |
|------|------|------|
| Timelock | GovernanceTimelock | `0x462402082B395F218FFB3634ec0611e39BdD504C` |
| Governor（Proxy） | TravelTrustGovernor | `0x1ce4fbE80557bC2111A814f60A2334de41032116` |
| Treasury / USDC 收款（P4Cap=sink） | GovernanceTreasuryP4Cap | `0x6A10df057c637A295b48D91A8101d22542425905` |
| Primary Market（Proxy） | TtgPrimaryMarketV1 | `0x98a9BCfe967BA27d5448A1569d1622A7938046c2` |
| Seat Registry（Proxy） | TtgSeatConcentrationRegistry | `0x7574E868dA767690FD91b5F8940dA7ad3B1efa66` |
| Stake Pool（Proxy） | RegionStewardStakePool | `0xc229D58987e0755467eB4EE53572F7139bAf7281` |
| 治理代币 TTG | GovernanceVotesToken | `0x5D2eDABF062E1d8AccDA2bd35c0d9B26CFCd5Ec0` |
| Timelock Admin（Safe） | Gnosis Safe | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` |

**约束（写死）：**

- `usdc_sink` **=** P4Cap（上表同一地址）· **≠** Safe  
- 公募 caps：`800_000 / 1_200_000 / 3_000_000` TTG  
- Timelock delay：`172800` 秒（48h）  
- 升级路径：Safe → Timelock → `upgradeTo`（五壳 Proxy）

**未列入 ACTIVE 治理基线、但在部署清单中的支付栈（COMPOSITE · 历史 fund-stack）：** EscrowFactory `0xbf746B6a330e61416c6D87aB9b0758f7107C8006` · FeeRouter `0x81A8009210c5215100564c6E4123F672c4459306` 等 — 见 [`registry/v311-web3-deployment-inventory.v1.json`](../../registry/v311-web3-deployment-inventory.v1.json) / [功能认证中文说明](./TT-V311-WEB3-DEPLOYMENT-FUNCTIONAL-CERT-LATEST.md)。

---

## 3 · 冻结指针

- 地址矩阵：`registry/v311-sepolia-address-matrix-freeze.v1.json` · **FROZEN**
- Registry ACTIVE：`protocol-convergence-deployments.active_deploy_baseline = v311_sepolia_clean_baseline`
- Git Baseline cite：`evidence/.../GIT-BASELINE-SHA-LATEST.txt` = `3096516ddcb230e571c41eb0fc0eb16a1f3ce39f`

---

## 4 · 撤销规则

ACTIVE 再漂到 V2 / 旧地址 first-wins → **立即撤销本 CERT** → 重入 Cutover · **禁止假认证**。
