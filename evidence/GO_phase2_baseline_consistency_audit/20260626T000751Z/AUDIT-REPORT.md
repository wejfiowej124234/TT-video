# Phase ② · 测试网全量一致性审计（只读）

**SSOT SHA:** `3bbedda776b2cf2666efaac055ce9e13d98127b7`
**审计时间:** 20260626T000751Z UTC
**staging API:** https://tt-api-staging.fly.dev · **Web:** https://tt-web-staging.fly.dev

## 总览

| 项 | 值 |
|----|-----|
| git HEAD | `3bbedda776b2cf2666efaac055ce9e13d98127b7` |
| API git_sha (probe=meta) | `3bbedda776b2cf2666efaac055ce9e13d98127b7` |
| Web /meta SHA | `3bbedda776b2cf2666efaac055ce9e13d98127b7` |
| **SHA Hard Match** | **YES** |
| 差异项 | 13 |
| 风险项 | 17 |

**诚实边界：** 本审计 **≠** Wave 1 / Soak / 真人验收 **≠** ③ Production GO

## 差异项（DIFF / WARN）

| 域 | 项 | 本地 SSOT | 测试网/远程 | 严重度 | 备注 |
|----|-----|-----------|-------------|--------|------|
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 408 {}` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200 token=yes` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200 token=yes` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `[]` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200 token=yes` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200 token=yes` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200 token=yes` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 200` | DIFF |  |
| DeepGate/G08_HAT_PREREQ | ? | `PASS expected` | `api=https://tt-api-staging.fly.dev web=https://t` | DIFF |  |
| DeepGate/G08_HAT_PREREQ | ? | `PASS expected` | `upstream_fail=True` | DIFF |  |
| DeepGate/G08_HAT_PREREQ | ? | `PASS expected` | `S6,HAT,PHASE3` | DIFF |  |

## 风险项（RISK · 不阻断已部署 SHA）

- **SHA/工作区 · deploy-path 未提交改动** — staging 镜像已部署 committed tree；工作区漂移不影响已部署 SHA，但下次 deploy 会带入
- **DeepGate/G01_API_WEB_SHA · ?** — HTTP 408 · deferred (meta observability-only; post-soak deploy required)
- **DeepGate/G01_API_WEB_SHA · ?** — HTTP 503 · deferred (meta observability-only; post-soak deploy required)
- **DeepGate/G01_API_WEB_SHA · ?** — 520abf396cce7baf3dcf39f71c1e77769e0086d8
- **DeepGate/G01_API_WEB_SHA · ?** — api=520abf396cce7baf3dcf39f71c1e77769e0086d8 web=(unreachable) · deferred (meta observability-only; post-soak deploy required)
- **DeepGate/G01_API_WEB_SHA · ?** — /meta/build HTTP 200 sha=520abf396cce7baf3dcf39f71c1e77769e0086d8
- **DeepGate/G01_API_WEB_SHA · ?** — api=520abf396cce7baf3dcf39f71c1e77769e0086d8 expect=520abf396cce7baf3dcf39f71c1e77769e0086d8
- **DeepGate/G02_META_CONTRACT · ?** — HTTP 408 · deferred (meta observability-only; post-soak deploy required)
- **DeepGate/G02_META_CONTRACT · ?** — /meta/build HTTP 200
- **DeepGate/G06_SEED_CONSISTENCY · ?** — None
- **DeepGate/G06_SEED_CONSISTENCY · ?** — {"traveler": "2760d445-cbf4-47d0-9461-fcba3db0516f", "guide": "4b389c45-bfca-4f3a-a897-42cf95c91a6e"}
- **DeepGate/G06_SEED_CONSISTENCY · ?** — HTTP 200 keys=['status', 'user', 'guide', 'trust', 'stats', 'identity_slots']
- **Phase② 剩余闸 · TN-P1-009** — P2FC 72h soak 未 COMPLETED
- **Phase② 剩余闸 · TN-P1-010** — Indexer deep reconcile OPEN
- **Phase② 剩余闸 · CERT-7..9** — Timelock/钱包闸 · Wave 1 未执行
- **Phase② 剩余闸 · TESTNET_STAGING_FREEZE** — 已 LIFTED · SHA sync 后 staging 可再 deploy
- **Phase② 剩余闸 · 1057+ untracked docs** — 未纳入 SSOT commit · 不影响 staging 运行 SHA

## Deep Release Gate 摘要

- release_gate: `NO_GO`
- G01_API_WEB_SHA: **WARN**
- G02_META_CONTRACT: **WARN**
- G03_FIVE_ROLE_LOGIN: **FAIL**
- G04_ADMIN_RBAC: **PASS**
- G05_DB_MIGRATE_ZERO: **PASS**
- G06_SEED_CONSISTENCY: **WARN**
- G07_STAGING_ENV: **PASS**
- G08_HAT_PREREQ: **FAIL**

机读：`D:\TravelTrust-V1.1\evidence\GO_phase2_baseline_consistency_audit\20260626T000751Z/audit.json`
