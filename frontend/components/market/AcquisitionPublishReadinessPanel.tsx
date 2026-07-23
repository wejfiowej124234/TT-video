"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAcquisitionPublishEligibility,
  type AcquisitionPublishEligibility,
} from "@/lib/acquisition/acquisitionPublishEligibility";
import { ME_IDENTITIES_ACQUISITION_SETTINGS_HREF } from "@/lib/me/meIdentitiesCoreCardModel";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function ReadinessRow({
  ok,
  label,
  actionHref,
  actionLabel,
}: {
  ok: boolean;
  label: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-slate-600/40 bg-slate-950/45 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-meta text-slate-200/95">
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            ok ? "bg-success/20 text-success border border-success/45" : "bg-slate-800 text-slate-400 border border-slate-600/50"
          }`}
          aria-hidden
        >
          {ok ? "✓" : "○"}
        </span>
        {label}
      </span>
      {!ok && actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`${touchTargetLink44Classes} text-meta font-semibold text-ref-sun underline underline-offset-2 ${travelFocusRingOffset2Classes}`}
        >
          {actionLabel}
        </Link>
      ) : null}
    </li>
  );
}

/** `/market/acquisition` 发布就绪度（PD-009 · 浏览页默认折叠 · 发布门闸可视化）。 */
export default function AcquisitionPublishReadinessPanel({ t }: { t: TFunc }) {
  const [gate, setGate] = useState<AcquisitionPublishEligibility | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reload = useCallback(() => {
    void fetchAcquisitionPublishEligibility().then((next) => {
      setGate(next);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
    const onAuth = () => reload();
    window.addEventListener("traveltrust:auth-change", onAuth);
    window.addEventListener("traveltrust:profile-updated", onAuth);
    return () => {
      window.removeEventListener("traveltrust:auth-change", onAuth);
      window.removeEventListener("traveltrust:profile-updated", onAuth);
    };
  }, [reload]);

  if (!loaded || !gate) return null;

  const publishReady = gate.publishEligible;
  const bondOk = gate.bondActive || gate.bondWaived;

  return (
    <section
      className="mx-auto max-w-4xl px-4 mb-4"
      aria-label={t("market_acquisition_readiness_aria")}
      data-tt-acquisition-publish-readiness="1"
      data-tt-acquisition-readiness-collapsed={expanded ? "0" : "1"}
    >
      <div className={`${TT_MARKETING_MARKET_DARK_PATH.subsiteHighlightPanel} text-left`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-small font-semibold text-slate-100">{t("market_acquisition_readiness_title")}</h2>
            <p className="mt-1 text-meta text-slate-300/95 leading-snug">{t("market_acquisition_readiness_caption")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {publishReady ? (
              <span className="inline-flex min-h-[32px] items-center rounded-full border border-success/40 bg-success/10 px-3 py-1 text-meta font-semibold text-success">
                {t("market_acquisition_readiness_ready_badge")}
              </span>
            ) : null}
            <button
              type="button"
              className={`${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.subsiteGhostCta} px-3 py-1.5 text-meta ${travelFocusRingOffset2Classes}`}
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              data-tt-acquisition-readiness-toggle="1"
            >
              {expanded
                ? t("market_acquisition_readiness_collapse")
                : t("market_acquisition_readiness_expand")}
            </button>
            <Link
              href={ME_IDENTITIES_ACQUISITION_SETTINGS_HREF}
              className={`${touchTargetLink44Classes} text-meta font-semibold text-ref-sun underline underline-offset-2 ${travelFocusRingOffset2Classes}`}
            >
              {t("market_acquisition_readiness_goto_identities")}
            </Link>
          </div>
        </div>

        {expanded ? (
          <>
            <ul className="mt-4 space-y-2" aria-label={t("market_acquisition_readiness_list_aria")}>
              <ReadinessRow ok={true} label={t("market_acquisition_readiness_browse")} />
              <ReadinessRow
                ok={gate.sessionOk}
                label={t("market_acquisition_readiness_login")}
                actionHref="/auth/login?returnUrl=%2Fmarket%2Facquisition"
                actionLabel={t("market_acquisition_readiness_action_login")}
              />
              <ReadinessRow
                ok={gate.walletOk}
                label={t("market_acquisition_readiness_wallet")}
                actionHref={meSecurityHref("wallet")}
                actionLabel={t("market_acquisition_readiness_action_wallet")}
              />
              <ReadinessRow
                ok={publishReady && bondOk}
                label={
                  gate.bondWaived
                    ? t("market_acquisition_readiness_bond_waived")
                    : t("market_acquisition_readiness_bond")
                }
                actionHref={ME_IDENTITIES_ACQUISITION_SETTINGS_HREF}
                actionLabel={t("market_acquisition_readiness_action_bond")}
              />
            </ul>
            {gate.trustScore != null ? (
              <p className="mt-3 text-meta text-slate-400/95">
                {t("market_acquisition_readiness_trust_score", { score: String(gate.trustScore) })}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
