import type { PoiImageWhitelistEntry } from "./types";

/**
 * 已人工验收 POI → 固定配图 URL / 本地资源。
 * 仅在此登记后才会覆盖语义池；修改须同步更新 contract test 期望。
 */
export const POI_IMAGE_WHITELIST: Record<string, PoiImageWhitelistEntry> = {
  // 验收通过后按批写入，例如：
  // "中国::北京::attraction::长城": { imageUrl: "...", sceneDescription: "...", ... },
};
