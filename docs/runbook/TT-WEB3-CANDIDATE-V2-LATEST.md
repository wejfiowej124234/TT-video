# TT · Web3 Candidate v2 · ACTIVE Web3 Candidate Baseline（LATEST）

**STATUS:** `ACTIVE_WEB3_CANDIDATE_BASELINE`  
**Release:** `PSG-REL-20260720-WEB3-CAND-V2`  
**FG-15 track:** **FG-15-B**（`PROMOTION_CANDIDATE`）  
**Machine:** [`registry/web3-candidate-v2.v1.yaml`](../../registry/web3-candidate-v2.v1.yaml) · [`registry/web3-mainline.v1.yaml`](../../registry/web3-mainline.v1.yaml)  
**Gates:**  
`bash scripts/gates/check-web3-mainline-candidate-v2-gate.sh`  
`bash scripts/gates/check-web3-candidate-v2-gate.sh`  
**Digest / ABI:** [`WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json`](../../evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json)  
**Baseline Migration v2:** [TT-WEB3-BASELINE-MIGRATION-V2-ALIGNMENT-LATEST](./TT-WEB3-BASELINE-MIGRATION-V2-ALIGNMENT-LATEST.md) · scan `bash scripts/gates/check-web3-baseline-migration-v2-scan.sh`

---

## 主线切换（写死）

```text
FG-15-A  PSG-REL-20260719-FG15-09c72b93
            ↓
     ARCHIVED / HISTORICAL（只读 · 不删 · 不改时间线）
            ↓ 不再作为测试 / Promotion / Release 对齐来源

Candidate v2  = ACTIVE WEB3 CANDIDATE BASELINE
            ↓
     Sepolia Deploy（Owner 授权）
            ↓
     Money Path
            ↓
     FG-15-B（独立证据根）
            ↓
     PSG Recalculate
```

| 轨 | 身份 | Promotion |
|----|------|-----------|
| **FG-15-A** | Historical Baseline | **NOT FOR PROMOTION** |
| **FG-15-B** | Candidate v2 Observation | **PROMOTION CANDIDATE** |

旧归档说明：[TT-FG15-A-HISTORICAL-ARCHIVE-LATEST](./TT-FG15-A-HISTORICAL-ARCHIVE-LATEST.md)

---

## 新流程默认入口（全部指向 Candidate v2）

| 用途 | 命令 |
|------|------|
| **Sepolia 部署（C2-02→C2-03）** | `bash scripts/dev/run-web3-candidate-v2-sepolia-deploy.sh` |
| Money Path | `bash scripts/dev/run-web3-candidate-v2-money-path-entry.sh` |
| Runtime Attestation | `bash scripts/dev/run-web3-candidate-v2-runtime-attestation-entry.sh` |
| Readiness / gates | `bash scripts/dev/run-web3-candidate-v2-readiness-entry.sh` |
| Forge Escrow/Settlement | `cd contracts && forge test --match-contract 'FundSafetyP0Test\|EscrowTest\|…'` |
| Env lib | `source scripts/dev/lib/web3-candidate-v2-mainline.sh` |

**LEGACY（仅历史 Hardened / FG-15-A 法医）：**  
`run-l5-runtime-rebind-and-money-path.sh` 须 `TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1` — **非**主线。

---

## 禁止项（新流程）

- 新测试读取旧 FG-15-A 合约地址当 SSOT  
- 新 Evidence 写入 `evidence/GO_fg15_observation_48h/`（非 `_candidate_v2`）  
- 新 Promotion 引用 `09c72b93` / `PSG-REL-20260719-FG15-09c72b93`  
- 新 Mainnet Package 以 `v311_sepolia_clean_baseline` 为候选 baseline  
- 真实 ETH Wave（Hard Gate 仍 fail-closed）

## 不要做

- 删除旧 FG-15  
- 覆盖旧 Evidence  
- 改写旧时间线  

---

## 阶梯

| # | 阶 | 状态 |
|---|-----|------|
| C2-01 | Code freeze | ✅ |
| C2-01b/c | Mainline + prod blockers + V1 fallback kill | ✅ |
| C2-02 | Owner Sepolia 授权 | ✅ |
| C2-03 | Sepolia 部署（Safe arb + FactoryV2 + Candidate SR） | ✅ |
| C2-04 | Money Path | ✅ Live Happy+Dispute · ⏳ Settlement finalize **after ETA 2026-07-21T18:10:48Z** |
| C2-05 | FG-15-B 观察 | ✅ **ELAPSED**（`elapsed_pass=true` · L5 FINAL on file） |
| C2-06 | Hard Gate 轴恢复 | ⛔ 禁止翻转直到 FG-15-B ELAPSED |
| C2-07 | Mainnet 准备 | ⏳ |
| C2-08 | Real ETH Wave | ⛔ FORBIDDEN |

### 等待窗（写死 · pin `PSG-REL-20260720-WEB3-CAND-V2` 冻结）

```text
now  <  Timelock ETA (2026-07-21T18:10:48Z)
        → bash scripts/dev/run-web3-candidate-v2-fg15b-maintain.sh   # append-only
        → bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh  # exit 3 WAIT
        → 禁止 Hard Gate flip / PSG Recalculate / L5 Cert promotion

ETA reached
        → bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh
        → 三笔 Timelock.execute + L5 Runtime Final Evidence

FG-15-B ELAPSED
        → python scripts/dev/run-psg-completion-matrix-recalculate.py
        → bash scripts/dev/run-web3-candidate-v2-formal-release-baseline.sh
        → Candidate v2 正式提升为 PSG Web3 Release Baseline（证据产物）
        → 全过程：ECONOMIC_MODEL_FREEZE · Appendix F · Hard Gate REFUSED · Wave FORBIDDEN
        → 此前禁止 Recalculate / Formal baseline / Hard Gate 翻转
```

### Sepolia Candidate 身份（C2-03）

| Role | Address |
|------|---------|
| EscrowFactoryV2 | `0x6e9a4c4032d2d0c91e643faa5dea45ba7f86bdef` |
| SettlementRouter | `0x5a6df184e9c6b1285f8beb50a438d82d5f094d6a` |
| FeeRouter | `0xf406e6f1277b990544d4f0556421c3c14df0ab28` |
| Arbitrator (Safe) | `0x7c018293396325077bb4d039930dcee11b7fb1cf` |
| Timelock (guardian / SR owner) | `0x462402082b395f218ffb3634ec0611e39bdd504c` |

Identity：`evidence/GO_web3_candidate_v2/sepolia-deploy/CANDIDATE-V2-SEPOLIA-ADDRESS-IDENTITY-LATEST.json`  
FG-15-B：`evidence/GO_fg15_observation_48h_candidate_v2/` · FG-15-A：**Historical Archive only**

Hard Gate：**REFUSED** · Wave：**FORBIDDEN**
