/** 与社区 Feed 同源阈值：超过此数量启用窗口虚拟滚动（① · 本地性能旁证） */
export const ORDERS_LIST_VIRTUAL_MIN = 14;

/** 订单卡片预估高度（px），供 `useWindowVirtualizer` 初值；实测后由 `measureElement` 校正 */
export const ORDERS_LIST_VIRTUAL_ESTIMATE_PX = 220;

export const ORDERS_LIST_VIRTUAL_GAP_PX = 16;

export const ORDERS_LIST_VIRTUAL_OVERSCAN = 5;
