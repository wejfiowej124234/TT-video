# GO_95 · §7.1 域 E（行程）审计证据 · 2026-04-21

## **`/itinerary/new` ↔ `POST /api/v1/itineraries`**

| 项 | 说明 |
|----|------|
| **页面** | **`frontend/app/itinerary/new/page.tsx`**：**`postItineraryCreate`**（**`@/lib/apiClient`**）提交生成体；**`getOrder`** 用于 **`fromOrder`** 预填（**53** 与 **04** 叙述一致）。 |
| **客户端契约** | **`frontend/lib/apiClient/itineraries.ts`** **`postItineraryCreate`** → **`fetch(apiUrl(routes.itineraries))`**；**`routes.itineraries`** = **`/api/v1/itineraries`**（**`frontend/lib/api.ts`**，与 **04 §3.4** **`POST /api/v1/itineraries`** 同源）。 |
| **地理与产品期** | 页内 **`geoOptions`**（**`CITIES_BY_COUNTRY`** / **`productCountries`**）与 **04** 表内「**`destination`/`city`/`cities[]`** 须锁死预设」互证。 |
| **单测旁证** | **`frontend/lib/apiClient/itineraries.test.ts`**、**`itineraries.http.test.ts`**（**56-S3** **`cities[]`**、**`guide_id`** 等）；**不**替代 **§8.2** **F-012** 行完成。 |

## **49 A 草稿 API（与本域边界）**

**`POST|GET …/itineraries/custom/drafts`** 由 **`api.ts`** **`routes.itinerariesCustomDrafts`** / **`itineraryCustomDraftById`** 与 **`postItineraryCustomDraft`**、**`getItineraryCustomDraft`**（**`apiClient/itineraries.ts`**）承载；**04** 与 **`routes/itineraries.rs`** 已登记。**`/itinerary/new`** 当前**仅**走 **`postItineraryCreate`**（**P15 主路径**）；自定义草稿/自定义建单 **`postItineraryCustom`** 由 **市场等入口**消费（见 **04** 映射表 **行程创建/自定义行程** 行），本域记为**横切对读**、**不**要求单页内调用全量草稿 API。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（**04** **`/itinerary/new`** ↔ **`frontend/app/itinerary/new`**）
```

## 边界

**不**替代 **§8.2** **F-012～013**/**行完成**；**不**替代 **53** 全文终验或 **93 B** 全量 **PASS**。
