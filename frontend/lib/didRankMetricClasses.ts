/** 榜内主指标排版：sans + mono tabular，避免衬线感与子像素发糊 */

export const DID_RANK_METRIC_SCORE_PODIUM =
  "font-semibold font-mono tabular-nums tracking-tight antialiased [text-rendering:geometricPrecision]";

export const DID_RANK_METRIC_SCORE_ROW = "font-semibold font-mono tabular-nums tracking-tight text-meta truncate antialiased";

/** 领奖台三卡同高；列容器另见 `didRankPodiumColumnClass` */
export const DID_RANK_PODIUM_CARD_MIN_H =
  "min-h-[10rem] sm:min-h-[10.75rem] flex flex-col flex-1 w-full";
