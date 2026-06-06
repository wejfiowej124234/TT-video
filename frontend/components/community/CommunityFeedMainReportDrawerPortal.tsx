"use client";

import dynamic from "next/dynamic";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

const CommunityReportDrawerPortal = dynamic(
  () =>
    import("@/components/community/CommunityReportDrawerPortal").then((mod) => ({
      default: mod.CommunityReportDrawerPortal,
    })),
  { ssr: false, loading: () => null },
);

type ReportSlice = Pick<
  CommunityFeedMainPortalsProps,
  | "t"
  | "reportContext"
  | "closeReportDrawer"
  | "handleReportSubmit"
  | "reportSendFailed"
  | "reportErrorMessage"
  | "reportFieldMessages"
  | "clearReportSendError"
>;

export function CommunityFeedMainReportDrawerPortal(props: ReportSlice) {
  const {
    t,
    reportContext,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
  } = props;
  if (!reportContext) return null;
  return (
    <CommunityReportDrawerPortal
      context={reportContext}
      onClose={closeReportDrawer}
      onSubmit={handleReportSubmit}
      t={t}
      reportSendFailed={reportSendFailed}
      reportErrorMessage={reportErrorMessage}
      reportFieldMessages={reportFieldMessages}
      onClearReportError={clearReportSendError}
    />
  );
}
