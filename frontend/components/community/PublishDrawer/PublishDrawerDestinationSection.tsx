"use client";

import {
  DESTINATION_LABEL_KEYS,
  PUBLISH_DESTINATION_OPTIONS,
} from "@/components/community/communityFeedConstants";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerDestinationSectionProps = {
  t: LocaleTranslateFn;
  publishDestinationLabelId: string;
  destination: string;
  onDestinationChange: (value: string) => void;
};

export function PublishDrawerDestinationSection({
  t,
  publishDestinationLabelId,
  destination,
  onDestinationChange,
}: PublishDrawerDestinationSectionProps) {
  return (
    <section
      className={`${TT_COMMUNITY_DRAWER_L5.publishFieldSection} ${TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
      aria-labelledby={publishDestinationLabelId}
    >
      <label id={publishDestinationLabelId} className="block text-small font-medium text-slate-300 mb-3">
        {t("community_publish_destination")}
      </label>
      <select
        value={destination}
        onChange={(e) => onDestinationChange(e.target.value)}
        data-testid="community-publish-drawer-destination"
        className={`w-full rounded-[var(--radius-lg)] border border-ref-sun/25 bg-ink-900/80 px-3 py-2.5 text-small text-slate-100 min-h-[44px] ${TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
        aria-label={t("community_publish_destination")}
      >
        <option value="">{t("community_publish_destination_optional")}</option>
        {PUBLISH_DESTINATION_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {DESTINATION_LABEL_KEYS[d] ? t(DESTINATION_LABEL_KEYS[d]) : d}
          </option>
        ))}
      </select>
      <p className="text-meta text-slate-400 mt-2" role="note">
        {t("community_publish_destination_hint")}
      </p>
    </section>
  );
}
