import type { PoiImageVerificationBatchMeta } from "./types";

/** 逐批验收进度（国家 → 城市 → 类型） */
export const POI_IMAGE_VERIFICATION_BATCHES: PoiImageVerificationBatchMeta[] = [
  {
    batchId: "CN-北京-attraction-01",
    country: "中国",
    city: "北京",
    kind: "attraction",
    status: "PENDING",
    startedAt: "2026-06-07",
    notes: "首批 P0：创建行程预览卡错图反馈的 6 个景区",
  },
];
