"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import GuideCard from "@/components/market/GuideCard";
import type { GuideCardItem } from "@/lib/marketTypes";
import {
  guidePublicDetailHref,
  guidePublicMarketBrowseHref,
} from "@/lib/guide/guideWorkbenchProfileSummaryModel";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

export function GuideProfileMarketPreview({
  draft,
  profileMeta,
  dirtyOnly = false,
}: {
  draft: GuideCardItem;
  profileMeta?: Pick<MeGuideProfile, "public_detail_available" | "city"> | null;
  /** 仅编辑中展示；已保存挂牌见 /guide 市场曝光 */
  dirtyOnly?: boolean;
}) {
  const { t } = useTranslation();
  const previewGuide = useMemo(
    () => ({
      ...draft,
      id: draft.id || "preview-guide",
      status: "active",
    }),
    [draft],
  );
  const publicHref =
    draft.id && draft.id !== "preview-guide"
      ? guidePublicDetailHref({
          guide_id: draft.id,
          public_detail_available: profileMeta?.public_detail_available,
          city: profileMeta?.city,
        })
      : null;
  const marketBrowseHref =
    profileMeta?.public_detail_available === false ? guidePublicMarketBrowseHref(profileMeta) : null;

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      aria-labelledby="me-guide-profile-preview-title"
      data-tt-me-guide-profile-preview="1"
      data-tt-me-guide-profile-preview-dirty-only={dirtyOnly ? "1" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="me-guide-profile-preview-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
            {t("me_guide_profile_preview_title")}
          </h2>
          <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>
            {dirtyOnly ? t("me_guide_profile_preview_subtitle_dirty") : t("me_guide_profile_preview_subtitle")}
          </p>
        </div>
        {publicHref ? (
          <Link
            href={publicHref}
            className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}
            data-tt-me-guide-profile-public-link="1"
          >
            {t("me_guide_profile_view_public_listing")}
          </Link>
        ) : marketBrowseHref ? (
          <Link
            href={marketBrowseHref}
            className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}
            data-tt-me-guide-profile-market-browse-link="1"
          >
            {t("guide_workbench_profile_summary_market_browse")}
          </Link>
        ) : null}
      </div>
      <div className="mt-4 max-w-sm">
        <GuideCard guide={previewGuide} glass previewOnly />
      </div>
    </section>
  );
}
