/**
 * P29 自由市场：模拟订单与向导数据，用于无后端/空数据时展示真实效果
 *
 * 实现按场景分文件（`helpers` / `mockOrders` / `showcaseOrders` / `guides` / `showcaseGuides`）；对外仍从 `@/lib/marketMockData` 导入。
 */

export { MOCK_ORDERS } from "./mockOrders";
export { MARKET_TRAVEL_SHOWCASE_ORDERS } from "./showcaseOrders";
export { MOCK_GUIDES, isMarketGuideMockShowcaseId } from "./guides";
export { MARKET_GUIDE_SHOWCASE } from "./showcaseGuides";
