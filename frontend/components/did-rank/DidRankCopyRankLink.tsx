"use client";

import { useCallback, useState } from "react";
import { trackDidRankEvent } from "@/lib/analytics";
import { toDidRankShareAbsoluteUrl } from "@/lib/didRankShareLink";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

type TFunc = (key: string) => string;

export function DidRankCopyRankLink({
  sharePath,
  board,
  t,
  className = "",
}: {
  sharePath: string;
  board: "traveler" | "guide" | "provider" | "acquisition";
  t: TFunc;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    const url = toDidRankShareAbsoluteUrl(sharePath);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackDidRankEvent("did_rank_share_link_copy", { board });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      trackDidRankEvent("did_rank_share_link_copy_failed", { board });
    }
  }, [sharePath, board]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={`${TT_MARKETING_DID_RANK_SURFACE.shareRankLinkBtn} ${
        copied ? TT_MARKETING_DID_RANK_SURFACE.shareRankLinkBtnCopied : ""
      } ${className}`}
      aria-live="polite"
    >
      {copied ? t("didRank_shareLinkCopied") : t("didRank_copyRankLink")}
    </button>
  );
}
