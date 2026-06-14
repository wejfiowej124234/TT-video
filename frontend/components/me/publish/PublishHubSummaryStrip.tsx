"use client";

import type { PublishHubSummaryChip } from "@/lib/me/publishHubSummaryModel";
import { TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";

export default function PublishHubSummaryStrip({
  t,
  chips,
}: {
  t: (key: string, vars?: Record<string, string | number>) => string;
  chips: readonly PublishHubSummaryChip[];
}) {
  if (chips.length === 0) return null;
  return (
    <div
      className={TT_PUBLISH_HUB_L5.summaryStrip}
      data-tt-publish-hub-summary="1"
      aria-label={t("publish_hub_summary_aria")}
    >
      {chips.map((chip) => (
        <span
          key={chip.rail}
          className={TT_PUBLISH_HUB_L5.summaryChip}
          data-tt-publish-hub-summary-rail={chip.rail}
        >
          {t(chip.labelKey, { count: chip.count })}
        </span>
      ))}
    </div>
  );
}
