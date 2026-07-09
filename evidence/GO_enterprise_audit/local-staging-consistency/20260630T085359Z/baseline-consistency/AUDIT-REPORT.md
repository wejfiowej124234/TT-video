# Phase ② · 测试网全量一致性审计（只读）

**SSOT SHA:** `f29b2772ed39afd57ff604704c1c8329358d08d0`
**审计时间:** 20260630T085359Z UTC
**staging API:** https://tt-api-staging.fly.dev · **Web:** https://tt-web-staging.fly.dev

## 总览

| 项 | 值 |
|----|-----|
| git HEAD | `82aba4aa8e710c01b50fd680c22c5352fc4dee78` |
| API git_sha (probe=meta) | `f29b2772ed39afd57ff604704c1c8329358d08d0` |
| Web /meta SHA | `f29b2772ed39afd57ff604704c1c8329358d08d0` |
| **SHA Hard Match** | **NO** |
| 差异项 | 1 |
| 风险项 | 19 |

**诚实边界：** 本审计 **≠** Wave 1 / Soak / 真人验收 **≠** ③ Production GO

## 差异项（DIFF / WARN）

| 域 | 项 | 本地 SSOT | 测试网/远程 | 严重度 | 备注 |
|----|-----|-----------|-------------|--------|------|
| SHA | git HEAD vs --expect-sha | `82aba4aa8e710c01b50fd680c22c5352fc4dee78` | `f29b2772ed39afd57ff604704c1c8329358d08d0` | DIFF |  |

## 风险项（RISK · 不阻断已部署 SHA）

- **SHA/工作区 · deploy-path 未提交改动** — staging 镜像已部署 committed tree；工作区漂移不影响已部署 SHA，但下次 deploy 会带入
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 {'status': 'ok', 'message': 'seed_done'}
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 token=yes
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 token=yes
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — []
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 token=yes
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 token=yes
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200 token=yes
- **DeepGate/G03_FIVE_ROLE_LOGIN · ?** — HTTP 200
- **DeepGate/G06_SEED_CONSISTENCY · ?** — None
- **DeepGate/G06_SEED_CONSISTENCY · ?** — {"traveler": "2760d445-cbf4-47d0-9461-fcba3db0516f", "guide": "4b389c45-bfca-4f3a-a897-42cf95c91a6e"}
- **DeepGate/G06_SEED_CONSISTENCY · ?** — HTTP 200 keys=['status', 'user', 'guide', 'trust', 'stats', 'identity_slots']
- **Phase② 剩余闸 · TN-P1-009** — P2FC 72h soak 未 COMPLETED
- **Phase② 剩余闸 · TN-P1-010** — Indexer deep reconcile OPEN
- **Phase② 剩余闸 · CERT-7..9** — Timelock/钱包闸 · Wave 1 未执行
- **Phase② 剩余闸 · TESTNET_STAGING_FREEZE** — 已 LIFTED · SHA sync 后 staging 可再 deploy
- **Phase② 剩余闸 · 1057+ untracked docs** — 未纳入 SSOT commit · 不影响 staging 运行 SHA

## Deep Release Gate 摘要

- release_gate: `GO`
- G01_API_WEB_SHA: **PASS**
- G02_META_CONTRACT: **PASS**
- G03_FIVE_ROLE_LOGIN: **WARN**
- G04_ADMIN_RBAC: **PASS**
- G05_DB_MIGRATE_ZERO: **PASS**
- G06_SEED_CONSISTENCY: **WARN**
- G07_STAGING_ENV: **PASS**
- G08_HAT_PREREQ: **PASS**

机读：`evidence\GO_enterprise_audit\local-staging-consistency\20260630T085359Z\baseline-consistency/audit.json`
