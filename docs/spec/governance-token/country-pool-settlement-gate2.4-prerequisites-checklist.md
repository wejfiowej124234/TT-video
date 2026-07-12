# Gate-2.4 · Country Pool Net Profit · Sepolia 前置清单

**Checklist ID:** `country-pool-settlement-gate2.4-prerequisites`  
**Version:** v1-20260615  
**Status:** **Gate-2.4 Ready Candidate（①）** · **② 经济基线锁定（GovFreeze V2 + Four-Ledger PASS）· 仅验收轨 · Phase B PAUSED**  
**Phase:** **② 测试网前置** · **禁止** 无 Owner 授权 broadcast · **≠** ③ Production GO  
**Upstream:** Gate-2.3 **EXIT** · [D-4555-B-HAT-LOCAL-REPORT.md](../../evidence/GO_local_country_pool_net_profit_gate2.3/D-4555-B-HAT-LOCAL-REPORT.md) · [GATE2.3-EXIT-REVIEW-REPORT.md](../../evidence/GO_local_country_pool_net_profit_gate2.3/GATE2.3-EXIT-REVIEW-REPORT.md)

> **Gate-2.4 Ready Candidate（①）≠ ② Sepolia GO ≠ staging 部署。**

---

## G24-P-01～11 状态

| ID | 项 | ①/② | 状态 | 证据 / 路径 |
|----|-----|-----|------|-------------|
| **G24-HAT-01** | **D-4555-B Local HAT**（六条核心链路） | ① | ✅ | [D-4555-B-HAT-LOCAL-REPORT.md](../../evidence/GO_local_country_pool_net_profit_gate2.3/D-4555-B-HAT-LOCAL-REPORT.md) · `bash scripts/dev/run-d4555b-hat-local.sh` |
| **G24-P-01** | Gate-2.3 Projection Package v1 四方 Pre-Review | ① | ✅ | [projection-package-v1.md](country-pool-settlement-gate2.3-projection-package-v1.md) |
| **G24-P-02** | Gate-2.3 Solidity delta merged（G23-01～03） | ① | ✅ | Gate-2.3 **EXIT** · `cf453bd9` |
| **G24-P-03** | ABI export + manifest + check-55-s13 | ① | ✅ | [country-pool-net-profit-v1.json](../../contracts/abi/manifests/country-pool-net-profit-v1.json) · `bash scripts/check-55-s13.sh` |
| **G24-P-04** | Event Topic Registry（decoder 规格） | ① | ✅ | [country-pool-net-profit-v1.yaml](../../registry/event-decoders/country-pool-net-profit-v1.yaml) · **decoder 实现留 Gate-2.4/3** |
| **G24-P-05** | G-1/G-2 + PHASE2-START-CHECKLIST | ② | ✅ 链切片 | `bash scripts/gates/check-g24-p-prerequisites-05-09-gov-freeze-sepolia.sh` |
| **G24-P-06** | Timelock `setAllowedExecutionTarget` ×5（V2 Shell + TTG） | ② | ✅ V2 | `DeployGovFreezeV2CleanBaseline` · Safe `configureGovFreezeV2CleanBaselineViaSafe` |
| **G24-P-07** | pilot DE registry JSON 填实地址 | ② | ✅ | [config/jurisdiction_country_pool_net_profit.sepolia.json](../../../config/jurisdiction_country_pool_net_profit.sepolia.json) |
| **G24-P-08** | Sepolia STEWARD_STAKE_POOL + jurisdiction | ② | ✅ V2 | `GOV_FREEZE_V2_STAKE_POOL_PROXY` · 10/10 bootstrap at deploy |
| **G24-P-09** | Phase2ControlPlane · non-Anvil owner | ② | ✅ | R-02 · `TIMELOCK_ADMIN_ADDRESS` ≠ deployer |
| **G24-P-10** | Runbook `[D-4555-B]` Anvil 全序列 | ① | ✅ | Gate-2.2 evidence · deploy script |
| **G24-P-11** | Legal LEG-XJ-05 未部署国不暗示已结算 | ②/③ | ☐ | legal-freeze-matrix |
| **G24-P-12** | **TTG Tokenomics V1 + GOV-01～04 SSOT** | ① | ✅ | [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) · [Final Audit Report](TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md) · `/governance/params#gov-params-tokenomics-freeze` |
| **G24-GOV-01** | **GOV-01 链上 enforce · `GovernanceTreasuryP4Cap`** | ①/② | ✅ ① HAT · ✅ ② Sepolia | `verify-gov-freeze-v1-sepolia-onchain.sh` · [GO_phase2_gov_freeze_v1_sepolia](../../../evidence/GO_phase2_gov_freeze_v1_sepolia/) |
| **G24-GOV-02** | **GOV-02 Governor quorum 400 + Timelock 48h** | ①/② | ✅ ① · ✅ ② Sepolia | Proxy 基线 · timelock delay=172800 |
| **G24-GOV-03** | **GOV-03 Seat registry（一国一控 + stake aggregate cap）** | ①/② | ✅ ① · ✅ ② Sepolia | `TtgSeatConcentrationRegistry` Proxy |
| **G24-GOV-04** | **GOV-04 Primary Market per-wallet / round cap** | ①/② | ✅ ① · ✅ ② Sepolia | `TtgPrimaryMarketV1` Proxy · `initializeProxyStorage` |
| **G24-P-UPGRADE-01** | **Proxy 架构闸 · Shell 须 Timelock Proxy · 禁止裸 Implementation 基线** | ② pre-broadcast | ✅ | [G24-P-UPGRADE-01-proxy-architecture-gate.md](G24-P-UPGRADE-01-proxy-architecture-gate.md) |
| **G24-FSA-01** | **TTG Tokenomics Full-System Audit**（SSOT 全链路 · ② Sepolia） | ② | ✅ PASS_WITH_PARTIAL | `bash scripts/dev/run-ttg-tokenomics-full-system-audit.sh` · [TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md](TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md) |
| **G24-HAT-R1** | **真人钱包全链路 HAT-R1** | ② | ✅ Phase A · ⏸ Phase B **PAUSED**（录屏 + Owner） | Phase A [20260616T063612Z](../../../evidence/GO_hat_r1_sepolia/20260616T063612Z/) |
| **G24-MTM-01** | **Master Traceability Matrix** | ② | ✅ **146 · DEV63 TN40 H43 OPS13** | [TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) · `TTG_GOV_MTM: ROWS=146 DEV=63 TN=40 HUMAN=43 OPS=13 DR=0` |
| **G24-FCC-01** | **Full Coverage Certification Report** | ② | ✅ **146 GFC · TN40 H43 OPS13 ENT99 CERT=6/12** | [TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md](TTG-GOVERNANCE-FULL-COVERAGE-CERTIFICATION-REPORT.md) · `TTG_GOV_FCC: … ENT=99 CERT=6/12` |
| **G24-HUMAN-CERT-01** | **Human Certification Coverage** | ② | ◐ **Cert#1–#6 ☑ · 43/58 Human · 13/34 Ops · active=#7** | [TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md](TTG-GOVERNANCE-HUMAN-CERTIFICATION-COVERAGE-REPORT.md) · `evidence/GO_ttg_cert/20260616T100918Z/` · **改动必跑** `run-ttg-governance-cert-post-change-gate.sh` · `registry/ttg-governance-cert-gates.v1.yaml` |
| **G24-COV-MAT-01** | **TTG Governance Full Coverage Matrix** | ② | ✅ **v1 已生成** | [TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md](TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md) · `gen-ttg-governance-full-coverage-matrix.py` |
| **G24-ASV-AUD-01** | **Attack Surface & Operational Coverage Audit** | ② | ✅ **v1 已生成** | [TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md](TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md) |
| **G24-OPS-DR-01** | **Operations & Disaster Recovery Audit** | ② | ✅ **v1 已生成** | [TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md](TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md) |
| **G24-PROD-READY-01** | **Production Readiness Closure Audit** | ② | ✅ **v1 已生成** | [TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md](TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md) |
| **G24-GORP-01** | **Governance Operational Readiness Program（GORP）** | ② | ✅ **v1 已发布** | [TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md](../../runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md) |
| **G24-ENT100-01** | **Enterprise 100/100 Final Gap Audit** | ② | ✅ **Score 53 · NOT 100**（报告体 v1 · **Closure SSOT ENT=99**） | [TTG-GOVERNANCE-ENTERPRISE-100-FINAL-GAP-AUDIT.md](TTG-GOVERNANCE-ENTERPRISE-100-FINAL-GAP-AUDIT.md) |
| **G24-360-01** | **360° Final Closure Audit** | ② | ✅ **E53 · GPR10 · GL2**（报告体 v1 · **Closure SSOT ENT=99**） | [TTG-GOVERNANCE-360-FINAL-CLOSURE-AUDIT.md](TTG-GOVERNANCE-360-FINAL-CLOSURE-AUDIT.md) |
| **G24-GECP-01** | **Enterprise Closure Program（GECP）** | ② | ✅ **CERT_ONLY · 6/12 · active=#7** | [TTG-GOVERNANCE-ENTERPRISE-CLOSURE-PROGRAM.md](../../runbook/TTG-GOVERNANCE-ENTERPRISE-CLOSURE-PROGRAM.md) · [Final Closure Checklist §14](TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md#14--certification-execution-queue唯一执行序--612) |
| **G24-CP-REV-HAT-01** | **TT_COUNTRY_POOL_REVENUE_ENTERPRISE_HAT**（九步 · 四账一致） | ② | ✅ **PASS** `20260616T084248Z` | cutover+drill `20260616T082259Z` · `four_ledger PASS` |
| **G24-ENT-HAT-01** | **TT_GOVERNANCE_ENTERPRISE_HAT**（L1～L9） | ② | ✅ **L9 recheck PASS** · 维护窗内不扩 scope | `l9-recheck/20260616T084529Z` |
| **G24-GOV-FREEZE-V2** | **GovFreeze V2 + TTG Tokenomics 基线冻结** | ② | ✅ **FROZEN** | [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) · `record-gov-freeze-v2-sepolia-baseline-freeze.sh` |
| **G24-GOV-CONC-01** | **Governance Concentration Audit（800 万 TTG 场景）** | ② | ✅ PASS | `run-governance-concentration-audit-sepolia.sh` · [evidence/GO_governance_concentration_audit_sepolia/latest-stamp.txt](../../../evidence/GO_governance_concentration_audit_sepolia/latest-stamp.txt) |
| **G24-TTG-PIVOT-01** | **GovernanceVotesToken approve/transferFrom 重播** | ② | ✅ | `0x2837ea0c…` · `verify-gov-freeze-v2-ttg-erc20-sepolia.sh` PASS |
| **G24-SPB-01** | **Stake Pool 10 国 jurisdiction bootstrap** | ② | ✅ V2 deploy init | `DeployGovFreezeV2CleanBaseline` · 补丁路径 **CANCELLED** |
| **G24-CLEAN-BASELINE-01** | **Sepolia GovFreeze 干净基线根因审计** | ② | ✅ **PASS_CLEAN_BASELINE** | `run-g24-clean-baseline-01-root-cause-audit.sh` · `20260616T042502Z` · [evidence/GO_g24_clean_baseline_01/latest](../../../evidence/GO_g24_clean_baseline_01/latest/) |
| **G24-UI-ALIGN-01** | **TTG Tokenomics 真人视角 UI 对齐审计** | ① | ✅ PASS | UI **≠** 链上 init · 见 G24-CLEAN-BASELINE-01 |

