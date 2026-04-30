/**
 * 与 `crates/api/src/routes/community/common.rs` 的 `LIST_LIMIT` 一致：
 * `GET /api/v1/community/me/likes`、`GET …/me/collects` 单次最多返回的关联行数。
 * 前端「可能还有更多」类提示应以 **接口返回的 id 条数** 是否触顶为准，而非 hydrate 后的帖子数。
 */
export const COMMUNITY_ME_DRAWER_LIST_ID_CAP = 100;
