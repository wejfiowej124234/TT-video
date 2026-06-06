"use client";

import { CommunityReportDrawer } from "@/components/community/CommunityReportDrawer";
import { CommunityDrawerPortal } from "@/components/community/communityDrawerPortal";
import type { CommunityReportFlowContext } from "@/components/community/useCommunityPostReport";
import type { CommunityReportReasonCode } from "@/lib/apiClient/community";

export function CommunityReportDrawerPortal({
  context,
  onClose,
  onSubmit,
  t,
  reportSendFailed,
  reportErrorMessage,
  reportFieldMessages,
  onClearReportError,
}: {
  context: CommunityReportFlowContext;
  onClose: () => void;
  onSubmit: (reason: CommunityReportReasonCode, details: string) => void | Promise<void>;
  t: (key: string) => string;
  reportSendFailed?: boolean;
  reportErrorMessage?: string | null;
  reportFieldMessages?: Record<string, string> | null;
  onClearReportError?: () => void;
}) {
  return (
    <CommunityDrawerPortal>
      <CommunityReportDrawer
        context={context}
        onClose={onClose}
        onSubmit={onSubmit}
        t={t}
        reportSendFailed={reportSendFailed}
        reportErrorMessage={reportErrorMessage}
        reportFieldMessages={reportFieldMessages}
        onClearReportError={onClearReportError}
      />
    </CommunityDrawerPortal>
  );
}
