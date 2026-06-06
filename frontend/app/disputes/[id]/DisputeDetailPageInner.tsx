"use client";

import { DisputeDetailLoadedView } from "./DisputeDetailLoadedView";
import { DisputeDetailPageErrorView } from "./DisputeDetailPageErrorView";
import { DisputeDetailPageLoadingView } from "./DisputeDetailPageLoadingView";
import { DisputeDetailPageNotFoundView } from "./DisputeDetailPageNotFoundView";
import { useDisputeDetailPage } from "./useDisputeDetailPage";

export function DisputeDetailPageInner() {
  const m = useDisputeDetailPage();

  if (m.loading) {
    return <DisputeDetailPageLoadingView t={m.t} />;
  }
  if (m.error) {
    return <DisputeDetailPageErrorView t={m.t} error={m.error} onDisputeLoadRetry={m.onDisputeLoadRetry} />;
  }
  if (!m.dispute) {
    return <DisputeDetailPageNotFoundView t={m.t} />;
  }

  return <DisputeDetailLoadedView {...m} />;
}
