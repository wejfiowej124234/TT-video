"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  communityFeedDestinationLabel,
  FEED_DESTINATION_GROUPS,
} from "./communityFeedConstants";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

const DESTINATION_PICKER_SHEET_MQ = "(max-width: 640px)";

type PanelLayout = "sheet" | "dropdown";

type PanelAnchor = {
  top: number;
  left: number;
  minWidth: number;
};

export interface CommunityFeedDestinationPickerProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  value: string;
  onChange: (value: string) => void;
  /** When a city is chosen (not 「全部」), e.g. switch feed tab to recommend */
  onCitySelect?: () => void;
  className?: string;
  showLabel?: boolean;
}

function destinationPickerCityBtn(active: boolean): string {
  return `flex min-h-[44px] items-center justify-center rounded-xl border px-3 py-2 text-meta font-medium motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${
    active
      ? "border-ref-sun/45 bg-ref-sun/12 text-ref-sun"
      : "border-ref-sun/18 bg-ink-900/55 text-slate-300 hover:border-ref-sun/28 hover:bg-ref-sun/8"
  }`;
}

export function CommunityFeedDestinationPicker({
  t,
  value,
  onChange,
  onCitySelect,
  className = "",
  showLabel = false,
}: CommunityFeedDestinationPickerProps) {
  const [open, setOpen] = useState(false);
  const [panelLayout, setPanelLayout] = useState<PanelLayout>("dropdown");
  const [panelAnchor, setPanelAnchor] = useState<PanelAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setPanelAnchor(null);
  }, []);

  const syncPanelLayout = useCallback(() => {
    if (typeof window === "undefined") return;
    setPanelLayout(window.matchMedia(DESTINATION_PICKER_SHEET_MQ).matches ? "sheet" : "dropdown");
  }, []);

  const syncPanelAnchor = useCallback(() => {
    const el = triggerRef.current;
    if (!el || panelLayout === "sheet") {
      setPanelAnchor(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 280);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - minWidth - 8));
    setPanelAnchor({ top: rect.bottom + 6, left, minWidth });
  }, [panelLayout]);

  useEffect(() => {
    syncPanelLayout();
    const mq = window.matchMedia(DESTINATION_PICKER_SHEET_MQ);
    const onChange = () => syncPanelLayout();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [syncPanelLayout]);

  useLayoutEffect(() => {
    if (!open) return;
    syncPanelAnchor();
    const onReflow = () => syncPanelAnchor();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, syncPanelAnchor, panelLayout]);

  useEffect(() => {
    if (!open || panelLayout !== "sheet") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, panelLayout]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (document.getElementById(panelId)?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close, panelId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const selectValue = (next: string) => {
    onChange(next);
    if (next !== "all") onCitySelect?.();
    close();
  };

  const triggerLabel =
    value === "all" ? t("community_destination_all") : communityFeedDestinationLabel(t, value);

  const panelBody = (
    <div className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain px-3 pb-3 pt-1">
      <button
        type="button"
        role="option"
        aria-selected={value === "all"}
        className={`${destinationPickerCityBtn(value === "all")} mb-3 w-full`}
        onClick={() => selectValue("all")}
      >
        {t("community_destination_all")}
      </button>
      {FEED_DESTINATION_GROUPS.map(({ regionKey, cities }) => (
        <div key={regionKey} className="mb-3 last:mb-0">
          <p
            className="mb-2 px-1 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-500"
            aria-hidden
          >
            {t(`community_region_${regionKey}`)}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                role="option"
                aria-selected={value === city}
                className={destinationPickerCityBtn(value === city)}
                onClick={() => selectValue(city)}
              >
                {communityFeedDestinationLabel(t, city)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const panelPortal =
    open && typeof document !== "undefined"
      ? panelLayout === "sheet"
        ? createPortal(
            <>
              <button
                type="button"
                className={TT_COMMUNITY_FEED_ACTION.supportMenuScrim}
                aria-label={t("community_close")}
                onClick={close}
              />
              <div
                id={panelId}
                role="listbox"
                aria-label={t("community_destination")}
                data-testid="community-feed-destination-picker-panel"
                className={TT_COMMUNITY_FEED_ACTION.supportMenuSheet}
              >
                <p className={TT_COMMUNITY_FEED_ACTION.supportMenuSheetTitle}>
                  {t("community_destination")}
                </p>
                {panelBody}
              </div>
            </>,
            document.body,
          )
        : panelAnchor
          ? createPortal(
              <div
                id={panelId}
                role="listbox"
                aria-label={t("community_destination")}
                data-testid="community-feed-destination-picker-panel"
                className={`${TT_COMMUNITY_FEED_ACTION.supportMenuPanel} fixed max-w-[min(24rem,calc(100vw-1rem))]`}
                style={{
                  top: panelAnchor.top,
                  left: panelAnchor.left,
                  minWidth: panelAnchor.minWidth,
                }}
              >
                {panelBody}
              </div>,
              document.body,
            )
          : null
      : null;

  return (
    <div
      ref={rootRef}
      className={`${TT_COMMUNITY_FEED_ACTION.discoveryDestinationPillWrap} ${className}`.trim()}
      data-testid="community-feed-destination-picker"
    >
      {showLabel ? (
        <span className="mb-1 block text-[0.62rem] text-slate-500">{t("community_destination")}</span>
      ) : (
        <span className="sr-only">{t("community_destination")}</span>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        className={`${TT_COMMUNITY_FEED_ACTION.discoveryDestinationSelect} w-full max-w-full text-left`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="block truncate pr-4">{triggerLabel}</span>
      </button>
      <svg
        className={`${TT_COMMUNITY_FEED_ACTION.discoveryDestinationChevron} motion-safe:transition-transform ${
          open ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      {panelPortal}
    </div>
  );
}
