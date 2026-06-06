/**
 * 行程 API（**`crates/api/src/routes/itineraries.rs`**）。
 *
 * **P15/17**：**`POST /api/v1/itineraries`**。**49 A**：**`POST /api/v1/itineraries/custom`**。**F-033**：**`POST|GET /api/v1/itineraries/custom/drafts*`**（**`itinerary_custom_drafts`** PG；**04** §3.4、**93 D-ITN-003**）。
 *
 * **chain_off（各环境与公网同源）**：**`POST …/itineraries`** 与 **`POST …/itineraries/custom`** 无 **chain_off** → **503** **`chain_off_unavailable`**；须登录 → **401** **`login_required`**。**草稿 `POST|GET`** 同 **503** / **401** / **`database_required`** 分岔（**GET** 另 **400** **`invalid_uuid`**、**404** **`itinerary_custom_draft_not_found`**、读库失败 **503** **`itinerary_custom_draft_db_read_failed`**；**`itinerary_custom_draft_get`**）。
 *
 * **52**：成功体 **`daily_itinerary` / `amount_breakdown`** 与统一表 §3.1/§3.2 一致。
 */

export type {
  CustomItineraryBody,
  ItineraryCreateResponse,
  ItineraryCustomDraftPostResult,
  ItineraryCustomDraftGetResult,
} from "./types";
export { postItineraryCustom, postItineraryCustomDraft, getItineraryCustomDraft } from "./customAndDrafts";
export { postItineraryCreate } from "./createHttp";
