# Mainnet Deployment Package v1

**Governance Root:** [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md) · **Production Release Governance v1**

**性质：** Web3 Freeze PASS 后生成的**部署唯一真源** — 不是 Sepolia env 复制。  
**Top SSOT:** `MANIFEST/manifest.json` inside each package  
**Generator:** `node scripts/dev/generate-mainnet-deployment-package.cjs`  
**Gate:** `bash scripts/gates/check-mainnet-deployment-package-gate.sh`

---

## Timelock 等待期 PREP（不改变 Gate）

Cert #8→#12 Timelock 期间可提前准备 deploy-day 工件，**不触发** Prerequisite / Exit / Freeze Gate：

```bash
node scripts/dev/prepare-mainnet-deployment-package-prep.cjs
```

**Verdict:** `MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE` · **Status:** `PREP_NOT_GENERATED`

| # | 组件 | 模板路径 |
|---|------|----------|
| 1 | Escrow Factory Wave-1（**V2** · V1 FORBIDDEN） | `wave-1-escrow-factory/` |
| 2 | Mainnet Deployment Runbook | `runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md` |
| 3 | Owner Sign-off Package | `owner-signoff/OWNER-SIGNOFF-PACKAGE.md` |
| 4 | Deployment Manifest（template） | `MANIFEST/manifest.template.json` |
| 5 | Contract Verify Package | `verify/CONTRACT-VERIFY-PACKAGE.md` |
| 6 | Explorer Verify Package | `verify/EXPLORER-VERIFY-PACKAGE.md` |
| 7 | Rollback Package | `rollback/MAINNET-ROLLBACK-PREP-V1.md` |
| 8 | Emergency Recovery Package | `emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md` |

模板 SSOT：`docs/runbook/templates/mainnet-package/`  
Prep 证据：`evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.json`

Freeze PASS 后仍须运行 `generate-mainnet-deployment-package.cjs` 生成正式 Package（`MANIFEST/manifest.json`）。

---

## Package 结构

```text
Mainnet Deployment Package/
├── MANIFEST/manifest.json          ← 唯一真源
├── registry-snapshot/
├── abi-snapshot/
├── contract-bytecode-hashes.json
├── deploy-scripts/
├── constructor-parameters.v1.yaml
├── wave-deployment-matrix.v1.yaml
├── runbook/MAINNET-ROLLBACK-V1.md
├── rpc-matrix.v1.yaml
├── evidence/
├── owner-signoff/OWNER-SIGNOFF-TEMPLATE.md
└── env/mainnet.env.template
```

任何人打开这一包，都知道：**这就是要部署的全部内容**。

---

## 生成前置

```bash
bash scripts/gates/check-phase2-exit-review-gate.sh
node scripts/dev/run-web3-freeze.cjs
bash scripts/gates/check-web3-freeze-gate.sh
node scripts/dev/generate-mainnet-deployment-package.cjs
bash scripts/gates/check-mainnet-deployment-package-gate.sh
```

---

## Phase ③ 消费方式

1. Owner + 工程评审 Package（Wave 矩阵 · Rollback · Registry 快照）
2. R-01 第三方审计 PASS
3. `export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1`（Owner only）
4. **Wave 1** 广播 → `node scripts/dev/run-mainnet-wave-validation.cjs --wave=1`
5. Shadow Launch 观察
6. **Wave 2** → 验证 → **Wave 3** → 验证
7. 进入 [Mainnet Validation](MAINNET-VALIDATION-V1.md)

---

## 相关

- [PHASE2-EXIT-REVIEW-V1.md](PHASE2-EXIT-REVIEW-V1.md)
- [MAINNET-VALIDATION-V1.md](MAINNET-VALIDATION-V1.md)
- [WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md](WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md)
