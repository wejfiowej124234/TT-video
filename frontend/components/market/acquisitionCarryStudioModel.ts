import type { AcquisitionCategorySlug } from "@/lib/marketSubsiteDemo";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { ACQUISITION_CATEGORY_SLUGS } from "@/lib/marketSubsiteFilters";

export const ACQ_CAT_LABEL: Record<AcquisitionCategorySlug, string> = {
  luxury: "market_subsite_a_cat_luxury",
  sneakers: "market_subsite_a_cat_sneakers",
  electronics: "market_subsite_a_cat_electronics",
  health: "market_subsite_a_cat_health",
  accessories: "market_subsite_a_cat_accessories",
};

export type AcquisitionStudioDraft = {
  title: string;
  summary: string;
  /** 货源 / 启运侧：门店、仓库、城市或国家等，与品类无关的通用描述 */
  supplyOrigin: string;
  /** 买方收货与交割期望：面交城市、可邮寄范围、时效等 */
  receiptHandoff: string;
  category: AcquisitionCategorySlug;
  destinationCountryIso: string;
  bountyMinUsdc: string;
  bountyMaxUsdc: string;
  deadlineNote: string;
  coverPreviewUrl: string | null;
  coverFileName: string | null;
  videoPreviewUrl: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  inspectionStandard: string;
  authenticity: string;
  condition: string;
  rejections: string;
  handoff: string;
  agreeEscrowCopy: boolean;
};

export function emptyAcquisitionStudioDraft(): AcquisitionStudioDraft {
  return {
    title: "",
    summary: "",
    supplyOrigin: "",
    receiptHandoff: "",
    category: "luxury",
    destinationCountryIso: "",
    bountyMinUsdc: "",
    bountyMaxUsdc: "",
    deadlineNote: "",
    coverPreviewUrl: null,
    coverFileName: null,
    videoPreviewUrl: null,
    videoFileName: null,
    videoUrl: "",
    highlightsText: "",
    description: "",
    inspectionStandard: "",
    authenticity: "",
    condition: "",
    rejections: "",
    handoff: "",
    agreeEscrowCopy: false,
  };
}

export type AcquisitionStudioDraftSavedMeta = {
  communityPostId?: string;
};

export const acquisitionStudioLabelClass = TT_MARKETING_MARKET_DARK_PATH.studioLabel;
export const acquisitionStudioInputClass = `${TT_MARKETING_MARKET_DARK_PATH.studioInput} px-4 py-2.5`;
export const acquisitionStudioDescClass = `${TT_MARKETING_MARKET_DARK_PATH.studioDesc} mt-3`;

export function acquisitionCategoryOptions() {
  return ACQUISITION_CATEGORY_SLUGS.map((slug) => ({ value: slug, labelKey: ACQ_CAT_LABEL[slug] }));
}
