"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { OrderListItem } from "@/lib/apiClient";
import { getIdempotencyKey, orderCancel } from "@/lib/apiClient";
import {
  orderBadgeVariantFromApiOrder,
  orderStatusLabelKeyFromApiOrder,
} from "@/lib/orderProjectionDisplayStatus";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import {
  communityMeOrderDrawerKindI18nKey,
  formatOrderAmountLine,
  formatOrderIdShort,
  formatOrderListTitle,
  orderBusinessLineFromApi,
} from "@/lib/communityMeOrdersDrawerModel";
import { orderListItemMayRequestCancel } from "@/lib/communityMeMyOrdersModel";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import type { LocaleTranslateFn } from "@/lib/i18n";

const ORDER_COVER_FALLBACK =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80";

function badgeClassesForThumb(variant: ReturnType<typeof orderBadgeVariantFromApiOrder>): string {
  if (variant === "success") return "bg-success/85 text-success";
  if (variant === "danger") return "bg-rose-500/85 text-rose-50";
  if (variant === "warning") return "bg-warning/88 text-white";
  return "bg-ink-900/80 text-white/95";
}

/**
 * 个人中心「我的订单」：`grid-cols-3` 多行铺开展示；卡片进 `/escrow/:id`；右上角菜单可尝试取消（链下允许态）。
 */
export function CommunityMeNotesOrderThumbGrid({
  orders,
  t,
  listAriaLabel,
  onNavigate,
  onOrderCancelled,
  onNotify,
  onPinToTop,
}: {
  orders: readonly OrderListItem[];
  t: LocaleTranslateFn;
  listAriaLabel: string;
  onNavigate?: () => void;
  onOrderCancelled?: (id: string) => void;
  onNotify?: (message: string) => void;
  /** 本弹窗内调整卡片顺序；不调用服务端（与 `community_me_notes_menu_pin_hint` 一致） */
  onPinToTop?: (orderId: string) => void;
}) {
  const menuHeadingId = useId();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node | null;
      if (!t) return;
      if (menuPanelRef.current?.contains(t)) return;
      if ((ev.target as HTMLElement | null)?.closest?.("[data-community-me-order-menu]")) return;
      setMenuOpenId(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setMenuOpenId(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpenId]);

  const tryCancel = useCallback(
    async (id: string) => {
      const item = orders.find((o) => String(o.id) === id);
      if (!item || !orderListItemMayRequestCancel(item)) {
        onNotify?.(t("community_me_orders_cancel_unavailable"));
        setMenuOpenId(null);
        return;
      }
      if (typeof window !== "undefined" && !window.confirm(t("community_me_orders_cancel_confirm"))) {
        setMenuOpenId(null);
        return;
      }
      setCancellingId(id);
      try {
        await orderCancel(id, getIdempotencyKey());
        onOrderCancelled?.(id);
        setMenuOpenId(null);
      } catch (e) {
        onNotify?.(mapApiReadError(e, t, "orders_requestFailed"));
      } finally {
        setCancellingId(null);
      }
    },
    [orders, t, onNotify, onOrderCancelled],
  );

  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0" aria-label={listAriaLabel}>
      {orders.filter((item) => String(item.id ?? "").length > 0).map((item) => {
        const id = String(item.id);
        const href = `/escrow/${encodeURIComponent(id)}`;
        const cover = (item.image ?? "").trim() || ORDER_COVER_FALLBACK;
        const statusKey = orderStatusLabelKeyFromApiOrder(item);
        const statusLabel = t(statusKey);
        const variant = orderBadgeVariantFromApiOrder(item);
        const kind = orderBusinessLineFromApi(item);
        const kindLabel = t(communityMeOrderDrawerKindI18nKey(kind));
        const titleRaw = formatOrderListTitle(item);
        const title = titleRaw || t("community_me_orders_drawer_untitled");
        const amountLine = formatOrderAmountLine(item, t);
        const idShort = formatOrderIdShort(id);
        const aria = t("community_me_orders_drawer_card_link_aria", {
          id: idShort,
          dest: title,
          amount: amountLine,
          status: statusLabel,
          kind: kindLabel,
        });
        const mayCancel = orderListItemMayRequestCancel(item);
        const menuOpen = menuOpenId === id;
        const busy = cancellingId === id;

        return (
          <li key={id} className="min-w-0">
            <div className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/50 shadow-scifi-panel ring-1 ring-white/5">
              <Link
                href={href}
                prefetch={false}
                aria-label={aria}
                title={aria}
                onClick={() => {
                  stashEscrowOrderPrefetchFromListItem(item);
                  onNavigate?.();
                }}
                className="absolute inset-0 z-[1] block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
              >
                <Image src={cover} alt="" fill className="object-cover" sizes="120px" unoptimized />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1.5 pb-1.5 pt-6">
                  <span className="line-clamp-2 text-left text-[0.62rem] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-left text-[0.58rem] font-medium tabular-nums text-white/95">{amountLine}</span>
                </span>
              </Link>
              <span className="pointer-events-none absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/55 px-1 py-0.5 text-[0.58rem] font-medium text-cyan-100 ring-1 ring-cyan-400/25">
                {kindLabel}
              </span>
              <span
                className={`pointer-events-none absolute right-1 top-8 max-w-[55%] truncate rounded px-1 py-0.5 text-[0.55rem] font-medium ring-1 ring-black/20 ${badgeClassesForThumb(variant)}`}
              >
                {statusLabel}
              </span>

              <div
                className="absolute right-0.5 top-0.5 z-[3] flex flex-col items-end gap-1"
                data-community-me-order-menu
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuOpen ? `${menuHeadingId}-${id}` : undefined}
                  aria-label={t("community_me_orders_card_menu_aria")}
                  disabled={busy}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpenId((cur) => (cur === id ? null : id));
                  }}
                  className={`${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} flex h-9 min-w-[36px] items-center justify-center rounded-[var(--radius-md)] border border-white/25 bg-black/55 text-lg leading-none text-white/95 shadow-md backdrop-blur-sm hover:bg-black/70 disabled:opacity-50`}
                >
                  ⋮
                </button>
                {menuOpen ? (
                  <div
                    ref={menuPanelRef}
                    id={`${menuHeadingId}-${id}`}
                    role="menu"
                    aria-label={t("community_me_orders_card_menu_aria")}
                    className="min-w-[10rem] rounded-[var(--radius-sm)] border border-white/20 bg-ink-900/95 py-1 text-left shadow-strong ring-1 ring-cyan-500/20"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!mayCancel || busy}
                      title={!mayCancel ? t("community_me_orders_cancel_unavailable") : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void tryCancel(id);
                      }}
                      className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {busy ? t("community_me_notes_menu_delete_pending") : t("community_me_notes_menu_delete")}
                    </button>
                    {onPinToTop ? (
                      <button
                        type="button"
                        role="menuitem"
                        title={t("community_me_notes_menu_pin_hint")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPinToTop(id);
                          setMenuOpenId(null);
                        }}
                        className={`${touchTargetLink44Classes} block w-full px-3 py-2 text-left text-[0.7rem] font-medium text-white hover:bg-white/10`}
                      >
                        {t("community_me_notes_menu_pin")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
