import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CommunitySupportMenu } from "@/components/community/CommunitySupportMenu";
import { warmCommunityTabRoute } from "@/lib/communityDrawerPrefetch";
import {
  TT_MARKETING_DARK_ROUTE_TAB_BASE_COMMUNITY,
  TT_MARKETING_DARK_ROUTE_TAB_FOCUS,
  TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM,
} from "@/lib/marketingUi";
import { COMMUNITY_ROUTE_SHELL_TABS, COMMUNITY_SHELL_TAB_ACTIVE, COMMUNITY_SHELL_TAB_IDLE } from "./communityRouteShellConstants";

export const CommunityRouteShellTabLinks = memo(function CommunityRouteShellTabLinks({
  pathname,
  t,
  totalUnread,
  className = "",
  onNavStart,
}: {
  pathname: string | null;
  t: (k: string) => string;
  totalUnread: number;
  className?: string;
  onNavStart?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <div className={`${TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM} ${className}`}>
      {COMMUNITY_ROUTE_SHELL_TABS.map((tab) => {
        const active = tab.pathMatch(pathname ?? "");
        const showBadge = tab.unread && totalUnread > 0;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            prefetch={true}
            onPointerEnter={() => warmCommunityTabRoute(router, tab.path, queryClient)}
            onPointerDown={onNavStart}
            className={`${TT_MARKETING_DARK_ROUTE_TAB_BASE_COMMUNITY} ${TT_MARKETING_DARK_ROUTE_TAB_FOCUS} ${
              active ? COMMUNITY_SHELL_TAB_ACTIVE : COMMUNITY_SHELL_TAB_IDLE
            }`}
            aria-current={active ? "page" : undefined}
            aria-label={showBadge ? `${t(tab.key)} ${totalUnread} ${t("community_unread")}` : t(tab.key)}
          >
            {t(tab.key)}
            {showBadge && (
              <span className="absolute -top-0.5 -right-0.5 sm:top-1 sm:right-1 min-w-[18px] h-[18px] rounded-full bg-ref-coral flex items-center justify-center text-micro font-bold text-[#0c0a09]">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        );
      })}
      <div className="w-px shrink-0 self-stretch bg-ink-600/45 my-1" aria-hidden />
      <CommunitySupportMenu onNavStart={onNavStart} variant="tabBar" />
    </div>
  );
});
