"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE } from "@/lib/marketingUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { marketDetailDrawerMeta } from "@/components/market/marketDetailDrawerClasses";
import { publicApiHealthCheckUrl } from "@/lib/publicApiHealthUrl";

export function GuideDetailDrawerCopyHealthUrlRow({ t }: { t: (key: string) => string }) {
  const url = useMemo(() => publicApiHealthCheckUrl(), []);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current != null) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(url);
      if (copyTimeoutRef.current != null) clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      /* 非安全上下文或浏览器拒绝：静默 */
    }
  }, [url]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={t("guide_detail_copyHealthUrl_aria")}
      className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} ${marketDetailDrawerMeta} w-full min-h-[44px] justify-start text-left underline decoration-white/20 decoration-dotted underline-offset-2 hover:text-slate-300 inline-flex items-center`}
      data-tt-guide-drawer-copy-health="1"
    >
      {copied ? t("guide_detail_copyHealthUrl_copied") : t("guide_detail_copyHealthUrl")}
    </button>
  );
}
