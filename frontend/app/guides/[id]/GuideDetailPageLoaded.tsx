import { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { MarketPageAmbientLayers } from "@/components/market";
import GuideOccupiedScheduleBlock from "@/components/guides/GuideOccupiedScheduleBlock";
import BookGuideModal from "@/components/market/BookGuideModal";
import { trackMarketEvent } from "@/lib/analytics";
import { formatGuideDisplayName } from "@/lib/guideDisplayName";
import { marketCyanInlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_PRIMARY_WARM_MARKET_BLOCK } from "@/lib/marketingUi";
import { useTranslation } from "@/components/LocaleProvider";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
  outboundUrlFromPersisted,
} from "@/lib/communityMediaClientUrl";
import { GuideDetailCredentialCard } from "./GuideDetailCredentialCard";
import {
  GUIDE_DETAIL_ACCENT_TEXT_CLASS,
  GUIDE_DETAIL_AVATAR_FALLBACK_TEXT_CLASS,
  GUIDE_DETAIL_DID_COPY_BTN_CLASS,
  GUIDE_DETAIL_HERO_RING_CLASS,
  GUIDE_DETAIL_INPUT_FOCUS_CLASS,
  GUIDE_DETAIL_PANEL_CLASS,
  GUIDE_DETAIL_PRIMARY_BTN_CLASS,
  GUIDE_DETAIL_PRIMARY_CTA_CLASS,
  GUIDE_DETAIL_SECONDARY_BTN_CLASS,
  GUIDE_DETAIL_SECTION_HEADING_CLASS,
} from "./guideDetailPageConstants";
import type { GuideDetailShape } from "./guideDetailPageTypes";

