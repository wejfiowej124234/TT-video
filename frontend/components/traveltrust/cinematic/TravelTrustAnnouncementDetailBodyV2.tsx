"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  resolveTraveltrustAnnouncementBenefitBullets,
  resolveTraveltrustAnnouncementDetailContent,
  resolveTraveltrustAnnouncementHighlight,
} from "@/lib/traveltrustAnnouncementDetailContent";
import type { TravelTrustAnnouncement } from "@/lib/traveltrustNetworkAnnouncements";
import {
  traveltrustAnnouncementBodyText,
  traveltrustAnnouncementListText,
  type TravelTrustAnnouncementDisplay,
} from "@/lib/traveltrustCmsAnnouncements";
import {
  formatTraveltrustAnnouncementListDate,
  resolveTraveltrustAnnouncementExpiresAt,
} from "@/lib/traveltrustNetworkAnnouncements";
import { TT_ANNOUNCEMENT_DETAIL_V2_L5, TT_FAQ_ACCORDION_L5, TT_PULSE_UPDATES_PANEL_L5 } from "@/lib/traveltrust/l5";

function AnnouncementDetailSteps({
  detail,
  t,
}: {
  detail: ReturnType<typeof resolveTraveltrustAnnouncementDetailContent>;
  t: (key: string) => string;
}) {
  if (detail.steps.length === 0) return null;

  const label = t(detail.stepsSectionLabelKey);
  const tok = TT_ANNOUNCEMENT_DETAIL_V2_L5;

  const renderStep = (step: (typeof detail.steps)[number], index: number, layout: "mobile" | "desktop") => {
    if (layout === "mobile") {
      return (
        <li key={`m-${step.titleKey}`} className={tok.stepTimelineRowClass}>
          <span className={tok.stepIndexClass} aria-hidden>
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className={tok.stepTitleClass}>{t(step.titleKey)}</p>
            <p className={`mt-0.5 ${tok.stepBodyClass}`}>{t(step.bodyKey)}</p>
          </div>
        </li>
      );
    }
    return (
      <li key={`d-${step.titleKey}`} className={tok.stepColClass}>
        <span className={`${tok.stepIndexClass} mb-1.5`} aria-hidden>
          {index + 1}
        </span>
        <p className={tok.stepTitleClass}>{t(step.titleKey)}</p>
        <p className={`mt-0.5 ${tok.stepBodyClass}`}>{t(step.bodyKey)}</p>
      </li>
    );
  };

  return (
    <details className={tok.techDetailsClass} data-tt-announcement-detail-tech="1">
      <summary className={tok.techSummaryClass}>
        <span>{t("traveltrust_announcements_detail_tech_toggle")}</span>
        <span className={tok.techChevronClass} aria-hidden>
          ›
        </span>
      </summary>
      <section className="mt-3" aria-label={label}>
        <p className={tok.sectionLabelClass}>{label}</p>
        <ol className={`mt-2 ${tok.stepsMobileClass}`} aria-label={label}>
          {detail.steps.map((step, index) => renderStep(step, index, "mobile"))}
        </ol>
        <ol className={`mt-2 ${tok.stepsDesktopClass}`} aria-label={label}>
          {detail.steps.map((step, index) => renderStep(step, index, "desktop"))}
        </ol>
      </section>
    </details>
  );
}

type Props = {
  item: TravelTrustAnnouncementDisplay;
  bodyId: string;
};

