"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { GuideCardItem } from "./GuideCard";
import {
  filterGuidePublicServiceTypes,
  formatGuideLanguages,
  formatGuidePublicBio,
  formatGuideHourlyRateLabel,
  formatGuideServiceTypeLabel,
} from "@/lib/marketDisplayCopy";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import MarketDetailDrawerFrame from "@/components/market/MarketDetailDrawerFrame";
import {
  marketDetailDrawerAvatarFallback,
  marketDetailDrawerBlockLink,
  marketDetailDrawerBody,
  marketDetailDrawerCloseBtn,
  marketDetailDrawerHeaderRow,
  marketDetailDrawerInnerCol,
  marketDetailDrawerMeta,
  marketDetailDrawerPrimaryCta,
  marketDetailDrawerSecondaryBtn,
  marketDetailDrawerSkeletonBlock,
  marketDetailDrawerSkeletonLine,
  marketDetailDrawerSubtle,
  marketDetailDrawerTagPill,
  marketDetailDrawerTitle,
} from "@/components/market/marketDetailDrawerClasses";
import { resolveGuideAvatarUrl } from "@/lib/marketMediaFallback";
import { getGuide } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { GuideIdentityStakeTrustBadge } from "@/components/guide/GuideIdentityStakeTrustBadge";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";
import { guideDetailHrefForBind } from "@/lib/ordersGuideDeepLink";

function mergeGuideFromApi(base: GuideCardItem, api: unknown): GuideCardItem {
  if (api == null || typeof api !== "object") return base;
  const patch = api as Partial<GuideCardItem>;
  return { ...base, ...patch, id: base.id };
}