export function GuideDetailPageLoaded({
  guide,
  stakeAmount,
  setStakeAmount,
  stakeLoading,
  stakeError,
  copiedDid,
  copyDidBusy,
  copyDid,
  bookGuideOpen,
  setBookGuideOpen,
  handleStake,
}: {
  guide: GuideDetailShape;
  stakeAmount: string;
  setStakeAmount: (v: string) => void;
  stakeLoading: boolean;
  stakeError: string | null;
  copiedDid: boolean;
  copyDidBusy: boolean;
  copyDid: () => void;
  bookGuideOpen: boolean;
  setBookGuideOpen: (v: boolean) => void;
  handleStake: () => void;
}) {
  const { t } = useTranslation();
  const guideHeroNameId = useId();
  const guideCredentialsHeadingId = useId();
  const guideStakeAmountFieldId = useId();

  const displayName = formatGuideDisplayName(t, guide);
  const guideHeroAvatarSrc = guide.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(guide.avatar_url.trim())
    : "";
  const didShort = guide.wallet_address
    ? `${guide.wallet_address.slice(0, 10)}…${guide.wallet_address.slice(-8)}`
    : null;

  return (
    <main
      className="relative min-h-screen"
      aria-labelledby={guideHeroNameId}
      data-tt-guides-detail-page="1"
      data-tt-ui-generation="v2"
    >
      <MarketPageAmbientLayers />

      <div className="relative z-10 min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl space-y-6">
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

          <section className={`${GUIDE_DETAIL_PANEL_CLASS} p-6`} aria-labelledby={guideHeroNameId}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className={`relative w-24 h-24 shrink-0 rounded-full overflow-hidden ${GUIDE_DETAIL_HERO_RING_CLASS} bg-ink-700`}>
                {guideHeroAvatarSrc ? (
                  <Image
                    src={guideHeroAvatarSrc}
                    alt={t("guide_card_avatarAlt", { name: displayName })}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover"
                    sizes="96px"
                    unoptimized={communityMediaNextImageUnoptimized(guideHeroAvatarSrc)}
                  />
                ) : (
                  <span className={`flex h-full w-full items-center justify-center text-h3 font-bold ${GUIDE_DETAIL_AVATAR_FALLBACK_TEXT_CLASS}`} aria-hidden>
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
                        className={GUIDE_DETAIL_DID_COPY_BTN_CLASS}
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

          <section className={GUIDE_DETAIL_PANEL_CLASS} aria-labelledby={guideCredentialsHeadingId}>
            <h2 id={guideCredentialsHeadingId} className={GUIDE_DETAIL_SECTION_HEADING_CLASS}>
              {t("guideDetail_credentials")}
            </h2>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              <GuideDetailCredentialCard title={t("guideDetail_realName")}>
                <p className="text-small text-slate-200">{guide.real_name || t("guideDetail_notProvided")}</p>
              </GuideDetailCredentialCard>
              <GuideDetailCredentialCard title={t("guideDetail_passportNumber")}>
                <p className="text-small text-slate-200 font-mono">{guide.passport_number || t("guideDetail_notProvided")}</p>
              </GuideDetailCredentialCard>
              <GuideDetailCredentialCard title={t("guideDetail_passportPhoto")}>
                {guide.id_photo_url ? (
                  <a
                    href={outboundUrlFromPersisted(guide.id_photo_url.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </GuideDetailCredentialCard>
              <GuideDetailCredentialCard title={t("guideDetail_languageCert")}>
                {guide.language_cert_url ? (
                  <a
                    href={outboundUrlFromPersisted(guide.language_cert_url.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline underline-offset-2 transition-colors motion-reduce:transition-none ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </GuideDetailCredentialCard>
              <GuideDetailCredentialCard title={t("guideDetail_license")} className="sm:col-span-2">
                {guide.guide_license_url ? (
                  <a
                    href={outboundUrlFromPersisted(guide.guide_license_url.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${touchTargetLink44Classes} text-small text-cyan-300 hover:text-cyan-100 underline break-all ${marketCyanInlineLinkFocusClasses}`}
                  >
                    {t("guideDetail_viewCert")}
                  </a>
                ) : (
                  <p className="text-small text-slate-400">{t("guideDetail_notProvided")}</p>
                )}
              </GuideDetailCredentialCard>
            </div>
          </section>

          <section className={GUIDE_DETAIL_PANEL_CLASS}>
            <h2 className={GUIDE_DETAIL_SECTION_HEADING_CLASS}>
              {t("guideDetail_intro")}
            </h2>
            <div className="p-4">
              <p className="text-small text-slate-200 whitespace-pre-wrap">{guide.bio || t("guide_detail_bioEmpty")}</p>
            </div>
          </section>

          {guide.id ? <GuideOccupiedScheduleBlock guideId={guide.id} /> : null}

          <section className={`${GUIDE_DETAIL_PANEL_CLASS} p-4`}>
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
              <p className={GUIDE_DETAIL_ACCENT_TEXT_CLASS}>
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

          <section className={`${GUIDE_DETAIL_PANEL_CLASS} p-4`}>
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
                className={`min-h-[44px] rounded-[var(--radius-md)] border border-slate-600 bg-ink-700/80 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 w-28 ${GUIDE_DETAIL_INPUT_FOCUS_CLASS}`}
                autoComplete="off"
                aria-label={t("guideDetail_amountPlaceholder")}
              />
              <button
                type="submit"
                disabled={stakeLoading || !stakeAmount.trim()}
                aria-busy={stakeLoading ? true : undefined}
                className={GUIDE_DETAIL_PRIMARY_BTN_CLASS}
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

          <nav className="flex flex-col sm:flex-row gap-3" aria-label={t("guideDetail_ctaAria")}>
            {guide.id && (
              <button
                type="button"
                data-tt-guide-detail-book-cta="1"
                onClick={() => {
                  trackMarketEvent("market_guide_detail_book_click", { guideId: guide.id });
                  setBookGuideOpen(true);
                }}
                className={`${TT_MARKETING_BTN_PRIMARY_WARM_MARKET_BLOCK} rounded-[var(--radius-md)] px-5 py-3 text-center sm:w-auto`}
              >
                {t("guideDetail_orderLink")}
              </button>
            )}
            <Link
              href="/market"
              className={GUIDE_DETAIL_SECONDARY_BTN_CLASS}
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
