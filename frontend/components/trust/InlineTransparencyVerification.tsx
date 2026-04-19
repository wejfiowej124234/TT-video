"use client";

import { useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { useAutoTransparencyVerification } from "@/lib/trust/useAutoTransparencyVerification";
import ExternalVerificationPanel from "@/components/trust/ExternalVerificationPanel";
import TrustStatusCallout from "@/components/trust/TrustStatusCallout";
import TechnicalTransparencyDetails from "@/components/trust/TechnicalTransparencyDetails";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type InlineTransparencyContext = "yield" | "order" | "governance";

export type InlineTransparencyVerificationProps = {
  context: InlineTransparencyContext;
  surface: "ink" | "slate";
  verificationKey?: string;
  pollIntervalMs?: number;
  enabled?: boolean;
};

function shortSha(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

function surfaceTone(surface: InlineTransparencyVerificationProps["surface"]) {
  if (surface === "slate") {
    return {
      box: "rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-900/55 backdrop-blur-sm",
      title: "text-small font-semibold text-cyan-100",
      body: "text-meta text-slate-300",
      btn: `inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-meta font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 motion-sub ${travelFocusRingOffset2Classes}`,
      link: `text-meta text-cyan-300 hover:text-cyan-100 underline ${travelFocusRingOffset2Classes}`,
      mono: "font-mono text-slate-200",
      err: "text-meta text-red-400",
    };
  }
  return {
    box: "rounded-[var(--radius-md)] border border-ink-200 bg-ink-50/90",
    title: "text-small font-semibold text-ink-900",
    body: "text-meta text-ink-600",
    btn: `inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full border border-ink-300 bg-white px-3 py-1.5 text-meta font-medium text-ink-800 hover:bg-ink-100 disabled:opacity-50 motion-sub ${travelFocusRingOffset2Classes}`,
    link: `text-meta text-travel-600 hover:text-travel-700 underline ${travelFocusRingOffset2Classes}`,
    mono: "font-mono text-ink-800",
    err: "text-meta text-red-700",
  };
}

function formatCheckedAt(iso: string | null, t: (k: string) => string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return `${t("p003_last_checked")} ${d.toLocaleString()}`;
  } catch {
    return null;
  }
}

function narrativeKey(ctx: InlineTransparencyContext): "pux1_narrative_yield" | "pux1_narrative_order" | "pux1_narrative_governance" {
  if (ctx === "yield") return "pux1_narrative_yield";
  if (ctx === "order") return "pux1_narrative_order";
  return "pux1_narrative_governance";
}

/**
 * P-002 / P-003 / P-UX1：就地信任体验 — 自然语言 + 可视化状态；技术细节可折叠。
 */
export default function InlineTransparencyVerification({
  context,
  surface,
  verificationKey = "",
  pollIntervalMs,
  enabled = true,
}: InlineTransparencyVerificationProps) {
  const { t } = useTranslation();
  const tone = surfaceTone(surface);
  const introId = useId();
  const refreshKey = `${context}:${verificationKey}`;

  const { trustState, bundle, fingerprint, error, lastCheckedAt, backgroundBusy, isVerifying, refresh } =
    useAutoTransparencyVerification({
      t,
      refreshKey,
      pollIntervalMs,
      enabled,
    });

  const docVer = bundle?.protocol_reference_summary.doc_version ?? "";
  const sha = bundle?.build.git_sha ?? "";
  const checkedLabel = formatCheckedAt(lastCheckedAt, t);

  const headline =
    trustState === "verified"
      ? t("pux1_headline_verified")
      : trustState === "failed"
        ? t("pux1_headline_failed")
        : t("pux1_headline_pending");

  const body =
    trustState === "verified"
      ? t("pux1_body_verified")
      : trustState === "failed"
        ? t("pux1_body_failed")
        : t("pux1_body_pending");

  const subtleParts: string[] = [];
  if (backgroundBusy) subtleParts.push(t("p003_background_check"));
  if (checkedLabel) subtleParts.push(checkedLabel);
  const subtle = subtleParts.length ? subtleParts.join(" · ") : null;

  return (
    <section
      className={`${tone.box} px-3 py-3 sm:px-4`}
      aria-labelledby={introId}
      data-inline-transparency={context}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-prose">
          <h2 id={introId} className={tone.title}>
            {t("pux1_section_title")}
          </h2>
          <p className={`${tone.body} mt-1`}>{t("pux1_section_autocheck")}</p>
          <p className={`${tone.body} mt-2 leading-relaxed`}>{t(narrativeKey(context))}</p>
        </div>
        <button type="button" className={tone.btn} onClick={() => refresh()} disabled={isVerifying}>
          {isVerifying ? t("p003_refresh_busy") : t("p003_refresh_cta")}
        </button>
      </div>

      <div className="mt-3 space-y-2" role="status" aria-live="polite">
        <TrustStatusCallout
          state={trustState}
          surface={surface}
          headline={headline}
          body={body}
          subtle={subtle}
        />

        {trustState === "failed" && error ? <p className={`${tone.err} mt-2`}>{error}</p> : null}

        {trustState === "verified" && bundle && fingerprint ? (
          <TechnicalTransparencyDetails surface={surface}>
            <p className={`${tone.body} font-medium`}>{t("pux1_technical_explainer")}</p>
            <ul className={`mt-2 space-y-1.5 ${tone.body}`}>
              <li>
                {t("p002_inline_build_prefix")}: <span className={tone.mono}>{shortSha(sha, 7)}</span>
              </li>
              <li>
                {t("p002_inline_doc_ver")}:{" "}
                {docVer ? <span className={tone.mono}>{shortSha(docVer, 24)}</span> : t("ui_em_dash")}
              </li>
              <li>
                {t("p002_inline_fp_prefix")}: <span className={tone.mono}>{shortSha(fingerprint, 12)}</span>
              </li>
            </ul>
          </TechnicalTransparencyDetails>
        ) : null}
      </div>

      <p className={`${tone.body} mt-3`}>
        <Link href="/trust" className={tone.link}>
          {t("pux1_link_trust_center")}
        </Link>
      </p>

      {trustState === "verified" && fingerprint ? (
        <ExternalVerificationPanel fingerprint={fingerprint} surface={surface} />
      ) : null}
    </section>
  );
}
