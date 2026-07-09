"use client";

import { useTranslation } from "@/components/LocaleProvider";
import GuideCard from "@/components/market/GuideCard";
import type { GuideCardItem } from "@/components/market/GuideCard";
import EmptyState from "@/components/market/EmptyState";
import { GuideCardSkeleton } from "@/components/market/MarketSkeleton";
import { trackMarketEvent } from "@/lib/analytics";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;
import { MARKET_GUIDE_SHOWCASE } from "@/lib/marketMockData";
import { marketPublicShowcaseFallbackEnabled } from "@/lib/marketPublicDisplayGate";
import { resolveMarketGuideForDetail } from "./marketContentModel";

type View = "split" | "orders" | "guides";

type Props = {
  marketGuidesHeadingId: string;
  view: View;
  showGuides: boolean;
  loadingGuides: boolean;
  guides: GuideCardItem[];
  apiErrorGuides: string | null;
  hasFilters: boolean;
  loadGuides: () => void;
  favoritedGuideIds: Set<string>;
  toggleGuideFavorite: (id: string) => void;
  setDetailGuide: (g: GuideCardItem | null) => void;
  setBookGuideId: (id: string | null) => void;
  setBookGuideName: (name: string | null) => void;
  resetFilters: () => void;
};

export function MarketContentGuidesSection({
  marketGuidesHeadingId,
  view,
  showGuides,
  loadingGuides,
  guides,
  apiErrorGuides,
  hasFilters,
  loadGuides,
  favoritedGuideIds,
  toggleGuideFavorite,
  setDetailGuide,
  setBookGuideId,
  setBookGuideName,
  resetFilters,
}: Props) {
  const { t } = useTranslation();
  if (!showGuides) return null;

  const resolveGuide = (id: string) => resolveMarketGuideForDetail(guides, id);

  return (
    <section
      className={view === "guides" ? "lg:col-span-12" : "lg:col-span-5"}
      aria-labelledby={marketGuidesHeadingId}
      aria-busy={loadingGuides ? true : undefined}
    >
      <h2 id={marketGuidesHeadingId} className="text-body font-semibold text-white mb-3 drop-shadow-market-section">
        {t("market_guides_heading")}
      </h2>
      {showGuides &&
      (view === "split" || view === "guides") &&
      !loadingGuides &&
      guides.length === 0 &&
      apiErrorGuides == null &&
      !hasFilters &&
      marketPublicShowcaseFallbackEnabled() ? (
        <div
          className={D.marketGlassInsetPanelShowcase}
          role="region"
          aria-label={t("market_guide_showcase_aria")}
        >
          <div className="mb-3">
            <h3 className="text-small font-semibold text-white tracking-wide">{t("market_guide_showcase_title")}</h3>
            <p className="text-meta text-white/65 mt-1 leading-relaxed">{t("market_guide_showcase_hint")}</p>
          </div>
          <ul
            className={`list-none m-0 p-0 gap-4 grid ${
              view === "split" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {MARKET_GUIDE_SHOWCASE.map((g) => (
              <li key={g.id} className="min-w-0">
                <GuideCard
                  guide={g}
                  onView={(id) => {
                    trackMarketEvent("market_guide_click", { guideId: id });
                    setDetailGuide(resolveGuide(id));
                  }}
                  onBookGuide={(id) => {
                    trackMarketEvent("market_guide_click", { guideId: id });
                    const guide = resolveGuide(id);
                    setBookGuideId(id);
                    setBookGuideName(guide ? formatGuideDisplayName(t, guide) : null);
                  }}
                  isFavorited={favoritedGuideIds.has(g.id)}
                  onToggleFavorite={toggleGuideFavorite}
                  glass
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {loadingGuides ? (
        <GuideCardSkeleton
          count={view === "guides" ? 6 : 3}
          gridClass={view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}
        />
      ) : guides.length === 0 ? (
        apiErrorGuides != null ? (
          <div
            className={D.marketApiErrorPanel}
            role="region"
            aria-label={t("market_guides_loadFailed_title")}
          >
            <p className="text-body font-semibold text-white mb-2">{t("market_guides_loadFailed_title")}</p>
            <p className="text-small text-white/90 leading-relaxed" role="alert">
              {apiErrorGuides}
            </p>
            <form
              className="mt-4 inline"
              onSubmit={(e) => {
                e.preventDefault();
                loadGuides();
              }}
            >
              <button
                type="submit"
                disabled={loadingGuides}
                aria-busy={loadingGuides ? true : undefined}
                className={`${touchTargetLink44Classes} ${D.marketRetryBtn}`}
              >
                {loadingGuides ? t("common_retrying") : t("common_retry")}
              </button>
            </form>
          </div>
        ) : hasFilters ? (
          <div className={D.marketGlassInsetPanel}>
            <EmptyState kind="no-matches" onResetFilters={resetFilters} darkBg />
          </div>
        ) : (
          <div className={D.marketGlassInsetPanel}>
            <EmptyState kind="no-guides" onResetFilters={resetFilters} darkBg />
          </div>
        )
      ) : (
        <ul className={`grid gap-4 list-none p-0 m-0 ${view === "guides" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {guides.map((g) => (
            <li key={g.id}>
              <GuideCard
                guide={g}
                onView={(id) => {
                  trackMarketEvent("market_guide_click", { guideId: id });
                  setDetailGuide(resolveGuide(id));
                }}
                onBookGuide={(id) => {
                  trackMarketEvent("market_guide_click", { guideId: id });
                  const guide = resolveGuide(id);
                  setBookGuideId(id);
                  setBookGuideName(guide ? formatGuideDisplayName(t, guide) : null);
                }}
                isFavorited={favoritedGuideIds.has(g.id)}
                onToggleFavorite={toggleGuideFavorite}
                glass
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
