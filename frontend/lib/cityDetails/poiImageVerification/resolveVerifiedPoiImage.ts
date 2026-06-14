import { POI_IMAGE_WHITELIST } from "./poiImageWhitelist";

/** 若 POI 已通过人工验收，返回白名单 URL；否则 undefined（继续走语义池） */
export function resolveWhitelistedPoiImage(poiId: string): string | undefined {
  return POI_IMAGE_WHITELIST[poiId]?.imageUrl;
}

export function isPoiImageWhitelisted(poiId: string): boolean {
  return poiId in POI_IMAGE_WHITELIST;
}
