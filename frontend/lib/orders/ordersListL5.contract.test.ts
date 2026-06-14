import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ORDERS_LIST_L5_SSOT_ID,
  ORDERS_LIST_L5_VISUAL_DATA_ATTR,
  TT_ORDERS_LIST_L5,
  ordersListL5MainDataAttrs,
} from "@/lib/orders/ordersListL5";
import { filterOrdersListByClientSearch, splitTextByOrdersListSearchQuery } from "@/lib/orders/ordersListClientSearch";
import {
  filterOrdersListByUrlStateParam,
  orderListItemIsInProgress,
} from "@/lib/orders/ordersListStateFilter";
import {
  clampOrdersListCardSwipeOffset,
  resolveOrdersListCardSwipeOffsetAfterRelease,
} from "@/lib/orders/ordersListCardSwipe";
import { resolveOrdersListCardPrimaryAction } from "@/lib/orders/ordersListCardPrimaryAction";
import { countOrdersListByTerminalState } from "@/lib/orders/ordersListStateCounts";
import { buildOrdersListGetParams } from "@/lib/orders/ordersListFetchParams";
import { resolveOrdersListOrdersChainId } from "@/lib/orders/ordersListChainScope";
import { ORDERS_LIST_VIRTUAL_MIN } from "@/lib/orders/ordersListVirtualConstants";

const root = join(process.cwd());
const main = join(root, "app/orders/OrdersListPageMain.tsx");
const header = join(root, "app/orders/OrdersListPageHeader.tsx");
const cards = join(root, "app/orders/OrdersListCards.tsx");
const footer = join(root, "app/orders/OrdersListPageFooter.tsx");
const empty = join(root, "app/orders/OrdersListEmptyState.tsx");
const loading = join(root, "app/orders/OrdersPageLoadingView.tsx");
const filterRail = join(root, "app/orders/OrdersListFilterRail.tsx");
const toolbar = join(root, "app/orders/OrdersListToolbar.tsx");
const cardItem = join(root, "app/orders/OrdersListCardItem.tsx");
const searchBar = join(root, "app/orders/OrdersListSearchBar.tsx");
const cardsVirtual = join(root, "app/orders/OrdersListCardsWindowVirtual.tsx");

