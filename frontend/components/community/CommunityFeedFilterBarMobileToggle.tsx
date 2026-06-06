import { type FormEvent, type Dispatch, type SetStateAction } from "react";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export type CommunityFeedFilterBarMobileToggleProps = {
  t: LocaleTranslateFn;
  chipFiltersRegionId: string;
  filtersExpanded: boolean;
  setFiltersExpanded: Dispatch<SetStateAction<boolean>>;
  chipFiltersActive: boolean;
};

export function CommunityFeedFilterBarMobileToggle({
  t,
  chipFiltersRegionId,
  filtersExpanded,
  setFiltersExpanded,
  chipFiltersActive,
}: CommunityFeedFilterBarMobileToggleProps) {
  return (
    <div className="mb-2 lg:hidden">
      <form
        className="block w-full"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setFiltersExpanded((v) => !v);
        }}
      >
        <button
          type="submit"
          className={TT_COMMUNITY_FEED_ACTION.filterMobileToggle}
          aria-expanded={filtersExpanded}
          aria-controls={chipFiltersRegionId}
        >
          <span className="flex items-center gap-2 min-w-0">
            <svg className="h-4 w-4 shrink-0 text-ref-sun/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="truncate">{t("community_filters_toggle")}</span>
            {chipFiltersActive ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-ref-sun shadow-scifi-dot-glow" aria-hidden />
            ) : null}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
