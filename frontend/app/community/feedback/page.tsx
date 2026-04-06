"use client";

import { useState, useCallback, useEffect, useId, useRef, type FormEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useTranslation } from "@/components/LocaleProvider";
import { getFeedbackList, postFeedback } from "@/lib/apiClient/community";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { dedupeListById } from "@/lib/dedupeListById";
import {
  formatFeedbackListDate,
  mediaUrlsToItems,
  type FeedbackMediaItem,
} from "@/lib/communityFeedbackDisplay";
import {
  loadFeedbackLocalBrowser,
  saveFeedbackLocalBrowser,
  type CommunityFeedbackLocalItem,
} from "@/lib/communityFeedbackLocal";
import {
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communityPublishFabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

export type { FeedbackMediaItem };

/** 54-S19：TT 社区 · 用户与官方沟通窗口（景区/美食/产品建议）；Web3 风格；后端 API 未就绪时本地暂存（localStorage 持久化） */
const FEEDBACK_CATEGORIES = [
  { value: "feedback_category_attraction", labelKey: "feedback_category_attraction" },
  { value: "feedback_category_dining", labelKey: "feedback_category_dining" },
  { value: "feedback_category_product", labelKey: "feedback_category_product" },
  { value: "feedback_category_other", labelKey: "feedback_category_other" },
] as const;

export type FeedbackItem = CommunityFeedbackLocalItem;

const MAX_MEDIA = 4;
const MAX_IMAGE_SIZE = 800;
const MAX_VIDEO_BYTES = 800_000;

/** 稳定码，供 `feedbackMediaRejectI18n` 映射；勿直接展示给用户 */
const MEDIA_ERR_VIDEO_TOO_LARGE = "MEDIA_VIDEO_TOO_LARGE";
const MEDIA_ERR_IMAGE_LOAD = "MEDIA_IMAGE_LOAD_FAILED";
const MEDIA_ERR_VIDEO_READ = "MEDIA_VIDEO_READ_FAILED";
const MEDIA_ERR_UNSUPPORTED_TYPE = "MEDIA_UNSUPPORTED_TYPE";

function feedbackMediaRejectI18n(err: unknown, t: (k: string) => string): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case MEDIA_ERR_VIDEO_TOO_LARGE:
      return t("community_feedback_video_too_large");
    case MEDIA_ERR_IMAGE_LOAD:
      return t("community_feedback_image_load_failed");
    case MEDIA_ERR_VIDEO_READ:
      return t("community_feedback_video_read_failed");
    case MEDIA_ERR_UNSUPPORTED_TYPE:
      return t("community_feedback_media_type_unsupported");
    default:
      return t("community_feedback_media_process_failed");
  }
}

function fileToDataUrl(file: File, maxWidth = MAX_IMAGE_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } catch {
          resolve(URL.createObjectURL(file));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(MEDIA_ERR_IMAGE_LOAD));
      };
      img.src = url;
    } else if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_BYTES) {
        reject(new Error(MEDIA_ERR_VIDEO_TOO_LARGE));
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error(MEDIA_ERR_VIDEO_READ));
      r.readAsDataURL(file);
    } else {
      reject(new Error(MEDIA_ERR_UNSUPPORTED_TYPE));
    }
  });
}

