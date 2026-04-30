"use client";

import type { ReactNode } from "react";
import MarketHubSubNav from "@/components/market/MarketHubSubNav";

type Props = {
  /** 左侧主操作（旅行预约为「创建行程」Hero CTA；子站默认为链至 `/market`；商家橱窗/收购列表可改为本页工作台按钮） */
  primary?: ReactNode;
  /** 顶距：旅行预约可传 `mt-4` 压缩首屏 */
  topClassName?: string;
};

const shell =
  "mx-auto max-w-xl rounded-2xl border border-white/10 bg-ink-900/50 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-w-2xl sm:p-2.5";

/** Hero 主 CTA + 三入口合并工具条：旅行预约 `/market` 与子站共用版式。 */
export default function MarketHeroNavToolbar({ primary, topClassName = "mt-5" }: Props) {
  if (!primary) {
    return (
      <div className={`${topClassName} ${shell}`}>
        <div className="flex w-full justify-center px-1">
          <MarketHubSubNav compact />
        </div>
      </div>
    );
  }

  return (
    <div className={`${topClassName} ${shell}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
        <div className="flex justify-center sm:shrink-0 sm:border-r sm:border-white/10 sm:pr-4 sm:mr-4">{primary}</div>
        <div className="flex min-w-0 justify-center border-t border-white/10 pt-2 sm:border-t-0 sm:pt-0 sm:flex-1">
          <MarketHubSubNav compact className="w-full sm:w-auto" />
        </div>
      </div>
    </div>
  );
}
