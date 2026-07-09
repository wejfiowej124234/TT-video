# Phase ③ Production Deployment Prerequisite Review v1

**Governance Root:** [PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md](PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md) · **Production Release Governance v1**

**正式名称：** TravelTrust Phase ③ Production Deployment Prerequisite Review（第三阶段部署前最终审查）

**性质：** 进入 Phase ③ Mainnet Production Deployment 之前，**最后一道系统级 Gate**。  
**不通过不得进入 Web3 Freeze 及后续主网部署。**

**SSOT：** [`registry/phase3-deployment-prerequisite-review.v1.yaml`](../../registry/phase3-deployment-prerequisite-review.v1.yaml)

---

## 完成标准模型

```text
Review
    ↓
Sub Checks（全部 PASS 才算 Review PASS）
    ↓
Evidence
    ↓
Machine Verdict（例：TT_R06_PROTOCOL_CONSISTENCY_PASS）
```

**Review PASS 规则：** 该 Review 下 **每一个** sub_check 必须 PASS。  
**Gate PASS 规则：** 10 个 Review 全部 PASS → `PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS`。

---

## Production Readiness Book（非 Gate）

Prerequisite Review 跑完后 **自动生成** 部署日总账：

- **路径：** `evidence/GO_production_readiness/production-readiness-book/PRODUCTION-READINESS-BOOK-LATEST.md`
- **生成器：** `node scripts/dev/gen-production-readiness-book.cjs`

部署当天只打开这一份，即可看到：Review 矩阵、Blockers、为何/为何不能 Mainnet、Manifest、Registry Snapshot、Commit、Evidence Index、Rollback、Owner Sign-off。

---

## R06 Protocol Consistency（优先加强）

| Sub-check | 含义 |
|-----------|------|
| R06-SC-01 | Registry ↔ Contracts |
| R06-SC-02 | Registry ↔ ABI |
| R06-SC-03 | Registry ↔ API |
| R06-SC-04 | Registry ↔ Frontend |
| R06-SC-05 | Registry ↔ Dashboard |
| R06-SC-06 | Registry ↔ Master Map |
| R06-SC-07 | Registry ↔ Evidence |
| R06-SC-08 | Registry ↔ Deployment Package |
| R06-SC-09 | Registry ↔ Environment |
| R06-SC-10 | Registry ↔ Runtime |

**退出：** 10/10 → `TT_R06_PROTOCOL_CONSISTENCY_PASS`

---

## 十项 Review · Machine Keys

| ID | Machine Key (PASS) |
|----|-------------------|
| REVIEW-01 | `TT_R01_BUSINESS_LOGIC_PASS` |
| REVIEW-02 | `TT_R02_PROTOCOL_STATE_MACHINE_PASS` |
| REVIEW-03 | `TT_R03_ROLE_LIFECYCLE_PASS` |
| REVIEW-04 | `TT_R04_FUND_LIFECYCLE_PASS` |
| REVIEW-05 | `TT_R05_PERMISSION_SECURITY_PASS` |
| REVIEW-06 | `TT_R06_PROTOCOL_CONSISTENCY_PASS` |
| REVIEW-07 | `TT_R07_UPGRADEABLE_ARCHITECTURE_PASS` |
| REVIEW-08 | `TT_R08_DEPLOYMENT_DRY_RUN_PASS` |
| REVIEW-09 | `TT_R09_DISASTER_RECOVERY_PASS` |
| REVIEW-10 | `TT_R10_MAINNET_READINESS_PASS` |

完整 sub_checks 清单见 Registry SSOT。

---

## 执行

```bash
# 前置：Phase ②-F Exit Review PASS
node scripts/dev/run-phase2-exit-review.cjs

# 本 Gate（含 Production Readiness Book 自动生成）
node scripts/dev/run-phase3-deployment-prerequisite-review.cjs

# 仅重新生成总账
node scripts/dev/gen-production-readiness-book.cjs

# Gate 检查
bash scripts/gates/check-phase3-deployment-prerequisite-review-gate.sh

# Dashboard
node scripts/dev/dashboard.cjs --refresh
```

---

## 通过后

```bash
node scripts/dev/run-web3-freeze.cjs
node scripts/dev/generate-mainnet-deployment-package.cjs
# Phase ③ Wave 1→2→3 从 MANIFEST/manifest.json 部署
```

Evidence：

- `evidence/.../phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json`
- `evidence/.../production-readiness-book/PRODUCTION-READINESS-BOOK-LATEST.md`
