# `/did-rank` DID 排行榜 · 代码 SSOT

**① 本地 · Phase ① 收口冻结（2026-06-03）** — UI 壳 + 榜单数据链 L5 子集已闭；榜链上真值 → **②** 测试网 / **③** 主网。

**冻结 SSOT：** [`DID-RANK-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md) · **五主 UI 壳：** [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

| 层级 | 文件 |
|------|------|
| 路由 | `app/did-rank/page.tsx`（SSR · `?period=` · `?guide_sort=`）· `DidRankPageClient.tsx` · `layout.tsx` |
| SSR 鉴权 | `lib/serverForwardAuthHeaders.ts` — `traveltrust_user_id` cookie → **`X-User-Id`** · `lib/did-rank/didRankPageInitialData.server.ts` |
| 页身叠层 | 暖场 + `bg-web3-podium-spotlight` 等（**88 §1.1** 透明度表） |
| 主 UI | `components/did-rank/*`（竖脊 **五签** · `?board=` · 游客/向导/行程/商家/收购） |
| 类型 SSOT | `lib/didRankTypes.ts`；**`didRankDevPreviewGate.ts`** 为 **① 门闸预览**（**非** `didRankMockData` 运行时回退） |
| API | **`GET /api/v1/did-rank/{travelers,guides,itineraries,providers,acquisitions}`** + **`prize-pool`**（`lib/apiClient/didRank*.ts` · `crates/api/src/routes/did_rank.rs`） |
| 行程榜 | **`?board=itinerary`** · `DidRankItineraryRankBlock` · Top10（**无** 11～100 · **30 §0.1**） |
| **`is_me`** | API 榜行字段 + SSR 首屏（cookie 转发）+ 客户端刷新 · URL **`?me=traveler-|guide-|itinerary-|provider-|acquisition-`** |
| 档案链 | 行点击 → **`/community/user/[id]`**（**非** `/guides/{uuid}`；**`isDidRankDevPreviewId`** 拦截 devPreview UUID） |

**L5 审计任务清单（②③ backlog）：** [`DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md`](../../evidence/GO_local_marketing_front_closure/DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) · [30-DID排行榜](../../../docs/spec/30-DID排行榜-页面规范.md) · [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

---

## devPreview 门闸（①）

| 环境 | 行为 |
|------|------|
| **`NODE_ENV=production`** | **硬关**（忽略 env） |
| **开发** | 仅 **`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`**（或 true/on/yes）开启 |
| **预览 UUID** | **不**链 `/community/user/*`（`isDidRankDevPreviewId`） |

真源：`lib/didRankDevPreviewGate.ts` · 测试：`lib/didRankDevPreviewGate.test.ts`

---

## ① 验收

```bash
bash scripts/dev/run-did-rank-l5-green.sh
```

**②③：** 见 [`DID-RANK-PHASE1-FREEZE.md`](../../evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md) **§② / §③**。
