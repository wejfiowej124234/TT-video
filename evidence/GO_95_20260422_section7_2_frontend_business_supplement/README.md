# GO_95 · §7.2 前端业务与展示 · 机读复验（补充登记 · v1.4.164）

**Scope:** **§7.2**（点赞/收藏、市场星标 API 客户端、Feed envelope & mappers、`useCommunityFeed`）有界 **Vitest** 子集 + **i18n CI** + 仓库根 **04/13-1** 路由门禁链。  
**Date:** 2026-04-22  
**Repo:** `d:\Wbe3-TravelTrust`

## 1. 命令与真值输出

```bash
cd "d:/Wbe3-TravelTrust"
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
cd frontend
npm run test:i18n:ci
npx vitest run \
  lib/communityFeedPageEnvelope.test.ts \
  components/community/communityFeedMappers.test.ts \
  components/community/useCommunityFeed.test.ts \
  lib/apiClient/marketTravelBookmarks.test.ts \
  --reporter=dot
```

**摘录**

| 步骤 | 结果 |
|------|------|
| `check-07-version-triple.sh` | **OK**（07 **1.0.858**） |
| `run-check-04-routes.sh` | **exit 0**（含 **178** 条 `api.ts`↔04 等） |
| `npm run test:i18n:ci` | **`[i18n-gate] passed.`** |
| `npx vitest run`（上列 **4** 文件） | **4 files · 35 tests passed**（**Vitest v2.1.9**） |

**`frontend/.i18n-coverage.json`** 根级 **`"passed": true`**（与 **§7.2 i18n/a11y** 既有叙述一致）。

## 2. 诚实边界（非闭证）

- **不**替代 **§7.2** 六条逐条 README（**`evidence/GO_95_20260421_section7_2_*`**）中的全文件走读与 **93 D**/**§8.2** **行完成**。
- **不**将本包 **35** 条 Vitest 当作 **全站 Vitest**/**`test:a11y:ci`** 已闭。
- **不**含 **`create_post_commerce`** / **`commerce_showcase`** 专测文件本轮执行（**F-031** 仍以 **`…section7_2_commerce_showcase_f031/`** + **`cargo test`** 旁证为主）。

## 3. 互指

- **95 · §7.2** 六条 **`[x]`** 主证据仍为 **2026-04-21** 域包。
- **95 · §12.4** 登记本路径。
