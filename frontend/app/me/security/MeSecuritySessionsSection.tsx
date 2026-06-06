"use client";

import { useMemo, useState } from "react";
import type { MeSessionItem } from "./meSecurityPageTypes";
import type { MeSecurityPageViewModel } from "./useMeSecurityPage";
import { MeSettingsL5Panel } from "@/components/me/MeSettingsL5Panel";
import { ME_SECURITY_PANEL_IDS, TT_ME_SECURITY_L5 } from "@/lib/me/meSecurityL5";

const SESSIONS_PREVIEW_COUNT = 5;

type Props = Pick<
  MeSecurityPageViewModel,
  | "t"
  | "cellPh"
  | "formatTs"
  | "activeSessions"
  | "exportSessionsDisabled"
  | "busySuffix"
  | "revokeCurrent"
  | "revokeBySuffix"
  | "exportSessionsJson"
>;

export function MeSecuritySessionsSection({
  t,
  cellPh,
  formatTs,
  activeSessions,
  exportSessionsDisabled,
  busySuffix,
  revokeCurrent,
  revokeBySuffix,
  exportSessionsJson,
}: Props) {
  const [showAllSessions, setShowAllSessions] = useState(false);
  const hiddenCount = Math.max(0, activeSessions.length - SESSIONS_PREVIEW_COUNT);
  const visibleSessions = useMemo(() => {
    if (showAllSessions || hiddenCount === 0) return activeSessions;
    return activeSessions.slice(0, SESSIONS_PREVIEW_COUNT);
  }, [activeSessions, hiddenCount, showAllSessions]);

  const toolbar = (
    <>
      <button
        type="button"
        data-tt-me-security-revoke-current="1"
        onClick={() => void revokeCurrent()}
        disabled={busySuffix === "current"}
        className={TT_ME_SECURITY_L5.btnDangerGhost}
      >
        {busySuffix === "current" ? t("me_security_page_busy") : t("me_security_page_revoke_current")}
      </button>
      <button
        type="button"
        onClick={exportSessionsJson}
        disabled={exportSessionsDisabled}
        className={TT_ME_SECURITY_L5.btnSecondary}
      >
        {t("me_security_page_export_sessions_json")}
      </button>
    </>
  );

  return (
    <MeSettingsL5Panel
      id={ME_SECURITY_PANEL_IDS.sessions}
      title={t("me_security_page_section_sessions")}
      actions={toolbar}
    >
      <div className={TT_ME_SECURITY_L5.sessionList}>
        {activeSessions.length === 0 ? (
          <p className="text-meta text-slate-400/90">{t("me_security_page_no_sessions")}</p>
        ) : (
          visibleSessions.map((s: MeSessionItem) => (
            <SessionCard
              key={`${s.session_token_suffix ?? ""}-${s.created_at ?? ""}`}
              s={s}
              t={t}
              cellPh={cellPh}
              formatTs={formatTs}
              busySuffix={busySuffix}
              revokeBySuffix={revokeBySuffix}
            />
          ))
        )}
      </div>
      {hiddenCount > 0 ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            data-tt-me-security-sessions-toggle="1"
            className={`${TT_ME_SECURITY_L5.btnSecondary} min-h-[44px]`}
            aria-expanded={showAllSessions}
            onClick={() => setShowAllSessions((v) => !v)}
          >
            {showAllSessions
              ? t("me_security_page_sessions_show_less")
              : t("me_security_page_sessions_show_all", { n: activeSessions.length })}
          </button>
        </div>
      ) : null}
    </MeSettingsL5Panel>
  );
}

function SessionCard({
  s,
  t,
  cellPh,
  formatTs,
  busySuffix,
  revokeBySuffix,
}: {
  s: MeSessionItem;
  t: (key: string, vars?: Record<string, string>) => string;
  cellPh: string;
  formatTs: (v?: string | null) => string;
  busySuffix: string | null;
  revokeBySuffix: (suffix: string) => void;
}) {
  const suffix = s.session_token_suffix ?? "";
  const isBusy = busySuffix === suffix;
  const isCurrent = Boolean(s.is_current);
  const revoked = Boolean(s.revoked_at);

  return (
    <article className={TT_ME_SECURITY_L5.sessionCard}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-slate-100">
          {suffix || cellPh}
          {isCurrent ? (
            <span className="ml-2 text-meta text-ref-sun/80">{t("me_security_page_yes_this_device")}</span>
          ) : null}
        </span>
        {suffix && !isCurrent ? (
          <button
            type="button"
            data-tt-me-security-revoke-suffix={suffix}
            onClick={() => void revokeBySuffix(suffix)}
            disabled={isBusy}
            className={TT_ME_SECURITY_L5.btnDangerGhost}
          >
            {isBusy ? t("me_security_page_busy") : t("me_security_page_btn_revoke")}
          </button>
        ) : isCurrent ? (
          <span className={TT_ME_SECURITY_L5.badgeMuted}>{t("me_security_page_btn_current_session")}</span>
        ) : null}
      </div>
      <dl className={TT_ME_SECURITY_L5.sessionMetaGrid}>
        <div>
          <dt className={TT_ME_SECURITY_L5.sessionMetaLabel}>{t("me_security_page_th_created")}</dt>
          <dd>{formatTs(s.created_at)}</dd>
        </div>
        <div>
          <dt className={TT_ME_SECURITY_L5.sessionMetaLabel}>{t("me_security_page_th_last_seen")}</dt>
          <dd>{formatTs(s.last_seen_at)}</dd>
        </div>
        <div>
          <dt className={TT_ME_SECURITY_L5.sessionMetaLabel}>{t("me_security_page_th_status")}</dt>
          <dd>
            {revoked ? t("me_security_page_state_revoked") : t("me_security_page_state_active")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
