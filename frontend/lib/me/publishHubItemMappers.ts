import type { PublishHubGovernanceProposalRow } from "@/app/me/publish/usePublishHubGovernanceRail";import type { PublishHubTripOrderRow } from "@/app/me/publish/usePublishHubTripOrders";
import type { MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import {
  publishHubGuideHeadline,
  publishHubGuideStatusLabelKey,
} from "@/lib/me/publishHubGuideModel";
import type { PublishHubItem } from "@/lib/me/publishHubItemModel";
import {
  publishHubItemStatusToneForGovernanceStatus,
  publishHubItemStatusToneForGuideStatusKey,
  publishHubItemStatusToneForListingKind,
} from "@/lib/me/publishHubItemModel";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import type { MerchantWorkbenchShowcaseRow } from "@/lib/provider/providerWorkbenchListingsModel";

export function mapPublishHubTripItems(
  rows: readonly PublishHubTripOrderRow[],
  primaryLabel: string,
): PublishHubItem[] {
  return rows.map((row) => ({
    key: `trip-${row.id}`,
    rail: "trip",
    id: row.id,
    title: row.title,
    statusText: row.statusLabel,
    statusTone: "neutral",
    coverUrl: row.coverUrl ?? null,
    primaryAction: {
      href: row.href,
      label: primaryLabel,
      dataAttr: row.id,
    },
  }));
}

export function mapPublishHubGovernanceItems(
  rows: readonly PublishHubGovernanceProposalRow[],
  primaryLabel: string,
): PublishHubItem[] {
  return rows.map((row) => ({
    key: `governance-${row.id}`,
    rail: "governance",
    id: row.id,
    title: row.title,
    statusText: row.status,
    statusTone: publishHubItemStatusToneForGovernanceStatus(row.status),
    coverUrl: null,
    primaryAction: {
      href: row.href,
      label: primaryLabel,
      dataAttr: row.id,
    },
  }));
}

export function mapPublishHubGuideItem(input: {
  profile: MeGuideProfile | null;
  slotState: MeIdentitySlotState | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  settingsHref: string;
  editLabel: string;
}): PublishHubItem {
  const statusKey = publishHubGuideStatusLabelKey(input.profile, input.slotState);
  const headline = publishHubGuideHeadline(input.profile, input.t("publish_hub_guide_untitled"));
  const subtitle = input.profile?.hourly_rate
    ? input.t("publish_hub_guide_hourly_line", { rate: input.profile.hourly_rate })
    : undefined;
  return {
    key: "guide-profile",
    rail: "guide",
    id: input.profile?.guide_id?.trim() || "guide-profile",
    title: headline,
    subtitle,
    statusText: input.t(statusKey),
    statusTone: publishHubItemStatusToneForGuideStatusKey(statusKey),
    coverUrl: input.profile?.avatar_url ?? null,
    primaryAction: {
      href: input.settingsHref,
      label: input.editLabel,
      dataAttr: "settings",
    },
  };
}

export function mapPublishHubListingItems(input: {
  rail: "merchant" | "acquisition";
  rows: readonly MerchantWorkbenchShowcaseRow[];
  publishedLabel: string;
  draftLabel: string;
  archiveLabel: string;
  archivingLabel: string;
  deleteDraftLabel: string;
  deletingLabel: string;
  mutatingId: string | null;
  onArchivePublished: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  variantDataAttr: string;
}): PublishHubItem[] {
  return input.rows.map((row) => {
    const busy = input.mutatingId === row.id;
    const isPublished = row.kind === "published";
    return {
      key: `${input.rail}-${row.kind}-${row.id}`,
      rail: input.rail,
      id: row.id,
      title: row.title,
      statusText: isPublished ? input.publishedLabel : input.draftLabel,
      statusTone: publishHubItemStatusToneForListingKind(row.kind),
      coverUrl: row.coverUrl ?? null,
      secondaryActions: [
        isPublished
          ? {
              id: "archive",
              kind: "button",
              label: busy ? input.archivingLabel : input.archiveLabel,
              disabled: busy,
              busy,
              onClick: () => void input.onArchivePublished(row.id),
              dataAttr: input.variantDataAttr,
            }
          : {
              id: "delete-draft",
              kind: "button",
              label: busy ? input.deletingLabel : input.deleteDraftLabel,
              disabled: busy,
              busy,
              onClick: () => void input.onDeleteDraft(row.id),
              dataAttr: input.variantDataAttr,
            },
      ],
    };
  });
}
