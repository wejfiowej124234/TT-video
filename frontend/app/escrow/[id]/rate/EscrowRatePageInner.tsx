"use client";

import { useParams } from "next/navigation";

import { EscrowRatePageSkeleton } from "@/components/escrow/EscrowRateRouteSuspense";

import { EscrowRatePageEmptyIdView } from "./EscrowRatePageEmptyIdView";
import { EscrowRatePageLoadErrorView } from "./EscrowRatePageLoadErrorView";
import { EscrowRatePageMain } from "./EscrowRatePageMain";
import { useEscrowRatePage } from "./useEscrowRatePage";

export function EscrowRatePageInner() {
  const params = useParams();
  const idRaw = typeof params?.id === "string" ? params.id : "";
  const ctx = useEscrowRatePage(idRaw);

  if (!ctx.id) {
    return <EscrowRatePageEmptyIdView t={ctx.t} />;
  }
  if (ctx.loading) {
    return <EscrowRatePageSkeleton t={ctx.t} />;
  }
  if (ctx.orderLoadError) {
    return (
      <EscrowRatePageLoadErrorView
        t={ctx.t}
        orderLoadError={ctx.orderLoadError}
        onRetry={() => void ctx.loadOrder()}
      />
    );
  }

  return (
    <EscrowRatePageMain
      t={ctx.t}
      id={ctx.id}
      order={ctx.order}
      phase={ctx.phase}
      files={ctx.files}
      submitting={ctx.submitting}
      error={ctx.error}
      uploadServerSyncHint={ctx.uploadServerSyncHint}
      uploadSubmitHintId={ctx.uploadSubmitHintId}
      ratePageH1Id={ctx.ratePageH1Id}
      rateUploadHeadingId={ctx.rateUploadHeadingId}
      rateFileInputId={ctx.rateFileInputId}
      rateFileHintId={ctx.rateFileHintId}
      rateReleaseCtaHeadingId={ctx.rateReleaseCtaHeadingId}
      stashEscrowMainPrefetch={ctx.stashEscrowMainPrefetch}
      onFileChange={ctx.onFileChange}
      submitUpload={ctx.submitUpload}
      confirmRating={ctx.confirmRating}
    />
  );
}