export default function CommunityFeedbackPage() {
  const { t } = useTranslation();
  const feedbackListHeadingId = useId();
  const feedbackModalTitleId = useId();
  const feedbackModalDescId = useId();
  const feedbackMediaErrId = useId();
  const feedbackContentErrId = useId();
  const feedbackFormErrId = useId();
  const feedbackCategoryId = useId();
  const feedbackContentId = useId();
  const [list, setList] = useState<FeedbackItem[]>([]);
  /** 仅在为 true 时表示已成功按约定形状拉到服务端列表（含空数组）；否则列表可能仅为本地或未同步。 */
  const [serverListSynced, setServerListSynced] = useState(false);
  /** `getFeedbackList` 抛错或网络失败时的映射文案；与「未同步形状」区分。 */
  const [listFetchError, setListFetchError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [listFetchRetryKey, setListFetchRetryKey] = useState(0);
  const [postOpen, setPostOpen] = useState(false);
  const [category, setCategory] = useState<string>(FEEDBACK_CATEGORIES[0].value);
  const [content, setContent] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<FeedbackMediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** API `status: error` 顶栏（无字段映射时） */
  const [feedbackFormError, setFeedbackFormError] = useState<string | null>(null);
  /** 后端 `errors` 已映射（如 content） */
  const [feedbackFieldMessages, setFeedbackFieldMessages] = useState<Record<string, string> | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const feedbackToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalFocusRef = useRef<HTMLSelectElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const local = loadFeedbackLocalBrowser();
    setListFetchError(null);
    getFeedbackList()
      .then((data) => {
        if (cancelled) return;
        if (data?.status === "ok" && Array.isArray(data.items)) {
          setListFetchError(null);
          setServerListSynced(true);
          const serverItems: FeedbackItem[] = data.items.map((r) => ({
            id: r.id,
            category: r.category,
            content: r.content,
            status: r.status,
            official_reply: r.official_reply ?? undefined,
            created_at: r.created_at,
            local: false,
            media: mediaUrlsToItems(r.media_urls),
          }));
          setList(
            dedupeListById([...serverItems, ...local.filter((x) => x.local)], (x) => x.id)
          );
        } else {
          setListFetchError(null);
          setServerListSynced(false);
          setList(dedupeListById(local, (x) => x.id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (typeof window !== "undefined") {
            console.error("CommunityFeedbackPage getFeedbackList:", err);
          }
          setListFetchError(mapApiReadError(err, t, "community_feedback_list_load_failed"));
          setServerListSynced(false);
          setList(dedupeListById(local, (x) => x.id));
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [listFetchRetryKey, t]);

  useEffect(() => {
    if (!hydrated) return;
    saveFeedbackLocalBrowser(list);
  }, [hydrated, list]);

  const showFeedbackToast = useCallback((i18nKey: string) => {
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
    setFeedbackToast(i18nKey);
    feedbackToastTimerRef.current = setTimeout(() => {
      feedbackToastTimerRef.current = null;
      setFeedbackToast(null);
    }, 3200);
  }, []);

  /** 新一次提交/保存前必须清掉旧 toast，避免「请求未完成或已失败仍显示成功」 */
  const dismissFeedbackToast = useCallback(() => {
    if (feedbackToastTimerRef.current) {
      clearTimeout(feedbackToastTimerRef.current);
      feedbackToastTimerRef.current = null;
    }
    setFeedbackToast(null);
  }, []);

  const clearFeedbackFormErrors = useCallback(() => {
    setFeedbackFormError(null);
    setFeedbackFieldMessages(null);
  }, []);

  useEffect(() => () => {
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
  }, []);

  useEffect(() => {
    if (postOpen && modalFocusRef.current) {
      const id = setTimeout(() => modalFocusRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [postOpen]);

  useEffect(() => {
    if (!postOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPostOpen(false);
        setContent("");
        setMediaPreviews([]);
        setMediaError(null);
        clearFeedbackFormErrors();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [postOpen, clearFeedbackFormErrors]);

  const addMediaFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    setMediaError(null);
    const toAdd: File[] = [];
    for (let i = 0; i < files.length && mediaPreviews.length + toAdd.length < MAX_MEDIA; i++) {
      const f = files[i];
      if (f.type.startsWith("image/") || f.type.startsWith("video/")) toAdd.push(f);
    }
    Promise.all(
      toAdd.map((file) =>
        fileToDataUrl(file).then((url) => ({ type: file.type.startsWith("video/") ? "video" as const : "image" as const, url }))
      )
    )
      .then((items) => {
        setMediaPreviews((prev) => {
          const next = [...prev, ...items];
          return next.slice(0, MAX_MEDIA);
        });
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("Community feedback media:", err);
        }
        setMediaError(feedbackMediaRejectI18n(err, t));
      });
  }, [mediaPreviews.length, t]);

  const removeMedia = useCallback((index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveOfflineDraft = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    dismissFeedbackToast();
    const item: FeedbackItem = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      category,
      content: trimmed,
      created_at: new Date().toISOString(),
      local: true,
      media: mediaPreviews.length ? [...mediaPreviews] : undefined,
    };
    setList((prev) => dedupeListById([item, ...prev], (x) => x.id));
    setContent("");
    setCategory(FEEDBACK_CATEGORIES[0].value);
    setMediaPreviews([]);
    setPostOpen(false);
    clearFeedbackFormErrors();
    showFeedbackToast("community_feedback_offline_saved");
  }, [category, content, mediaPreviews, dismissFeedbackToast, showFeedbackToast, clearFeedbackFormErrors]);

  const handleClose = useCallback(() => {
    setPostOpen(false);
    setContent("");
    setMediaPreviews([]);
    setMediaError(null);
    clearFeedbackFormErrors();
  }, [clearFeedbackFormErrors]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      if (sub?.name === "fbPick") {
        if (sub.value === "photo") {
          photoInputRef.current?.click();
          return;
        }
        if (sub.value === "video") {
          videoInputRef.current?.click();
          return;
        }
      }
      if (sub?.name === "fbRemoveMedia") {
        const idx = Number.parseInt(sub.value, 10);
        if (!Number.isNaN(idx)) removeMedia(idx);
        return;
      }
      if (sub?.name === "fbClose") {
        handleClose();
        return;
      }
      const trimmed = content.trim();
      if (!trimmed) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        saveOfflineDraft();
        return;
      }
      dismissFeedbackToast();
      setSubmitting(true);
      clearFeedbackFormErrors();
      try {
        const res = await postFeedback({
          category,
          content: trimmed,
          ...(mediaPreviews.length > 0 ? { media_urls: mediaPreviews.map((m) => m.url) } : {}),
        });
        if (res?.status === "ok" && res.id) {
          const item: FeedbackItem = {
            id: res.id,
            category,
            content: trimmed,
            status: "open",
            created_at: new Date().toISOString(),
            local: false,
            media: mediaPreviews.length ? [...mediaPreviews] : undefined,
          };
          setList((prev) => dedupeListById([item, ...prev], (x) => x.id));
          setContent("");
          setCategory(FEEDBACK_CATEGORIES[0].value);
          setMediaPreviews([]);
          setPostOpen(false);
          clearFeedbackFormErrors();
          showFeedbackToast("community_feedback_submit_ok");
          return;
        }
        if (res?.status === "error") {
          if (typeof window !== "undefined") {
            console.error("CommunityFeedbackPage postFeedback not ok:", res);
          }
          dismissFeedbackToast();
          const { topMessage, fieldMessages } = interpretCommunityWriteError(
            res,
            t,
            "community_feedback_submit_failed"
          );
          const fm = Object.keys(fieldMessages).length > 0 ? fieldMessages : null;
          setFeedbackFieldMessages(fm);
          setFeedbackFormError(fm?.content || fm?.media_urls ? null : topMessage);
          return;
        }
        if (typeof window !== "undefined") {
          console.error("CommunityFeedbackPage postFeedback unexpected:", res);
        }
        dismissFeedbackToast();
        setFeedbackFormError(t("community_feedback_submit_failed"));
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("CommunityFeedbackPage postFeedback:", err);
        }
        dismissFeedbackToast();
        setFeedbackFormError(mapApiReadError(err, t, "community_feedback_submit_failed"));
      } finally {
        setSubmitting(false);
      }
    },
    [
      category,
      content,
      mediaPreviews,
      dismissFeedbackToast,
      showFeedbackToast,
      clearFeedbackFormErrors,
      saveOfflineDraft,
      t,
      removeMedia,
      handleClose,
    ]
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6" aria-label={t("community_feedback_title")}>
      <header className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-6 shadow-scifi-banner-strong">
        <h1 className="text-h2 font-bold bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
          {t("community_feedback_title")}
        </h1>
        <p className="text-small text-slate-300 mt-1">{t("community_feedback_subtitle")}</p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              clearFeedbackFormErrors();
              setPostOpen(true);
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border-2 border-fuchsia-400/70 bg-fuchsia-500/40 px-4 py-2 text-small font-medium text-white hover:bg-fuchsia-500/60 motion-sub ${communityPublishFabFocus}`}
              aria-label={t("community_feedback_post")}
            >
              <span aria-hidden>+</span>
              {t("community_feedback_post")}
            </button>
          </form>
          <Link
            href="/community"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub ${communitySlatePillFocus}`}
          >
            {t("community_back_to_community")}
          </Link>
        </div>
      </header>

      <section className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/40 p-4 sm:p-6" aria-labelledby={feedbackListHeadingId}>
        <h2 id={feedbackListHeadingId} className="text-body font-semibold text-cyan-200 mb-4">{t("community_feedback_list_title")}</h2>
        {!hydrated ? (
          <div
            className="space-y-3 py-2"
            role="status"
            aria-busy="true"
            aria-label={t("common_loading")}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-[var(--radius-md)] border border-slate-600/40 bg-slate-700/25 animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : (
          <>
        {listFetchError != null && (
          <div className="mb-4 space-y-2" role="alert" aria-live="polite">
            <ApiErrorAlert message={listFetchError} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setListFetchRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        )}
        {listFetchError == null && !serverListSynced && (
          <div className="mb-4 space-y-2" role="alert" aria-live="polite">
            <ApiErrorAlert message={t("community_feedback_list_not_synced")} />
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setListFetchRetryKey((k) => k + 1);
              }}
            >
              <button
                type="submit"
                aria-label={t("common_retry")}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
              >
                {t("common_retry")}
              </button>
            </form>
          </div>
        )}
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[var(--radius-md)] border border-dashed border-slate-500/50 bg-slate-900/30">
            <p className="text-small text-slate-300">{t("community_feedback_empty")}</p>
            <p className="text-meta text-slate-400 mt-1">{t("community_feedback_empty_hint")}</p>
            <form
              className="mt-4 inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                clearFeedbackFormErrors();
                setPostOpen(true);
              }}
            >
              <button
                type="submit"
                aria-label={t("community_feedback_post")}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2 text-small font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub ${communityFuchsiaPillFocus}`}
              >
                {t("community_feedback_post")}
              </button>
            </form>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-4 text-small text-slate-300"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-meta text-slate-400">{t(item.category)}</span>
                  {item.status && (
                    <span className="rounded px-1.5 py-0.5 text-micro font-medium bg-slate-600/60 text-slate-300 border border-slate-500/50">
                      {item.status === "replied" || item.official_reply
                        ? t("community_feedback_status_replied")
                        : item.status === "closed"
                          ? t("community_feedback_status_closed")
                          : t("community_feedback_status_open")}
                    </span>
                  )}
                  {item.local && (
                    <span className="rounded px-1.5 py-0.5 text-micro font-medium bg-warning/15 text-warning/95 border border-warning/40">
                      {t("community_feedback_local_only")}
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                {item.official_reply && (
                  <div className="mt-3 pl-3 border-l-2 border-cyan-500/50">
                    <p className="text-meta text-cyan-200 mb-0.5">{t("community_feedback_official_reply_label")}</p>
                    <p className="text-small text-slate-300 whitespace-pre-wrap">{item.official_reply}</p>
                  </div>
                )}
                {item.media && item.media.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2 overflow-x-auto list-none p-0" role="list">
                    {item.media.map((m, i) => (
                      <li key={i} className="relative shrink-0 w-24 h-24 rounded-[var(--radius-md)] overflow-hidden border border-slate-500/50 bg-slate-800">
                        {m.type === "image" ? (
                          <NextImage src={m.url} alt="" fill className="object-cover" sizes="96px" unoptimized />
                        ) : (
                          <video src={m.url} className="w-full h-full object-cover" muted playsInline preload="metadata" controlsList="nodownload" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-meta text-slate-400 mt-2">{formatFeedbackListDate(item.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
          </>
        )}
      </section>

      {postOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={feedbackModalTitleId}
          aria-describedby={feedbackModalDescId}
        >
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-cyan-400/40 bg-slate-900/95 backdrop-blur-md p-6 shadow-scifi-modal">
            <h3 id={feedbackModalTitleId} className="text-body font-semibold text-cyan-200 mb-4">{t("community_feedback_post")}</h3>
            <p id={feedbackModalDescId} className="sr-only">{t("community_feedback_subtitle")}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="submit"
                name="fbSubmit"
                className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
                tabIndex={-1}
                aria-hidden
              >
                {t("community_feedback_submit")}
              </button>
              {feedbackFieldMessages?.media_urls ? (
                <div
                  id={feedbackMediaErrId}
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-3 py-2 text-small text-danger/95"
                >
                  {feedbackFieldMessages.media_urls}
                </div>
              ) : null}
              {feedbackFieldMessages?.content ? (
                <div
                  id={feedbackContentErrId}
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-3 py-2 text-small text-danger/95"
                >
                  {feedbackFieldMessages.content}
                </div>
              ) : null}
              {!feedbackFieldMessages?.content &&
              !feedbackFieldMessages?.media_urls &&
              feedbackFormError ? (
                <div
                  id={feedbackFormErrId}
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/15 px-3 py-2 text-small text-warning/95"
                >
                  {feedbackFormError}
                </div>
              ) : null}
              <div>
                <label htmlFor={feedbackCategoryId} className="block text-meta text-slate-300 mb-1.5">
                  {t("community_feedback_category_label")}
                </label>
                <select
                  ref={modalFocusRef}
                  id={feedbackCategoryId}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-small text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-required
                >
                  {FEEDBACK_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {t(c.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={feedbackContentId} className="block text-meta text-slate-300 mb-1.5">
                  {t("community_feedback_content_label")}
                </label>
                <textarea
                  id={feedbackContentId}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (feedbackFieldMessages?.content || feedbackFormError) clearFeedbackFormErrors();
                  }}
                  placeholder={t("community_feedback_content_placeholder")}
                  rows={4}
                  required
                  aria-invalid={!!feedbackFieldMessages?.content}
                  aria-errormessage={
                    feedbackFieldMessages?.content
                      ? feedbackContentErrId
                      : feedbackFormError
                        ? feedbackFormErrId
                        : undefined
                  }
                  className={`w-full rounded-[var(--radius-md)] border bg-slate-800/80 px-3 py-2 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 resize-y min-h-[80px] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    feedbackFieldMessages?.content
                      ? "border-danger/70 focus-visible:ring-danger/50"
                      : "border-slate-500/60 focus-visible:ring-cyan-400/50"
                  }`}
                />
              </div>
              <div>
                <span className="block text-meta text-slate-300 mb-1.5">{t("community_feedback_media_label")}</span>
                <p className="text-meta text-slate-400 mb-2">{t("community_feedback_media_limit")}</p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  aria-label={t("community_feedback_upload_photo")}
                  onChange={(e) => { addMediaFiles(e.target.files); e.target.value = ""; }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  aria-label={t("community_feedback_upload_video")}
                  onChange={(e) => { addMediaFiles(e.target.files); e.target.value = ""; }}
                />
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="submit"
                    name="fbPick"
                    value="photo"
                    disabled={mediaPreviews.length >= MAX_MEDIA}
                    className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 disabled:opacity-50 ${communitySlatePillFocus}`}
                  >
                    {t("community_feedback_upload_photo")}
                  </button>
                  <button
                    type="submit"
                    name="fbPick"
                    value="video"
                    disabled={mediaPreviews.length >= MAX_MEDIA}
                    className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 disabled:opacity-50 ${communitySlatePillFocus}`}
                  >
                    {t("community_feedback_upload_video")}
                  </button>
                </div>
                {mediaError ? (
                  <p className="text-meta text-danger/95 mb-2" role="alert">
                    {mediaError}
                  </p>
                ) : null}
                {mediaPreviews.length > 0 && (
                  <ul className="flex flex-wrap gap-2 overflow-x-auto pb-1" role="list">
                    {mediaPreviews.map((m, i) => (
                      <li key={i} className="relative shrink-0 w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-slate-500/50 bg-slate-800">
                        {m.type === "image" ? (
                          <NextImage src={m.url} alt="" fill className="object-cover" sizes="80px" unoptimized />
                        ) : (
                          <video src={m.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        )}
                        <button
                          type="submit"
                          name="fbRemoveMedia"
                          value={String(i)}
                          className="absolute top-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-bl-[var(--radius-md)] bg-black/60 text-white text-body font-medium hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/80"
                          aria-label={t("common_close")}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="submit"
                  name="fbClose"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/60 px-4 py-2 text-small text-slate-300 hover:bg-slate-700/60 ${communitySlatePillFocus}`}
                >
                  {t("common_close")}
                </button>
                <button
                  type="submit"
                  name="fbSubmit"
                  disabled={submitting || !content.trim()}
                  aria-busy={submitting ? true : undefined}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border-2 border-fuchsia-400/70 bg-fuchsia-500/40 px-4 py-2 text-small font-medium text-white hover:bg-fuchsia-500/60 disabled:opacity-50 disabled:pointer-events-none ${communityPublishFabFocus}`}
                >
                  {submitting ? t("common_submitting") : t("community_feedback_submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {feedbackToast && (
        <div
          className={`fixed left-1/2 z-[120] bottom-24 md:bottom-8 -translate-x-1/2 max-w-[min(100vw-2rem,22rem)] rounded-[var(--radius-md)] border px-4 py-3 text-small shadow-medium backdrop-blur safe-area-pb ${
            feedbackToast === "community_feedback_offline_saved"
              ? "border-warning/50 bg-slate-900/95 text-warning/95"
              : "border-cyan-500/50 bg-slate-900/95 text-cyan-200"
          }`}
          role="status"
          aria-live="polite"
        >
          {t(feedbackToast)}
        </div>
      )}
    </main>
  );
}
