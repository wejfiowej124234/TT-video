"use client";

import {
  AdminHomeSystemOverview,
  adminHomeSystemOverviewCollapsedSummaryVars,
} from "@/components/admin/AdminHomeSystemOverview";
import { AdminHomeCollapsibleSection } from "@/components/admin/AdminHomeCollapsibleSection";
import { adminHomeSystemOverviewDefaultOpen } from "@/lib/admin/adminShellUxPolicy";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import type { AdminHomeKpiCounts } from "@/lib/admin/useAdminHomeKpi";
import { useAdminHomeSystemOverview } from "@/lib/admin/useAdminHomeSystemOverview";

export function AdminHomeSystemOverviewSection(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  inboxLoading: boolean;
  kpi: AdminHomeKpiCounts;
  kpiLoading: boolean;
  inboxPendingTotal: number | null;
  focusInbox: boolean;
}) {
  const overview = useAdminHomeSystemOverview();
  const defaultOpen = props.focusInbox
    ? false
    : adminHomeSystemOverviewDefaultOpen(props.inboxPendingTotal);
  const summaryVars = adminHomeSystemOverviewCollapsedSummaryVars({
    users: overview.users,
    metrics: overview.metrics,
    observability: overview.observability,
    inboxPendingTotal: props.inboxPendingTotal,
    adminActivity7d: overview.metrics?.trends.adminActivity.reduce((a, b) => a + b, 0) ?? null,
  });

  return (
    <AdminHomeCollapsibleSection
      sectionId="home-system-overview"
      titleKey="admin_home_system_overview_title"
      defaultOpen={defaultOpen}
      persistOpen={!props.focusInbox}
      frame={props.focusInbox ? "compact" : "warm"}
      collapsedSummaryKey="admin_home_system_overview_collapsed_summary"
      collapsedSummaryVars={summaryVars}
    >
      <AdminHomeSystemOverview {...props} overview={overview} />
    </AdminHomeCollapsibleSection>
  );
}
