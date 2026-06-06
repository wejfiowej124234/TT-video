# `/community/me` · Phase ① L5 独立冻结证据（ME-P1-6 · ME-P1-7）



**阶段：① 本地** — Hub + 笔记抽屉 + Posts/Collects/Likes/Reports 独立页；**非** ② 测试网 / ③ 生产 GO。



## SSOT



| 文档 | 用途 |

|------|------|

| **[COMMUNITY-ME-L5-FREEZE.md](./COMMUNITY-ME-L5-FREEZE.md)** | 路由边界 · AuthGate · parity · contract · 绿集 · flags · limits · Go/No-Go |

| **[community-me-l5-local-gate.v1.json](./community-me-l5-local-gate.v1.json)** | 机读闸：路由 → vitest / playwright / green script |

| **[app/community/me/README.md](../../app/community/me/README.md)** | 工程入口 · 命名 P3 |



## 推送前窄绿集（ME-P1-7 · 推荐）



```bash
# 仓库根 · 社区 ME 窄绿集
bash scripts/dev/run-community-me-l5-green.sh
cd frontend && npm run green:community-me-l5

# 全站账户导航 Vitest 并集（Playwright 社区层可 SKIP 重复 i18n/vitest）
bash scripts/dev/smoke-account-nav-full-local.sh
```



**含：** `test:i18n:ci` · Vitest **5 文件 union** · Playwright **暖序**：`l5-a-parity` → `l5-b-load-more` → `l5-c-dedicated` → data-state `-g "访客"`。



**Vitest 仅（无 E2E）：**



```bash

cd frontend

npx vitest run \

  app/community/me/posts/communityMePostsPage.contract.test.ts \

  app/community/me/reports/communityMeReportsPage.contract.test.ts \

  components/me/communityMeProfile.contract.test.ts \

  lib/communityMeContentNav.test.ts \

  app/community/communityRouteDataHooks.contract.test.ts

```



**收口行：** `TT_COMMUNITY_ME_L5_GREEN: OK` · Playwright 经 `run-e2e-default.mjs`（默认 `PLAYWRIGHT_E2E_STABILITY=1`）。



## 最终绿集运行记录（Phase ① · 推送前 · 2026-06-01）



| 项 | 结果 |
|----|------|
| **命令** | `cd frontend && npm run green:community-me-l5` |
| **本地时间** | 2026-06-01 23:56 CST（约 168s 全链） |
| **环境** | `PLAYWRIGHT_FULL_STACK=1` · API `127.0.0.1:8080` + `seed-test-accounts` · Next `localhost:3012` · `PLAYWRIGHT_E2E_STABILITY=1` |
| **i18n** | `test:i18n:ci` passed |
| **Vitest union** | **5/5** files · **60/60** tests passed |
| **Playwright 暖序 batch 1** | `l5-a` → `l5-b` → `l5-c` · **12 passed · 11 skipped**（seed 条件 `test.skip` · 无 failed） |
| **Playwright batch 2** | `community-me-data-state.spec.ts -g "访客"` · **5 passed · 1 skipped** |
| **收口** | **`TT_COMMUNITY_ME_L5_GREEN: OK`** · exit **0** |

**说明：** batch 1 中 `l5-b-load-more-mocked` 使用路由 mock（`media_urls: []` 避免 Next `remotePatterns` 误触 community error boundary）；load-more 完成后按钮自 DOM 移除，断言以网格/菜单计数为准（`l5-b` · `l5-c` 同源）。



## 互指



- [MARKET-L5-CLOSURE](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · [ME-IDENTITIES-UI-FREEZE](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)

- [COMMUNITY-L5-CLOSURE](../GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md)（Feed 壳 + PI-1 头像）

- [GO_local_phase1](../GO_local_phase1/README.md)（Phase ① 总闸）