/** P29 向导详情抽屉：介绍、服务类型、报价范围占位、CTA；与订单抽屉共用 premium 深色壳 */
export default function GuideDetailDrawer({
  guide,
  onClose,
  onInvite,
  bindGuideToOrderId,
}: {
  guide: GuideCardItem | null;
  onClose: () => void;
  onInvite?: (guideId: string) => void;
  /** Escrow / 行程绑定向导：查看完整页时保留订单上下文 */
  bindGuideToOrderId?: string;
}) {
  const { t } = useTranslation();
  const dash = t("ui_em_dash");
  const trapRef = useFocusTrap(!!guide, onClose);
  const drawerTitleId = useId();
  const drawerDescId = useId();
  const guideRef = useRef<GuideCardItem | null>(null);
  guideRef.current = guide;

  const [displayGuide, setDisplayGuide] = useState<GuideCardItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [detailFetchRetryTick, setDetailFetchRetryTick] = useState(0);

  useEffect(() => {
    if (!guide) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [guide]);

  useEffect(() => {
    const g = guideRef.current;
    if (!g) return;
    const idRaw = String(g.id ?? "").trim();
    if (!idRaw) {
      setDisplayGuide(null);
      setLoadingDetail(false);
      setFetchError(null);
      setNotFound(false);
      return;
    }
    const requestedId = idRaw;
    setDisplayGuide(g);
    setFetchError(null);
    setNotFound(false);
    setLoadingDetail(true);
    let cancelled = false;
    getGuide(requestedId)
      .then((raw) => {
        if (cancelled) return;
        const cur = guideRef.current;
        if (!cur || String(cur.id ?? "").trim() !== requestedId) return;
        setDisplayGuide(mergeGuideFromApi(cur, raw));
        setFetchError(null);
        setNotFound(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const cur = guideRef.current;
        if (!cur || String(cur.id ?? "").trim() !== requestedId) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "guide_not_found" || msg === "not_found") {
          setNotFound(true);
          setFetchError(null);
        } else {
          setFetchError(mapApiReadError(err, t, "guideDetail_loadFailed"));
          setNotFound(false);
        }
      })
      .finally(() => {
        if (cancelled) return;
        const cur = guideRef.current;
        if (!cur || String(cur.id ?? "").trim() !== requestedId) return;
        setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [guide?.id, detailFetchRetryTick, t]);

  if (!guide) return null;

  const invalidId = !String(guide.id ?? "").trim();
  const shellGuide = displayGuide ?? guide;
  const name = formatGuideDisplayName(t, shellGuide);
  const bioText = formatGuidePublicBio(shellGuide.bio, 2000);
  const langs = formatGuideLanguages(shellGuide.languages, t, "、");
  const tags = filterGuidePublicServiceTypes(shellGuide.service_types);
  const avatarAlt = t("guide_card_avatarAlt").replace("{{name}}", name);
  const avatarSrc = resolveGuideAvatarUrl(shellGuide);

  const neutralActions = (
    <div className="flex flex-col gap-2 pt-2">
      <form
        className="w-full"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button type="submit" className={marketDetailDrawerBlockLink}>
          {t("guide_detail_close")}
        </button>
      </form>
      <Link
        href="/market"
        className={`${touchTargetLink44Classes} text-small text-center font-medium ${TT_MARKETING_MARKET_DARK_PATH.inlineLinkUnderline} ${TT_MARKETING_MARKET_DARK_PATH.drawerControlFocus}`}
      >
        {t("market_meta_title")}
      </Link>
    </div>
  );

  return (
    <MarketDetailDrawerFrame
      panelRef={trapRef}
      onRequestClose={onClose}
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
      aria-busy={loadingDetail ? true : undefined}
    >
      <div className={marketDetailDrawerInnerCol}>
        <div className={marketDetailDrawerHeaderRow}>
          <h2 id={drawerTitleId} className={marketDetailDrawerTitle}>
            {t("guide_detail_title")}
          </h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("guide_detail_close")}>
              ✕
            </button>
          </form>
        </div>
        <div id={drawerDescId} className={marketDetailDrawerBody}>
          {invalidId ? (
            <div className="space-y-3 py-1">
              <p className="text-body font-medium text-white">{t("market_guideDrawer_invalidId")}</p>
              <p className={marketDetailDrawerMeta}>{t("market_guideDrawer_notFoundHint")}</p>
              {neutralActions}
            </div>
          ) : null}

          {!invalidId && notFound ? (
            <div className="space-y-3 py-1">
              <p className="text-body font-medium text-white">{t("guideDetail_notFound")}</p>
              <p className={marketDetailDrawerMeta}>{t("market_guideDrawer_notFoundHint")}</p>
              {neutralActions}
            </div>
          ) : null}

          {!invalidId && !notFound ? (
            <>
              {fetchError ? (
                <div className="space-y-2">
                  <ApiErrorAlert message={fetchError} tone="dark" />
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      if (loadingDetail) return;
                      setDetailFetchRetryTick((n) => n + 1);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loadingDetail}
                      aria-busy={loadingDetail ? true : undefined}
                      aria-label={t("common_retry")}
                      className={marketDetailDrawerSecondaryBtn}
                    >
                      {loadingDetail ? t("common_retrying") : t("common_retry")}
                    </button>
                  </form>
                </div>
              ) : null}
              {loadingDetail && !fetchError ? (
                <div
                  className="space-y-2"
                  role="status"
                  aria-live="polite"
                  aria-busy={true}
                  aria-label={t("common_loading")}
                >
                  <p className="sr-only">{t("common_loading")}</p>
                  <div className={`h-3 w-40 max-w-[55%] ${marketDetailDrawerSkeletonLine}`} />
                  <div className={`h-12 w-full ${marketDetailDrawerSkeletonBlock}`} />
                  <div className={`h-12 w-full ${marketDetailDrawerSkeletonBlock}`} />
                </div>
              ) : null}
              <div className={`flex items-center gap-3 ${loadingDetail ? "opacity-70" : ""}`}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-ref-sun/22">
                  <Image
                    src={avatarSrc}
                    alt={avatarAlt}
                    fill
                    className="object-cover object-top"
                    sizes="56px"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <div className={`hidden ${marketDetailDrawerAvatarFallback}`} aria-hidden="true">
                    {shellGuide.city?.charAt(0) ?? "导"}
                  </div>
                </div>
                <div>
                  <p className="text-body font-semibold text-white">{name}</p>
                  <p className={marketDetailDrawerSubtle}>{shellGuide.city ?? dash}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={TT_MARKETING_MARKET_DARK_PATH.trustDidVerified}>
                      <span aria-hidden="true" className="text-ref-sun/85">
                        ✓
                      </span>{" "}
                      {t("guide_detail_didVerified")}
                    </span>
                    {shellGuide.stake_amount?.trim() ? (
                      <GuideIdentityStakeTrustBadge stakeAmount={shellGuide.stake_amount.trim()} size="sm" />
                    ) : null}
                  </div>
                </div>
              </div>
              {(shellGuide.rating != null || shellGuide.completedCount != null || shellGuide.responseSLA) && (
                <div className={`flex flex-wrap gap-3 ${marketDetailDrawerMeta}`}>
                  {shellGuide.rating != null && (
                    <span>{t("guide_card_rating").replace("{{n}}", String(shellGuide.rating))}</span>
                  )}
                  {shellGuide.completedCount != null && (
                    <span>{t("guide_card_completed").replace("{{n}}", String(shellGuide.completedCount))}</span>
                  )}
                  {shellGuide.responseSLA && (
                    <span>{t("guide_card_response").replace("{{n}}", shellGuide.responseSLA)}</span>
                  )}
                </div>
              )}
              {shellGuide.hourly_rate != null && shellGuide.hourly_rate !== "" && (
                <div>
                  <p className={`${marketDetailDrawerMeta} mb-0.5`}>{t("guide_detail_price")}</p>
                  <p className="text-body font-semibold text-ref-sun">
                    {formatGuideHourlyRateLabel(shellGuide, t)}
                  </p>
                  {(shellGuide.priceRange?.guideFeePerDay != null || shellGuide.priceRange?.carFeePerDay != null) && (
                    <p className={`${marketDetailDrawerMeta} mt-1`}>
                      {shellGuide.priceRange.guideFeePerDay != null &&
                        t("guide_card_feePerDay").replace("{{amount}}", String(shellGuide.priceRange.guideFeePerDay))}
                      {shellGuide.priceRange.carFeePerDay != null &&
                        ` · ${t("guide_card_carPerDay").replace("{{amount}}", String(shellGuide.priceRange.carFeePerDay))}`}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className={`${marketDetailDrawerMeta} mb-0.5`}>{t("guide_card_lang").replace("：", "")}</p>
                <p className="text-small text-slate-200">{langs}</p>
              </div>
              {tags.length > 0 && (
                <div>
                  <p className={`${marketDetailDrawerMeta} mb-1`}>{t("guide_detail_specialty")}</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className={marketDetailDrawerTagPill}>
                        {formatGuideServiceTypeLabel(tag, t)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className={`${marketDetailDrawerMeta} mb-0.5`}>{t("guide_detail_bio")}</p>
                {bioText ? (
                  <UgcTranslatedText
                    as="p"
                    className="text-small text-slate-300 whitespace-pre-wrap"
                    policy="cache_first"
                    contentClass="guide"
                    contentId={shellGuide.id}
                    field="bio"
                    originalText={bioText}
                  />
                ) : (
                  <p className="text-small text-slate-300 whitespace-pre-wrap">{t("guide_detail_bioEmpty")}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {onInvite && (
                  <form
                    className="w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onInvite(shellGuide.id);
                    }}
                  >
                    <button type="submit" disabled={loadingDetail} className={marketDetailDrawerPrimaryCta}>
                      {t("guide_card_book")}
                    </button>
                  </form>
                )}
                <Link
                  href={guideDetailHrefForBind(shellGuide.id, bindGuideToOrderId)}
                  className={marketDetailDrawerBlockLink}
                >
                  {t("guide_detail_viewPage")}
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </MarketDetailDrawerFrame>
  );
}