---

## G23-04 冻结面（Gate-2.4 不得 breaking change）

| 合约 | ABI 路径 | 事件 / selector 真源 |
|------|----------|----------------------|
| `CountryPoolNetProfitLedger` | `contracts/abi/CountryPoolNetProfitLedger.json` | manifest `events` + `selectors` |
| `StewardPathVault` | `contracts/abi/StewardPathVault.json` | `StewardPathDeposit` |
| `UnallocatedStewardPathVault` | `contracts/abi/UnallocatedStewardPathVault.json` | `UnallocatedStewardDeposit` · `UnallocatedStewardReleased` |
| `CountryPoolNetProfitGovernancePayload` | manifest `governance_payload` | `CPNP_*` selector 常量 |

**验证（① 本地）：**

```bash
bash scripts/dev/check-country-pool-net-profit-abi-freeze.sh
bash scripts/check-55-s13.sh
cd contracts && forge test --match-contract CountryPoolNetProfitAbiFreeze
```

---

## Gate-2.4 前置评审（① · HAT 上游已闭）

**评审日：** 2026-06-15 · **HEAD** `d32b4813` · **结论：** **Ready Candidate（①）** · **② 实施 NOT STARTED**

| 维度 | 结论 |
|------|------|
| **Gate-2.3 Exit** | ✅ 四卡 DoD · forge 54 + fuzz 4 + FeeRouter 10 |
| **D-4555-B HAT** | ✅ 六条核心链路 · `D4555B_HAT_SUMMARY: PASS` |
| **ABI / 事件冻结** | ✅ G24-P-03/04 · `check-55-s13` + AbiFreeze |
| **Sepolia broadcast** | ✅ **GovFreeze V2 Clean Baseline** · deploy `20260616T041454Z` · cutover `20260616T042502Z` · **PASS_CLEAN_BASELINE** · **≠ ③ GO** |

**下一合法动作（② · 验收维护窗 · 禁止 Tokenomics 设计变更）：**

1. **真人录屏验收** — `run-govfreeze-v2-human-screen-acceptance-prep.sh` → 录屏 → `record-govfreeze-v2-human-screen-acceptance.sh`
2. **Timelock 到期 + 录屏签核后** — `export HAT_R1_PHASE_B_PAUSED=0` → `run-hat-r1-phase-b-when-ready.sh`（Execute → Treasury Spend → Unstake）

**≠ ③ Production GO**

---

## 诚实边界

- **G24-P-03/04 ☑** = manifest + topic registry **已冻结** · **≠** indexer/API/DB 已合入 · **≠** Sepolia broadcast 已执行
- **Sepolia deploy** 须 **G24-P-05～09** + Owner 授权 · 单独 PR / checklist
- **① HAT PASS + 前置评审 ☑** **≠** ② Sepolia GO **≠** ③ Production GO
