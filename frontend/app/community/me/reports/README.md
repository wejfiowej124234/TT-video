# `/community/me/reports` · ① 本地 · 我的举报（独立页 · 160）

**阶段：① 本地** — 社区 **举报工单列表**；**无** Hub 抽屉等价面；详情 **`/community/me/reports/[id]`**。

**L5 冻结 SSOT：** [`evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) · Hub [`../README.md`](../README.md)

---

## 路由与 AuthGate

| 项 | 值 |
|----|-----|
| **列表** | `/community/me/reports` · `data-tt-community-me-reports-page="1"` |
| **详情** | `/community/me/reports/[id]` · `data-tt-community-report-ticket-page` |
| **AuthGate** | `community_me_reports_auth_gate` |
| **login `returnUrl`** | 列表/详情 **保持规范路径** + query（`communityMeLoginReturnUrl`） |

## 与 Posts/Collects/Likes 差异

- **仅独立页** — 不纳入 Hub `?tab=` 抽屉栈
- **QuickLinks** · 顶栏工具区 → `/community/me/reports`

## 代码地图

| 文件 | 职责 |
|------|------|
| `page.tsx` | Suspense + AuthGate 薄页 |
| `useCommunityMeReportsPage.ts` | VM · `useCommunityMeReportsListQuery`（递增 `limit` load-more） |
| `CommunityMeReportsPageMain.tsx` | 列表 · 空态 · `CommunityMeListLoadMoreButton` |
| `reports/[id]/page.tsx` | 工单详情 |

## 已知限制（①）

- API **无 cursor/offset** — 客户端 **递增 `limit`** load-more（步长 **30** · 顶 **100** · `COMMUNITY_ME_REPORTS_LIST_API_MAX`）
- 触顶提示 **`community_me_reports_list_truncated_hint`**

## ① 机读绿集

```bash
cd frontend
npx vitest run app/community/me/reports/communityMeReportsPage.contract.test.ts
npx playwright test e2e/community-me-data-state.spec.ts e2e/community-me-l5-parity-closeout.spec.ts --project=chromium -g "reports"
```
