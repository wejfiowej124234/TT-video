"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type TFunc = (k: string) => string;

const marketSecondaryBtn =
  `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-white text-small font-medium text-center hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/20`;

/**
 * 个人中心「赞过 / 收藏 / 社区帖子 / 订单」弹层：与自由市场 Hero「创建行程」弹层同构（Portal + 玻璃面板骨架）——
 * `createPortal` 挂 body、`z-[400]` 越过社区顶栏、居中卡片 + `bg-black/40` 遮罩 + 白边玻璃面板。
 */
export function CommunityMeNotesGlassDrawer({
  open,
  onClose,
  fullPageHref,
  dialogTitle,
  /** 主标题下、说明段上：一行 IA 边界提示（如「社区 UGC · 非市场目录」），与 `dialogDescription` 同块 `aria-describedby` */
  dialogTitleBadge,
  dialogDescription,
  t,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** 省略时不展示「在完整页面打开」（如收藏仅弹窗、无独立路由） */
  fullPageHref?: string;
  dialogTitle: string;
  dialogTitleBadge?: string;
  dialogDescription?: string;
  t: TFunc;
  children: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const trapRef = useFocusTrap(open, onClose);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!portalReady || !open) return null;

  const descClass = "text-small text-white/85 mt-1";
  const hasDescRegion = Boolean(dialogTitleBadge?.trim() || dialogDescription?.trim());

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 pt-20 pb-8 sm:pt-16 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={hasDescRegion ? descId : undefined}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm motion-sub" aria-hidden onClick={onClose} />
      <div
        ref={trapRef}
        className="relative w-full max-w-3xl rounded-[var(--radius-lg)] border border-white/25 bg-white/5 backdrop-blur-md shadow-strong overflow-hidden max-h-[90vh] flex flex-col"
        tabIndex={-1}
      >
        <div className="border-b border-white/15 px-4 py-3 sm:px-6 shrink-0 bg-transparent">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 pr-0 sm:pr-2">
              <h2 id={titleId} className="text-body-l font-semibold text-white drop-shadow-market-body">
                {dialogTitle}
              </h2>
              {hasDescRegion ? (
                <div id={descId} className="mt-1 space-y-1">
                  {dialogTitleBadge?.trim() ? (
                    <p className="text-[0.7rem] font-medium leading-snug text-cyan-200/90">{dialogTitleBadge.trim()}</p>
                  ) : null}
                  {dialogDescription?.trim() ? <p className={descClass}>{dialogDescription.trim()}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {fullPageHref ? (
                <Link href={fullPageHref} prefetch onClick={onClose} className={marketSecondaryBtn}>
                  {t("community_me_notes_drawer_open_full")}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className={`${marketSecondaryBtn} min-w-[44px] px-3`}
                aria-label={t("community_close")}
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:pb-5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
