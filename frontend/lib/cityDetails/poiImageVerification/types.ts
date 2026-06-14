/** POI 配图人工验收状态 */
export type PoiImageVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PoiImageKind = "attraction" | "food";

export interface PoiImageCandidate {
  /** 候选编号，如 `cand-01` */
  id: string;
  /** 可直接预览的 CDN / 本地路径 */
  previewUrl: string;
  /** 来源页（Unsplash / Wikimedia / 本地证据） */
  sourcePageUrl: string;
  sceneDescription: string;
  license: string;
  status: PoiImageVerificationStatus;
  /** AI 或验收人备注 */
  notes?: string;
}

export interface PoiImageWhitelistEntry {
  imageUrl: string;
  sceneDescription: string;
  approvedAt: string;
  approvedCandidateId: string;
  sourcePageUrl: string;
  license: string;
}

export interface PoiImageVerificationEntry {
  poiId: string;
  country: string;
  city: string;
  kind: PoiImageKind;
  label: string;
  value: string;
  /** 当前线上语义池解析结果（对照用，禁止在本 Sprint 直接改池） */
  productionImageUrl: string;
  batchId: string;
  batchStatus: PoiImageVerificationStatus;
  candidates: PoiImageCandidate[];
  selectedCandidateId?: string;
}

export interface PoiImageVerificationBatchMeta {
  batchId: string;
  country: string;
  city: string;
  kind: PoiImageKind;
  status: PoiImageVerificationStatus;
  startedAt: string;
  notes?: string;
}
