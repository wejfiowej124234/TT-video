"use client";

import { FOCUS_RING } from "@/components/me/constants";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatGuideRegistrationStatus } from "@/lib/meTrust";

export interface GuideRegistrationStatusBannerProps {
  trust: MeTrustSummary;
  t: (k: string) => string;
  onRefresh?: () => void;
}

/**
 * `/guide` 顶区：向导资质审核状态（与 `GET /api/v1/me.trust` 同源；B-080 / TT-GUIDE-DASHBOARD-REGISTRATION-BANNER-001）
 */
export default function GuideRegistrationStatusBanner({ trust, t, onRefresh }: GuideRegistrationStatusBannerProps) {
  const raw = trust.guide_registration_status;
  if (raw == null || raw === "") return null;
  const s = raw.toLowerCase();

  const isPending = s === "pending" || s === "pending_review";
  const isRejected = s === "rejected";
  const isSuspended = s === "suspended";
  const isKnown = isPending || isRejected || isSuspended;

  if (s === "active") return null;

  if (!isKnown) {
    return (
      <div
        role="region"
        aria-label={t("guide_registration_banner_aria")}
        className="rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/50 px-4 py-3 mb-4"
      >
        <p className="text-body text-slate-200">{formatGuideRegistrationStatus(raw, t)}</p>
      </div>
    );
  }

  let shell: string;
  let titleKey: string;
  let bodyKey: string | null = null;

  if (isPending) {
    shell = "border-warning/40 bg-warning/10";
    titleKey = "guide_registration_banner_title_pending";
    bodyKey = "guide_registration_banner_body_pending";
  } else if (isRejected) {
    shell = "border-danger/45 bg-danger/10";
    titleKey = "guide_registration_banner_title_rejected";
  } else {
    shell = "border-amber-500/40 bg-amber-500/10";
    titleKey = "guide_registration_banner_title_suspended";
    bodyKey = "guide_registration_banner_body_suspended";
  }

  const codes = trust.guide_registration_rejection_codes ?? [];
  const msg = trust.guide_registration_rejection_message?.trim() ?? "";

  return (
    <div
      role="region"
      aria-label={t("guide_registration_banner_aria")}
      className={`rounded-[var(--radius-md)] border px-4 py-3 mb-4 motion-sub ${shell}`}
    >
      <p className="text-body font-semibold text-slate-100">{t(titleKey)}</p>
      {bodyKey != null ? <p className="text-meta text-slate-300 mt-1">{t(bodyKey)}</p> : null}
      {isRejected ? (
        <div className="mt-2 space-y-2">
          {codes.length > 0 ? (
            <div>
              <p className="text-meta text-slate-400">{t("guide_registration_banner_codes")}</p>
              <ul className="flex flex-wrap gap-2 mt-1">
                {codes.map((c) => (
                  <li key={c}>
                    <span className="inline-block rounded-[var(--radius-sm)] border border-slate-600/80 bg-slate-900/60 px-2 py-0.5 text-meta font-mono text-slate-200">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {msg !== "" ? (
            <p className="text-small text-slate-200">
              <span className="text-meta text-slate-400">{t("guide_registration_banner_message")}</span> {msg}
            </p>
          ) : null}
        </div>
      ) : null}
      {onRefresh != null ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={onRefresh}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-cyan-500/25 motion-sub ${FOCUS_RING}`}
          >
            {t("guide_registration_banner_refresh")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
