/**
 * 发布中心 · 统一卡片 schema（SSOT：`PUBLISH-HUB-L5-DESIGN.md` §3）
 */
import type { PublishHubContentRail } from "@/lib/me/publishHubModel";

export type PublishHubItemStatusTone = "success" | "warning" | "neutral" | "danger";

export type PublishHubItemSecondaryAction = {
  id: string;
  label: string;
  kind: "link" | "button";
  href?: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
  dataAttr?: string;
};

export type PublishHubItem = {
  key: string;
  rail: PublishHubContentRail;
  id: string;
  title: string;
  subtitle?: string;
  statusText?: string;
  statusTone?: PublishHubItemStatusTone;
  coverUrl?: string | null;
  primaryAction?: {
    href: string;
    label: string;
    dataAttr?: string;
  };
  secondaryActions?: readonly PublishHubItemSecondaryAction[];
};

export function publishHubItemStatusToneForListingKind(
  kind: "published" | "draft",
): PublishHubItemStatusTone {
  return kind === "published" ? "success" : "warning";
}

export function publishHubItemStatusToneForGovernanceStatus(status: string): PublishHubItemStatusTone {
  const s = status.trim().toLowerCase();
  if (s === "active" || s === "succeeded" || s === "executed" || s === "queued") return "success";
  if (s === "pending" || s === "pendingvote" || s === "pending_vote") return "warning";
  if (s === "canceled" || s === "cancelled" || s === "defeated" || s === "expired") return "danger";
  return "neutral";
}

export function publishHubItemStatusToneForGuideStatusKey(statusKey: string): PublishHubItemStatusTone {
  if (statusKey.includes("active")) return "success";
  if (statusKey.includes("pending")) return "warning";
  if (statusKey.includes("rejected") || statusKey.includes("suspended")) return "danger";
  return "neutral";
}

export const PUBLISH_HUB_ITEM_RAIL_FALLBACK_LABEL: Record<PublishHubContentRail, string> = {
  trip: "TR",
  guide: "GD",
  merchant: "MR",
  acquisition: "AC",
  governance: "GV",
};
