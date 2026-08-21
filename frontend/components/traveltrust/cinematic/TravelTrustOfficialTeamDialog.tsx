"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { TRAVELTRUST_OFFICIAL_TEAM } from "@/lib/traveltrustOfficialTeam";
import { isOfficialTeamLinkedInProfileUrl } from "@/lib/traveltrustListingDisclosure";
import {
  TT_ANNOUNCEMENTS_MOTION_L5,
  TT_PULSE_UPDATES_PANEL_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

type Props = {
  open: boolean;
  onClose: () => void;
};

function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z"
      />
    </svg>
  );
}

export function TravelTrustOfficialTeamDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();
  const trapRef = useFocusTrap(open, onClose);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const panelMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: TT_ANNOUNCEMENTS_MOTION_L5.panelScale },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: {
          duration: TT_ANNOUNCEMENTS_MOTION_L5.panel.duration,
          ease: TT_ANNOUNCEMENTS_MOTION_L5.panel.ease,
        },
      };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={TT_PULSE_UPDATES_PANEL_L5.detailOverlayClass}
          data-tt-traveltrust-official-team-dialog="1"
          data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        >
          <motion.button
            type="button"
            className={TT_PULSE_UPDATES_PANEL_L5.backdropClass}
            aria-label={t("common_close")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: TT_ANNOUNCEMENTS_MOTION_L5.backdrop.duration,
              ease: TT_ANNOUNCEMENTS_MOTION_L5.backdrop.ease,
            }}
          />
          <motion.div
            ref={(el) => {
              trapRef.current = el;
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className={`${TT_PULSE_UPDATES_PANEL_L5.detailPanelClass} sm:max-w-[min(100vw,72rem)]`}
            data-tt-traveltrust-official-team-panel="1"
            {...panelMotion}
          >
            <div className={TT_PULSE_UPDATES_PANEL_L5.detailPanelTopGlowClass} aria-hidden />
            <div className={TT_PULSE_UPDATES_PANEL_L5.sheetHandleClass} aria-hidden />
            <div className={TT_PULSE_UPDATES_PANEL_L5.headerClass}>
              <div className="min-w-0 pr-2">
                <p className={TT_PULSE_UPDATES_PANEL_L5.titleClass}>
                  {t("traveltrust_official_team_kicker")}
                </p>
                <h2 id={titleId} className={TT_PULSE_UPDATES_PANEL_L5.detailTitleClass}>
                  {t("traveltrust_official_team_title")}
                </h2>
                <p id={bodyId} className={TT_PULSE_UPDATES_PANEL_L5.descClass}>
                  {t("traveltrust_official_team_disclaimer")}
                </p>
              </div>
              <button
                type="button"
                className={TT_PULSE_UPDATES_PANEL_L5.closeBtnClass}
                onClick={onClose}
                aria-label={t("common_close")}
              >
                <span aria-hidden>×</span>
              </button>
            </div>

            <ul
              className={`${TT_PULSE_UPDATES_PANEL_L5.listClass} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5`}
            >
              {TRAVELTRUST_OFFICIAL_TEAM.map((member) => {
                const name = t(member.nameKey);
                const linkedInReady = isOfficialTeamLinkedInProfileUrl(member.linkedinUrl);
                return (
                  <li
                    key={member.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-ref-sun/14 bg-[#100e0c]"
                    data-tt-traveltrust-official-team-member={member.id}
                  >
                    <div className="relative">
                      <img
                        src={member.image}
                        alt={name}
                        width={640}
                        height={640}
                        className="aspect-square w-full object-cover object-top"
                      />
                      {linkedInReady && member.linkedinUrl ? (
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-2.5 right-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-ref-sun/55 bg-[#0c0a09]/90 text-ref-sun transition hover:border-ref-sun hover:bg-ref-sun/15 hover:text-[#fde9a8] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55"
                          title={t("traveltrust_official_team_linkedin")}
                          aria-label={t("traveltrust_official_team_linkedin_aria", { name })}
                          data-tt-traveltrust-official-team-linkedin="1"
                          onClick={() =>
                            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                              source: "official_team_dialog",
                              target: "linkedin",
                              role: member.id,
                            })
                          }
                        >
                          <LinkedInGlyph className="h-4 w-4" />
                        </a>
                      ) : (
                        <span
                          className="absolute bottom-2.5 right-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-ref-sun/25 bg-[#0c0a09]/80 text-ref-sun/55"
                          title={t("traveltrust_official_team_linkedin_pending")}
                          aria-label={t("traveltrust_official_team_linkedin_pending_aria", { name })}
                          data-tt-traveltrust-official-team-linkedin="pending"
                        >
                          <LinkedInGlyph className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-3.5 py-3.5">
                      <p className="text-[15px] font-semibold leading-snug text-slate-50">{name}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ref-sun/90">
                        {t(member.roleKey)}
                      </p>
                      <p className="mt-1 text-meta text-slate-400/95">{t(member.locationKey)}</p>
                      <p className="mt-2 flex-1 text-meta leading-relaxed text-slate-300/90">
                        {t(member.bioKey)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={TT_PULSE_UPDATES_PANEL_L5.detailFooterClass}>
              <button type="button" className={TT_PULSE_UPDATES_PANEL_L5.detailSecondaryCtaClass} onClick={onClose}>
                {t("common_close")}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
