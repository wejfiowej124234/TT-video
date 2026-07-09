# Phase ②-F · Exit Review v1

**子轨 ID：** ②-F  
**Phase ② 总称：** **Staging / Sepolia Production Validation**  
**SSOT:** [`registry/phase2-staging-sepolia-production-validation.v1.yaml`](../../registry/phase2-staging-sepolia-production-validation.v1.yaml) → `phase_2f_exit_review`  
**Orchestrator：** `node scripts/dev/run-phase2-exit-review.cjs`  
**Gate：** `bash scripts/gates/check-phase2-exit-review-gate.sh`

---

## 在整体流程中的位置

```text
Phase ① Development
        ↓
Phase ② Staging / Sepolia Production Validation
  ②-A Website & Product UAT
  ②-B Admin / Operations UAT
  ②-C Data Governance / CMS / COS
  ②-D Web3 Lifecycle Validation
  ②-E Security / RBAC / Monitoring
        ↓
Phase ②-F Exit Review          ← 本阶段
        ↓
Phase ③ Deployment Prerequisite Review (10 Reviews)
        ↓
Web3 Freeze → Mainnet Package → Phase ③
```

---

## 审查项（②-A～②-E 全部 PASS + 跨轨 Evidence）

| ID | 子轨 | 项 |
|----|------|-----|
| 2A | Website & Product UAT | 页面 · UI/UX · 多身份 UAT |
| 2B | Admin / Operations UAT | Admin · moderation · ops |
| 2C | Data Governance / CMS / COS | CMS/COS/数据治理 |
| 2D | Web3 Lifecycle | `SEPOLIA_FULL_WEB3_LIFECYCLE_PASS` · RULE-PH2-001 |
| 2D | Web3 audits | System Closure · Protocol-Grade P0=0 · Escrow MODEL_ALIGNED · Cert 8–12 |
| 2E | Security / RBAC / Monitoring | Protocol-Grade · RBAC D3 |
| — | Cross-cutting | Business Logic · User Journey · Security audits |

---

## 执行

```bash
node scripts/dev/run-phase2-production-validation.cjs
node scripts/dev/run-phase2-exit-review.cjs
bash scripts/gates/check-phase2-exit-review-gate.sh
```

---

## 出口后

1. `node scripts/dev/run-phase3-deployment-prerequisite-review.cjs` — 10 Reviews 全部 PASS
2. `node scripts/dev/run-web3-freeze.cjs`
3. `node scripts/dev/generate-mainnet-deployment-package.cjs`

Runbooks: [PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md](PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md) · [WEB3-FREEZE-V1.md](WEB3-FREEZE-V1.md) · [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md)

---

## 相关

- [PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md](PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md)
- [SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md](SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md)
