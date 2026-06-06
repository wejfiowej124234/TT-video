"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { AcquisitionListingDetailBody } from "@/components/market/AcquisitionListingDetailBody";
import { MerchantShowcaseDetailBody } from "@/components/market/MerchantShowcaseDetailBody";
import {
  marketDetailDrawerBody,
  marketDetailDrawerCloseBtn,
  marketDetailDrawerHeaderRow,
  marketDetailDrawerInnerCol,
  marketDetailDrawerPanel,
  marketDetailDrawerScrim,
  marketDetailDrawerSecondaryBtn,
  marketDetailDrawerSkeletonLine,
  marketDetailDrawerTitle,
} from "@/components/market/marketDetailDrawerClasses";
import {
  getDemoAcquisitionListing,
  getDemoMerchantListing,
  pickL10n,
} from "@/lib/marketSubsiteDemo";
import type { DemoAcquisitionListing, DemoMerchantListing } from "@/lib/marketSubsiteDemo";
import {
  catalogDetailToDemoAcquisitionListing,
  catalogDetailToDemoMerchantListing,
} from "@/lib/marketCatalogAdapter";
import { getMarketAcquisitionListing, getMarketProviderListing } from "@/lib/apiClient/marketSubsite";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";
import { trackMarketEvent } from "@/lib/analytics";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { TT_MARKETING_BTN_MARKET_PRIMARY } from "@/lib/marketingUi";

/**
 * 商家橱窗 / 旅行收购：列表「查看详情」与旅行预约订单侧栏一致，从右侧抽屉打开。
 * **`catalogSourced`**：列表来自 **`postgres_catalog`** 时，对非演示 id 走 **`GET …/listings/:id`**。
 * **深链卫生**：404 / 空体 / 坏包视为「条目不存在」→ `onClose()` 清 `?listing=`；网络/503 等可恢复错误保留 query 并展示重试。
 */
