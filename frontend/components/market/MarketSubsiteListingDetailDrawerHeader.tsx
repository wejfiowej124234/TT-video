"use client";

import {
  marketDetailDrawerCloseBtn,
  marketDetailDrawerHeaderRow,
  marketDetailDrawerTitle,
} from "@/components/market/marketDetailDrawerClasses";

type TFn = (key: string) => string;

export function MarketSubsiteListingDetailDrawerHeader({
  titleId,
  title,
  t,
  onClose,
}: {
  titleId: string;
  title: string;
  t: TFn;
  onClose: () => void;
}) {
  return (
    <div className={marketDetailDrawerHeaderRow}>
      <h2 id={titleId} className={marketDetailDrawerTitle}>
        {title}
      </h2>
      <form
        className="inline shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button type="submit" className={marketDetailDrawerCloseBtn} aria-label={t("market_subsite_listing_drawer_close")}>
          ✕
        </button>
      </form>
    </div>
  );
}