/** L5 公告详情 · 默认用户层 + 可展开技术说明 */
export function TravelTrustAnnouncementDetailBodyV2({ item, bodyId }: Props) {
  const { t, locale } = useTranslation();

  if (item.cmsCopy) {
    const body = traveltrustAnnouncementBodyText(item, locale);
    const summary = traveltrustAnnouncementListText(item, locale);
    const formattedRelease =
      item.contentTier === "upcoming" && item.releaseAt
        ? formatTraveltrustAnnouncementListDate(item.releaseAt, locale ?? "en")
        : null;
    return (
      <div id={bodyId} className={TT_PULSE_UPDATES_PANEL_L5.detailContentClass}>
        <div className={TT_FAQ_ACCORDION_L5.warmPlateClass} data-tt-announcement-detail-cms="1">
          <p className={TT_ANNOUNCEMENT_DETAIL_V2_L5.highlightInnerClass}>{summary}</p>
        </div>
        {body ? <p className="mt-3 text-meta text-slate-300/92 whitespace-pre-wrap">{body}</p> : null}
        {formattedRelease ? (
          <div className={`${TT_PULSE_UPDATES_PANEL_L5.detailMetaBlockClass} mt-4`}>
            <div className={TT_ANNOUNCEMENT_DETAIL_V2_L5.metaRowClass}>
              <span className={TT_PULSE_UPDATES_PANEL_L5.detailMetaLabelClass}>
                {t("traveltrust_announcements_detail_timeline_meta")}
              </span>
              <p className={TT_PULSE_UPDATES_PANEL_L5.detailMetaValueClass}>
                {t("traveltrust_announcements_detail_planned_launch")} {formattedRelease}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const detail = resolveTraveltrustAnnouncementDetailContent(item);
  const highlight = resolveTraveltrustAnnouncementHighlight(item, detail, t);
  const benefitBullets = resolveTraveltrustAnnouncementBenefitBullets(detail, t);
  const expiresAt = resolveTraveltrustAnnouncementExpiresAt(item);
  const formattedRelease =
    item.contentTier === "upcoming" && item.releaseAt
      ? formatTraveltrustAnnouncementListDate(item.releaseAt, locale ?? "en")
      : null;
  const formattedEffective =
    item.contentTier === "live" && item.effectiveAt
      ? formatTraveltrustAnnouncementListDate(item.effectiveAt, locale ?? "en")
      : null;

  const formattedExpires =
    expiresAt != null ? formatTraveltrustAnnouncementListDate(expiresAt, locale ?? "en") : null;

  const timelineParts = [
    formattedRelease
      ? `${t("traveltrust_announcements_detail_planned_launch")} ${formattedRelease}`
      : null,
    !formattedRelease && formattedEffective
      ? `${t("traveltrust_announcements_detail_effective")} ${formattedEffective}`
      : null,
    formattedExpires && item.lane === "protocol_status"
      ? `${t("traveltrust_announcements_detail_list_until")} ${formattedExpires}`
      : null,
  ].filter(Boolean);

  const tok = TT_ANNOUNCEMENT_DETAIL_V2_L5;

  return (
    <div id={bodyId} className={TT_PULSE_UPDATES_PANEL_L5.detailContentClass}>
      {highlight ? (
        <div className={TT_FAQ_ACCORDION_L5.warmPlateClass} data-tt-announcement-detail-highlight="1">
          <p className={tok.highlightInnerClass}>{highlight}</p>
        </div>
      ) : null}

      {benefitBullets.length > 0 ? (
        <section aria-label={t("traveltrust_announcements_detail_benefit")}>
          <p className={tok.sectionLabelClass}>{t("traveltrust_announcements_detail_benefit")}</p>
          <ul className={`mt-2 ${tok.benefitListClass}`}>
            {benefitBullets.map((text) => (
              <li key={text} className={tok.benefitItemClass}>
                <span className={tok.benefitMarkClass} aria-hidden>
                  ✔
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AnnouncementDetailSteps detail={detail} t={t} />

      {detail.related.length > 0 ? (
        <section aria-label={t("traveltrust_announcements_detail_related")}>
          <p className={tok.sectionLabelClass}>{t("traveltrust_announcements_detail_related")}</p>
          <nav className={tok.relatedListClass}>
            {detail.related.map((rel) => (
              <Link
                key={rel.href}
                href={rel.href}
                className={tok.relatedLinkClass}
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                    source: "announcement_detail_related",
                    target: rel.href,
                    id: item.id,
                  })
                }
              >
                {t(rel.titleKey)}
              </Link>
            ))}
          </nav>
        </section>
      ) : null}

      {timelineParts.length > 0 ? (
        <div className={TT_PULSE_UPDATES_PANEL_L5.detailMetaBlockClass}>
          <div className={tok.metaRowClass}>
            <span className={TT_PULSE_UPDATES_PANEL_L5.detailMetaLabelClass}>
              {t("traveltrust_announcements_detail_timeline_meta")}
            </span>
            <p className={TT_PULSE_UPDATES_PANEL_L5.detailMetaValueClass}>{timelineParts.join(" · ")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
