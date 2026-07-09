# Phase ②-D · Web3 Lifecycle Validation v1

**子轨 ID：** ②-D  
**Phase ② 总称：** **Staging / Sepolia Production Validation** — Web3 **不是** Phase ② 总名  
**SSOT:** [`registry/sepolia-full-web3-lifecycle-validation.v1.yaml`](../../registry/sepolia-full-web3-lifecycle-validation.v1.yaml)  
**Parent SSOT:** [`registry/phase2-staging-sepolia-production-validation.v1.yaml`](../../registry/phase2-staging-sepolia-production-validation.v1.yaml)  
**Orchestrator:** `node scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs`

---

## 范围（仅此子轨）

Web3 Business · Protocol · Governance · Security · Economics · Deployment — Sepolia 真实链上 E2E。

**不包括：** 网站 UAT · Admin · CMS/COS · 数据治理 — 见 ②-A/B/C。

---

## 模块 E2E 顺序

TTG → Governance → Primary Market → Escrow → Guide Stake → Provider Stake → Steward → CountryPool → Treasury → FeeRouter → Settlement → Ledger → Emergency → Recovery → Upgrade → Security → RBAC → Deployment → Monitoring

---

## 执行

```bash
node scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs
bash scripts/gates/check-phase2-mainnet-feature-evidence-gate.sh
```

**出口：** `SEPOLIA_FULL_WEB3_LIFECYCLE_PASS` · RULE-PH2-001

→ 作为 ②-D 输入 **②-F Exit Review**

---

## 相关

- [PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md](PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md)
- [WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md](WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md)
