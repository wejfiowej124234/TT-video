"use client";

import { CIM, CIM_CHOICE, CIM_FOCUS, CIM_FOCUS_WITHIN } from '../customItineraryModalTheme';
import Image from "next/image";
import { useId } from "react";
import {
  itinNestedImagePreviewPortalRootClass,
  itinNestedImagePreviewScrimClass,
} from "../../marketStudioModalLayout";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export function GuideFormCoverImagePreviewDialog({
  viewingGuideImage,
  setViewingGuideImage,
  t,
}: {
  viewingGuideImage: { label: string; url: string };
  setViewingGuideImage: (v: { label: string; url: string } | null) => void;
  t: (key: string) => string;
}) {
  const guideImagePreviewTitleId = useId();
  const guideImagePreviewDescId = useId();
  return (
    <div
      className={itinNestedImagePreviewPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={guideImagePreviewTitleId}
      aria-describedby={guideImagePreviewDescId}
      data-tt-custom-itinerary-guide-cover-preview="1"
    >
      <div
        className={itinNestedImagePreviewScrimClass}
        aria-hidden
        onClick={() => setViewingGuideImage(null)}
      />
      <div
        className={CIM.customItineraryOverlayPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <p id={guideImagePreviewDescId} className="sr-only">
          {t("market_guideCoverHint")}
        </p>
        <div className="relative aspect-[4/3] bg-ink-800">
          <Image
            src={communityMediaAbsoluteUrlForRender(viewingGuideImage.url)}
            alt={viewingGuideImage.label}
            fill
            className="object-cover"
            unoptimized={communityMediaNextImageUnoptimized(
              communityMediaAbsoluteUrlForRender(viewingGuideImage.url),
            )}
          />
        </div>
        <div className="p-6">
          <h4 id={guideImagePreviewTitleId} className="text-body font-semibold text-white">
            {viewingGuideImage.label}
          </h4>
        </div>
        <form
          className="absolute top-2 right-2 inline"
          onSubmit={(e) => {
            e.preventDefault();
            setViewingGuideImage(null);
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={t("common_close")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
