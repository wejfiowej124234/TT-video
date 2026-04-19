"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { GuideCardItem } from "./GuideCard";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";
import { getGuide } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";

/** 顶栏高度，抽屉内容与 sticky 标题栏留白，避免被顶栏遮挡（56-S8） */
const DRAWER_TOP_SAFE = "3.5rem";

function mergeGuideFromApi(base: GuideCardItem, api: unknown): GuideCardItem {
  if (api == null || typeof api !== "object") return base;
  const patch = api as Partial<GuideCardItem>;
  return { ...base, ...patch, id: base.id };
}

/** P29 向导详情抽屉：介绍、服务类型、报价范围占位、CTA；56-S8 顶部留白与 29 一致；B-062：`GET` 详情失败 ApiErrorAlert + 重试，未找到/无效 id 中性块 */
export default function GuideDetailDrawer({
  guide,
  onClose,
  onInvite,
}: {
  guide: GuideCardItem | null;
  onClose: () => void;
  onInvite?: (guideId: string) => void;
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

  const neutralActions = (
    <div className="flex flex-col gap-2 pt-2">
      <form
        className="w-full"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button
          type="submit"
          className={`btn-console w-full rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
        >
          {t("guide_detail_close")}
        </button>
      </form>
      <Link
        href="/market"
        className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-travel-500/40 bg-travel-500/5 px-4 py-2 text-travel-700 text-small text-center font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
      >
        {t("market_meta_title")}
      </Link>
    </div>
  );

  const name = formatGuideDisplayName(t, shellGuide);
  const langs = Array.isArray(shellGuide.languages) ? shellGuide.languages.join("、") : dash;
  const tags = Array.isArray(shellGuide.service_types) ? shellGuide.service_types : [];
  const avatarAlt = t("guide_card_avatarAlt").replace("{{name}}", name);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md bg-bg-console shadow-strong overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 flex flex-col" style={{ paddingTop: DRAWER_TOP_SAFE }}>
          <div
            className="sticky z-10 flex items-center justify-between border-b border-ink-200 bg-bg-console px-4 py-3 shrink-0"
            style={{ top: DRAWER_TOP_SAFE }}
          >
            <h2 id={drawerTitleId} className="text-body font-semibold text-ink-900 truncate pr-2">
              {t("guide_detail_title")}
            </h2>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-ink-500 hover:bg-bg-soft hover:text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                aria-label={t("guide_detail_close")}
              >
                ✕
              </button>
            </form>
          </div>
          <div id={drawerDescId} className="p-4 space-y-4 flex-1 min-h-0">
            {invalidId ? (
              <div className="space-y-3 py-1">
                <p className="text-body font-medium text-ink-900">{t("market_guideDrawer_invalidId")}</p>
                <p className="text-meta text-ink-600">{t("market_guideDrawer_notFoundHint")}</p>
                {neutralActions}
              </div>
            ) : null}

            {!invalidId && notFound ? (
              <div className="space-y-3 py-1">
                <p className="text-body font-medium text-ink-900">{t("guideDetail_notFound")}</p>
                <p className="text-meta text-ink-600">{t("market_guideDrawer_notFoundHint")}</p>
                {neutralActions}
              </div>
            ) : null}

            {!invalidId && !notFound ? (
              <>
                {fetchError ? (
                  <div className="space-y-2">
                    <ApiErrorAlert message={fetchError} />
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
                        className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
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
                    <div className="h-3 w-40 max-w-[55%] rounded-[var(--radius-sm)] bg-ink-200/90 animate-pulse" />
                    <div className="h-12 w-full rounded-[var(--radius-md)] bg-ink-200/70 animate-pulse" />
                    <div className="h-12 w-full rounded-[var(--radius-md)] bg-ink-200/60 animate-pulse" />
                  </div>
                ) : null}
                <div className={`flex items-center gap-3 ${loadingDetail ? "opacity-70" : ""}`}>
                  {shellGuide.avatar_url ? (
                    <>
                      <Image
                        src={shellGuide.avatar_url}
                        alt={avatarAlt}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }}
                        unoptimized
                      />
                      <div
                        className="hidden w-14 h-14 rounded-full bg-bg-soft flex items-center justify-center text-h4 font-semibold text-travel-500 shrink-0"
                        aria-hidden="true"
                      >
                        {shellGuide.city?.charAt(0) ?? "导"}
                      </div>
                    </>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-bg-soft flex items-center justify-center text-h4 font-semibold text-travel-500 shrink-0">
                      {shellGuide.city?.charAt(0) ?? "导"}
                    </div>
                  )}
                  <div>
                    <p className="text-body font-semibold text-ink-900">{name}</p>
                    <p className="text-small text-ink-500">{shellGuide.city ?? dash}</p>
                    <span className="inline-block mt-1 rounded-[var(--radius-sm)] bg-success/10 text-success px-2 py-0.5 text-meta font-medium">
                      {t("guide_detail_didVerified")}
                    </span>
                  </div>
                </div>
                {(shellGuide.rating != null || shellGuide.completedCount != null || shellGuide.responseSLA) && (
                  <div className="flex flex-wrap gap-3 text-small text-ink-600">
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
                    <p className="text-meta text-ink-500 mb-0.5">{t("guide_detail_price")}</p>
                    <p className="text-body font-semibold text-travel-500">
                      {t("guide_detail_perHour")
                        .replace("{{amount}}", String(shellGuide.hourly_rate))
                        .replace(
                          "{{currency}}",
                          typeof shellGuide.hourly_currency === "string" && shellGuide.hourly_currency.trim()
                            ? shellGuide.hourly_currency.trim()
                            : t("market_guide_hourly_currency_unspecified"),
                        )}
                    </p>
                    {(shellGuide.priceRange?.guideFeePerDay != null || shellGuide.priceRange?.carFeePerDay != null) && (
                      <p className="text-meta text-ink-600 mt-1">
                        {shellGuide.priceRange.guideFeePerDay != null &&
                          t("guide_card_feePerDay").replace("{{amount}}", String(shellGuide.priceRange.guideFeePerDay))}
                        {shellGuide.priceRange.carFeePerDay != null &&
                          ` · ${t("guide_card_carPerDay").replace("{{amount}}", String(shellGuide.priceRange.carFeePerDay))}`}
                      </p>
                    )}
                    <p className="text-meta text-ink-500">{t("guide_card_onChainNote")}</p>
                  </div>
                )}
                <div>
                  <p className="text-meta text-ink-500 mb-0.5">{t("guide_card_lang").replace("：", "")}</p>
                  <p className="text-small text-ink-800">{langs}</p>
                </div>
                {tags.length > 0 && (
                  <div>
                    <p className="text-meta text-ink-500 mb-1">{t("guide_detail_specialty")}</p>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[var(--radius-sm)] bg-bg-soft text-ink-700 px-2 py-0.5 text-small"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-meta text-ink-500 mb-0.5">{t("guide_detail_bio")}</p>
                  <p className="text-small text-ink-700 whitespace-pre-wrap">
                    {shellGuide.bio || t("guide_detail_bioEmpty")}
                  </p>
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
                      <button
                        type="submit"
                        disabled={loadingDetail}
                        className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium w-full disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                      >
                        {t("guide_card_book")}
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/guides/${encodeURIComponent(shellGuide.id)}`}
                    className={`${touchTargetLink44Classes} btn-console rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-ink-700 text-small text-center ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                  >
                    {t("guide_detail_viewPage")}
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
