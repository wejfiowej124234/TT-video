/**
 * 94 市场子站 + 31 社区发布：可选 E2E 切片（与 **TT-LOCAL-CI-DELIVERY-GATE-001 §2.1**、**`npm run e2e:market-community`** 同源）。
 * **Playwright `request`**：**`GET …/market/{provider,acquisition}/listings/:id`** 与社区详情 **`GET`** 同源 **`requestGetExpectOkWith429Backoff`**（**①②③** 限流契约一致）。
 * 须 **API + `DATABASE_URL` 全栈**（**`npm run e2e:market-community`** / **`run-e2e-default.mjs`** / **`local-delivery-expanded.sh`** 同源 **`PLAYWRIGHT_FULL_STACK=1`**）。
 * 视频闭环用 **`e2e/fixtures/minimal-1s-h264.mp4`**（约 1s、低于 API 默认解码上限；重生成见 **TT-LOCAL §2.1.1** **31** 行）。
 *
 * **实现拆片**：**`market-subsite-shared.ts`**（夹具）+ **`market-subsite-studios.body.ts`** + **`market-subsite-community-gates.body.ts`** + **`market-subsite-community-media.body.ts`**（媒体用例含与 **`post_min_interval_sec`** 相关的**文件内顺序**，勿单独重排）。
 */
import "./market-subsite-studios.body";
import "./market-subsite-community-gates.body";
import "./market-subsite-community-media.body";
