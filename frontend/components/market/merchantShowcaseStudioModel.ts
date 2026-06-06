import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

export type MerchantShowcaseCategory = "hotel" | "dining" | "attraction" | "experience";

/** 与链上一致：橱窗商品统一走「订单 + Escrow + 双方确认里程碑」模型 */
export type MerchantDeliveryArchetype = "escrow_order";

export type MerchantStudioDraft = {
  title: string;
  subtitle: string;
  category: MerchantShowcaseCategory;
  city: string;
  countryIso: string;
  coverPreviewUrl: string | null;
  coverFileName: string | null;
  videoPreviewUrl: string | null;
  videoFileName: string | null;
  videoUrl: string;
  highlightsText: string;
  description: string;
  priceUsdc: string;
  /** 固定为链上订单托管路径；保留字段便于后续 API 契约扩展 */
  deliveryArchetype: MerchantDeliveryArchetype;
  agreeEscrowCopy: boolean;
};

export function emptyMerchantStudioDraft(): MerchantStudioDraft {
  return {
    title: "",
    subtitle: "",
    category: "dining",
    city: "",
    countryIso: "",
    coverPreviewUrl: null,
    coverFileName: null,
    videoPreviewUrl: null,
    videoFileName: null,
    videoUrl: "",
    highlightsText: "",
    description: "",
    priceUsdc: "",
    deliveryArchetype: "escrow_order",
    agreeEscrowCopy: false,
  };
}

export type MerchantStudioDraftSavedMeta = {
  /** 已成功同步为社区笔记时带回，供子站列表临时置顶链到 `/community/post/:id` */
  communityPostId?: string;
};

export const merchantStudioLabelClass = TT_MARKETING_MARKET_DARK_PATH.studioLabel;

export const merchantStudioInputClass = `${TT_MARKETING_MARKET_DARK_PATH.studioInput} px-4 py-2.5`;
export const merchantStudioDescClass = `${TT_MARKETING_MARKET_DARK_PATH.studioDesc} mt-3`;

export function merchantShowcaseCategoryOptions() {
  return [
    { value: "hotel" as const, labelKey: "market_subsite_m_cat_hotel" },
    { value: "dining" as const, labelKey: "market_subsite_m_cat_dining" },
    { value: "attraction" as const, labelKey: "market_subsite_m_cat_attraction" },
    { value: "experience" as const, labelKey: "market_subsite_m_cat_experience" },
  ] as const;
}