describe("orders list L5 contract (① · product console)", () => {
  it("exports SSOT tokens + stable data attrs", () => {
    expect(ORDERS_LIST_L5_VISUAL_DATA_ATTR).toBe("l5");
    expect(ORDERS_LIST_L5_SSOT_ID).toContain("TT-ORDERS-LIST-L5");
    expect(TT_ORDERS_LIST_L5.heroCta).toContain("text-[#0c0a09]");
    expect(TT_ORDERS_LIST_L5.title).toContain("drop-shadow-landing-hero");
    expect(TT_ORDERS_LIST_L5.heroFrame).toContain("animate-fadeUp");
    expect(TT_ORDERS_LIST_L5.pageInner).toContain("max-w-5xl");
    expect(TT_ORDERS_LIST_L5.pageShell).toContain("#0c0a09");
    expect(TT_ORDERS_LIST_L5.pageVignette).toContain("experience-landing-vignette");
    expect(TT_ORDERS_LIST_L5.dotGrid).toContain("bg-web3-dot-grid");
    expect(TT_ORDERS_LIST_L5.cardPreviewBtn).toContain("bg-slate-950");
    expect(TT_ORDERS_LIST_L5.filterTabSelected).toContain("text-white");
    expect(TT_ORDERS_LIST_L5.statusBadgeWarm).toContain("ring-ref-sun");
    expect(TT_ORDERS_LIST_L5.dotGrid).toContain("bg-web3-dot-grid");
    expect(TT_ORDERS_LIST_L5.loadMoreSpinner).toContain("animate-spin");
    expect(TT_ORDERS_LIST_L5.emptyGlow).toContain("radial-gradient");
    expect(TT_ORDERS_LIST_L5.stickyFilterRail).toContain("sticky");
    expect(TT_ORDERS_LIST_L5.filterBarScroll).toContain("overflow-x-auto");
    expect(TT_ORDERS_LIST_L5.toolbarShell).toContain("border-t border-white/10");
    expect(TT_ORDERS_LIST_L5.hintBarSlim).toContain("border-t border-white/");
    expect(TT_ORDERS_LIST_L5.hintChevron).toContain("group-open:rotate-180");
    expect(TT_ORDERS_LIST_L5.pageHeaderWrap).toContain("mb-3");
    expect(TT_ORDERS_LIST_L5.listEndIcon).toContain("rounded-full");
    expect(TT_ORDERS_LIST_L5.amountValue).toContain("text-h4");
    expect(TT_ORDERS_LIST_L5.cardActionsStack).toContain("flex-col");
    expect(TT_ORDERS_LIST_L5.filterTabCountBump).toContain("orders-list-l5-count-bump");
    expect(TT_ORDERS_LIST_L5.mobileActionBar).toContain("md:hidden");
    expect(ordersListL5MainDataAttrs()["data-tt-orders-list-l5"]).toBe("l5");
    expect(ordersListL5MainDataAttrs()["data-tt-orders-page"]).toBe("1");
  });

  it("OrdersListPageMain wires L5 shell + ambient", () => {
    const src = readFileSync(main, "utf8");
    expect(src).toContain("ordersListL5MainDataAttrs");
    expect(src).toContain("TT_ORDERS_LIST_L5.pageShell");
    expect(src).toContain("TT_ORDERS_LIST_L5.pageVignette");
    expect(src).toContain("TT_ORDERS_LIST_L5.ambient");
    expect(src).toContain("TT_ORDERS_LIST_L5.dotGrid");
    expect(src).toContain("OrdersListToolbar");
    expect(src).not.toContain("OrdersListSearchBar");
    expect(src).not.toContain("useOrdersListClientSearch");
    expect(src).toContain("OrdersListActiveFiltersBar");
    expect(src).toContain("clearAllFilters");
    expect(src).not.toContain("OrdersListStickyFilterDock");
    expect(src).toContain("OrdersListMobileActionBar");
    expect(src).toContain("TT_ORDERS_LIST_L5.pageInner");
    expect(src).not.toContain("text-travel-600");
    const l5 = readFileSync(join(root, "lib/orders/ordersListL5.ts"), "utf8");
    expect(l5).toContain("TT_MARKETING_ORDERS_FOOTER_CROSS_LINK");
    expect(l5).toContain("TT_MARKETING_ORDERS_TEXT_BODY");
    expect(l5).toContain("TT_MARKETING_ORDERS_TEXT_META");
    expect(TT_ORDERS_LIST_L5.bodyText).toContain("slate-200");
    expect(TT_ORDERS_LIST_L5.metaText).toContain("slate-300");
    expect(TT_ORDERS_LIST_L5.searchInput).toContain("placeholder:text-white/50");
  });

  it("header uses gradient hero CTA (filter moved to sticky rail)", () => {
    const src = readFileSync(header, "utf8");
    const railSrc = readFileSync(filterRail, "utf8");
    expect(src).toContain("TT_ORDERS_LIST_L5.heroCta");
    expect(src).toContain("heroInnerGlow");
    expect(src).toContain("orders_list_publish_hub_boundary");
    expect(src).toContain("data-tt-orders-list-publish-hub-link");
    expect(src).toContain("PUBLISH_HUB_PATH");
    expect(src).toContain("pageHeaderWrap");
    expect(src).toContain("heroScopeNote");
    expect(src).toContain("orders_list_drafts_scope_note");
    expect(src).toContain('href="/orders/new"');
    expect(src).toContain('data-tt-orders-list-book-cta="primary"');
    expect(src).not.toContain("listCountBadge");
    expect(src).not.toContain("filterBar");
    expect(railSrc).toContain("filterRailEmbedded");
    expect(railSrc).toContain("embedded");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterRailLabel");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterTabOnIndicator");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterTabIndicator");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterBarScroll");
    expect(railSrc).toContain("flex-nowrap");
    expect(railSrc).toContain("filterTabCountBadge");
    expect(railSrc).toContain("stateCounts");
    expect(railSrc).toContain("countsLoadedOnly");
    expect(railSrc).toContain("orders_list_filter_count_loaded_only_hint");
    expect(railSrc).toContain("OrdersListFilterTabCountBadge");
    expect(railSrc).toContain("ORDERS_LIST_FILTER_TAB_OPTIONS");
    expect(railSrc).toContain("orders_list_in_progress_scope_hint");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterTabIndicator");
    expect(railSrc).toContain("TT_ORDERS_LIST_L5.filterTabOnIndicator");
    expect(railSrc).not.toContain("new IntersectionObserver");
    expect(src).not.toContain("<select");
    expect(src).not.toContain("TT_MARKETING_BTN_SECONDARY_CONSOLE");
  });

  it("cards use warm action panel + escrow warm outline + status warm badge", () => {
    const src = readFileSync(cards, "utf8");
    const itemSrc = readFileSync(cardItem, "utf8");
    expect(src).toContain("OrdersListCardItem");
    expect(src).toContain("resolveOrdersListCardPrimaryAction");
    expect(src).toContain("openFocusedCardPrimary");
    expect(src).toContain("ORDERS_LIST_VIRTUAL_MIN");
    expect(src).toContain("staggerEnter={!useVirtualList}");
    expect(src).toContain("OrdersListCardsWindowVirtual");
    expect(src).toContain("OrdersListInteractionHint");
    const hintSrc = readFileSync(join(root, "app/orders/OrdersListInteractionHint.tsx"), "utf8");
    expect(hintSrc).toContain("data-tt-orders-list-hint");
    expect(hintSrc).toContain("hintChevron");
    expect(hintSrc).toContain("OrdersListHintChevron");
    expect(src).not.toContain("listCountBadge");
    expect(src).toContain('tabIndex={list.length > 0 ? 0 : undefined}');
    expect(src).toContain("pointerdown");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.listCardFrame");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.amountRow");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardActionsStack");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardSecondaryBtn");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardDeleteBtnCompact");
    expect(itemSrc).toContain("OrdersListPinIcon");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardEscrowBtn");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardSwipeShell");
    expect(itemSrc).toContain("useOrdersListCardSwipe");
    expect(itemSrc).toContain("cardSwipeEdgeGlow");
    expect(itemSrc).toContain("listCardKeyboardFocus");
    expect(itemSrc).toContain("keyboardFocused");
    expect(itemSrc).toContain("data-tt-orders-card-swipe-open");
    expect(itemSrc).toContain("hidden sm:flex");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.listCardArticle");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.amountValue");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.amountCurrency");
    expect(itemSrc).not.toContain("stickyHintBar");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.statusBadgeWarm");
    expect(itemSrc).toContain("staggerEnter");
    expect(itemSrc).toContain('loading={coverEager ? "eager" : "lazy"}');
    expect(itemSrc).toContain("coverEager");
    expect(itemSrc).not.toContain("TT_MARKETING_DRAFT_CARD_HIGHLIGHT");
    expect(itemSrc).not.toContain("cardDraftRibbon");
    expect(itemSrc).toContain("orderListItemMayRequestCancel");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.cardDeletingOverlay");
    expect(itemSrc).toContain("OrdersListSearchHighlight");
    expect(itemSrc).toContain("orders_list_destination_detail");
    expect(itemSrc).toContain("TT_ORDERS_LIST_L5.coverImage");
    expect(itemSrc).toContain("resolveOrderListCoverUrl");
    expect(itemSrc).toContain("<img");
    expect(itemSrc).not.toContain('from "next/image"');
    expect(TT_ORDERS_LIST_L5.cardEscrowBtn).toContain("text-[#0c0a09]");
    expect(itemSrc).not.toContain("TT_MARKETING_BTN_SECONDARY_CONSOLE");
  });

  it("delete confirm uses L5 dialog instead of window.confirm", () => {
    const core = readFileSync(join(root, "app/orders/useOrdersListPageCore.ts"), "utf8");
    const main = readFileSync(join(root, "app/orders/OrdersListPageMain.tsx"), "utf8");
    const dialog = readFileSync(join(root, "components/orders/OrdersListDeleteConfirmDialog.tsx"), "utf8");
    expect(core).not.toContain("window.confirm");
    expect(core).toContain("pendingDeleteOrder");
    expect(main).toContain("OrdersListDeleteConfirmDialog");
    expect(dialog).toContain("data-tt-orders-list-delete-confirm");
    expect(dialog).toContain("TT_ORDERS_LIST_L5.deleteConfirmPanel");
    expect(TT_ORDERS_LIST_L5.deleteConfirmPanel).toContain("border-ref-sun/35");
    expect(TT_ORDERS_LIST_L5.deleteConfirmBtnDanger).toContain("text-red-300");
  });

  it("toolbar uses flat sticky shell (no nested warm frame)", () => {
    const src = readFileSync(toolbar, "utf8");
    expect(src).toContain("data-tt-orders-toolbar");
    expect(src).toContain("TT_ORDERS_LIST_L5.toolbarShell");
    expect(src).toContain("TT_ORDERS_LIST_L5.toolbarInnerFlat");
    expect(src).not.toContain("toolbarFrame");
    expect(src).not.toContain("heroInnerGlow");
  });

  it("active filters bar wires unified chips", () => {
    const bar = readFileSync(join(root, "app/orders/OrdersListActiveFiltersBar.tsx"), "utf8");
    const searchSrc = readFileSync(searchBar, "utf8");
    expect(bar).toContain("data-tt-orders-active-filters");
    expect(bar).toContain("orders_list_clear_all_filters");
    expect(bar).toContain("searchResultsPaginated");
    expect(bar).toContain("searchScopeHintInline");
    expect(bar).toContain("orders_list_search_scope_hint");
    expect(bar).toContain("TT_ORDERS_LIST_L5.clearAllFiltersBtn");
    expect(searchSrc).not.toContain("activeFilterChip");
    expect(searchSrc).toContain("orders_list_search_shortcut_hint");
    expect(searchSrc).not.toContain("orders_list_search_scope_hint");
    expect(searchSrc).not.toContain("searchScopeLoadedOnly");
  });

  it("search bar supports / focus and Esc clear", () => {
    const src = readFileSync(searchBar, "utf8");
    expect(src).toContain('e.key === "/"');
    expect(src).toContain('e.key === "Escape"');
    expect(src).toContain("orders_list_search_shortcut_hint");
  });

  it("footer uses slim product L5 shell (not LandingFooter)", () => {
    const mainSrc = readFileSync(main, "utf8");
    const footerSrc = readFileSync(footer, "utf8");
    const emptySrc = readFileSync(empty, "utf8");
    const productFooter = join(root, "components/orders/OrdersProductFooter.tsx");
    const productFooterSrc = readFileSync(productFooter, "utf8");
    const railSrc = readFileSync(filterRail, "utf8");
    expect(railSrc).toContain("data-tt-orders-filter-rail");
    expect(footerSrc).toContain("OrdersProductFooter");
    expect(footerSrc).toContain("TT_ORDERS_LIST_L5.footerTopFade");
    expect(footerSrc).not.toMatch(/import\s+LandingFooter/);
    expect(productFooterSrc).toContain("data-tt-orders-product-footer");
    expect(productFooterSrc).toContain("hideFeeRouterLinks");
    expect(productFooterSrc).not.toContain("footer_col_about");
    expect(emptySrc).not.toContain("ProductCrossNav");
    expect(mainSrc).toContain("OrdersListPageFooter");
    expect(mainSrc).toContain('ordersListStateParam ?? "__all__"');
    expect(mainSrc).toContain("filterStateCounts");
    expect(mainSrc).toContain("countOrdersListByTerminalState");
    expect(mainSrc).toContain("filterOrdersListByUrlStateParam");
    expect(mainSrc).toContain("stateFilteredList");
    expect(mainSrc).toContain("countsLoadedOnly={ordersHasMore}");
    expect(emptySrc).toContain("orders_list_filter_empty");
    expect(emptySrc).toContain("orders_list_clear_filter");
    expect(emptySrc).toContain("empty_goCreateItinerary");
    expect(emptySrc).toContain("buildMarketCreateItineraryHref");
    expect(emptySrc).toContain("data-tt-orders-list-create-draft-cta");
    expect(emptySrc).not.toContain('href="/itinerary/new"');
    expect(emptySrc).not.toMatch(/filtered\s*\?\s*["']\/orders\/new["']/);
    expect(emptySrc).toContain("TT_ORDERS_LIST_L5.filterEmptyIcon");
  });

  it("loading view matches loaded ambient shell + warm skeleton", () => {
    const src = readFileSync(loading, "utf8");
    const skeleton = readFileSync(join(root, "components/orders/OrdersListPageLoadingSkeleton.tsx"), "utf8");
    expect(src).toContain("TT_ORDERS_LIST_L5.pageShell");
    expect(src).toContain("TT_ORDERS_LIST_L5.pageVignette");
    expect(src).toContain("TT_ORDERS_LIST_L5.ambient");
    expect(src).toContain("TT_ORDERS_LIST_L5.dotGrid");
    expect(src).toContain("OrdersListPageHeroLoadingSkeleton");
    expect(skeleton).toContain("skeletonShimmer");
    expect(src).toContain("TT_ORDERS_LIST_L5.hintBarSlim");
    expect(src).toContain("OrdersListToolbarLoadingSkeleton");
    expect(skeleton).toContain("OrdersListToolbarLoadingSkeleton");
    expect(skeleton).toContain("OrdersListFilterRailLoadingSkeleton");
  });

  it("load more + footer use warm L5 tokens", () => {
    const loadMore = readFileSync(join(root, "app/orders/OrdersListLoadMoreSection.tsx"), "utf8");
    const footerSrc = readFileSync(footer, "utf8");
    const skeleton = readFileSync(join(root, "components/orders/OrdersListPageLoadingSkeleton.tsx"), "utf8");
    expect(loadMore).toContain("TT_ORDERS_LIST_L5.loadMoreBtn");
    expect(loadMore).toContain("TT_ORDERS_LIST_L5.listEndPanel");
    expect(loadMore).toContain("OrdersListLoadMoreRowSkeleton");
    expect(loadMore).toContain("TT_ORDERS_LIST_L5.listEndIcon");
    expect(loadMore).not.toContain("orders_list_search_scope_hint");
    expect(skeleton).toContain("OrdersListLoadMoreRowSkeleton");
    expect(loadMore).not.toContain("TT_MARKETING_BTN_SECONDARY_CONSOLE");
    expect(footerSrc).toContain("TT_ORDERS_LIST_L5.footerTopFade");
  });

  it("alerts + book guide + empty use warm L5 tokens (no gray console secondary)", () => {
    const alerts = readFileSync(join(root, "app/orders/OrdersListAlertsSection.tsx"), "utf8");
    const bookGuide = readFileSync(join(root, "app/orders/OrdersBookGuideBannerSection.tsx"), "utf8");
    const emptySrc = readFileSync(empty, "utf8");
    expect(alerts).toContain("TT_ORDERS_LIST_L5.alertPanel");
    expect(alerts).toContain("TT_ORDERS_LIST_L5.expectBannerPanel");
    expect(alerts).not.toContain("TT_MARKETING_BTN_SECONDARY_CONSOLE");
    expect(bookGuide).toContain("TT_ORDERS_LIST_L5.heroFrame");
    expect(bookGuide).toContain("TT_ORDERS_LIST_L5.bookGuideCtaPrimary");
    expect(bookGuide).toContain("skeletonShimmer");
    expect(emptySrc).toContain("TT_ORDERS_LIST_L5.emptyGlow");
    expect(emptySrc).toContain("TT_ORDERS_LIST_L5.listItemEnter");
    expect(emptySrc).toContain("TT_ORDERS_LIST_L5.emptySecondaryBtn");
    expect(emptySrc).not.toContain("TT_MARKETING_BTN_SECONDARY_CONSOLE");
  });

  it("orders list route files avoid light-console ink text classes", () => {
    const paths = [
      main,
      header,
      cards,
      footer,
      empty,
      loading,
      filterRail,
      toolbar,
      cardItem,
      searchBar,
      join(root, "app/orders/OrdersListAlertsSection.tsx"),
      join(root, "app/orders/OrdersListLoadMoreSection.tsx"),
      join(root, "app/orders/OrdersBookGuideBannerSection.tsx"),
      join(root, "app/orders/OrdersListPageFooter.tsx"),
      join(root, "components/orders/OrdersListRouteSuspense.tsx"),
    ];
    for (const p of paths) {
      const src = readFileSync(p, "utf8");
      expect(src).not.toMatch(/text-ink-/);
      expect(src).not.toContain("bg-bg-console");
    }
    expect(TT_ORDERS_LIST_L5.crossNavLink).toContain("slate-200");
    expect(TT_ORDERS_LIST_L5.cardDeleteBtn).toContain("text-red-300");
  });

  it("globals defines orders list L5 rise animation scoped to data attr", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    expect(css).toContain(".bg-experience-landing-vignette");
    expect(css).toContain("@keyframes orders-list-l5-rise");
    expect(css).toContain('[data-tt-orders-list-l5="l5"] .orders-list-l5-rise');
    expect(css).toContain("@keyframes orders-list-l5-shimmer");
    expect(css).toContain("@keyframes orders-list-l5-count-bump");
    expect(css).toContain('[data-tt-orders-list-l5="l5"] .orders-list-l5-count-bump');
    expect(css).toContain("@keyframes orders-list-l5-sync-progress");
    expect(css).toContain('[data-tt-orders-list-l5="l5"] .orders-list-l5-sync-progress');
    expect(css).toContain('[data-tt-orders-list-l5="l5"] .orders-list-l5-shimmer');
  });

  it("client search filters loaded list fields", () => {
    const sample = [
      { id: "abc-123", destination: "Guilin", country: "China", city: "Guilin" },
      { id: "def-456", destination: "Tokyo", country: "Japan", city: "Tokyo" },
    ];
    expect(filterOrdersListByClientSearch(sample, "")).toHaveLength(2);
    expect(filterOrdersListByClientSearch(sample, "tokyo")).toHaveLength(1);
    expect(filterOrdersListByClientSearch(sample, "abc")).toHaveLength(1);
    expect(filterOrdersListByClientSearch(sample, "nope")).toHaveLength(0);
  });

  it("client search highlight splits case-insensitive matches", () => {
    const parts = splitTextByOrdersListSearchQuery("Guilin Sunset", "gui");
    expect(parts.some((p) => p.match && p.text === "Gui")).toBe(true);
    expect(parts.filter((p) => p.match)).toHaveLength(1);
    const multi = splitTextByOrdersListSearchQuery("aaAAaa", "aa");
    expect(multi.filter((p) => p.match)).toHaveLength(3);
  });

  it("state counts aggregate loaded orders incl. in progress", () => {
    const sample = [
      { id: "1", state: "completed" },
      { id: "2", state: "canceled" },
      { id: "3", state: "disputed" },
      { id: "4", state: "draft" },
      { id: "5", state: "accepted" },
      { id: "6", state: "escrowed" },
    ];
    const counts = countOrdersListByTerminalState(sample);
    expect(counts.__all__).toBe(5);
    expect(counts.completed).toBe(1);
    expect(counts.cancelled).toBe(1);
    expect(counts.disputed).toBe(1);
    expect(counts.in_progress).toBe(2);
  });

  it("default all tab hides cancelled rows", () => {
    const sample = [
      { id: "1", state: "completed" },
      { id: "2", state: "cancelled" },
      { id: "3", state: "created" },
    ];
    const filtered = filterOrdersListByUrlStateParam(sample, "");
    expect(filtered.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("in_progress filter matches created/accepted/escrowed on loaded list", () => {
    const sample = [
      { id: "1", state: "completed" },
      { id: "2", state: "created" },
      { id: "3", state: "accepted" },
    ];
    expect(orderListItemIsInProgress(sample[1]!)).toBe(true);
    const filtered = filterOrdersListByUrlStateParam(sample, "in_progress");
    expect(filtered).toHaveLength(2);
    expect(filtered.map((o) => o.id)).toEqual(["2", "3"]);
  });

  it("virtual list uses window virtualizer above threshold", () => {
    const src = readFileSync(cardsVirtual, "utf8");
    expect(ORDERS_LIST_VIRTUAL_MIN).toBeGreaterThanOrEqual(10);
    expect(src).toContain("useWindowVirtualizer");
    expect(src).toContain("data-tt-orders-card-list-virtual");
    expect(src).toContain("measureElement");
  });

  it("fetch params wire chain scope + server search q", () => {
    const p = buildOrdersListGetParams({ stateParam: "in_progress", searchQ: "gui" });
    expect(p.q).toBe("gui");
    expect(p.state).toBeUndefined();
    expect(typeof resolveOrdersListOrdersChainId()).toBe("number");
    const core = readFileSync(join(root, "app/orders/useOrdersListPageCore.ts"), "utf8");
    expect(core).toContain("buildOrdersListGetParams");
    expect(core).toContain("ordersListSearchParam");
    expect(core).toContain("filterOrdersForOrdersListPage(deduped, ordersListStateParam)");
    expect(core).not.toContain("filterOrdersForTransactionalMyOrdersSurface");
  });

  it("primary action prefers pay then escrow", () => {
    const payFirst = resolveOrdersListCardPrimaryAction({
      id: "o-1",
      state: "accepted",
      amount: "100",
    } as Parameters<typeof resolveOrdersListCardPrimaryAction>[0]);
    expect(payFirst.kind === "pay" || payFirst.kind === "escrow").toBe(true);
    const escrowOnly = resolveOrdersListCardPrimaryAction({
      id: "o-2",
      state: "completed",
    } as Parameters<typeof resolveOrdersListCardPrimaryAction>[0]);
    expect(escrowOnly.kind).toBe("escrow");
    expect(escrowOnly.kind === "escrow" && escrowOnly.draft).toBe(false);
  });

  it("card swipe offset clamps and snaps open", () => {
    expect(clampOrdersListCardSwipeOffset(20)).toBe(0);
    expect(clampOrdersListCardSwipeOffset(-200)).toBe(-132);
    expect(resolveOrdersListCardSwipeOffsetAfterRelease(-80)).toBe(-132);
    expect(resolveOrdersListCardSwipeOffsetAfterRelease(-20)).toBe(0);
  });
});
