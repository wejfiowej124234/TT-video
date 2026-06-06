export type MeProfileRootTag = "div" | "section";

export function getMeProfileSectionChrome(
  unifiedInCommunityCard: boolean,
  insetInCollapsible: boolean
): {
  RootTag: MeProfileRootTag;
  rootClass: string;
  showFuchsiaHeader: boolean;
  bodyClass: string;
} {
  const RootTag: MeProfileRootTag = unifiedInCommunityCard ? "div" : "section";
  const rootClass = unifiedInCommunityCard
    ? insetInCollapsible
      ? "scroll-mt-24 pt-2"
      : "scroll-mt-24 border-t border-slate-600/45 pt-5 mt-5"
    : "scroll-mt-24 rounded-[var(--radius-md)] border border-fuchsia-500/30 bg-ink-900/70 backdrop-blur-md overflow-hidden mb-4 sm:mb-6 shadow-scifi-fuchsia-panel-md motion-sub hover:border-fuchsia-500/50 ring-1 ring-white/5";
  const showFuchsiaHeader = !unifiedInCommunityCard;
  const bodyClass =
    unifiedInCommunityCard && insetInCollapsible
      ? "space-y-2.5 sm:space-y-3"
      : unifiedInCommunityCard
        ? "space-y-4 sm:space-y-5"
        : "p-4 sm:p-6";
  return { RootTag, rootClass, showFuchsiaHeader, bodyClass };
}
