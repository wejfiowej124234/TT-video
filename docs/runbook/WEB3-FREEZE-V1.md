# Web3 Freeze v1

**性质：** Phase ③ Deployment Prerequisite Review PASS 后、Mainnet Deployment Package 生成前的**强制冻结点**。  
**SSOT：** [`registry/web3-freeze.v1.yaml`](../../registry/web3-freeze.v1.yaml)  
**Orchestrator：** `node scripts/dev/run-web3-freeze.cjs`  
**Gate：** `bash scripts/gates/check-web3-freeze-gate.sh`

---

## 在流程中的位置

```text
Phase ② Exit Review PASS
        ↓
Phase ③ Deployment Prerequisite Review (10 Reviews)
        ↓
Web3 Freeze              ← 本阶段
        ↓
Mainnet Deployment Package
        ↓
Wave Deployment
```

**目的：** 防止 Package 生成后 Registry / ABI / 合约被改动，导致 Package 不再是真正要部署的内容。

---

## 冻结范围

| 资产 | 说明 |
|------|------|
| Contracts | `contracts/src/**/*.sol` + bytecode hash |
| Registry | protocol-convergence · master-map · policy 等 |
| ABI | `contracts/abi/*.json` |
| Runbooks | 三阶段 · lifecycle · exit review · package · validation |
| Evidence | Sepolia validation · exit review · audit refs |
| Master Map | registry + runbook |
| Protocol SSOT | protocol-ssot · fund-flow-ssot |
| Deployment Scripts | Forge scripts + phase3 broadcast stub |

---

## 执行

```bash
bash scripts/gates/check-phase2-exit-review-gate.sh              # 须 PASS
node scripts/dev/run-phase3-deployment-prerequisite-review.cjs   # 10 Reviews 须 PASS
bash scripts/gates/check-phase3-deployment-prerequisite-review-gate.sh
node scripts/dev/run-web3-freeze.cjs
bash scripts/gates/check-web3-freeze-gate.sh
```

Evidence: `evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json`

Gate 会检测**冻结后漂移** — 任何 frozen 文件变更 → FAIL → 须 re-freeze。

---

## 出口

`WEB3_FREEZE_PASS` → `node scripts/dev/generate-mainnet-deployment-package.cjs`

**RULE-FREEZE-001：** 冻结后改动 Registry/ABI/Contracts → Package 失效 → 重新 freeze + re-package。

---

## 相关

- [PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md](PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md)
- [PHASE2-EXIT-REVIEW-V1.md](PHASE2-EXIT-REVIEW-V1.md)
- [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md)
