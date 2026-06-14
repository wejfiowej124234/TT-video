"use client";

import Link from "next/link";

import { useMeReferralsPage } from "./useMeReferralsPage";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

function formatTs(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function MeReferralsPageMain() {
  const { t, titleId, data, loading, error, copyHint, referralLink, reload, copyText, needsLogin } =
    useMeReferralsPage();

  return (
    <MeSettingsL5FlowPage
      aria-labelledby={titleId}
      route="referrals"
      dataAttrs={{
        "data-tt-me-referrals-page": "1",
        "data-tt-me-settings-route": "referrals",
      }}
    >
      <MeSettingsHubBackLink t={t} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <MeSettingsSubpageHeader
          t={t}
          titleId={titleId}
          eyebrowKey="me_referrals_eyebrow"
          titleKey="me_referrals_title"
          subtitleKey="me_referrals_subtitle"
        />
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="shrink-0 rounded border border-ink-200 px-3 py-2 text-body-s disabled:opacity-50"
        >
          {loading ? t("me_referrals_refreshing") : t("me_referrals_refresh")}
        </button>
      </div>

      {error ? (
        <p className="mb-4 text-body-s text-red-600" role="alert">
          {t(error)}
        </p>
      ) : null}

      {needsLogin ? (
        <section
          className="rounded border border-ink-200 bg-ink-50 p-4"
          data-tt-me-referrals-auth-required="1"
          role="status"
        >
          <p className="text-body-m text-ink-800">{t("me_referrals_login_required")}</p>
          <p className="mt-2 text-body-s text-ink-600">{t("me_referrals_login_required_hint")}</p>
          <Link
            href="/auth/login?from=/me/referrals"
            className={`mt-4 inline-flex rounded bg-ink-900 px-4 py-2 text-body-s text-white ${authL5InlineLinkFocusClasses}`}
            data-tt-me-referrals-login-cta="1"
          >
            {t("me_referrals_login_cta")}
          </Link>
        </section>
      ) : null}

      {copyHint ? (
        <p
          className="mb-4 text-body-s text-ref-sun"
          data-tt-me-referrals-copy-hint="1"
          data-tt-me-referrals-copy-toast="1"
          role="status"
          aria-live="polite"
        >
          {t(copyHint)}
        </p>
      ) : null}

      {needsLogin ? null : loading ? (
        <p className="text-body-m text-ink-600" data-tt-me-referrals-loading="1">
          …
        </p>
      ) : data ? (
        <div className="space-y-6" data-tt-me-referrals-content="1">
          <section className="rounded border border-ink-200 p-4" data-tt-me-referrals-code="1">
            <h2 className="text-body-m font-medium">{t("me_referrals_my_code")}</h2>
            <p className="mt-2 font-mono text-body-l">{data.referral_code}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-ink-900 px-3 py-2 text-body-s text-white"
                onClick={() => void copyText(data.referral_code, "me_referrals_copy_code_ok")}
              >
                {t("me_referrals_copy_code")}
              </button>
              <button
                type="button"
                className="rounded border border-ink-200 px-3 py-2 text-body-s"
                disabled={!referralLink}
                onClick={() => void copyText(referralLink, "me_referrals_copy_link_ok")}
              >
                {t("me_referrals_copy_link")}
              </button>
            </div>
            {referralLink ? (
              <p className="mt-3 break-all text-body-s text-ink-600">{referralLink}</p>
            ) : null}
          </section>

          <section className="rounded border border-ink-200 p-4" data-tt-me-referrals-stats="1">
            <h2 className="text-body-m font-medium">{t("me_referrals_stats_title")}</h2>
            <ul className="mt-2 space-y-1 text-body-s">
              <li>
                {t("me_referrals_invites_total")}: {data.stats.referrals_total}
              </li>
              <li>
                {t("me_referrals_invites_register")}: {data.stats.referrals_register}
              </li>
              <li>
                {t("me_referrals_growth_points")}: {data.stats.growth_points}
              </li>
              <li>
                {t("me_referrals_binding")}:{" "}
                {data.binding.is_referred
                  ? t("me_referrals_binding_yes")
                  : t("me_referrals_binding_no")}
                {data.binding.is_referred && data.binding.referred_at
                  ? ` · ${formatTs(data.binding.referred_at)}`
                  : ""}
              </li>
              {data.stats.growth_fraud_status !== "normal" ? (
                <li className="text-amber-700">
                  {t("me_referrals_fraud_status")}: {data.stats.growth_fraud_status}
                </li>
              ) : null}
            </ul>
          </section>

          <section className="rounded border border-ink-200 p-4" data-tt-me-referrals-early-bird="1">
            <h2 className="text-body-m font-medium">{t("me_referrals_early_bird_title")}</h2>
            <ul className="mt-2 space-y-1 text-body-s">
              <li>
                {t("me_referrals_registration_rank")}:{" "}
                {data.early_bird.registration_rank ?? "—"}
              </li>
              <li>
                {t("me_referrals_stage")}: {data.early_bird.stage_number ?? "—"}
              </li>
              <li>
                {t("me_referrals_multiplier")}: {data.early_bird.multiplier}×
              </li>
            </ul>
          </section>

          <section className="rounded border border-ink-200 p-4" data-tt-me-referrals-events="1">
            <h2 className="text-body-m font-medium">{t("me_referrals_events_title")}</h2>
            {data.recent_referral_events.length === 0 ? (
              <p className="mt-2 text-body-s text-ink-600">{t("me_referrals_events_empty")}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-body-s">
                {data.recent_referral_events.map((ev) => (
                  <li key={ev.id} className="border-b border-ink-100 pb-2">
                    <span className="font-medium">{ev.event_type}</span>
                    {" · "}+{ev.points_for_me} · {formatTs(ev.created_at)}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-meta text-ink-500">{t("me_referrals_privacy_note")}</p>
          </section>

          <section className="rounded border border-ink-200 p-4" data-tt-me-referrals-ledger="1">
            <h2 className="text-body-m font-medium">{t("me_referrals_ledger_title")}</h2>
            {data.recent_ledger.length === 0 ? (
              <p className="mt-2 text-body-s text-ink-600">{t("me_referrals_ledger_empty")}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-body-s">
                {data.recent_ledger.map((row) => (
                  <li key={row.id} className="border-b border-ink-100 pb-2">
                    <span className="font-medium">{row.source}</span>
                    {" · "}+{row.points}
                    {row.early_bird_multiplier != null && row.early_bird_multiplier !== 1
                      ? ` (${row.early_bird_multiplier}×)`
                      : ""}
                    {" · "}
                    {formatTs(row.created_at)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-meta text-ink-500">
            <Link
              href="/auth/register"
              className={`text-ref-sun underline ${authL5InlineLinkFocusClasses}`}
            >
              {t("me_referrals_share_cta")}
            </Link>
          </p>
        </div>
      ) : null}
    </MeSettingsL5FlowPage>
  );
}
