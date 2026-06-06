/** 我的帖子首屏/分页条数（`getMyPosts` cursor 对齐） */
export const COMMUNITY_ME_POSTS_LIST_PAGE_SIZE = 30;

/** 收藏列表 hydrate 分批条数（`GET …/me/collects` 无 cursor，客户端分批拉详情） */
export const COMMUNITY_ME_COLLECTS_HYDRATE_PAGE_SIZE = 24;

/** 赞过列表 hydrate 分批条数（与收藏同源） */
export const COMMUNITY_ME_LIKES_HYDRATE_PAGE_SIZE = 24;

/** 订单 Hub 抽屉首屏/分页条数（`GET /orders` cursor 对齐） */
export const COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE = 30;

/** 举报列表首屏/递增 `limit` 步长（`GET …/me/reports` 无 cursor/offset） */
export const COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE = 30;
