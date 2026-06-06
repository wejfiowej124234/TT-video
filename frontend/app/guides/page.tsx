"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getGuides } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import TrustInfraWall from "@/components/trust/TrustInfraWall";
import { useTranslation } from "@/components/LocaleProvider";
import GuideCard from "@/components/market/GuideCard";
import { GuideCardSkeleton } from "@/components/market/MarketSkeleton";
import type { GuideCardItem } from "@/lib/marketTypes";
import { dedupeListById } from "@/lib/dedupeListById";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  marketCyanInlineLinkFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { ordersNewHrefForGuide } from "@/lib/ordersGuideDeepLink";
import { GuidesRouteSuspense } from "@/components/guides/GuidesRouteSuspense";
import { GUIDE_DETAIL_RETRY_PILL_CLASS } from "./[id]/guideDetailPageConstants";

/** 向导列表（56-S7：卡片网格与市场 29 信息层级一致，玻璃态风格） */
function GuidesPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const guidesLoginReturnPath = useMemo(() => {
    const base = pathname && pathname !== "/" ? pathname : "/guides";
    const q = searchParams?.toString() ?? "";
    return q ? `${base}?${q}` : base;
  }, [pathname, searchParams]);
  const [list, setList] = useState<GuideCardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGuides = useCallback(() => {
    setError(null);
    setLoading(true);
    getGuides()
      .then((res) => {
        const v = res.items;
        if (!Array.isArray(v)) {
          if (typeof window !== "undefined") {
            console.error("GuidesPage: getGuides returned non-array", v);
          }
          setError(t("guides_responseInvalid"));
          setList([]);
          return;
        }
        const rows = dedupeListById(
          v.map((g: unknown) => toGuideCardItem(g)),
          (g) => String(g.id ?? "")
        );
        setList(rows);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("GuidesPage:", err);
        }
        if (err instanceof Error && err.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(guidesLoginReturnPath)}`);
          return;
        }
        setError(mapApiReadError(err, t, "guides_requestFailed"));
      })
      .finally(() => setLoading(false));
  }, [guidesLoginReturnPath, router, t]);

  useEffect(() => {
    loadGuides();
  }, [loadGuides]);

  if (loading) {
    return (
      <main
        className="relative min-h-screen"
        aria-label={t("guides_title")}
        aria-busy="true"
        data-tt-guides-surface="list_loading"
      >
        <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
        <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
        <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
          <div className="mx-auto max-w-6xl space-y-6">
            <header>
              <p className="text-small text-slate-300 mb-2">
                <Link href="/market" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                  {t("market_meta_title")}
                </Link>
                {" · "}
                <Link href="/" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                  {t("guides_navHome")}
                </Link>
              </p>
              <h1 className="text-h3 font-semibold text-white tracking-tight">{t("guides_title")}</h1>
              <p className="text-small text-slate-300 mt-1">{t("guides_desc")}</p>
            </header>
            <GuideCardSkeleton count={6} gridClass="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
            <footer className="mt-12 pt-8 border-t border-white/20">
              <ProductCrossNav
                ariaLabelKey="guides_relatedNav_aria"
                showGuides
                className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
                linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
                separatorClassName="text-slate-400"
              />
            </footer>
          </div>
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="relative min-h-screen p-8" aria-label={t("guides_title")}>
        <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
        <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h1 className="sr-only">{t("guides_title")}</h1>
          <ApiErrorAlert message={error} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              loadGuides();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={GUIDE_DETAIL_RETRY_PILL_CLASS}
            >
              {t("common_retry")}
            </button>
          </form>
          <p>
            <Link href="/market" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
              {t("market_meta_title")}
            </Link>
            {" · "}
            <Link href="/" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
              {t("guides_navHome")}
            </Link>
          </p>
          <ProductCrossNav
            ariaLabelKey="guides_relatedNav_aria"
            showGuides
            className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            separatorClassName="text-slate-400"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen" aria-label={t("guides_title")}>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <header>
            <p className="text-small text-slate-300 mb-2">
              <Link href="/market" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                {t("market_meta_title")}
              </Link>
              {" · "}
              <Link href="/" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                {t("guides_navHome")}
              </Link>
            </p>
            <h1 className="text-h3 font-semibold text-white tracking-tight">{t("guides_title")}</h1>
            <p className="text-small text-slate-300 mt-1">{t("guides_desc")}</p>
          </header>

          {list.length === 0 ? (
            <section className="rounded-[var(--radius-xl)] border border-white/25 bg-white/5 backdrop-blur-md p-8 text-center text-slate-300" aria-live="polite">
              {t("guides_empty")}
              <p className="mt-4">
                <Link href="/market" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                  {t("market_meta_title")}
                </Link>
                {" · "}
                <Link href="/guide/register" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                  {t("guides_becomeGuide")}
                </Link>
              </p>
            </section>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0" role="list" aria-label={t("guides_title")}>
              {list.map((guide, guideIdx) => (
                <li key={guide.id}>
                  <GuideCard
                    guide={guide}
                    glass
                    coverImagePriority={guideIdx === 0}
                    onView={(id) => router.push(`/guides/${id}`)}
                    onBookGuide={(gid) => router.push(ordersNewHrefForGuide(gid))}
                  />
                </li>
              ))}
            </ul>
          )}

          <footer className="mt-12 pt-8 border-t border-white/20">
            <TrustInfraWall />
            <ProductCrossNav
              ariaLabelKey="guides_relatedNav_aria"
              className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
              separatorClassName="text-slate-400"
            />
            <p className="mt-3 text-meta text-slate-300 text-center">
              <Link href="/guide/register" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                {t("guides_becomeGuide")}
              </Link>
              {" · "}
              <Link href="/orders/new" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                {t("guides_createOrder")}
              </Link>
              {" · "}
              <Link href="/itinerary/new" className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
                {t("guides_newItineraryDraft")}
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

function toGuideCardItem(g: unknown): GuideCardItem {
  const row = g as Record<string, unknown>;
  return {
    id: String(row?.id ?? ""),
    user_id: row?.user_id as string | undefined,
    city: row?.city as string | undefined,
    country_code: row?.country_code as string | undefined,
    languages: Array.isArray(row?.languages) ? (row.languages as string[]) : undefined,
    service_types: Array.isArray(row?.service_types) ? (row.service_types as string[]) : undefined,
    bio: (row?.bio as string | null) ?? null,
    stake_amount: row?.stake_amount != null ? String(row.stake_amount) : undefined,
    hourly_rate: row?.hourly_rate != null ? String(row.hourly_rate) : undefined,
    hourly_currency: row?.hourly_currency as string | undefined,
    avatar_url: (row?.avatar_url as string | null) ?? null,
    status: row?.status as string | undefined,
    created_at: row?.created_at as string | undefined,
    priceRange: row?.priceRange as GuideCardItem["priceRange"] ?? null,
    rating: (row?.rating as number | null) ?? null,
    completedCount: (row?.completedCount as number | null) ?? null,
    responseSLA: (row?.responseSLA as string | null) ?? null,
  };
}

export default function GuidesPage() {
  return (
    <GuidesRouteSuspense>
      <GuidesPageInner />
    </GuidesRouteSuspense>
  );
}
