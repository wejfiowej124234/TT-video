"use client";

import { FOCUS_RING } from "./constants";

export interface CopyButtonProps {
  text: string;
  field: "id" | "wallet";
  copiedField: "id" | "wallet" | null;
  /** 剪贴板写入进行中（任一字段复制时两键可同时 disabled） */
  copyClipboardBusy?: "id" | "wallet" | null;
  onCopy: (text: string, field: "id" | "wallet") => void;
  t: (k: string) => string;
  className?: string;
}

export default function CopyButton({
  text,
  field,
  copiedField,
  copyClipboardBusy = null,
  onCopy,
  t,
  className = "",
}: CopyButtonProps) {
  const isCopied = copiedField === field;
  const isThisBusy = copyClipboardBusy === field;
  const anyCopyBusy = copyClipboardBusy !== null;
  return (
    <form
      className="inline"
      onSubmit={(e) => {
        e.preventDefault();
        void onCopy(text, field);
      }}
    >
      <button
        type="submit"
        disabled={anyCopyBusy}
        aria-busy={isThisBusy ? true : undefined}
        className={`shrink-0 rounded-[var(--radius-sm)] border border-slate-600 bg-slate-800/60 px-2 py-1 min-h-[32px] text-meta text-slate-300 hover:text-cyan-100 hover:border-cyan-500/40 motion-sub disabled:opacity-60 disabled:cursor-wait ${FOCUS_RING} ${className}`}
        aria-label={isCopied ? t("me_copiedAnnounce") : t("me_copy")}
      >
        {isCopied ? t("me_copied") : t("me_copy")}
      </button>
    </form>
  );
}
