"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCommunityDateShort } from "@/lib/communityFormatters";
import {
  communityStoredRolePillClassName,
} from "@/components/community/communityFeedMappers";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT } from "@/components/community/communityFeedConstants";
import { communityConversationRowFocus } from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  warmCommunityConversationThread,
  warmCommunityTabRoute,
} from "@/lib/communityDrawerPrefetch";
import type { CommunityMessagesDisplayConversation } from "./communityMessagesPageTypes";

type Props = {
  conv: CommunityMessagesDisplayConversation;
  t: (k: string) => string;
  locale: Locale;
  dash: string;
  sharePostId: string | null;
  orderId: string | null;
};

export function CommunityMessagesConversationRow({ conv, t, locale, dash, sharePostId, orderId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const convQs = new URLSearchParams();
  if (sharePostId) convQs.set("sharePostId", sharePostId);
  if (orderId) convQs.set("orderId", orderId);
  const convQ = convQs.toString();
  const convHref = `/community/messages/${conv.id}${convQ ? `?${convQ}` : ""}`;
  const showBookGuide = conv.peerId && (conv.peer?.role === "guide" || conv.peer?.isEscrowGuide === true);

  return (
    <li
      className={
        "flex items-stretch divide-x divide-slate-600/40 " +
        (conv.unread != null && conv.unread > 0 ? "bg-ink-800/40" : "")
      }
    >
      <Link
        href={convHref}
        onPointerEnter={() => {
          warmCommunityTabRoute(router, convHref, queryClient);
          warmCommunityConversationThread(conv.id);
        }}
        className={
          `${communityConversationRowFocus} flex min-w-0 flex-1 items-center gap-3 px-4 py-3 motion-sub ` +
          (conv.unread != null && conv.unread > 0
            ? "border-l-[3px] border-ref-coral/70 hover:bg-ink-800/65"
            : "hover:bg-ink-800/50")
        }
        aria-label={
          conv.unread != null && conv.unread > 0
            ? `${conv.peer?.nickname ?? ""}, ${conv.unread} ${t("community_unread")}`
            : undefined
        }
      >
        <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-ref-sun/22 flex-shrink-0 bg-ink-700">
          {conv.peer?.avatar_url?.trim() ? (
            <Image
              src={communityMediaAbsoluteUrlForRender(conv.peer.avatar_url.trim())}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
              unoptimized={communityMediaNextImageUnoptimized(
                communityMediaAbsoluteUrlForRender(conv.peer.avatar_url.trim()),
              )}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-body font-medium text-ref-sun">
              {(conv.peer?.nickname ?? "?").slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-body font-medium text-slate-200">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{conv.peer?.nickname ?? dash}</span>
                {conv.peer?.role && (
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
                      conv.peer.role,
                    )}`}
                  >
                    {t(communityStoredRoleLabelI18nKey(conv.peer.role))}
                  </span>
                )}
                {conv.peer?.isEscrowGuide ? (
                  <span className="flex-shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
                    {t("community_badge_escrow_guide")}
                  </span>
                ) : null}
              </span>
              {conv.peer?.walletShort ? (
                <span className="truncate text-meta font-mono text-slate-400">{conv.peer.walletShort}</span>
              ) : null}
            </span>
            {conv.unread != null && conv.unread > 0 && (
              <span className="rounded-full bg-ref-coral px-2 py-0.5 text-meta text-white">{conv.unread}</span>
            )}
          </div>
          <p
            className={
              "text-small truncate mt-0.5 " +
              (conv.unread != null && conv.unread > 0 ? "text-slate-300 font-medium" : "text-slate-400")
            }
          >
            {conv.last_message}
          </p>
        </div>
        <span className="text-meta text-slate-400 flex-shrink-0 self-center">
          {formatCommunityDateShort(conv.last_at, locale)}
        </span>
      </Link>
      {showBookGuide ? (
        <div className="flex items-center px-2 py-2 sm:px-3">
          <Link href={marketHrefForCommunityUser(conv.peerId)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT}>
            {t("community_book_guide_cta")}
          </Link>
        </div>
      ) : null}
    </li>
  );
}
