import { memo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCommunityPublish } from "@/components/community/CommunityPublishContext";
import { warmCommunityPublishDrawer, warmCommunityTabRoute } from "@/lib/communityDrawerPrefetch";
import {
  TT_MARKETING_DARK_ROUTE_PUBLISH_FAB,
  TT_MARKETING_DARK_ROUTE_PUBLISH_FAB_FOCUS,
} from "@/lib/uiSystem";
import {
  TT_MARKETING_DARK_ROUTE_TAB_BASE_COMMUNITY,
  TT_MARKETING_DARK_ROUTE_TAB_FOCUS,
  TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM,
} from "@/lib/marketingUi";
import { COMMUNITY_SHELL_TAB_ACTIVE, COMMUNITY_SHELL_TAB_IDLE } from "./communityRouteShellConstants";

/** 移动端底部导航（需在 CommunityPublishProvider 内使用）；onNavStart 实现 200ms 内可感知反馈 */
export const CommunityRouteShellMobileBottomNav = memo(function CommunityRouteShellMobileBottomNav({
  pathname,
  t,
  totalUnread,
  onNavStart,
}: {
  pathname: string | null;
  t: (k: string) => string;
  totalUnread: number;
  onNavStart?: () => void;
}) {
  const publish = useCommunityPublish();
  const router = useRouter();
  const queryClient = useQueryClient();
  const onFeed =
    pathname === "/community" || pathname === "/community/feed" || (pathname ?? "").startsWith("/community/topic/");
  return (
    <div className={`${TT_MARKETING_DARK_ROUTE_TAB_RAIL_COMMUNITY_PREMIUM} gap-0.5`}>
      <Link
        href="/community"
        prefetch={true}
        onPointerEnter={() => warmCommunityTabRoute(router, "/community", queryClient)}
        onPointerDown={onNavStart}
        className={`${TT_MARKETING_DARK_ROUTE_TAB_BASE_COMMUNITY} ${TT_MARKETING_DARK_ROUTE_TAB_FOCUS} ${
          onFeed ? COMMUNITY_SHELL_TAB_ACTIVE : COMMUNITY_SHELL_TAB_IDLE
        }`}
        aria-current={onFeed ? "page" : undefined}
        aria-label={t("community_tab_feed")}
      >
        {t("community_tab_feed")}
      </Link>
      <Link
        href="/community/explore"
        prefetch={true}
        onPointerEnter={() => warmCommunityTabRoute(router, "/community/explore", queryClient)}
        onPointerDown={onNavStart}
        className={`relative flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-0.5 py-2.5 min-h-[44px] text-[0.65rem] sm:text-meta font-medium motion-sub leading-tight text-center ${TT_MARKETING_DARK_ROUTE_TAB_FOCUS} ${
          (pathname ?? "").startsWith("/community/explore")
            ? COMMUNITY_SHELL_TAB_ACTIVE
            : COMMUNITY_SHELL_TAB_IDLE
        }`}
        aria-current={(pathname ?? "").startsWith("/community/explore") ? "page" : undefined}
        aria-label={t("community_tab_explore")}
      >
        {t("community_tab_explore")}
      </Link>
      <Link
        href="/community/messages"
        prefetch={true}
        onPointerEnter={() => warmCommunityTabRoute(router, "/community/messages", queryClient)}
        onPointerDown={onNavStart}
        className={`relative flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${TT_MARKETING_DARK_ROUTE_TAB_FOCUS} ${
          (pathname ?? "").startsWith("/community/messages") || (pathname ?? "").startsWith("/community/activity")
            ? COMMUNITY_SHELL_TAB_ACTIVE
            : COMMUNITY_SHELL_TAB_IDLE
        }`}
        aria-current={
          (pathname ?? "").startsWith("/community/messages") || (pathname ?? "").startsWith("/community/activity")
            ? "page"
            : undefined
        }
        aria-label={totalUnread > 0 ? `${t("community_tab_messages")} ${totalUnread} ${t("community_unread")}` : t("community_tab_messages")}
      >
        {t("community_tab_messages")}
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 rounded-full bg-ref-coral flex items-center justify-center text-micro font-bold text-[#0c0a09]">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Link>
      {onFeed ? (
        <form
          className="inline flex-shrink-0"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const sub = (e.nativeEvent as SubmitEvent).submitter;
            if (sub instanceof HTMLButtonElement) publish?.openPublish(sub);
          }}
        >
          <button
            type="submit"
            className={`-my-0.5 ${TT_MARKETING_DARK_ROUTE_PUBLISH_FAB} ${TT_MARKETING_DARK_ROUTE_PUBLISH_FAB_FOCUS}`}
            aria-label={t("community_publish")}
            onPointerEnter={warmCommunityPublishDrawer}
          >
            <span className="text-h4 font-bold leading-none">+</span>
          </button>
        </form>
      ) : (
        <Link
          href="/community?publish=1"
          prefetch={true}
          onPointerEnter={() => {
            warmCommunityTabRoute(router, "/community?publish=1", queryClient);
            warmCommunityPublishDrawer();
          }}
          onPointerDown={onNavStart}
          className={`-my-0.5 ${TT_MARKETING_DARK_ROUTE_PUBLISH_FAB} ${TT_MARKETING_DARK_ROUTE_PUBLISH_FAB_FOCUS}`}
          aria-label={t("community_publish")}
        >
          <span className="text-h4 font-bold leading-none">+</span>
        </Link>
      )}
      <Link
        href="/community/friends"
        prefetch={true}
        onPointerEnter={() => warmCommunityTabRoute(router, "/community/friends", queryClient)}
        onPointerDown={onNavStart}
        className={`flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${TT_MARKETING_DARK_ROUTE_TAB_FOCUS} ${
          (pathname ?? "").startsWith("/community/friends") ? COMMUNITY_SHELL_TAB_ACTIVE : COMMUNITY_SHELL_TAB_IDLE
        }`}
        aria-current={(pathname ?? "").startsWith("/community/friends") ? "page" : undefined}
        aria-label={t("community_tab_friends")}
      >
        {t("community_tab_friends")}
      </Link>
    </div>
  );
});
