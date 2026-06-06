"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { getIdempotencyKey } from "@/lib/apiClient";
import {
  postMarketAcquisitionListingOrder,
  postMarketProviderListingOrder,
} from "@/lib/apiClient/marketSubsite";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { trackMarketEvent } from "@/lib/analytics";
import AcquisitionFulfillmentBondBanner from "@/components/market/AcquisitionFulfillmentBondBanner";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_MARKET_PRIMARY_PILL, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOrderId(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const root = res as Record<string, unknown>;
  const order = root.order;
  if (order && typeof order === "object" && typeof (order as Record<string, unknown>).id === "string") {
    return (order as Record<string, unknown>).id as string;
  }
  if (typeof root.order_id === "string") return root.order_id;
  return null;
}

/** 94 §4 / §6：catalog listing → **`POST …/listings/:id/orders`** → **`/escrow/:id`** */
export default function MarketSubsiteListingOrderCta({
  variant,
  listingId,
  catalogSourced,
  bountyMaxUsdc,
}: {
  variant: "provider" | "acquisition";
  listingId: string;
  catalogSourced: boolean;
  /** 收购 listing 赏金上限（USDC）；用于履约保证金提示 */
  bountyMaxUsdc?: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateOrder = catalogSourced && UUID_RE.test(listingId.trim());
  const primaryLabel =
    variant === "provider" ? t("market_subsite_cta_create_order") : t("market_subsite_cta_accept_carry");
  const D = TT_MARKETING_MARKET_DARK_PATH;

  const onCreateOrder = useCallback(async () => {
    if (!canCreateOrder) return;
    setLoading(true);
    setError(null);
    trackMarketEvent("market_subsite_listing_order_click", { variant, listingId });
    try {
      const idem = getIdempotencyKey();
      const res =
        variant === "provider"
          ? await postMarketProviderListingOrder(listingId, idem)
          : await postMarketAcquisitionListingOrder(listingId, idem);
      const orderId = parseOrderId(res);
      if (!orderId) {
        setError(t("market_subsite_order_create_failed"));
        return;
      }
      trackMarketEvent("market_subsite_listing_order_created", { variant, listingId, orderId });
      router.push(`/escrow/${encodeURIComponent(orderId)}`);
    } catch (e) {
      setError(mapApiReadError(e, t, "market_subsite_order_create_failed"));
    } finally {
      setLoading(false);
    }
  }, [canCreateOrder, listingId, router, t, variant]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {variant === "acquisition" && typeof bountyMaxUsdc === "number" ? (
        <div className="w-full">
          <AcquisitionFulfillmentBondBanner bountyMaxUsdc={bountyMaxUsdc} />
        </div>
      ) : null}
      {canCreateOrder ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void onCreateOrder()}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY_PILL} disabled:opacity-60 ${travelFocusRingOffset2Classes}`}
        >
          {loading ? t("market_subsite_order_creating") : primaryLabel}
        </button>
      ) : (
        <Link
          href="/orders/new"
          className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY_PILL} ${travelFocusRingOffset2Classes}`}
        >
          {primaryLabel}
        </Link>
      )}
      <Link
        href="/orders"
        className={`${touchTargetLink44Classes} ${D.subsiteGhostCta} ${travelFocusRingOffset2Classes}`}
      >
        {t("market_subsite_cta_orders")}
      </Link>
      <Link
        href="/pay"
        className={`${touchTargetLink44Classes} ${D.subsiteGhostCta} ${travelFocusRingOffset2Classes}`}
      >
        {t("market_subsite_cta_pay_hub")}
      </Link>
      {error ? (
        <p className="w-full text-meta text-red-300/95" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}