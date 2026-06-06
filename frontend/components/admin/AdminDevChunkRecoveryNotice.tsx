"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  clearDevChunkAutoReloadFlag,
  isDevChunkLoadMessage,
  tryDevChunkAutoReload,
} from "@/lib/devChunkLoadRecovery";
import { ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS, ADMIN_SHELL_PREVIEW_NOTICE_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const DISMISS_KEY = "tt-admin-dev-chunk-notice-dismiss";

/** Admin 子树 · 开发态 chunk 加载失败提示（ERR_CONNECTION_RESET / ChunkLoadError · ①） */
export function AdminDevChunkRecoveryNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const cancelClear = clearDevChunkAutoReloadFlag();

    const showOrReload = (message: string) => {
      if (!isDevChunkLoadMessage(message)) return;
      if (tryDevChunkAutoReload()) return;
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {
        /* ignore */
      }
      setVisible(true);
    };

    const onError = (event: ErrorEvent) => {
      showOrReload(String(event.message ?? ""));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
      showOrReload(msg);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      cancelClear();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (process.env.NODE_ENV !== "development" || !visible) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="alert"
      className={`${ADMIN_SHELL_PREVIEW_NOTICE_CLASS} px-4 py-3`}
      data-tt-admin-dev-chunk-notice="1"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-small leading-relaxed text-ink-800">
          {t("admin_dev_chunk_notice")}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS} px-3 py-1.5 text-small ${travelFocusRingOffset2Classes}`}
            onClick={() => window.location.reload()}
          >
            {t("traveltrust_webgl_fallback_refresh")}
          </button>
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
            onClick={dismiss}
          >
            {t("traveltrust_page_brief_dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
