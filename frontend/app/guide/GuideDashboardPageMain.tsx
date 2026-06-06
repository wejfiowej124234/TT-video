"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import GuideBillingPeriodCard from "@/components/guide/GuideBillingPeriodCard";
import GuideDashboardStats from "@/components/guide/GuideDashboardStats";
import MePageBackground from "@/components/me/MePageBackground";
import MePageSkeleton from "@/components/me/MePageSkeleton";
import GuideRegistrationStatusBanner from "@/components/guide/GuideRegistrationStatusBanner";
import MeTrustSection from "@/components/me/MeTrustSection";
import { FOCUS_RING } from "@/components/me/constants";
import { parseIdentitySlotsFromMe } from "@/lib/meIdentitySlots";
import { parseMeTrustFromMeResponse } from "@/lib/meTrust";
import { userIsGuide } from "@/lib/meRoleDisplay";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { traveltrustExperienceL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import type { GuideDashboardPageViewModel } from "./useGuideDashboardPage";

export function GuideDashboardPageMain(props: GuideDashboardPageViewModel) {
  const {
    t,
    loading,
    error,
    user,
    mePayload,
    stats,
    statsLoading,
    statsError,
    loadMe,
    retryStatsCards,
  } = props;

  if (loading) return <MePageSkeleton t={t} ariaLabelKey="guide_dashboard_title" />;

  if (error) {
    return (
      <main
        className="min-h-screen relative overflow-hidden bg-ink-900"
        aria-label={t("guide_dashboard_title")}
        {...traveltrustExperienceL5ShellDataAttrs("guide")}
        data-tt-guide-workspace-page="1"
      >
        <MePageBackground />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
          <div className="rounded-[var(--radius-md)] border border-slate-600/60 bg-ink-700/50 px-4 py-4 space-y-4">
            <h1 className="text-h2 font-bold bg-gradient-to-r from-ref-cyan via-ref-sun to-ref-coral bg-clip-text text-transparent">
              {t("guide_dashboard_title")}
            </h1>
            <ApiErrorAlert message={error} />
            <div className="flex flex-wrap gap-3">
              <form
                className="inline"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadMe();
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {t("common_retry")}
                </button>
              </form>
              <Link
                href="/me/settings/profile"
                className={`inline-flex items-center justify-center rounded-full border border-slate-500/60 bg-ink-700/60 px-4 py-2.5 min-h-[44px] text-meta text-slate-300 hover:bg-ink-600/60 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
              >
                {t("guide_dashboard_link_me")}
              </Link>
            </div>
            <ProductCrossNav
              ariaLabelKey="guide_dashboard_relatedNav_aria"
              showGuides
              className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
              separatorClassName="text-slate-500"
            />
          </div>
        </div>
      </main>
    );
  }

  const isGuide = user?.role === "guide";
  const trustSummary = user != null ? parseMeTrustFromMeResponse(mePayload, user) : null;
  const ordersGuided = typeof stats?.orders_guided === "number" ? stats.orders_guided : 0;
  const completedCount = typeof stats?.completed_count === "number" ? stats.completed_count : 0;
  const totalEarned = typeof stats?.total_earned === "number" ? stats.total_earned : 0;
  const avgScore = typeof stats?.avg_score === "number" ? stats.avg_score : null;
  const reviewsWritten = typeof stats?.reviews_count === "number" ? stats.reviews_count : 0;
  const billingPeriodUtc = typeof stats?.billing_period_utc === "string" ? stats.billing_period_utc : null;
  const periodExpectedEarnings =
    typeof stats?.period_expected_earnings === "number" ? stats.period_expected_earnings : 0;
  const periodSettledOrdersCount =
    typeof stats?.period_settled_orders_count === "number" ? stats.period_settled_orders_count : 0;

  return (
    <main
      className="min-h-screen relative overflow-hidden bg-ink-900"
      aria-label={t("guide_dashboard_title")}
      {...traveltrustExperienceL5ShellDataAttrs("guide")}
      data-tt-guide-workspace-page="1"
    >
      <MePageBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8">
        {isGuide && trustSummary != null ? (
          <GuideRegistrationStatusBanner trust={trustSummary} t={t} onRefresh={() => void loadMe({ force: true })} />
        ) : null}
        <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-ink-800/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-banner-strong">
          <h1 className="text-h2 font-bold bg-gradient-to-r from-ref-cyan via-ref-sun to-ref-coral bg-clip-text text-transparent">
            {t("guide_dashboard_title")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5">{t("guide_dashboard_subtitle")}</p>
        </header>

        {user && trustSummary != null ? (
          <MeTrustSection
            t={t}
            trust={trustSummary}
            showGuideRegisterLink={!userIsGuide(user)}
            hideGuideRegistrationRow={isGuide}
            identitySlots={mePayload ? parseIdentitySlotsFromMe(mePayload) : undefined}
            onTrustRefresh={() => void loadMe({ force: true })}
          />
        ) : null}

        {!isGuide ? (
          <div
            className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/10 px-4 py-5 sm:px-6 sm:py-6 mb-6"
            role="region"
            aria-label={t("guide_dashboard_not_guide_aria")}
          >
            <p className="text-small text-warning/95 mb-4">{t("guide_dashboard_not_guide")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/guide/register"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
              >
                {t("guide_dashboard_cta_register")}
              </Link>
              <Link
                href="/me/settings/profile"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-ink-700/60 px-4 py-2 text-meta text-slate-300 hover:bg-ink-600/60 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
              >
                {t("guide_dashboard_link_me")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <GuideBillingPeriodCard
              t={t}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetry={retryStatsCards}
              billingPeriodUtc={billingPeriodUtc}
              periodExpectedEarnings={periodExpectedEarnings}
              periodSettledOrdersCount={periodSettledOrdersCount}
            />
            <GuideDashboardStats
              t={t}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetry={retryStatsCards}
              ordersGuided={ordersGuided}
              completedCount={completedCount}
              totalEarned={totalEarned}
              avgScore={avgScore}
              reviewsWritten={reviewsWritten}
            />
            <section className="rounded-[var(--radius-md)] border border-slate-600/60 bg-ink-800/50 backdrop-blur-md px-4 py-4 sm:px-5 sm:py-4 mb-6">
              <h2 className="text-meta text-slate-300 mb-3">{t("guide_dashboard_quick_links")}</h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/market"
                  className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {t("header_market")}
                </Link>
                <Link
                  href="/orders"
                  className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {t("nav_orders")}
                </Link>
                <Link
                  href="/community"
                  className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {t("header_community")}
                </Link>
                <Link
                  href="/me/settings/profile"
                  className={`rounded-full border border-slate-500/60 bg-ink-700/60 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-slate-300 hover:bg-ink-600/60 motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
                >
                  {t("me_title")}
                </Link>
              </div>
            </section>
          </>
        )}

        <footer className="mt-8 pt-6 border-t border-slate-700/50">
          <ProductCrossNav
            ariaLabelKey="guide_dashboard_relatedNav_aria"
            showGuides
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 font-medium motion-sub motion-reduce:transition-none ${FOCUS_RING}`}
            separatorClassName="text-slate-500"
          />
        </footer>
      </div>
    </main>
  );
}
