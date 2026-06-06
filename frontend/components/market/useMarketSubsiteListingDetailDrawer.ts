"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  catalogDetailToDemoAcquisitionListing,
  catalogDetailToDemoMerchantListing,
} from "@/lib/marketCatalogAdapter";
import type { DemoAcquisitionListing, DemoMerchantListing } from "@/lib/marketSubsiteDemo";
import {
  getDemoAcquisitionListing,
  getDemoMerchantListing,
  pickL10n,
} from "@/lib/marketSubsiteDemo";
import { getMarketAcquisitionListing, getMarketProviderListing } from "@/lib/apiClient/marketSubsite";
import { marketSubsiteDemoStudioFallbackEnabled } from "@/lib/marketSubsiteProductionGate";
import { trackMarketEvent } from "@/lib/analytics";
import { mapApiReadError } from "@/lib/mapApiReadError";

export type MarketSubsiteListingDetailDrawerProps = {
  variant: "provider" | "acquisition";
  listingId: string | null;
  onClose: () => void;
  catalogSourced?: boolean;
};

/**
 * 商家橱窗 / 旅行收购：列表「查看详情」抽屉的状态与副作用（**`catalogSourced`** 时 **`GET …/listings/:id`**）。
 * 视图见 **`MarketSubsiteListingDetailDrawer.tsx`**。
 */
export function useMarketSubsiteListingDetailDrawer({
  variant,
  listingId,
  onClose,
  catalogSourced = false,
}: MarketSubsiteListingDetailDrawerProps) {
  const { locale, t } = useTranslation();
  const titleId = useId();
  const errorAlertId = useId();
  const [remoteMerchant, setRemoteMerchant] = useState<DemoMerchantListing | null>(null);
  const [remoteAcquisition, setRemoteAcquisition] = useState<DemoAcquisitionListing | null>(null);
  const [remoteCatalogGone, setRemoteCatalogGone] = useState(false);
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
    void (async () => {
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
        : t("market_subsite_listing_drawer_title");

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

  const retryCatalogFetch = () => {
    setRemoteCatalogLoadError(null);
    setCatalogFetchRetryTick((n) => n + 1);
  };

  return {
    t,
    titleId,
    errorAlertId,
    trapRef,
    merchant,
    acquisition,
    listing,
    isCatalogDetailLoading,
    isCatalogDetailError,
    remoteCatalogLoadError,
    remoteCatalogGone,
    drawerTitle,
    retryCatalogFetch,
  };
}