export function MarketSubsiteListingDetailDrawer({
  variant,
  listingId,
  onClose,
  catalogSourced = false,
}: {
  variant: "provider" | "acquisition";
  listingId: string | null;
  onClose: () => void;
  catalogSourced?: boolean;
}) {
  const { locale, t } = useTranslation();
  const titleId = useId();
  const errorAlertId = useId();
  const [remoteMerchant, setRemoteMerchant] = useState<DemoMerchantListing | null>(null);
  const [remoteAcquisition, setRemoteAcquisition] = useState<DemoAcquisitionListing | null>(null);
  /** 目录侧确认无此 id（404、空、字段不齐）→ 父级 `onClose` 应从 URL 去掉 `listing` */
  const [remoteCatalogGone, setRemoteCatalogGone] = useState(false);
  /** 可恢复错误：保留深链，用户可重试 */
  const [remoteCatalogLoadError, setRemoteCatalogLoadError] = useState<string | null>(null);
  const [catalogFetchRetryTick, setCatalogFetchRetryTick] = useState(0);

  const demoAllowed = marketSubsiteDemoStudioFallbackEnabled();
  const demoMerchant =
    variant === "provider" && listingId && demoAllowed ? getDemoMerchantListing(listingId) : undefined;
  const demoAcquisition =
    variant === "acquisition" && listingId && demoAllowed ? getDemoAcquisitionListing(listingId) : undefined;

  useEffect(() => {
    setRemoteMerchant(null);
    setRemoteAcquisition(null);
    setRemoteCatalogGone(false);
    setRemoteCatalogLoadError(null);
    if (!listingId || !catalogSourced) return;
    if (variant === "provider" && demoMerchant) return;
    if (variant === "acquisition" && demoAcquisition) return;
    let cancelled = false;
    (async () => {
      try {
        const raw =
          variant === "provider"
            ? await getMarketProviderListing(listingId)
            : await getMarketAcquisitionListing(listingId);
        if (cancelled) return;
        if (raw == null || typeof raw !== "object") {
          setRemoteCatalogGone(true);
          return;
        }
        const body = raw as Record<string, unknown>;
        const listing = body.listing as Record<string, unknown> | undefined;
        if (!listing || typeof listing !== "object") {
          setRemoteCatalogGone(true);
          return;
        }
        const id = typeof listing.id === "string" ? listing.id : "";
        const updated_at = typeof listing.updated_at === "string" ? listing.updated_at : "";
        const payload = listing.payload;
        if (!id || !updated_at || payload == null || typeof payload !== "object" || Array.isArray(payload)) {
          setRemoteCatalogGone(true);
          return;
        }
        const common = {
          id,
          payload: payload as Record<string, unknown>,
          updated_at,
        };
        if (variant === "provider") {
          setRemoteMerchant(catalogDetailToDemoMerchantListing(common));
        } else {
          setRemoteAcquisition(catalogDetailToDemoAcquisitionListing(common));
        }
      } catch (err) {
        if (!cancelled) {
          setRemoteCatalogLoadError(mapApiReadError(err, t, "guideDetail_loadFailed"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, catalogSourced, variant, demoMerchant, demoAcquisition, catalogFetchRetryTick, t]);

  const merchant = demoMerchant ?? remoteMerchant;
  const acquisition = demoAcquisition ?? remoteAcquisition;
  const listing = merchant ?? acquisition;

  const isCatalogDetailLoading =
    Boolean(listingId) &&
    catalogSourced &&
    !demoMerchant &&
    !demoAcquisition &&
    !listing &&
    !remoteCatalogGone &&
    !remoteCatalogLoadError;

  const isCatalogDetailError =
    Boolean(listingId) &&
    catalogSourced &&
    remoteCatalogLoadError != null &&
    !listing &&
    !remoteCatalogGone;

  const trapRef = useFocusTrap(
    Boolean(listingId && (listing || isCatalogDetailLoading || isCatalogDetailError)),
    onClose,
  );

  const drawerTitle =
    merchant != null
      ? pickL10n(merchant.title, locale)
      : acquisition != null
        ? pickL10n(acquisition.title, locale)
        : t("order_drawerTitle");

  useEffect(() => {
    if (!listing) return;
    trackMarketEvent("market_subsite_detail_view", {
      variant: variant === "provider" ? "provider" : "acquisition",
      listingId: listing.id,
    });
  }, [listing, variant]);

  useEffect(() => {
    if (!listingId) return;
    if (!listing && !isCatalogDetailLoading && !isCatalogDetailError) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [listingId, listing, isCatalogDetailLoading, isCatalogDetailError]);

  useEffect(() => {
    if (!listingId || !remoteCatalogGone) return;
    onClose();
  }, [listingId, remoteCatalogGone, onClose]);

  if (!listingId) return null;
  if (remoteCatalogGone) return null;

  if (isCatalogDetailLoading) {
    return (
      <div
        data-tt-market-subsite-listing-drawer="1"
        className={marketDetailDrawerScrim}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div ref={trapRef} className={marketDetailDrawerPanel} onClick={(e) => e.stopPropagation()}>
          <div className={marketDetailDrawerInnerCol}>
            <div className={marketDetailDrawerHeaderRow}>
              <h2 id={titleId} className={marketDetailDrawerTitle}>
                {t("order_drawerTitle")}
              </h2>
              <form
                className="inline shrink-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  onClose();
                }}
              >
                <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("order_closeDrawer")}>
                  ✕
                </button>
              </form>
            </div>
            <div className={`${marketDetailDrawerBody} space-y-3`}>
              <div className={`h-6 w-48 ${marketDetailDrawerSkeletonLine}`} aria-hidden />
              <div className={`h-4 w-full max-w-md ${marketDetailDrawerSkeletonLine}`} aria-hidden />
              <div className={`h-4 w-[90%] ${marketDetailDrawerSkeletonLine}`} aria-hidden />
              <p className="text-small text-slate-400 pt-2" role="status" aria-live="polite">
                {t("common_loading")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCatalogDetailError && remoteCatalogLoadError) {
    return (
      <div
        data-tt-market-subsite-listing-drawer="1"
        className={marketDetailDrawerScrim}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div ref={trapRef} className={marketDetailDrawerPanel} onClick={(e) => e.stopPropagation()}>
          <div className={marketDetailDrawerInnerCol}>
            <div className={marketDetailDrawerHeaderRow}>
              <h2 id={titleId} className={marketDetailDrawerTitle}>
                {t("order_drawerTitle")}
              </h2>
              <form
                className="inline shrink-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  onClose();
                }}
              >
                <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("order_closeDrawer")}>
                  ✕
                </button>
              </form>
            </div>
            <div className={marketDetailDrawerBody}>
              <p id={errorAlertId} className="text-small text-rose-200/95" role="alert">
                {remoteCatalogLoadError}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={TT_MARKETING_BTN_MARKET_PRIMARY}
                  onClick={() => {
                    setRemoteCatalogLoadError(null);
                    setCatalogFetchRetryTick((n) => n + 1);
                  }}
                >
                  {t("common_retry")}
                </button>
                <form
                  className="inline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onClose();
                  }}
                >
                  <button
                    type="submit"
                    className={marketDetailDrawerSecondaryBtn}
                  >
                    {t("common_cancel")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div
      data-tt-market-subsite-listing-drawer="1"
      className={marketDetailDrawerScrim}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={trapRef} className={marketDetailDrawerPanel} onClick={(e) => e.stopPropagation()}>
        <div className={marketDetailDrawerInnerCol}>
          <div className={marketDetailDrawerHeaderRow}>
            <h2 id={titleId} className={marketDetailDrawerTitle}>
              {drawerTitle}
            </h2>
            <form
              className="inline shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("order_closeDrawer")}>
                ✕
              </button>
            </form>
          </div>
          <div className={marketDetailDrawerBody}>
            {merchant != null ? (
              <MerchantShowcaseDetailBody listing={merchant} embed={{ onClose }} catalogSourced={catalogSourced} />
            ) : (
              <AcquisitionListingDetailBody listing={acquisition!} embed={{ onClose }} catalogSourced={catalogSourced} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
