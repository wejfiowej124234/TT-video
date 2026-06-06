"use client";

import { useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { OrderListItem } from "@/lib/apiClient";
import type { OrderDetailItem } from "@/components/market/OrderDetailDrawer";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { orderLikeMayOnchainDeposit } from "@/components/escrow/EscrowDetail/escrowOnChainEligibility";
import {
  orderBadgeVariantFromApiOrder,
  orderProjectionDivergesFromOrderState,
  orderProjectionTerminalDegraded,
  orderStatusLabelKeyFromApiOrder,
} from "@/lib/orderProjectionDisplayStatus";
import { orderListItemMayRequestCancel } from "@/lib/communityMeMyOrdersModel";
import { stashEscrowOrderPrefetchFromListItem } from "@/lib/orderEscrowPrefetch";
import { TT_ORDERS_LIST_L5, ordersListL5ListItemStaggerMs } from "@/lib/orders/ordersListL5";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { OrdersListSearchHighlight } from "@/components/orders/OrdersListSearchHighlight";
import { OrdersListCalendarIcon, OrdersListPinIcon } from "@/components/orders/OrdersListMetaIcons";
import { ORDER_PLACEHOLDER_IMAGE, orderListItemToDetailDrawer } from "./ordersListPageModel";
import { useOrdersListCardSwipe } from "./useOrdersListCardSwipe";

export function OrdersListCardItem({
  t,
  item,
  index,
  highlightQuery,
  keyboardFocused = false,
  staggerEnter = true,
  as: ListTag = "li",
  deletingId,
  openSwipeCardId,
  setOpenSwipeCardId,
  setPreviewOrder,
  handleDeleteOrder,
  onKeyboardActivate,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  item: OrderListItem;
  index: number;
  highlightQuery: string;
  keyboardFocused?: boolean;
  /** 虚拟列表关闭 stagger，避免滚动挂载时重复入场 */
  staggerEnter?: boolean;
  as?: "li" | "div";
  deletingId: string | null;
  openSwipeCardId: string | null;
  setOpenSwipeCardId: (id: string | null) => void;
  setPreviewOrder: (o: OrderDetailItem | null) => void;
  handleDeleteOrder: (orderId: string, stateOrStatus: string, tConfirm: (k: string) => string) => Promise<void>;
  onKeyboardActivate?: () => void;
}) {
  const id = item?.id ?? String(index);
  const state = (item?.state ?? item?.status ?? "").toLowerCase();
  const statusKey = orderStatusLabelKeyFromApiOrder(item);
  const statusLabel = t(statusKey) || state || t("ui_em_dash");
  const variant = orderBadgeVariantFromApiOrder(item);
  const projectionDiverges = orderProjectionDivergesFromOrderState(item);
  const projectionDegraded = orderProjectionTerminalDegraded(item);
  const canDelete =
    orderListItemMayRequestCancel(item) || state === "cancelled" || state === "canceled";
  const dest = item?.destination ?? item?.city ?? item?.country ?? id;
  const locationLine = item?.country ?? dest;
  const destDetail = item?.destination ?? item?.city ?? null;
  const showDestSub =
    destDetail != null && String(destDetail).trim() !== "" && String(destDetail) !== String(locationLine);
  const isDeleting = deletingId === item?.id;
  const dateLine =
    item?.travel_date && item?.days != null
      ? `${item.travel_date} · ${item.days} ${t("orders_days")}`
      : item?.travel_date ?? (item?.days != null ? `${item.days} ${t("orders_days")}` : null) ?? t("ui_em_dash");
  const orderCoverRaw = typeof item?.image === "string" ? item.image.trim() : "";
  const imageUrl = orderCoverRaw ? communityMediaAbsoluteUrlForRender(orderCoverRaw) : ORDER_PLACEHOLDER_IMAGE;

  const badgeClass =
    variant === "success"
      ? TT_ORDERS_LIST_L5.statusBadgeSuccess
      : variant === "danger"
        ? TT_ORDERS_LIST_L5.statusBadgeDanger
        : variant === "warning"
          ? TT_ORDERS_LIST_L5.statusBadgeWarm
          : TT_ORDERS_LIST_L5.statusBadgeNeutral;

  const escrowHref = item?.id ? `/escrow/${encodeURIComponent(String(item.id))}` : null;
  const stashListItemEscrowPayPrefetch = () => stashEscrowOrderPrefetchFromListItem(item);
  const coverAlt = t("orders_cardCoverAlt", { dest: String(dest) });
  const cardFrameClass = TT_ORDERS_LIST_L5.listCardFrame;
  const cardInnerClass = TT_ORDERS_LIST_L5.listCardInner;

  const { offsetPx, isOpen, closeSwipe, onTouchStart, onTouchMove, onTouchEnd, swipeSurfaceStyle } = useOrdersListCardSwipe({
    cardId: id,
    openSwipeCardId,
    setOpenSwipeCardId,
  });

  const swipeRevealed = offsetPx < 0;

  useEffect(() => {
    if (!keyboardFocused) return;
    document.getElementById(`order-card-${id}`)?.focus({ preventScroll: true });
  }, [keyboardFocused, id]);

  const showSwipeEscrow = Boolean(item?.id && escrowHref);
  const showSwipePay = Boolean(item?.id && orderLikeMayOnchainDeposit(item));
  const showSwipePreview = Boolean(item?.id);
  const showSwipeDelete = Boolean(canDelete && item?.id);
  const hasSwipeActions = showSwipePreview || showSwipeEscrow || showSwipePay || showSwipeDelete;

  const coverEager = staggerEnter && index === 0;

  return (
    <ListTag
      className={staggerEnter ? TT_ORDERS_LIST_L5.listItemEnter : undefined}
      style={staggerEnter ? { animationDelay: `${ordersListL5ListItemStaggerMs(index)}ms` } : undefined}
    >
      <div className={cardFrameClass}>
        <div
          className={TT_ORDERS_LIST_L5.cardSwipeShell}
          data-tt-orders-card-swipe={hasSwipeActions ? "1" : undefined}
          data-tt-orders-card-swipe-open={swipeRevealed ? "1" : undefined}
        >
          {hasSwipeActions ? (
            <div
              className={TT_ORDERS_LIST_L5.cardSwipeTray}
              aria-hidden={!isOpen}
              data-tt-orders-card-swipe-tray="1"
            >
              {showSwipePreview ? (
                <button
                  type="button"
                  className={TT_ORDERS_LIST_L5.cardSwipePreview}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => {
                    closeSwipe();
                    setPreviewOrder(orderListItemToDetailDrawer(item));
                  }}
                >
                  <span aria-hidden>◎</span>
                  {t("orders_list_swipe_preview")}
                </button>
              ) : null}
              {showSwipePay ? (
                <Link
                  href={`/pay?orderId=${encodeURIComponent(String(item.id))}`}
                  onClick={() => {
                    stashListItemEscrowPayPrefetch();
                    closeSwipe();
                  }}
                  data-tt-orders-list-pay-link="1"
                  className={TT_ORDERS_LIST_L5.cardSwipeEscrow}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <span aria-hidden>¥</span>
                  {t("orders_list_swipe_pay")}
                </Link>
              ) : null}
              {showSwipeEscrow && !showSwipePay ? (
                <Link
                  href={escrowHref!}
                  onClick={() => {
                    stashListItemEscrowPayPrefetch();
                    closeSwipe();
                  }}
                  data-tt-orders-list-card-escrow-link="1"
                  className={TT_ORDERS_LIST_L5.cardSwipeEscrow}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <span aria-hidden>→</span>
                  {t("orders_list_swipe_escrow")}
                </Link>
              ) : null}
              {showSwipeDelete ? (
                <button
                  type="button"
                  className={TT_ORDERS_LIST_L5.cardSwipeDelete}
                  tabIndex={isOpen ? 0 : -1}
                  disabled={deletingId === item.id}
                  onClick={() => {
                    closeSwipe();
                    void handleDeleteOrder(id, state, t);
                  }}
                >
                  <span aria-hidden>✕</span>
                  {t("orders_list_swipe_delete")}
                </button>
              ) : null}
            </div>
          ) : null}

          <article
            id={`order-card-${id}`}
            tabIndex={keyboardFocused ? 0 : -1}
            className={`relative ${TT_ORDERS_LIST_L5.listCardGroup} ${TT_ORDERS_LIST_L5.listCardArticle} ${cardInnerClass} ${TT_ORDERS_LIST_L5.cardSwipeSurface} outline-none ${
              keyboardFocused ? TT_ORDERS_LIST_L5.listCardKeyboardFocus : ""
            }`}
            style={swipeSurfaceStyle}
            onTouchStart={hasSwipeActions ? onTouchStart : undefined}
            onTouchMove={hasSwipeActions ? onTouchMove : undefined}
            onTouchEnd={hasSwipeActions ? onTouchEnd : undefined}
            onKeyDown={(e) => {
              if (!keyboardFocused || e.key !== "Enter") return;
              e.preventDefault();
              onKeyboardActivate?.();
            }}
            aria-labelledby={`order-title-${id}`}
            data-tt-orders-card-focused={keyboardFocused ? "1" : undefined}
          >
            {swipeRevealed ? <div className={TT_ORDERS_LIST_L5.cardSwipeEdgeGlow} aria-hidden /> : null}
            {escrowHref && !swipeRevealed ? (
              <Link
                href={escrowHref}
                onClick={stashListItemEscrowPayPrefetch}
                data-tt-orders-list-card-escrow-link="1"
                className={`absolute inset-0 z-0 rounded-[var(--radius-xl)] ${TT_ORDERS_LIST_L5.cardLinkFocus}`}
                aria-label={t("orders_cardLinkAria", { dest: String(locationLine) })}
              />
            ) : null}
            {escrowHref && !swipeRevealed ? (
              <span className={`${TT_ORDERS_LIST_L5.cardOpenChevron} hidden sm:inline-flex`} aria-hidden>
                →
              </span>
            ) : null}
            {isDeleting ? (
              <div className={TT_ORDERS_LIST_L5.cardDeletingOverlay} role="status" aria-live="polite">
        <span className={TT_ORDERS_LIST_L5.deletingBadge}>
                  {t("orders_list_deleting")}
                </span>
              </div>
            ) : null}
            <div className="relative z-10 flex flex-col sm:flex-row pointer-events-none">
              <div className="relative w-full sm:w-48 shrink-0 p-3 sm:p-4 sm:pr-0">
                <div
                  className={`relative aspect-[16/10] sm:aspect-auto sm:h-[168px] w-full overflow-hidden rounded-[var(--radius-lg)] ${TT_ORDERS_LIST_L5.coverPlaceholder} ${TT_ORDERS_LIST_L5.coverRing}`}
                >
                  <Image
                    src={imageUrl}
                    alt={coverAlt}
                    fill
                    className={TT_ORDERS_LIST_L5.coverImage}
                    sizes="(max-width: 640px) 100vw, 192px"
                    unoptimized={communityMediaNextImageUnoptimized(imageUrl)}
                    priority={coverEager}
                    loading={coverEager ? undefined : "lazy"}
                    fetchPriority={coverEager ? "high" : "low"}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ref-sun/20 via-transparent to-transparent opacity-0 motion-safe:transition-opacity motion-safe:duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 p-4 sm:p-5 sm:pl-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 id={`order-title-${id}`} className={TT_ORDERS_LIST_L5.destinationTitle}>
                    <OrdersListPinIcon className={`mr-1.5 inline-block align-[-2px] ${TT_ORDERS_LIST_L5.metaDestIcon}`} />
                    <OrdersListSearchHighlight text={String(locationLine)} query={highlightQuery} />
                  </h2>
                  {showDestSub ? (
                    <p className={TT_ORDERS_LIST_L5.destinationSub}>
                      <OrdersListSearchHighlight
                        text={t("orders_list_destination_detail", { destination: String(destDetail) })}
                        query={highlightQuery}
                      />
                    </p>
                  ) : null}
                  <p className={TT_ORDERS_LIST_L5.destinationMeta}>
                    <span className="inline-flex items-center gap-1.5">
                      <OrdersListCalendarIcon className={TT_ORDERS_LIST_L5.metaDateIcon} />
                      {dateLine}
                    </span>
                  </p>
                  <div className="mt-2.5">
                    <span className={badgeClass}>{statusLabel}</span>
                  </div>
                  {item?.amount != null ? (
                    <p className={TT_ORDERS_LIST_L5.amountRow}>
                      <span className={TT_ORDERS_LIST_L5.amountValue}>{item.amount}</span>
                      <span className={TT_ORDERS_LIST_L5.amountCurrency}>
                        {item?.currency ?? t("order_defaultSettlementToken")}
                      </span>
                    </p>
                  ) : null}
                  {(projectionDiverges || projectionDegraded) ? (
                    <p className={TT_ORDERS_LIST_L5.warningNote} role="note">
                      {projectionDegraded
                        ? t("orders_projection_ssot_degraded")
                        : t("orders_projection_ssot_notice_divergent_short")}
                    </p>
                  ) : null}
                  {item?.id && highlightQuery ? (
                    <p className={`${TT_ORDERS_LIST_L5.metaText} mt-1.5 font-mono truncate max-w-full`}>
                      <OrdersListSearchHighlight text={String(item.id)} query={highlightQuery} />
                    </p>
                  ) : null}
                  {item.escrow_address ? (
                    <p
                      className={`${TT_ORDERS_LIST_L5.metaText} mt-1.5 font-mono truncate max-w-full`}
                      title={item.escrow_address}
                    >
                      {t("escrow_contract")}
                      {shortEvmAddress(item.escrow_address)}
                    </p>
                  ) : null}
                </div>
                <div className={`hidden sm:flex pointer-events-auto ${TT_ORDERS_LIST_L5.cardActionsStack}`}>
                  <div className="flex flex-col gap-2">
                    {item?.id && orderLikeMayOnchainDeposit(item) && (
                      <Link
                        href={`/pay?orderId=${encodeURIComponent(String(item.id))}`}
                        onClick={stashListItemEscrowPayPrefetch}
                        data-tt-orders-list-pay-link="1"
                        className={TT_ORDERS_LIST_L5.cardEscrowBtn}
                      >
                        {t("orders_payHub")}
                      </Link>
                    )}
                    {item?.id && escrowHref ? (
                      <Link
                        href={escrowHref}
                        onClick={stashListItemEscrowPayPrefetch}
                        data-tt-orders-list-card-escrow-link="1"
                        className={TT_ORDERS_LIST_L5.cardEscrowBtn}
                      >
                        {t("orders_escrowDetail")}
                      </Link>
                    ) : null}
                  </div>
                  <div className={TT_ORDERS_LIST_L5.cardSecondaryRow}>
                    {item?.id ? (
                      <form
                        className="min-w-0 flex-1"
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          setPreviewOrder(orderListItemToDetailDrawer(item));
                        }}
                      >
                        <button type="submit" className={`${TT_ORDERS_LIST_L5.cardSecondaryBtn} w-full`}>
                          {t("orders_itineraryPreview")}
                        </button>
                      </form>
                    ) : null}
                    {canDelete && item?.id ? (
                      <form
                        className="min-w-0 flex-1"
                        onSubmit={(e: FormEvent) => {
                          e.preventDefault();
                          void handleDeleteOrder(id, state, t);
                        }}
                      >
                        <button
                          type="submit"
                          disabled={deletingId === item.id}
                          aria-busy={deletingId === item.id ? true : undefined}
                          className={`${TT_ORDERS_LIST_L5.cardDeleteBtnCompact} w-full`}
                          aria-label={t("escrow_deleteOrder")}
                        >
                          {deletingId === item.id ? t("common_submitting") : t("escrow_deleteOrder")}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </ListTag>
  );
}
