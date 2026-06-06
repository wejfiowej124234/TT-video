"use client";

import { useCallback, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS } from "@/lib/adminUi";

type Props = {
  text: string;
  labelKey: string;
  copiedKey: string;
  unavailableKey: string;
  dataAttr?: string;
  className?: string;
};

/** ① Admin 域剪贴板复制（44px 触达 · 诚实失败态）。 */
export function AdminClipboardCopyButton(props: Props) {
  const { text, labelKey, copiedKey, unavailableKey, dataAttr, className = "" } = props;
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const onCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setStatus("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
    }
  }, [text]);

  const statusLabel =
    status === "copied"
      ? t(copiedKey)
      : status === "failed"
        ? t(unavailableKey)
        : null;

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
        onClick={() => void onCopy()}
        data-tt-admin-clipboard-copy={dataAttr ?? "1"}
        aria-label={t(labelKey)}
      >
        {t(labelKey)}
      </button>
      {statusLabel ? (
        <span className="text-meta text-ink-600" role="status" aria-live="polite">
          {statusLabel}
        </span>
      ) : null}
    </span>
  );
}
