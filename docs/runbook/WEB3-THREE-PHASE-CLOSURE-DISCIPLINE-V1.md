# Web3 Three-Phase Closure Discipline v1

**Web3 子轨 SSOT:** [`registry/web3-three-phase-closure-discipline.v1.yaml`](../../registry/web3-three-phase-closure-discipline.v1.yaml)  
**Phase ② 总 SSOT:** [`registry/phase2-staging-sepolia-production-validation.v1.yaml`](../../registry/phase2-staging-sepolia-production-validation.v1.yaml)

> **Web3 Lifecycle Validation（②-D）只是 Phase ② 的一个子轨，不是 Phase ② 的总名称。**

---

## 三阶段总览

| 阶段 | 名称 |
|------|------|
| **Phase ①** | **Development** |
| **Phase ②** | **Staging / Sepolia Production Validation** |
| **Phase ③** | **Production Deployment (Mainnet)** |

---

## Phase ② 子轨（总称见上）

```text
Phase ② · Staging / Sepolia Production Validation
├── ②-A  Website & Product UAT
├── ②-B  Admin / Operations UAT
├── ②-C  Data Governance / CMS / COS Validation
├── ②-D  Web3 Lifecycle Validation     ← 本文 Web3 纪律所覆盖
├── ②-E  Security / RBAC / Monitoring
└── ②-F  Exit Review
```

Master Runbook: [PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md](PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md)

---

## Web3 子轨（②-D）之后

```text
②-F Exit Review PASS
        ↓
Phase ③ Deployment Prerequisite Review (10 Reviews)
        ↓
Web3 Freeze
        ↓
Mainnet Deployment Package (MANIFEST/manifest.json)
        ↓
Phase ③ Wave 1→2→3
        ↓
Mainnet Validation
```

**禁止：** Sepolia param swap 上主网（RULE-DEPLOY-001）

---

## Phase 纪律

| 阶段 | 允许 | 禁止 |
|------|------|------|
| ① Development | 开发 · 新功能 · 修 Bug | 跳 Phase ② |
| ② Staging/Sepolia | 验证 · UAT · 修 Bug · Evidence | **新功能** · 主网广播 |
| ③ Mainnet | 部署 · 验证 · Rollback | **开发** · 新功能 |

---

## ②-D Web3 命令

```bash
node scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs
bash scripts/gates/check-phase2-mainnet-feature-evidence-gate.sh
```

Runbook: [SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md](SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md)

---

## Phase Dashboard（项目总驾驶舱）

```bash
node scripts/dev/run-phase-dashboard.cjs
```

一分钟查看 Phase ①/②/③ 进度 · Blockers · **Current Focus → Next**  
Runbook: [PHASE-DASHBOARD-V1.md](PHASE-DASHBOARD-V1.md)

---

## Phase ② 总览命令

```bash
node scripts/dev/run-phase2-production-validation.cjs
node scripts/dev/run-phase2-exit-review.cjs
```

---

## 相关

- [PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md](PHASE2-STAGING-SEPOLIA-PRODUCTION-VALIDATION-V1.md)
- [PHASE2-EXIT-REVIEW-V1.md](PHASE2-EXIT-REVIEW-V1.md)
- [WEB3-FREEZE-V1.md](WEB3-FREEZE-V1.md)
- [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md)
