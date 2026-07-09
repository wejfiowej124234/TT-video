# Phase ② · 测试网全量一致性审计（只读）

**SSOT SHA:** `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6`
**审计时间:** 20260630T100536Z UTC
**staging API:** https://tt-api-staging.fly.dev · **Web:** https://tt-web-staging.fly.dev

## 总览

| 项 | 值 |
|----|-----|
| git HEAD | `422aadb9f7685c125b4f9ada83bfbb3396d881a8` |
| API git_sha (probe=meta) | `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6` |
| Web /meta SHA | `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6` |
| **SHA Hard Match** | **NO** |
| 差异项 | 1 |
| 风险项 | 6 |

**诚实边界：** 本审计 **≠** Wave 1 / Soak / 真人验收 **≠** ③ Production GO

## 差异项（DIFF / WARN）

| 域 | 项 | 本地 SSOT | 测试网/远程 | 严重度 | 备注 |
|----|-----|-----------|-------------|--------|------|
| SHA | git HEAD vs --expect-sha | `422aadb9f7685c125b4f9ada83bfbb3396d881a8` | `d5aa447f1c9e2adecbcb4f3c19004eaa8b9348f6` | DIFF |  |

## 风险项（RISK · 不阻断已部署 SHA）

- **SHA/工作区 · deploy-path 未提交改动** — staging 镜像已部署 committed tree；工作区漂移不影响已部署 SHA，但下次 deploy 会带入
- **Phase② 剩余闸 · TN-P1-009** — P2FC 72h soak 未 COMPLETED
- **Phase② 剩余闸 · TN-P1-010** — Indexer deep reconcile OPEN
- **Phase② 剩余闸 · CERT-7..9** — Timelock/钱包闸 · Wave 1 未执行
- **Phase② 剩余闸 · TESTNET_STAGING_FREEZE** — 已 LIFTED · SHA sync 后 staging 可再 deploy
- **Phase② 剩余闸 · 1057+ untracked docs** — 未纳入 SSOT commit · 不影响 staging 运行 SHA

## Deep Release Gate 摘要

- release_gate: `GO`
- G01_API_WEB_SHA: **PASS**
- G02_META_CONTRACT: **PASS**
- G03_FIVE_ROLE_LOGIN: **PASS**
- G04_ADMIN_RBAC: **PASS**
- G05_DB_MIGRATE_ZERO: **PASS**
- G06_SEED_CONSISTENCY: **PASS**
- G07_STAGING_ENV: **PASS**
- G08_HAT_PREREQ: **PASS**

机读：`evidence\GO_enterprise_audit\local-staging-consistency\20260630T100536Z/audit.json`
