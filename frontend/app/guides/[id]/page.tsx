"use client";

import { useEffect, useMemo, useState, useId, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { getGuide, postGuideStake } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import LoadingText from "@/components/LoadingText";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { GuideDetailRouteSuspense } from "@/components/guides/GuideDetailRouteSuspense";
import GuideOccupiedScheduleBlock from "@/components/guides/GuideOccupiedScheduleBlock";
import BookGuideModal from "@/components/market/BookGuideModal";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";
import { parseGuideDetailForRoute } from "@/lib/guideDetailRoutePayload";

type GuideShape = {
  id?: string;
  user_id?: string;
  city?: string;
  country_code?: string;
  languages?: string[];
  service_types?: string[];
  bio?: string | null;
  stake_amount?: string;
  status?: string;
  created_at?: string;
  avatar_url?: string | null;
  wallet_address?: string | null;
  real_name?: string | null;
  passport_number?: string | null;
  id_photo_url?: string | null;
  language_cert_url?: string | null;
  guide_license_url?: string | null;
  hourly_rate?: string | number | null;
  hourly_currency?: string | null;
};

const PANEL_CLASS = "rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/70 backdrop-blur-md shadow-scifi-panel";

function CredentialCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-700/50 p-4 ${className}`}>
      <h4 className="text-meta font-semibold text-cyan-200 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function GuideDetailPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const guideDetailLoginReturnUrl = useMemo(
    () => buildLoginReturnPathWithQuery(pathname, searchParams?.toString() ?? "", id ? `/guides/${id}` : "/guides"),
    [pathname, searchParams, id],
  );
  const [guide, setGuide] = useState<GuideShape | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [copiedDid, setCopiedDid] = useState(false);
  const [copyDidBusy, setCopyDidBusy] = useState(false);
  const [guideLoadRetryKey, setGuideLoadRetryKey] = useState(0);
  const [bookGuideOpen, setBookGuideOpen] = useState(false);
  const guideHeroNameId = useId();
  const guideCredentialsHeadingId = useId();
  const guideStakeAmountFieldId = useId();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setGuide(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGuide(id)
      .then((g) => {
        if (cancelled) return;
        const normalized = parseGuideDetailForRoute(g, id);
        if (!normalized) {
          setGuide(null);
          setError(t("guideDetail_payloadIncomplete"));
          return;
        }
        setError(null);
        setGuide(normalized as GuideShape);
      })
      .catch((err) => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          console.error("GuideDetailPage load:", err);
        }
        if (err instanceof Error && err.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideDetailLoginReturnUrl)}`);
          return;
        }
        setGuide(null);
        setError(mapApiReadError(err, t, "guideDetail_loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router, t, guideLoadRetryKey, guideDetailLoginReturnUrl]);

  const handleStake = () => {
    if (!id || !stakeAmount.trim()) return;
    setStakeLoading(true);
    setStakeError(null);
    postGuideStake(id, { amount: stakeAmount.trim() })
      .then(() => {
        setStakeAmount("");
        return getGuide(id);
      })
      .then((g) => {
        const normalized = parseGuideDetailForRoute(g, id);
        if (!normalized) {
          setStakeError(t("guideDetail_payloadIncomplete"));
          return;
        }
        setGuide(normalized as GuideShape);
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("GuideDetailPage stake:", e);
        }
        if (e instanceof Error && e.message === "login_required") {
          router.replace(`/auth/login?returnUrl=${encodeURIComponent(guideDetailLoginReturnUrl)}`);
          return;
        }
        setStakeError(mapApiReadError(e, t, "guideDetail_stakeFailed"));
      })
      .finally(() => setStakeLoading(false));
  };

  const copyDid = async () => {
    const w = guide?.wallet_address;
    if (!w || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    setCopyDidBusy(true);
    try {
      await navigator.clipboard.writeText(w);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("GuideDetailPage copyDid:", err);
      }
    } finally {
      setCopyDidBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center gap-6 p-8" aria-label={t("guideDetail_title")}>
        <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
        <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <LoadingText />
          <ProductCrossNav
            ariaLabelKey="guide_detail_relatedNav_aria"
            showGuides
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            separatorClassName="text-slate-500"
          />
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-8" aria-label={t("guideDetail_title")}>
        <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
        <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
        <div className="relative z-10 w-full max-w-md">
          <div className={`${PANEL_CLASS} p-6 w-full text-center space-y-3`}>
            <h1 className="sr-only">{t("guideDetail_title")}</h1>
            <ApiErrorAlert message={error} tone="dark" />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setGuideLoadRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub motion-reduce:transition-none min-h-[44px] inline-flex items-center justify-center ${travelFocusRingOffset2Classes}`}
              >
                {t("common_retry")}
              </button>
            </form>
            <p>
              <Link
                href="/guides"
                className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none text-small ${marketCyanInlineLinkFocusClasses}`}
              >
                {t("guideDetail_backList")}
              </Link>
            </p>
            <ProductCrossNav
              ariaLabelKey="guide_detail_relatedNav_aria"
              showGuides
              className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
              separatorClassName="text-slate-500"
            />
          </div>
        </div>
      </main>
    );
  }
  if (!guide) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-8" aria-label={t("guideDetail_title")}>
        <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
        <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
        <div className="relative z-10 w-full max-w-md">
          <div className={`${PANEL_CLASS} p-6 w-full text-center`}>
            <h1 className="sr-only">{t("guideDetail_notFound")}</h1>
            <p className="text-body text-slate-200">{t("guideDetail_notFound")}</p>
            <Link
              href="/guides"
              className={`mt-4 ${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 underline text-small ${marketCyanInlineLinkFocusClasses}`}
            >
              {t("guideDetail_backList")}
            </Link>
            <ProductCrossNav
              ariaLabelKey="guide_detail_relatedNav_aria"
              showGuides
              className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300"
              linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
              separatorClassName="text-slate-500"
            />
          </div>
        </div>
      </main>
    );
  }

  const displayName = formatGuideDisplayName(t, guide);
  const didShort = guide.wallet_address
    ? `${guide.wallet_address.slice(0, 10)}…${guide.wallet_address.slice(-8)}`
    : null;

  return (
    <main className="relative min-h-screen" aria-labelledby={guideHeroNameId}>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* 返回 */}
          <p className="text-small">
            <Link href="/guides" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
              {t("guides_title")}
            </Link>
            {" · "}
            <Link href="/market" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
              {t("market_meta_title")}
            </Link>
            {" · "}
            <Link href="/" className={`${touchTargetLink44Classes} text-slate-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}>
              {t("guides_navHome")}
            </Link>
          </p>

          {/* Hero：头像 + 名称 + 地区 + DID（56-S6 与 P56-002 附一致） */}
          <section className={`${PANEL_CLASS} p-6`} aria-labelledby={guideHeroNameId}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden ring-2 ring-cyan-400/50 bg-ink-700">
                {guide.avatar_url ? (
                  <Image
                    src={guide.avatar_url}
                    alt={t("guide_card_avatarAlt", { name: displayName })}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-h3 font-bold text-cyan-300" aria-hidden>
                    {guide.city?.charAt(0) ?? t("market_guideAvatarFallback")}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 id={guideHeroNameId} className="text-h3 font-semibold text-white tracking-tight">{displayName}</h1>
                <p className="text-small text-slate-300 mt-0.5">
                  {guide.city ?? t("ui_em_dash")} · {guide.country_code ?? t("ui_em_dash")} · {t("guideDetail_stake")}{" "}
                  {guide.stake_amount ?? "0"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/50 bg-success/20 px-3 py-1 text-meta font-medium text-success">
                    <span aria-hidden>✓</span> {t("guide_detail_didVerified")}
                  </span>
                  {didShort && (
                    <form
                      className="inline"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void copyDid();
                      }}
                    >
                      <button
                        type="submit"
                        disabled={copyDidBusy}
                        aria-busy={copyDidBusy ? true : undefined}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-meta font-mono text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800 disabled:opacity-60 disabled:cursor-wait"
                        title={guide.wallet_address ?? undefined}
                        aria-label={copiedDid ? t("guideRegister_copied") : t("guideDetail_didCopy")}
                      >
                        <span>{didShort}</span>
                        <span className="text-cyan-300">{copiedDid ? t("guideRegister_copied") : t("guideDetail_didCopy")}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 资质与凭证（56-S6 区域标注） */}
          <section className={PANEL_CLASS} aria-labelledby={guideCredentialsHeadingId}>
            <h2 id={guideCredentialsHeadingId} className="text-body font-semibold text-cyan-200 px-4 pt-4 pb-2 border-b border-slate-600/50">
              {t("guideDetail_credentials")}
            </h2>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              <CredentialCard title={t("guideDetail_realName")}>
                <p className="text-small text-slate-200">{guide.real_name || t("guideDetail_notProvided")}</p>
              </CredentialCard>
              <CredentialCard title={t("guideDetail_passportNumber")}>
                <p className="text-small text-slate-200 font-mono">{guide.passport_number || t("guideDetail_notProvided")}</p>
              </CredentialCard>
              <CredentialCard title={t("guideDetail_passportPhoto")}>
                {guide.id_photo_url ? (
                  <a
                    href={guide.id_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </CredentialCard>
              <CredentialCard title={t("guideDetail_languageCert")}>
                {guide.language_cert_url ? (
                  <a
                    href={guide.language_cert_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </CredentialCard>
              <CredentialCard title={t("guideDetail_license")} className="sm:col-span-2">
                {guide.guide_license_url ? (
                  <a
                    href={guide.guide_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline break-all ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </CredentialCard>
            </div>
          </section>

          {/* 介绍 */}
          <section className={PANEL_CLASS}>
            <h2 className="text-body font-semibold text-cyan-200 px-4 pt-4 pb-2 border-b border-slate-600/50">
              {t("guideDetail_intro")}
            </h2>
            <div className="p-4">
              <p className="text-small text-slate-200 whitespace-pre-wrap">{guide.bio || t("guide_detail_bioEmpty")}</p>
            </div>
          </section>

          {guide.id ? <GuideOccupiedScheduleBlock guideId={guide.id} /> : null}

          {/* 语言 · 服务 · 报价 */}
          <section className={`${PANEL_CLASS} p-4`}>
            {guide.languages?.length ? (
              <p className="text-small text-slate-300">
                <span className="text-slate-300">{t("guideDetail_languages")}</span>
                {guide.languages.join(", ")}
              </p>
            ) : null}
            {guide.service_types?.length ? (
              <p className="text-small text-slate-300 mt-2">
                <span className="text-slate-300">{t("guideDetail_services")}</span>
                {guide.service_types.join(", ")}
              </p>
            ) : null}
            {(guide.hourly_rate != null && guide.hourly_rate !== "") && (
              <p className="text-small text-cyan-300 mt-2 font-medium">
                {t("guide_detail_perHour", {
                  amount: String(guide.hourly_rate),
                  currency:
                    typeof guide.hourly_currency === "string" && guide.hourly_currency.trim()
                      ? guide.hourly_currency.trim()
                      : t("market_guide_hourly_currency_unspecified"),
                })}
              </p>
            )}
          </section>

          {/* 质押（向导本人可操作） */}
          <section className={`${PANEL_CLASS} p-4`}>
            <h3 className="text-small font-semibold text-slate-200 mb-2">{t("guideDetail_stakeSection")}</h3>
            <form
              className="flex gap-2 items-center flex-wrap"
              onSubmit={(e) => {
                e.preventDefault();
                handleStake();
              }}
            >
              <label htmlFor={guideStakeAmountFieldId} className="sr-only">
                {t("guideDetail_stakeAmountLabel")}
              </label>
              <input
                id={guideStakeAmountFieldId}
                type="text"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder={t("guideDetail_amountPlaceholder")}
                className="min-h-[44px] rounded-[var(--radius-md)] border border-slate-600 bg-ink-700/80 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 w-28 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
                autoComplete="off"
                aria-label={t("guideDetail_amountPlaceholder")}
              />
              <button
                type="submit"
                disabled={stakeLoading || !stakeAmount.trim()}
                aria-busy={stakeLoading ? true : undefined}
                className="rounded-[var(--radius-md)] border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
              >
                {stakeLoading ? t("guideDetail_submitting") : t("guideDetail_stake")}
              </button>
            </form>
            {stakeError ? (
              <div className="mt-2">
                <ApiErrorAlert message={stakeError} tone="dark" />
              </div>
            ) : null}
          </section>

          {/* CTA（56-S6 主次按钮、无障碍） */}
          <nav className="flex flex-col sm:flex-row gap-3" aria-label={t("guideDetail_ctaAria")}>
            {guide.id && (
              <button
                type="button"
                onClick={() => setBookGuideOpen(true)}
                className="rounded-[var(--radius-md)] border border-cyan-400/50 bg-cyan-500/30 px-5 py-3 text-small font-medium text-cyan-200 hover:text-cyan-100 hover:bg-cyan-500/40 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
              >
                {t("guideDetail_orderLink")}
              </button>
            )}
            <Link
              href="/market"
              className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-ink-700/60 px-5 py-3 text-small text-slate-300 hover:bg-ink-600/60 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
            >
              {t("market_meta_title")}
            </Link>
            <Link
              href="/guides"
              className="rounded-[var(--radius-md)] border border-slate-500/60 bg-ink-700/60 px-5 py-3 text-small text-slate-300 hover:bg-ink-600/60 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
            >
              {t("guideDetail_backList")}
            </Link>
          </nav>

          <ProductCrossNav
            ariaLabelKey="guide_detail_relatedNav_aria"
            showGuides
            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-300 pt-6 border-t border-white/10"
            linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
            separatorClassName="text-slate-500"
          />

          {guide.id && bookGuideOpen ? (
            <BookGuideModal
              guideId={guide.id}
              guideName={displayName}
              onClose={() => setBookGuideOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function GuideDetailPage() {
  return (
    <GuideDetailRouteSuspense>
      <GuideDetailPageInner />
    </GuideDetailRouteSuspense>
  );
}
