"use client";

import {
  AdminHomeSystemOverview,
  adminHomeSystemOverviewCollapsedSummaryVars,
} from "@/components/admin/AdminHomeSystemOverview";
import { AdminHomeCollapsibleSection } from "@/components/admin/AdminHomeCollapsibleSection";
import { AdminHomeTreasuryPoolStrip } from "@/components/admin/AdminHomeTreasuryPoolStrip";
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
  kpiSource?: string | null;
  inboxPendingTotal: number | null;
  focusInbox: boolean;
}) {
  const overview = useAdminHomeSystemOverview();
  /** HU-455：聚焦（pending>0）默认收起；无待办仍展开 */
  const defaultOpen = adminHomeSystemOverviewDefaultOpen(props.inboxPendingTotal);
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
      /* HU-455 · 聚焦不记忆展开，避免旧 localStorage 盖掉「先待办」默认收起 */
      persistOpen={!props.focusInbox}
      frame={props.focusInbox ? "compact" : "warm"}
      collapsedSummaryKey="admin_home_system_overview_collapsed_summary"
      collapsedSummaryVars={summaryVars}
    >
      <AdminHomeSystemOverview {...props} overview={overview} />
      <AdminHomeTreasuryPoolStrip />
    </AdminHomeCollapsibleSection>
  );
}
