"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_CONSOLE_HOVER_ACCENT, TT_MARKETING_CONSOLE_INLINE_LINK, TT_MARKETING_CONSOLE_LINK_FOCUS} from "@/lib/marketingUi";

/** P28 §2.B、§5：预算区底部折叠「Agreement summary」，展开展示 token、total、platform fee、snapshotHash、release conditions */
export default function AgreementSummaryAccordion({
  total,
  platformFee,
  orderId,
}: { total: number; platformFee: number; orderId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const copyOkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyOkTimerRef.current != null) {
        clearTimeout(copyOkTimerRef.current);
        copyOkTimerRef.current = null;
      }
    },
    []
  );

  const copySnapshot = async () => {
    setCopyError(null);
    if (copyOkTimerRef.current != null) {
      clearTimeout(copyOkTimerRef.current);
      copyOkTimerRef.current = null;
    }
    setCopyOk(false);
    const text = `order:${orderId}`;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyError(t("agree_copy_clipboard_unavailable"));
      return;
    }
    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      copyOkTimerRef.current = setTimeout(() => {
        setCopyOk(false);
        copyOkTimerRef.current = null;
      }, 2500);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("AgreementSummaryAccordion copySnapshot:", err);
      }
      setCopyError(t("agree_copy_failed"));
    } finally {
      setCopyBusy(false);
    }
  };
  return (
    <section className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 shadow-soft">
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <button
          type="submit"
          className={`flex min-h-[44px] w-full items-center justify-between text-left text-body font-semibold text-ink-800 transition-colors ${TT_MARKETING_CONSOLE_HOVER_ACCENT} motion-sub motion-reduce:transition-none ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
          aria-expanded={open}
        >
          <span>{t("agree_title")}</span>
          <span className="text-ink-500" aria-hidden>{open ? "▼" : "▶"}</span>
        </button>
      </form>
      {open && (
        <div className="mt-4 space-y-3 border-t border-ink-200 pt-4 text-small text-ink-700">
          <p>
            <span className="text-ink-500">{t("agree_label_token")}</span>
            {t("agree_escrow_token_display", {
              token: t("order_defaultSettlementToken"),
              chain: t("didRank_badge_polygon"),
            })}
          </p>
          <p>
            <span className="text-ink-500">{t("agree_label_total")}</span>
            {total}
          </p>
          <p>
            <span className="text-ink-500">{t("agree_label_platform_fee")}</span>
            {platformFee}
          </p>
          <p>
            <span className="text-ink-500">{t("agree_label_snapshot_hash")}</span>
            <code className="ml-1 rounded-[var(--radius-sm)] bg-bg-soft px-1.5 py-0.5 font-mono text-meta">{orderId}</code>
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault();
                void copySnapshot();
              }}
            >
              <button
                type="submit"
                disabled={copyBusy}
                aria-busy={copyBusy ? true : undefined}
                className={`ml-2 ${touchTargetLink44Classes} ${TT_MARKETING_CONSOLE_INLINE_LINK} disabled:opacity-60 disabled:cursor-wait ${TT_MARKETING_CONSOLE_LINK_FOCUS}`}
              >
                {t("agree_copy")}
              </button>
            </form>
            {copyError ? (
              <span className="ml-2 block sm:inline text-meta text-danger mt-1 sm:mt-0" role="alert">
                {copyError}
              </span>
            ) : null}
            {copyOk && !copyError ? (
              <span
                className="ml-2 block sm:inline text-meta text-success mt-1 sm:mt-0"
                role="status"
                aria-live="polite"
              >
                {t("agree_copy_done")}
              </span>
            ) : null}
          </p>
          <p>
            <span className="text-ink-500">{t("agree_label_release")}</span>
            {t("agree_releaseConditions")}
          </p>
        </div>
      )}
    </section>
  );
}
