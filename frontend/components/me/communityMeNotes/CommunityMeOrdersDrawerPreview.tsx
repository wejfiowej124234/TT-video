"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { CommunityMeNotesOrderThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesOrderThumbGrid";
import {
  fetchOrdersForCommunityMeMyOrdersDrawer,
  MY_ORDERS_DRAWER_RAW_FETCH_CAP,
} from "@/lib/communityMeMyOrdersModel";
import type { OrderListItem } from "@/lib/apiClient";
import { applyPinOrder } from "@/lib/communityMeNotesPinOrder";
import type { LocaleTranslateFn } from "@/lib/i18n";

/**
 * 个人中心「我的订单」弹层：与赞过 / 收藏同构的 **`grid-cols-3`** 方格，**多行**展示；
 * 仅展示已进入交易闭环的订单（排除仍在市集 **Draft/open** 的草稿单，见 `communityMeMyOrdersModel`）。
 */
export function CommunityMeOrdersDrawerPreview({
  t,
  onNavigate,
}: {
  t: LocaleTranslateFn;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ordersLoginReturnUrl = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "orders"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  /** 与收藏 / 赞过弹层一致：未登录不发起 `GET /orders`（避免无意义 401 链）。 */
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [pinOrder, setPinOrder] = useState<string[]>([]);
  const [fetchNonce, setFetchNonce] = useState(0);

  const displayOrders = useMemo(() => applyPinOrder(rows, (o) => String(o.id ?? ""), pinOrder), [rows, pinOrder]);

  useEffect(() => {
    if (authPending || !isLoggedIn) {
      if (!authPending && !isLoggedIn) {
        setLoading(false);
        setRows([]);
        setError(null);
        setTruncated(false);
        setNeedLogin(false);
      }
      return;
    }

    let cancelled = false;
    setNeedLogin(false);
    setLoading(true);
    setError(null);
    setNotice(null);
    setTruncated(false);
    void fetchOrdersForCommunityMeMyOrdersDrawer()
      .then(({ items, truncatedAtCap }) => {
        if (cancelled) return;
        setRows(items);
        setTruncated(truncatedAtCap);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof Error && e.message === "login_required") {
          setNeedLogin(true);
          setRows([]);
          return;
        }
        setError(mapApiReadError(e, t, "orders_requestFailed"));
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authPending, isLoggedIn, fetchNonce, t]);

  const retryFetch = useCallback(() => {
    if (!isLoggedIn || authPending) return;
    setFetchNonce((n) => n + 1);
  }, [authPending, isLoggedIn]);

  const ctaClass = `${touchTargetLink44Classes} w-full rounded-[var(--radius-sm)] border border-white/30 bg-travel-500/90 px-4 py-2.5 text-small font-medium text-white shadow-strong hover:bg-travel-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/10`;

  const footerLinkClass = `${touchTargetLink44Classes} text-[0.7rem] text-white/75 hover:text-white underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 rounded-[var(--radius-sm)] px-1`;

  if (authPending) {
    return (
      <ul
        className="m-0 grid list-none grid-cols-3 gap-2 p-0"
        aria-busy="true"
        aria-label={t("header_myOrders")}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="min-w-0">
            <div className="aspect-square animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] border border-cyan-500/25 bg-white/10" />
          </li>
        ))}
      </ul>
    );
  }

  if (!isLoggedIn || needLogin) {
    return (
      <div className="space-y-3">
        <p className="text-small text-white/85">{t("community_me_login_prompt")}</p>
        <Link
          href={`/auth/login?returnUrl=${encodeURIComponent(ordersLoginReturnUrl)}`}
          onClick={onNavigate}
          className={ctaClass}
        >
          {t("me_goLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-rose-400/30 bg-rose-950/25 px-3 py-2">
          <p className="text-small text-rose-100/95">{error}</p>
          <button type="button" onClick={() => retryFetch()} className={footerLinkClass}>
            {t("common_retry")}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-[var(--radius-sm)] border border-warning/35 bg-warning/30 px-3 py-2 text-[0.7rem] text-white/95" role="status">
          {notice}
        </p>
      ) : null}

      {truncated ? (
        <p className="rounded-[var(--radius-sm)] border border-cyan-500/30 bg-ink-900/50 px-3 py-2 text-[0.68rem] leading-snug text-cyan-100/90" role="status">
          {t("community_me_orders_drawer_truncated_hint", { cap: String(MY_ORDERS_DRAWER_RAW_FETCH_CAP) })}
        </p>
      ) : null}

      {loading ? (
        <ul
          className="m-0 grid list-none grid-cols-3 gap-2 p-0"
          aria-busy="true"
          aria-label={t("header_myOrders")}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="min-w-0">
              <div className="aspect-square animate-pulse motion-reduce:animate-none rounded-[var(--radius-md)] border border-cyan-500/25 bg-white/10" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/40 px-3 py-4 text-center ring-1 ring-white/5">
          <p className="text-small text-white/90">{t("orders_empty")}</p>
          <p className="text-[0.7rem] leading-snug text-white/70">{t("community_me_orders_drawer_empty_sub")}</p>
          <p className="text-[0.7rem] leading-snug text-cyan-100/85">{t("community_me_orders_drawer_empty_troubleshoot")}</p>
          <Link
            href="/market"
            prefetch={false}
            onClick={onNavigate}
            className={`${ctaClass} text-center`}
          >
            {t("community_me_orders_drawer_empty_cta_market_drafts")}
          </Link>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Link href="/orders" prefetch={false} onClick={onNavigate} className={footerLinkClass}>
              {t("community_me_orders_drawer_cta_all")}
            </Link>
            <Link href="/market" prefetch={false} onClick={onNavigate} className={footerLinkClass}>
              {t("community_me_orders_drawer_link_market")}
            </Link>
            <Link href="/itinerary/new" prefetch={false} onClick={onNavigate} className={footerLinkClass}>
              {t("community_me_orders_drawer_link_create")}
            </Link>
          </div>
        </div>
      ) : (
        <CommunityMeNotesOrderThumbGrid
          orders={displayOrders}
          t={t}
          listAriaLabel={t("header_myOrders")}
          onNavigate={onNavigate}
          onOrderCancelled={(id) => {
            setRows((r) => r.filter((x) => String(x.id) !== id));
            setPinOrder((p) => p.filter((x) => x !== id));
          }}
          onPinToTop={(id) => setPinOrder((prev) => [id, ...prev.filter((x) => x !== id)])}
          onNotify={(msg) => {
            setNotice(msg);
            window.setTimeout(() => setNotice(null), 5000);
          }}
        />
      )}
    </div>
  );
}
