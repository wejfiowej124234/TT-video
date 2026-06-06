import {
  TT_MARKETING_FOCUS_RING_DARK_SURFACE,
  TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL,
  TT_MARKETING_MARKET_GLASS_FIELD_FOCUS,
  TT_MARKETING_MARKET_GLASS_FOCUS_WITHIN,
} from "@/lib/marketingUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** CustomItinerary / 玻璃弹窗共享输入框 */
export const marketGlassInputClass = `w-full rounded-[var(--radius-sm)] border border-white/25 bg-white/5 px-4 py-2.5 text-small text-white placeholder-white/50 ${TT_MARKETING_MARKET_GLASS_FIELD_FOCUS}`;

/** 缩略图/选图等可聚焦控件 */
export const marketGlassInteractiveFocusClass = TT_MARKETING_FOCUS_RING_DARK_SURFACE;

/** 次要描边按钮（玻璃底） */
export const marketGlassPillButtonClass = `${touchTargetLink44Classes} text-meta text-white/80 hover:text-white border border-white/30 rounded-[var(--radius-sm)] px-2 py-1 ${TT_MARKETING_FOCUS_RING_DARK_SURFACE}`;

/** 卡片内可选封面按钮 */
export const marketGlassThumbButtonClass = `shrink-0 w-36 rounded-[var(--radius-sm)] border border-white/20 bg-ink-900/60 overflow-hidden text-left ${TT_MARKETING_FOCUS_RING_DARK_SURFACE}`;

export { TT_MARKETING_MARKET_GLASS_CHOICE_CONTROL, TT_MARKETING_MARKET_GLASS_FOCUS_WITHIN };
