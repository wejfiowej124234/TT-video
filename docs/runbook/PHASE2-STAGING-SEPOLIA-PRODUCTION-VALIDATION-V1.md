# Phase ② · Staging / Sepolia Production Validation v1

**SSOT:** [`registry/phase2-staging-sepolia-production-validation.v1.yaml`](../../registry/phase2-staging-sepolia-production-validation.v1.yaml)  
**Orchestrator:** `node scripts/dev/run-phase2-production-validation.cjs`

---

## 命名（重要）

**Phase ② 总称：** **Staging / Sepolia Production Validation**

**不是**「Web3 Production Validation」。Web3 只是 Phase ② 的一个子轨 **②-D**。

Phase ② 覆盖：

- 网站页面功能 · UI/UX
- Admin 后台 · 运营流程
- Market / Guide / Provider / Acquisition
- CMS / COS / 数据治理
- 多身份真人 UAT
- Web3 链上验证
- Security / RBAC / Monitoring

---

## 子轨结构

```text
Phase ② · Staging / Sepolia Production Validation
├── ②-A  Website & Product UAT
├── ②-B  Admin / Operations UAT
├── ②-C  Data Governance / CMS / COS Validation
├── ②-D  Web3 Lifecycle Validation          ← Web3 仅此子轨
├── ②-E  Security / RBAC / Monitoring
└── ②-F  Exit Review
```

---

## Phase ② 纪律

| 允许 | 禁止 |
|------|------|
| 验证 · UAT | **新增功能** |
| 修 Bug | 主网广播 |
| 补 Evidence / Security / Protocol | param swap 上主网 |

---

## ②-A · Website & Product UAT

- 网站页面 · UI/UX · Market/Guide/Provider/Acquisition
- 多身份真人 UAT（Traveler · Guide · Merchant · Steward · Moderator · Admin）
- SSOT: `registry/phase2-testnet-surface-coverage-registry.v1.yaml`

## ②-B · Admin / Operations UAT

- Admin 六控制台 · moderation · provider 审批 · official ops · observability

## ②-C · Data Governance / CMS / COS

- CMS 内容队列 · COS catalog · 数据治理 · country/market 内容

## ②-D · Web3 Lifecycle Validation

- **仅此子轨**为 Web3 链上全生命周期验证
- Runbook: [SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md](SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md)
- Orchestrator: `node scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs`

## ②-E · Security / RBAC / Monitoring

- Protocol-Grade · RBAC D3 · indexer/monitoring · security audit

## ②-F · Exit Review

- 汇总 ②-A～②-E 全部 PASS 后收口
- Runbook: [PHASE2-EXIT-REVIEW-V1.md](PHASE2-EXIT-REVIEW-V1.md)

---

## 完整流程位置

```text
Phase ① Development
        ↓
Phase ② Staging / Sepolia Production Validation (②-A … ②-F)
        ↓
Web3 Freeze → Mainnet Deployment Package
        ↓
Phase ③ Production Deployment (Mainnet)
        ↓
Mainnet Validation
```

---

## 执行

```bash
node scripts/dev/run-phase-dashboard.cjs          # 项目总驾驶舱
node scripts/dev/run-phase2-production-validation.cjs
node scripts/dev/run-phase2-exit-review.cjs
```

Evidence: `evidence/GO_production_readiness/phase2-production-validation/`

---

## 相关

- [PHASE-DASHBOARD-V1.md](PHASE-DASHBOARD-V1.md)
- [WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md](WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md)
- [SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md](SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md)
- [PHASE2-EXIT-REVIEW-V1.md](PHASE2-EXIT-REVIEW-V1.md)
