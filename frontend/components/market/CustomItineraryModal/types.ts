import type { RefObject, MutableRefObject, Dispatch, SetStateAction } from "react";

/** 段间交通方式：飞机 / 高铁（跨城仅保留飞机、高铁） */
export type TransportType = "vehicle" | "rail" | "flight";

/** 城市交通：轿车 / SUV / 商务 */
export type CityTransportType = "sedan" | "suv" | "van";

/** 向导等级 */
export type GuideLevel = "primary" | "intermediate" | "advanced" | "expert";

export type CreatorType = "tourist" | "guide";

export interface DayPlan {
  city: string;
  attractions: string[];
  food: string[];
  hotel: string;
  cityTransport?: CityTransportType;
  transport?: TransportType;
}

/**
 * 向导创作：每日与游客一致；景区/美食为向导上传，城市交通/酒店由平台预设。
 * @deprecated 字段仅为兼容历史/持久化数据保留，新逻辑不再使用。
 */
export interface GuideDayPlan {
  city: string;
  attractionImage: string;
  attractions: string;
  foodImage: string;
  food: string;
  transport?: TransportType;
  cityTransport?: CityTransportType;
  /** @deprecated 已改为平台三选一，保留兼容 */
  vehicleImage: string;
  vehicleDescription: string;
  hotel: string;
  /** @deprecated 已改为平台酒店列表，保留兼容 */
  hotelImage: string;
  hotelDescription: string;
  /** @deprecated 当日照片已移除，保留字段兼容 */
  image: string;
}

/**
 * 自定义行程表单状态（游客/向导创建行程弹窗）。
 * 与 useItineraryForm、useQuoteCalculation 配合；金额与费用为字符串便于输入与展示。
 */
export interface CustomItineraryForm {
  creatorType: CreatorType;
  totalDays: number;
  country: string;
  dayPlans: DayPlan[];
  guideDayPlans: GuideDayPlan[];
  destinationManual: string;
  title: string;
  amount: string;
  description: string;
  image: string;
  headcount: number;
  needGuide: GuideLevel;
  guideFee: string;
  transportFee: string;
  guideAttractionFee: string;
  guideFoodFee: string;
  guideInterCityFee: string;
}

export function defaultDayPlan(): DayPlan {
  return { city: "", attractions: [], food: [], hotel: "", cityTransport: undefined, transport: undefined };
}

export function defaultGuideDayPlan(): GuideDayPlan {
  return {
    city: "",
    attractionImage: "",
    attractions: "",
    foodImage: "",
    food: "",
    transport: undefined,
    cityTransport: undefined,
    vehicleImage: "",
    vehicleDescription: "",
    hotel: "",
    hotelImage: "",
    hotelDescription: "",
    image: "",
  };
}

/** 初级向导建议日费（USDC），与 constants 中 GUIDE_LEVELS.primary 一致 */
const PRIMARY_GUIDE_SUGGESTED_PER_DAY = 150;

export function defaultForm(totalDays: number = 5): CustomItineraryForm {
  return {
    creatorType: "tourist",
    totalDays,
    country: "",
    dayPlans: Array.from({ length: totalDays }, defaultDayPlan),
    guideDayPlans: Array.from({ length: totalDays }, defaultGuideDayPlan),
    destinationManual: "",
    title: "",
    amount: "",
    description: "",
    image: "",
    headcount: 1,
    needGuide: "primary",
    guideFee: String(PRIMARY_GUIDE_SUGGESTED_PER_DAY * totalDays),
    transportFee: "",
    guideAttractionFee: "",
    guideFoodFee: "",
    guideInterCityFee: "",
  };
}

/** 游客表单区块：样式与引用，由 index 传入 */
export interface FormSectionStyles {
  labelClass: string;
  inputClass: string;
  descClass: string;
  pillSelected: string;
  pillUnselected: string;
}

/** 向导等级选项（含按国家单价），由 index 根据 form.country 计算传入 */
export type GuideLevelOptionWithPricing = { value: GuideLevel; labelKey: string; suggestedPerDay: number };

/**
 * 游客表单区块 props（由 index 组合 useItineraryForm + useQuoteCalculation 传入）。
 * 含表单状态、预算拆解、交通明细、样式类名与 i18n 的 t。
 */
export interface TouristFormProps extends FormSectionStyles {
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  setDayPlan: (dayIndex: number, patch: Partial<DayPlan>) => void;
  setTotalDays: (days: number) => void;
  cities: { value: string; label: string }[];
  budgetBreakdown: import("./useQuoteCalculation").BudgetBreakdown;
  budgetSuggestion: { min: number; max: number };
  suggestedCityTransportFee: number;
  suggestedInterCityFee: number;
  suggestedTransportFee: number;
  touristCityTransportLines: import("./useQuoteCalculation").TransportLine[];
  hasTouristInterCity: boolean;
  touristInterCityTransportLines: import("./useQuoteCalculation").InterCityLine[];
  setViewingAttraction: (v: import("@/lib/cityDetails").AttractionDetail | null) => void;
  setViewingFood: (v: import("@/lib/cityDetails").FoodDetail | null) => void;
  setViewingVehicle: (v: CityTransportType | null) => void;
  setViewingHotel: (v: import("@/lib/cityDetails").HotelDetail | null) => void;
  submitErrorRef: RefObject<HTMLParagraphElement | null>;
  submitError: string | null;
  /** 与外层 dialog `aria-describedby` 一致，避免多实例 id 冲突 */
  submitErrorNoticeId: string;
  userHasEditedBudgetRef: MutableRefObject<boolean>;
  coverFileTooBig: boolean;
  setCoverFileTooBig: (v: boolean) => void;
  t: (key: string) => string;
}

/** 向导表单区块 props */
export interface GuideFormProps extends FormSectionStyles {
  guideLevelsWithPricing: GuideLevelOptionWithPricing[];
  form: CustomItineraryForm;
  setForm: Dispatch<SetStateAction<CustomItineraryForm>>;
  setGuideDayPlan: (dayIndex: number, patch: Partial<GuideDayPlan>) => void;
  cities: { value: string; label: string }[];
  guideDayPlansNormalized: GuideDayPlan[];
  guideQuoteBreakdown: import("./useQuoteCalculation").GuideQuoteBreakdown;
  suggestedGuideCityTransportFee: number;
  suggestedGuideInterCityFee: number;
  hasGuideInterCity: boolean;
  guideCityTransportLines: import("./useQuoteCalculation").TransportLine[];
  guideInterCityTransportLines: import("./useQuoteCalculation").InterCityLine[];
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  viewingGuideImage: { label: string; url: string } | null;
  setViewingVehicle: (v: CityTransportType | null) => void;
  setViewingHotel: (v: import("@/lib/cityDetails").HotelDetail | null) => void;
  submitErrorRef: RefObject<HTMLParagraphElement | null>;
  submitError: string | null;
  submitErrorNoticeId: string;
  guideHasEditedAmountRef: MutableRefObject<boolean>;
  accountAvatarUrl: string;
  coverFileTooBig: boolean;
  setCoverFileTooBig: (v: boolean) => void;
  t: (key: string) => string;
}
