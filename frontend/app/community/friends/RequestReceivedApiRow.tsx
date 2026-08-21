"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  communityStoredRolePillClassName,
  mapApiUserRoleToCommunity,
} from "@/components/community/communityFeedMappers";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { postFriendsAccept, postFriendsReject } from "@/lib/apiClient/community";
import {
  communityAvatarLinkFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { CommunityFriendsRequestReceived } from "./communityFriendsPageTypes";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

/** 51-31-7：收到的申请 — 调用 accept/reject API，成功后从列表移除 */
export function RequestReceivedApiRow({
  req,
  t,
  onResolved,
  onActionFailed,
  onThrown,
  onOfflineHint,
}: {
  req: CommunityFriendsRequestReceived;
  t: (k: string) => string;
  onResolved: (requestId: string) => void;
  onActionFailed?: (res: unknown) => void;
  onThrown?: (err: unknown) => void;
  onOfflineHint?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const resolve = (kind: "accept" | "reject") => {
    if (busy || req.status !== "pending") return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      onOfflineHint?.();
      return;
    }
    setBusy(true);
    const p = kind === "accept" ? postFriendsAccept(req.id) : postFriendsReject(req.id);
    void p
      .then((res) => {
        const ok = res && typeof res === "object" && (res as { status?: string }).status === "ok";
        if (ok) onResolved(req.id);
        else {
          if (typeof window !== "undefined") {
            console.error("RequestReceivedApiRow resolve not ok:", kind, res);
          }
          onActionFailed?.(res);
        }
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("RequestReceivedApiRow resolve:", kind, e);
        }
        onThrown?.(e);
      })
      .finally(() => setBusy(false));
  };
  const fromWallet = formatWalletOrDidShort(req.from_default_wallet ?? undefined);
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-800/50 px-3 py-2">
      <Link
        href={`/community/user/${req.from_user_id}`}
        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink-700 ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
        aria-label={req.from_nickname ?? req.from_user_id.slice(0, 8)}
      >
        {req.from_avatar_url?.trim() ? (
          <Image
            src={communityMediaAbsoluteUrlForRender(req.from_avatar_url.trim())}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized={communityMediaNextImageUnoptimized(
              communityMediaAbsoluteUrlForRender(req.from_avatar_url.trim())
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-meta font-medium text-ref-sun">
            {(req.from_nickname ?? req.from_user_id).slice(0, 1)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-body text-slate-200">
          <Link
            href={`/community/user/${req.from_user_id}`}
            className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate font-medium hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
          >
            {req.from_nickname ?? req.from_user_id.slice(0, 8)}
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(
              mapApiUserRoleToCommunity(req.from_role)
            )}`}
          >
            {t(communityStoredRoleLabelI18nKey(mapApiUserRoleToCommunity(req.from_role)))}
          </span>
          {req.from_is_escrow_guide === true &&
          mapApiUserRoleToCommunity(req.from_role) !== "guide" ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
              {t("community_role_guide")}
            </span>
          ) : null}
        </div>
        {fromWallet ? (
          <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={fromWallet}>
            {fromWallet}
          </p>
        ) : null}
      </div>
      <form
        className="contents"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const v = sub?.value;
          if (v === "accept" || v === "reject") resolve(v);
        }}
      >
        <div className="flex flex-wrap gap-2 justify-end">
          {(mapApiUserRoleToCommunity(req.from_role) === "guide" || req.from_is_escrow_guide === true) && (
            <Link href={marketHrefForCommunityUser(req.from_user_id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
              {t("community_book_guide_cta")}
            </Link>
          )}
          <button
            type="submit"
            name="friendReqResolve"
            value="accept"
            disabled={busy}
            aria-busy={busy ? true : undefined}
            className={`${TT_COMMUNITY_PAGE_L5.pill} disabled:opacity-50 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
          >
            {t("common_accept")}
          </button>
          <button
            type="submit"
            name="friendReqResolve"
            value="reject"
            disabled={busy}
            aria-busy={busy ? true : undefined}
            className={`rounded-full border border-slate-500/60 bg-ink-700/50 px-4 py-2 text-meta text-slate-300 motion-sub disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
          >
            {t("common_reject")}
          </button>
        </div>
      </form>
    </li>
  );
}
