"use client";

import { useId, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TRANSPARENCY_FINGERPRINT_CODEC_ID } from "@/lib/trust/transparencyFingerprint";
import { deepShellPillControlFocusClasses, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type ExternalVerificationPanelProps = {
  fingerprint: string | null;
  surface: "ink" | "slate";
};

function surfaceClasses(surface: ExternalVerificationPanelProps["surface"]) {
  if (surface === "slate") {
    return {
      wrap: "rounded-[var(--radius-md)] border border-violet-500/25 bg-slate-900/40 px-3 py-3 mt-3",
      title: "text-small font-semibold text-violet-200",
      body: "text-meta text-slate-300",
      code: "block mt-2 rounded-[var(--radius-sm)] border border-slate-600/60 bg-slate-950/80 px-2 py-2 font-mono text-[11px] sm:text-xs text-slate-200 break-all",
      btn: `inline-flex min-h-[36px] items-center justify-center rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-meta text-violet-200 hover:bg-violet-500/20 motion-sub ${travelFocusRingOffset2Classes}`,
      input: "mt-2 w-full rounded-[var(--radius-sm)] border border-slate-600/60 bg-slate-950/80 px-2 py-2 font-mono text-xs text-slate-200",
      ok: "text-meta text-success",
      bad: "text-meta text-red-400",
      mono: "font-mono text-slate-300",
      details: "mt-2 rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-950/50 px-3 py-2",
      summary: `cursor-pointer list-none rounded-sm text-meta text-violet-300 hover:text-violet-100 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center -mx-1 px-1 ${deepShellPillControlFocusClasses}`,
      inner: "mt-2 border-t border-slate-600/40 pt-3 space-y-3",
    };
  }
  return {
    wrap: "rounded-[var(--radius-md)] border border-violet-200 bg-violet-50/50 px-3 py-3 mt-3",
    title: "text-small font-semibold text-violet-900",
    body: "text-meta text-ink-600",
    code: "block mt-2 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-2 font-mono text-[11px] sm:text-xs text-ink-900 break-all",
    btn: `inline-flex min-h-[36px] items-center justify-center rounded-full border border-ink-300 bg-white px-3 py-1 text-meta text-ink-800 hover:bg-ink-50 motion-sub ${travelFocusRingOffset2Classes}`,
    input: "mt-2 w-full rounded-[var(--radius-sm)] border border-ink-300 bg-white px-2 py-2 font-mono text-xs text-ink-900",
    ok: "text-meta text-green-800",
    bad: "text-meta text-red-700",
    mono: "font-mono text-ink-800",
    details: "mt-2 rounded-[var(--radius-md)] border border-ink-200 bg-white/90 px-3 py-2",
    summary: `cursor-pointer list-none text-meta text-violet-900 hover:text-violet-950 [&::-webkit-details-marker]:hidden min-h-[44px] flex items-center rounded-[var(--radius-sm)] ${travelFocusRingOffset2Classes}`,
    inner: "mt-2 border-t border-ink-200 pt-3 space-y-3",
  };
}

function normalizeFp(s: string): string | null {
  const m = s.match(/(?:fingerprint\s*:\s*)?(?:0x)?([0-9a-f]{64})\b/i);
  if (m) return m[1].toLowerCase();
  const t = s.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  return t;
}

/**
 * P-004 + P-UX1：专家核对默认折叠；主叙事见 teaser。
 */
export default function ExternalVerificationPanel({ fingerprint, surface }: ExternalVerificationPanelProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const [pasted, setPasted] = useState("");
  const cliFile = "node scripts/p004-verify-transparency.mjs ./traveltrust-transparency-snapshot.json";
  const cliApi = "node scripts/p004-verify-transparency.mjs --from-api http://127.0.0.1:8080";

  const compare = useMemo(() => {
    const want = fingerprint ? normalizeFp(fingerprint) : null;
    const got = pasted.trim() ? normalizeFp(pasted) : null;
    if (!want || !got) return null;
    if (want === got) return "match" as const;
    return "mismatch" as const;
  }, [fingerprint, pasted]);

  async function copyCodec() {
    try {
      await navigator.clipboard.writeText(TRANSPARENCY_FINGERPRINT_CODEC_ID);
    } catch {
      /* ignore */
    }
  }

  async function copyCliFile() {
    try {
      await navigator.clipboard.writeText(cliFile);
    } catch {
      /* ignore */
    }
  }

  async function copyCliApi() {
    try {
      await navigator.clipboard.writeText(cliApi);
    } catch {
      /* ignore */
    }
  }

  const tone = surfaceClasses(surface);

  return (
    <div className={tone.wrap} aria-labelledby={headingId}>
      <h3 id={headingId} className={tone.title}>
        {t("pux1_expert_block_title")}
      </h3>
      <p className={`${tone.body} mt-1 leading-relaxed`}>{t("pux1_expert_teaser")}</p>

      <details className={tone.details}>
        <summary className={tone.summary}>{t("pux1_expert_details_toggle")}</summary>
        <div className={tone.inner}>
          <p className={`${tone.body} font-medium`}>{t("p004_panel_title")}</p>
          <p className={tone.body}>{t("p004_panel_intro")}</p>

          <div>
            <p className={tone.body}>
              <span className="font-medium">{t("p004_codec_label")}</span>
            </p>
            <code className={tone.code} title={TRANSPARENCY_FINGERPRINT_CODEC_ID}>
              {TRANSPARENCY_FINGERPRINT_CODEC_ID}
            </code>
            <button type="button" className={`${tone.btn} mt-2`} onClick={() => void copyCodec()}>
              {t("p004_copy_codec")}
            </button>
          </div>

          <div>
            <p className={tone.body}>{t("p004_cli_hint_file")}</p>
            <code className={tone.code}>{cliFile}</code>
            <button type="button" className={`${tone.btn} mt-2`} onClick={() => void copyCliFile()}>
              {t("p004_copy_cli")}
            </button>
          </div>

          <div>
            <p className={tone.body}>{t("p004_cli_hint_api")}</p>
            <code className={tone.code}>{cliApi}</code>
            <button type="button" className={`${tone.btn} mt-2`} onClick={() => void copyCliApi()}>
              {t("p004_copy_cli_api")}
            </button>
          </div>

          {fingerprint ? (
            <>
              <p className={tone.body}>
                <span className="font-medium">{t("p004_browser_fp_label")}</span>
              </p>
              <p className={`${tone.mono} text-xs sm:text-sm break-all`}>{fingerprint}</p>

              <label className={`${tone.body} mt-2 block font-medium`} htmlFor="p004-paste-fp">
                {t("p004_compare_label")}
              </label>
              <input
                id="p004-paste-fp"
                className={tone.input}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={t("p004_compare_placeholder")}
                autoComplete="off"
                spellCheck={false}
              />
              {compare === "match" ? <p className={`${tone.ok} mt-2`}>{t("p004_compare_match")}</p> : null}
              {compare === "mismatch" ? <p className={`${tone.bad} mt-2`}>{t("p004_compare_mismatch")}</p> : null}
            </>
          ) : (
            <p className={tone.body}>{t("p004_need_verified_first")}</p>
          )}
        </div>
      </details>
    </div>
  );
}
