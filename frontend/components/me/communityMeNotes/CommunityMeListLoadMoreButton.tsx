"use client";

import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

type Props = {
  t: (k: string) => string;
  busy: boolean;
  onClick: () => void;
  /** `page` ref-sun 独立页；`drawer` Hub cyan 弹层 */
  surface?: "page" | "drawer";
};

export function CommunityMeListLoadMoreButton({ t, busy, onClick, surface = "page" }: Props) {
  const isDrawer = surface === "drawer";
  return (
    <div className={isDrawer ? "flex justify-center pt-2" : "flex justify-center pt-4"}>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        data-tt-community-me-load-more={surface}
        onClick={onClick}
        className={
          isDrawer
            ? `inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/45 bg-cyan-500/15 px-6 text-meta font-medium text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-70 motion-sub ${communityCyanPillFocus}`
            : `${TT_COMMUNITY_FEED_L5.loadMoreBtn} ${communityCyanPillFocus}`
        }
      >
        {busy ? t("common_loading") : t("common_loadMore")}
      </button>
    </div>
  );
}
