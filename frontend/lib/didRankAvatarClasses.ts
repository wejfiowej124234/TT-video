/**
 * DID 排行榜头像尺寸 SSOT
 * 领奖台 1/2/3 必须同像素外框；ring 用 ring-inset + 统一 ring-2，避免 #1 视觉更大。
 */

export const DID_RANK_AVATAR_PODIUM_PX = 52;

/** 领奖台 · 固定外框（游客/向导 Top3 共用） */
export const DID_RANK_AVATAR_PODIUM_BOX =
  "relative mx-auto mb-1 flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-[3.25rem] sm:w-[3.25rem] sm:min-h-[3.25rem] sm:min-w-[3.25rem]";

export const DID_RANK_AVATAR_PODIUM_MEDIA = "h-full w-full rounded-full object-cover";

export const DID_RANK_AVATAR_PODIUM_PLACEHOLDER =
  "flex h-full w-full items-center justify-center rounded-full text-body font-semibold";

/** 4～10 横条 */
export const DID_RANK_AVATAR_TOP10_ROW_BOX = "h-10 w-10 min-h-10 min-w-10 shrink-0 sm:h-11 sm:w-11 sm:min-h-11 sm:min-w-11";

export const DID_RANK_AVATAR_TOP10_ROW_MEDIA = `${DID_RANK_AVATAR_TOP10_ROW_BOX} rounded-full object-cover`;

export const DID_RANK_AVATAR_TOP10_ROW_PLACEHOLDER = `${DID_RANK_AVATAR_TOP10_ROW_BOX} flex items-center justify-center rounded-full text-body font-semibold`;

/** 11～100 列表行 */
export const DID_RANK_AVATAR_LIST_ROW_BOX = "h-11 w-11 min-h-11 min-w-11 shrink-0";
