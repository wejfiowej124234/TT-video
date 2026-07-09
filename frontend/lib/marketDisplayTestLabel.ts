import { isMarketDevVarietyOrderId } from "@/lib/marketDevVarietyOrders";
import { isMarketGuideMockShowcaseId } from "@/lib/marketMockData/guides";

export function isMarketDisplayTestDataOrigin(dataOrigin?: string | null): boolean {
  return (dataOrigin ?? "").trim().toLowerCase() === "test";
}

/** 旅行订单栏空列表示例（`tt-showcase-jp-*` 等；不含 `tt-showcase-guide-*`） */
export function isMarketTravelShowcaseOrderId(id: string): boolean {
  const s = String(id ?? "").trim();
  return /^tt-showcase-/.test(s) && !/^tt-showcase-guide-/.test(s);
}

export function shouldShowMarketGuideDisplayTestLabel(guide: {
  id: string;
  data_origin?: string | null;
}): boolean {
  return isMarketDisplayTestDataOrigin(guide.data_origin) || isMarketGuideMockShowcaseId(guide.id);
}

export function shouldShowMarketOrderDisplayTestLabel(item: {
  id: string;
  data_origin?: string | null;
}): boolean {
  return (
    isMarketDisplayTestDataOrigin(item.data_origin) ||
    isMarketDevVarietyOrderId(item.id) ||
    isMarketTravelShowcaseOrderId(item.id)
  );
}
