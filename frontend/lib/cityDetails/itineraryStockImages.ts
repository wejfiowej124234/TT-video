/**
 * 行程弹窗配图 SSOT：仅收录 HTTP 200 且语义匹配的 Unsplash 图。
 * 禁止复用 photo-1548013146（实为泰姬陵，非中国古建）。
 */
const Q = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

export const ITINERARY_STOCK = {
  // 北京景区
  beijingForbiddenCity: Q("1656171600501-456e5fd9614f"),
  beijingForbiddenCityAlt: Q("1551101509-f6f2cbae3604"),
  beijingGreatWall: Q("1559827260-dc66d52bef19"),
  beijingTempleOfHeaven: Q("1474181487882-5abf3f0ba6c2"),
  beijingSummerPalace: Q("1506905925346-21bda4d32df4"),
  beijingOldSummerPalace: Q("1578662996442-48f60103fc96"),
  beijingHutong: Q("1516528387618-afa90b13e000"),
  // 北京美食
  beijingPekingDuck: Q("1765441012353-10fb4701a276"),
  beijingHotPot: Q("1599487488170-d11ec9c172f0"),
  beijingZhajiangmian: Q("1563245372-f21724e3856d"),
  beijingStreetFood: Q("1555939594-58d7cb561ad1"),
  beijingOffalStew: Q("1529692236671-f1f6cf9683ba"),
  // 城市交通
  transportSedan: Q("1503376780353-7e6692767b70"),
  transportSuv: Q("1519641471654-76ce0107ad1b"),
  transportMpv: Q("1617814076367-b759c7d7e738"),
} as const;

/** 曾误用、语义错误的图片 ID（测试门禁） */
export const BANNED_STOCK_IMAGE_FRAGMENTS = [
  "photo-1548013146", // 泰姬陵，非故宫/天坛
  "photo-1533473359331", // 皮卡，非商务 MPV
  "photo-1508807525871", // 404
] as const;

export function stockImageUrl(id: keyof typeof ITINERARY_STOCK): string {
  return ITINERARY_STOCK[id];
}
