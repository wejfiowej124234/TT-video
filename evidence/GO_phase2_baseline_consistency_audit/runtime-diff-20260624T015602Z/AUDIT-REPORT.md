# Phase ② · 测试网全量一致性审计（只读）

**SSOT SHA:** `520abf396cce7baf3dcf39f71c1e77769e0086d8`
**审计时间:** 20260624T015602Z UTC
**staging API:** https://tt-api-staging.fly.dev · **Web:** https://tt-web-staging.fly.dev

## 总览

| 项 | 值 |
|----|-----|
| git HEAD | `520abf396cce7baf3dcf39f71c1e77769e0086d8` |
| API /meta SHA | `` |
| Web /meta SHA | `n/a` |
| **SHA Hard Match** | **NO** |
| 差异项 | 22 |
| 风险项 | 10 |

**诚实边界：** 本审计 **≠** Wave 1 / Soak / 真人验收 **≠** ③ Production GO

## 差异项（DIFF / WARN）

| 域 | 项 | 本地 SSOT | 测试网/远程 | 严重度 | 备注 |
|----|-----|-----------|-------------|--------|------|
| SHA | API /meta.build.git_sha | `520abf396cce7baf3dcf39f71c1e77769e0086d8` | `` | DIFF |  |
| 六角色/业务链 | login guide | `seed account expected` | `<urlopen error [SSL: UNEXPECTED_EOF_WHILE_READIN` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `HTTP 408` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `HTTP 503` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `(missing)` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `api= web=` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `/meta/build HTTP 200 sha=520abf396cce7baf3dcf39f` | DIFF |  |
| DeepGate/G01_API_WEB_SHA | ? | `PASS expected` | `api= expect=520abf396cce7baf3dcf39f71c1e77769e00` | DIFF |  |
| DeepGate/G02_META_CONTRACT | ? | `PASS expected` | `HTTP 408` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 408 {}` | DIFF |  |
| DeepGate/G03_FIVE_ROLE_LOGIN | ? | `PASS expected` | `HTTP 408` | DIFF |  |
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
- **Indexer · meta.indexer.checkpoint** — TN-P1-010 deep reconcile 仍 OPEN
- **DeepGate/G06_SEED_CONSISTENCY · ?** — None
- **DeepGate/G06_SEED_CONSISTENCY · ?** — {"traveler": "2760d445-cbf4-47d0-9461-fcba3db0516f", "guide": "4b389c45-bfca-4f3a-a897-42cf95c91a6e"}
- **DeepGate/G06_SEED_CONSISTENCY · ?** — HTTP 200 keys=['status', 'user', 'guide', 'trust', 'stats', 'identity_slots']
- **Phase② 剩余闸 · TN-P1-009** — P2FC 72h soak 未 COMPLETED
- **Phase② 剩余闸 · TN-P1-010** — Indexer deep reconcile OPEN
- **Phase② 剩余闸 · CERT-7..9** — Timelock/钱包闸 · Wave 1 未执行
- **Phase② 剩余闸 · TESTNET_STAGING_FREEZE** — ACTIVE · baseline frozen · TL#1 Wave 1 wait
- **Phase② 剩余闸 · 1057+ untracked docs** — 未纳入 SSOT commit · 不影响 staging 运行 SHA

## Deep Release Gate 摘要

- release_gate: `NO_GO`
- G01_API_WEB_SHA: **FAIL**
- G02_META_CONTRACT: **FAIL**
- G03_FIVE_ROLE_LOGIN: **FAIL**
- G04_ADMIN_RBAC: **PASS**
- G05_DB_MIGRATE_ZERO: **PASS**
- G06_SEED_CONSISTENCY: **WARN**
- G07_STAGING_ENV: **PASS**
- G08_HAT_PREREQ: **FAIL**

机读：`evidence\GO_phase2_baseline_consistency_audit\runtime-diff-20260624T015602Z/audit.json`
