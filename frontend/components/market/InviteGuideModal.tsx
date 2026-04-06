"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { GuideCardItem } from "./GuideCard";
import { stashEscrowOrderPrefetchForOrderIdNav } from "@/lib/orderEscrowPrefetch";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** P29 邀请向导弹窗：选择向导后发邀请（占位：实际发邀请/创建会话待接 API）。企业级：焦点陷阱、body 滚动锁、Esc、遮罩点击关闭、aria。 */
export default function InviteGuideModal({
  orderId,
  guides,
  onSelect,
  onClose,
}: {
  orderId: string;
  guides: GuideCardItem[];
  onSelect: (guideId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap(true, onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        className="w-full max-w-md rounded-[var(--radius-sm)] bg-bg-console shadow-strong max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <h2 id={titleId} className="text-body font-semibold text-ink-900">
            {t("invite_guide_title")}
          </h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] text-ink-500 hover:bg-bg-soft hover:text-ink-800 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              aria-label={t("invite_guide_close")}
            >
              ✕
            </button>
          </form>
        </div>
        <div id={descId} className="p-4 overflow-y-auto flex-1">
          <p className="text-small text-ink-500 mb-3">{t("invite_guide_desc")}</p>
          {guides.length === 0 ? (
            <p className="text-small text-ink-500">{t("invite_guide_noGuides")}</p>
          ) : (
            <ul className="space-y-2">
              {guides.map((g) => (
                <li key={g.id}>
                  <form
                    className="block w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onSelect(g.id);
                    }}
                  >
                    <button
                      type="submit"
                      className={`flex min-h-[44px] w-full items-center justify-start text-left rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 hover:bg-bg-soft hover:border-travel-500/50 text-small ${travelFocusRingOffset2Classes}`}
                    >
                      <span className="font-medium text-ink-900">{g.city ?? t("view_guides")}</span>
                      <span className="text-ink-500 ml-2">
                        {Array.isArray(g.languages) ? g.languages.slice(0, 2).join(" / ") : ""}
                      </span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-ink-200 px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 text-meta bg-bg-soft/80">
          <Link
            href={`/escrow/${encodeURIComponent(orderId)}`}
            onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "escrow")}
            className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("orders_viewDetail")}
          </Link>
          <Link
            href={`/pay?orderId=${encodeURIComponent(orderId)}`}
            onClick={() => stashEscrowOrderPrefetchForOrderIdNav(orderId, "pay")}
            className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("orders_payHub")}
          </Link>
        </div>
      </div>
    </div>
  );
}
