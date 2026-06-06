/**
 * 向导 API：列表、详情、档期、注册、上传、质押（**`crates/api/src/routes/guides.rs`**）。
 *
 * **chain_off 分岔（与测试网/公网同一进程配置同源）**：**`GET /api/v1/guides`** 在 **无 chain_off** 时仍 **200** **`status:ok`**、**`items:[]`**（空目录，非 503）；**`GET /api/v1/guides/:id`**、**`POST /api/v1/guides`**、**`POST …/stake`** 在 **无 chain_off** 时 **503** 根级 **`error`/`message`=`chain_off_unavailable`**（**`routes/mod.rs`** **`chain_off_unavailable_json`**）。**`GET …/availability`** 无 chain_off 时 **200** 空 **`occupied_ranges`**（**04** §3.4 详表）。
 */

export { getGuides, getGuide, getGuideAvailability } from "./readHttp";
export { postGuideUploadDoc, postGuide, postGuideStake } from "./writeHttp";
