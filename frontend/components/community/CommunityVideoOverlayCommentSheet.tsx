"use client";

import { useState, type FormEvent } from "react";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityComment } from "@/lib/communityMockData";
import { isShowcasePostId } from "@/lib/communityShowcase";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";
import {
  CommunityCommentAuthorAvatar,
  CommunityCommentAuthorName,
} from "@/components/community/CommunityCommentAuthorAvatar";

export function CommunityVideoOverlayCommentSheet({
  t,
  open,
  onClose,
  postId,
  comments,
  commentCount,
  isLoggedIn,
  authPending,
  onSend,
  commentSort,
  onCommentSortChange,
  commentsLoadError,
  onRetryCommentsLoad,
  commentSendError,
  commentSendErrorMessage,
  onRetryComment,
}: {
  t: (key: string) => string;
  open: boolean;
  onClose: () => void;
  postId: string;
  comments: CommunityComment[];
  commentCount: number;
  isLoggedIn?: boolean;
  authPending?: boolean;
  onSend: (content: string, parentId?: string) => void | Promise<void>;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (sort: CommunityCommentSort) => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  onRetryComment?: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const guestLabel = t("community_comment_guest_author");
  const dash = t("ui_em_dash");
  const isShowcasePost = isShowcasePostId(postId);
  if (!open) return null;

  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);

  const composerInputDisabled = isShowcasePost
    ? authPending || sending
    : !isLoggedIn || authPending || sending;
  const sendDisabled = composerInputDisabled || !input.trim();

  const handleSend = async () => {
    if (isShowcasePost) {
      if (authPending || sending) return;
    } else if (!isLoggedIn || authPending || sending) {
      return;
    }
    const v = input.trim();
    if (!v) return;
    setSending(true);
    const payload = v;
    setInput("");
    try {
      await Promise.resolve(onSend(payload));
    } catch {
      setInput(payload);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={TT_COMMUNITY_VIDEO_OVERLAY_L5.commentSheet}
      role="dialog"
      aria-label={t("community_video_comments_sheet_title")}
      data-post-id={postId}
    >
      <button
        type="button"
        className="mx-auto flex w-full flex-col items-center py-1.5"
        aria-label={t("community_close")}
        onClick={onClose}
      >
        <span className={TT_COMMUNITY_VIDEO_OVERLAY_L5.commentSheetHandle} aria-hidden />
      </button>

      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2">
        <h3 className="text-small font-semibold text-white">
          {t("community_comments")} · {commentCount}
        </h3>
        <button
          type="button"
          className={`${TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCloseFab} !min-h-[36px] !min-w-[36px] px-3 text-meta font-medium`}
          onClick={onClose}
          aria-label={t("community_close")}
        >
          {t("community_close")}
        </button>
      </div>
      {/* R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1: sort tabs removed */}

      <div className={TT_COMMUNITY_VIDEO_OVERLAY_L5.commentSheetScroll}>
        {isShowcasePost ? (
          <p className={`${TT_COMMUNITY_DRAWER_L5.postDetailShowcaseHint} mb-3 text-meta leading-snug`} role="note">
            {t("community_showcase_content_hint")}
          </p>
        ) : null}
        {commentsLoadError ? (
          <p className="py-4 text-center text-meta text-slate-400" role="alert">
            {commentsLoadError}
            {onRetryCommentsLoad ? (
              <button type="button" className="ml-2 text-ref-sun/90 underline" onClick={onRetryCommentsLoad}>
                {t("community_retry")}
              </button>
            ) : null}
          </p>
        ) : rootComments.length === 0 ? (
          <p className="py-6 text-center text-meta text-slate-500">{t("community_no_comments")}</p>
        ) : (
          <ul className="space-y-3 pb-2">
            {rootComments.map((c) => (
              <li key={c.id} className="text-small">
                <div className="flex gap-2">
                  <CommunityCommentAuthorAvatar
                    author={c.author}
                    guestLabel={guestLabel}
                    dash={dash}
                    sizeClassName="h-9 w-9 min-h-[36px] min-w-[36px]"
                  />
                  <div className="min-w-0 flex-1">
                    <CommunityCommentAuthorName author={c.author} guestLabel={guestLabel} dash={dash} />
                    <p className="mt-0.5 text-slate-200 whitespace-pre-wrap">{c.content}</p>
                    {getReplies(c.id).map((r) => (
                      <div key={r.id} className="ml-0 mt-2 border-l border-white/10 pl-3">
                        <CommunityCommentAuthorName
                          author={r.author}
                          guestLabel={guestLabel}
                          dash={dash}
                          className="text-meta text-slate-300 font-medium"
                        />
                        <p className="text-slate-300">{r.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={TT_COMMUNITY_VIDEO_OVERLAY_L5.commentSheetComposer}>
        {commentSendError ? (
          <p className="mb-2 text-meta text-warning/95" role="alert">
            {commentSendErrorMessage?.trim() || t("community_comment_send_failed")}
            {onRetryComment ? (
              <button type="button" className="ml-2 underline" onClick={onRetryComment}>
                {t("community_retry")}
              </button>
            ) : null}
          </p>
        ) : null}
        {!isLoggedIn && !authPending && !isShowcasePost ? (
          <p className="mb-2 text-center text-meta text-slate-400">
            {t("community_login_to_comment")}
          </p>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isShowcasePost ? t("community_showcase_comment_placeholder") : t("community_comment_placeholder")
            }
            disabled={composerInputDisabled}
            className={`${TT_COMMUNITY_DRAWER_L5.composerInput} flex-1 min-w-0 rounded-full border border-white/15 bg-ink-900/80 px-4 py-2.5 text-small text-white placeholder:text-slate-500 ${
              isShowcasePost ? TT_COMMUNITY_DRAWER_L5.composerInputShowcase : ""
            }`}
          />
          <button
            type="submit"
            disabled={sendDisabled}
            className={TT_COMMUNITY_DRAWER_L5.sendBtn}
          >
            {sending ? t("community_comment_sending") : t("community_comment_send")}
          </button>
        </form>
      </div>
    </div>
  );
}
