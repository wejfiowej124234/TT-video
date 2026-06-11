"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { CommunityShareDmQuickPick } from "@/components/community/CommunityShareDmQuickPick";
import {
  communityCardLinkFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import { buildCommunityPostShareUrl } from "@/lib/communityPostShareUrl";
import { warmCommunityReportDrawer } from "@/lib/communityDrawerPrefetch";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export type CommunityPostShareMenuProps = {
  post: CommunityPost;
  t: (key: string) => string;
  onReport?: (post: CommunityPost) => void;
  /** `up`：菜单在按钮上方（Feed）；`down`：下方（如详情抽屉） */
  placement?: "up" | "down";
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
};

/** 帖子分享：复制链接、系统分享、私信（登录/最近会话/完整列表 sharePostId）；可选举报 */
export function CommunityPostShareMenu({
  post,
  t,
  onReport,
  placement = "up",
  className,
  menuClassName = "",
  triggerClassName,
}: CommunityPostShareMenuProps) {
  const shareRef = useRef<HTMLDivElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [copyLinkBusy, setCopyLinkBusy] = useState(false);
  const [copyLinkError, setCopyLinkError] = useState<string | null>(null);
  const [nativeShareOk, setNativeShareOk] = useState(false);
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const dmPickerEnabled = shareOpen && isLoggedIn && !authPending;

  useEffect(() => {
    setNativeShareOk(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    setCopyLinkError(null);
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [shareOpen]);

  const menuPosition =
    placement === "up" ? "right-0 bottom-full mb-1" : "right-0 top-full mt-1";

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    setCopyLinkBusy(true);
    setCopyLinkError(null);
    try {
      const url = buildCommunityPostShareUrl(window.location.origin, post.id);
      await window.navigator.clipboard.writeText(url);
      setCopyDone(true);
      window.setTimeout(() => {
        setCopyDone(false);
        setShareOpen(false);
      }, 1200);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("CommunityPostShareMenu copy link:", err);
      }
      setCopyLinkError(t("community_share_copy_failed"));
    } finally {
      setCopyLinkBusy(false);
    }
  };

  const handleNativeShare = () => {
    if (typeof window === "undefined" || typeof navigator.share !== "function") return;
    const url = buildCommunityPostShareUrl(window.location.origin, post.id);
    const title = (post.title?.trim() || post.content.trim().slice(0, 80) || t("community_title")).trim();
    void navigator
      .share({ title, text: title, url })
      .then(() => setShareOpen(false))
      .catch((err: unknown) => {
        const name = err instanceof Error ? err.name : "";
        if (name === "AbortError") return;
        if (typeof window !== "undefined") {
          console.error("CommunityPostShareMenu native share:", err);
        }
      });
  };

  const defaultTrigger = `inline-flex min-h-[44px] items-center justify-center gap-1.5 text-meta text-slate-300 hover:text-slate-300 motion-sub rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus}`;

  return (
    <div className={`relative ${className ?? ""}`} ref={shareRef}>
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          setShareOpen((o) => !o);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="submit"
          className={triggerClassName ?? defaultTrigger}
          aria-label={t("community_share")}
          aria-expanded={shareOpen}
          aria-haspopup="menu"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="sr-only">{t("community_share")}</span>
        </button>
      </form>
      {shareOpen ? (
        <div
          role="menu"
          aria-label={t("community_share")}
          className={`absolute ${menuPosition} rounded-[var(--radius-md)] border border-ref-sun/30 bg-ink-800/95 backdrop-blur py-1 shadow-medium z-10 min-w-[min(100vw-2rem,220px)] ${menuClassName}`}
        >
          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCopyLink();
            }}
          >
            <button
              type="submit"
              role="menuitem"
              disabled={copyLinkBusy}
              aria-busy={copyLinkBusy ? true : undefined}
              className={`w-full px-4 py-2.5 text-left text-small text-slate-200 hover:bg-ref-sun/12 motion-sub flex items-center justify-start gap-2 min-h-[44px] disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50`}
            >
              {copyDone ? t("community_share_copied") : t("community_copy_link")}
            </button>
          </form>
          {copyLinkError ? (
            <p className="px-4 py-2 text-meta text-amber-200/95" role="alert">
              {copyLinkError}
            </p>
          ) : null}
          {nativeShareOk ? (
            <form
              className={`w-full border-t ${TT_COMMUNITY_DRAWER_L5.divider}`}
              onSubmit={(e) => {
                e.preventDefault();
                handleNativeShare();
              }}
            >
              <button
                type="submit"
                role="menuitem"
                className={`w-full px-4 py-2.5 text-left text-small text-slate-200 hover:bg-ref-sun/12 motion-sub flex items-center justify-start gap-2 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/50`}
              >
                {t("community_share_native")}
              </button>
            </form>
          ) : null}
          <div className={`border-t ${TT_COMMUNITY_DRAWER_L5.divider}`}>
            {authPending ? (
              <div className="px-4 py-2.5 text-meta text-slate-400 min-h-[44px] flex items-center justify-start" role="status">
                {t("common_loading")}
              </div>
            ) : !isLoggedIn ? (
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(`/community/messages?sharePostId=${encodeURIComponent(post.id)}`)}`}
                role="menuitem"
                onClick={() => setShareOpen(false)}
                className={`flex w-full min-h-[44px] items-center justify-start px-4 py-2.5 text-left text-small text-slate-200 hover:bg-ref-sun/12 motion-sub ${communityCardLinkFocus}`}
              >
                {t("community_share_dm_login")}
              </Link>
            ) : (
              <>
                <CommunityShareDmQuickPick
                  postId={post.id}
                  t={t}
                  enabled={dmPickerEnabled}
                  onNavigate={() => setShareOpen(false)}
                />
                <Link
                  href={`/community/messages?sharePostId=${encodeURIComponent(post.id)}`}
                  role="menuitem"
                  onClick={() => setShareOpen(false)}
                  className={`flex w-full min-h-[44px] items-center justify-start border-t border-ref-sun/16 px-4 py-2.5 text-left text-small text-slate-200 hover:bg-ref-sun/12 motion-sub ${communityCardLinkFocus}`}
                >
                  {t("community_share_to_messages")}
                </Link>
              </>
            )}
          </div>
          {onReport ? (
            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault();
                onReport(post);
                setShareOpen(false);
              }}
            >
              <button
                type="submit"
                role="menuitem"
                onPointerEnter={warmCommunityReportDrawer}
                className={`w-full px-4 py-2.5 text-left text-small text-slate-300 motion-sub min-h-[44px] flex items-center justify-start focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${TT_COMMUNITY_DRAWER_L5.menuItemHover}`}
              >
                {t("community_report")}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
