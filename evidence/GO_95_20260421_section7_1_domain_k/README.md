# GO_95 · §7.1 域 K（DID / 排行）审计证据 · 2026-04-21



## 前端路由 ↔ **04 §3.4** / **30** / **04-附录 did-rank**



| 路径 | 实现要点 |

|------|----------|

| **`/did-rank`** | **`frontend/app/did-rank/page.tsx`**：**`getDidRankTravelers(period)`**、**`getDidRankGuides(period, "weighted")`**（**`frontend/lib/apiClient/didRank.ts`** → **`routes.didRankTravelers`** / **`routes.didRankGuides`** = **`GET /api/v1/did-rank/travelers`**、**`GET /api/v1/did-rank/guides`**，`period` **week|month|all**，向导榜 **`sort=weighted`**）；**`?board=`** 与 **`parseDidRankBoardParam`**/**`DID_RANK_BOARD_ORDER`**（**traveler / guide / provider / acquisition**）一致。**`getDidRankItineraries`** 在 **`didRank.ts`** 已导出但**本页不调用**（与 **04** 汇总段、**30 §0.1** 一致）。 |

| **商家 / 收购脊签** | **`ProviderRankBlock`** / **`AcquisitionRankBlock`**：占位 UI + **`/market/provider`**、**`/market/acquisition`** 深链；**未**冒充 **`GET …/did-rank/*`** 已接榜单。 |



## **`api.ts` / `apiClient/didRank.ts`**



- **`routes.didRankTravelers`**、**`didRankGuides`**、**`didRankItineraries`** — **`frontend/lib/api.ts`**。  

- **`didRank.test.ts`**：URL 与 **query**（**`period`**、**`sort=reviews|weighted`**）与 **04**/**附录** 同源。



## **`GET /meta` · `did_rank`**



- **`GET /meta`** 根 **`did_rank`** 与 **`GET …/did-rank/guides`** 剔除/回退叙事对读见 **04** **GET /meta** 行及 **[04-附录 did-rank](04-附录-did-rank对接说明.md) §1**；本域以 **页面 + `didRank.ts`** 为主，**不**替代 **meta** 全扇面审计。



## 命令



```bash

bash scripts/run-check-04-routes.sh

# exit 0

```



## 边界



**不**替代 **§8.2** / **93** DID 域人工回归；**不**将 **provider/acquisition** 占位当作 **`did-rank` API** 已闭证；**信誉加权 Target** 仍以 **04-附录 §3.1** 为路线图叙述。

