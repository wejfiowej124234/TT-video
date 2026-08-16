"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getUgcTranslationCache,
  hasUgcTranslateSession,
  postUgcTranslate,
} from "@/lib/apiClient/ugcTranslate";
import { isUgcContentId, useContentTranslationLocale } from "@/lib/ugc/contentTranslationLocale";

export type UgcTranslatePolicy = "cache_first" | "on_demand";

type TagName = "p" | "span" | "h2" | "h3";

/** 社区 Feed「查看全文」同族：暖金文字链 · 44px · 社区 focus ring（非 cyan 霓虹） */
const ACTION_FEED =
  "pointer-events-auto mt-0.5 inline-flex min-h-[44px] items-center justify-start text-meta font-medium text-ref-sun/90 hover:text-ref-sun/95 motion-sub rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

/** 视频叠字「展开」同族：白字 · 不抢暖金主链 */
const ACTION_OVERLAY =
  "pointer-events-auto mt-1 inline-flex items-center text-meta font-medium text-white/75 hover:text-white";

const ACTION_ORIGINAL =
  "pointer-events-auto mt-0.5 inline-flex min-h-[44px] items-center justify-start text-meta font-medium text-slate-400 hover:text-slate-200 motion-sub rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900";

const ACTION_ORIGINAL_OVERLAY =
  "pointer-events-auto mt-1 inline-flex items-center text-meta font-medium text-white/60 hover:text-white";

export function UgcTranslatedText({
  contentClass,
  contentId,
  field,
  originalText,
  policy,
  className,
  as: Tag = "span",
  showAction = true,
  actionSurface = "feed",
}: {
  contentClass: string;
  contentId: string;
  field: string;
  originalText: string;
  policy: UgcTranslatePolicy;
  className?: string;
  as?: TagName;
  /** false：瀑布流封面叠字等只出正文，翻译放到详情 / 列表卡 */
  showAction?: boolean;
  /** `feed` = 社区文字链；`overlay` = 视频底部白字 */
  actionSurface?: "feed" | "overlay";
}) {
  const { t } = useTranslation();
  const targetLocale = useContentTranslationLocale();
  const source = originalText ?? "";
  const eligible = Boolean(source.trim()) && isUgcContentId(contentId);

  const [translated, setTranslated] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setTranslated(null);
    setShowTranslated(false);
    setNeedLogin(false);
    setFailed(false);
  }, [contentId, field, source, targetLocale]);

  useEffect(() => {
    if (!eligible || policy !== "cache_first") return;
    let cancelled = false;
    void getUgcTranslationCache({
      contentClass,
      contentId,
      field,
      targetLocale,
    }).then((row) => {
      if (cancelled) return;
      if (row.cache === "hit" && row.translated_text) {
        setTranslated(row.translated_text);
        setShowTranslated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eligible, policy, contentClass, contentId, field, targetLocale]);

  const onTranslate = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!eligible || busy) return;
      if (!hasUgcTranslateSession()) {
        setNeedLogin(true);
        return;
      }
      setBusy(true);
      setFailed(false);
      try {
        const row = await postUgcTranslate({
          contentClass,
          contentId,
          field,
          targetLocale,
        });
        if (row.translated_text) {
          setTranslated(row.translated_text);
          setShowTranslated(true);
        }
      } catch (err) {
        if (err instanceof Error && err.message === "login_required") {
          setNeedLogin(true);
        } else {
          setFailed(true);
        }
      } finally {
        setBusy(false);
      }
    },
    [eligible, busy, contentClass, contentId, field, targetLocale],
  );

  const onShowOriginal = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTranslated(false);
  }, []);

  if (!source.trim()) return null;

  const text = showTranslated && translated ? translated : source;
  const showTranslateBtn = showAction && eligible && !showTranslated;
  const showOriginalBtn = showAction && eligible && showTranslated && Boolean(translated);
  const translateClass = actionSurface === "overlay" ? ACTION_OVERLAY : ACTION_FEED;
  const originalClass = actionSurface === "overlay" ? ACTION_ORIGINAL_OVERLAY : ACTION_ORIGINAL;

  const Wrapper = Tag === "span" ? "span" : "div";

  return (
    <Wrapper
      className={Tag === "span" ? "inline min-w-0" : "min-w-0"}
      data-tt-ugc-translated={policy}
      data-tt-ugc-content-class={contentClass}
    >
      <Tag className={className}>{text}</Tag>
      {showTranslateBtn ? (
        <button type="button" className={translateClass} onClick={onTranslate} disabled={busy}>
          {needLogin
            ? t("ugc_translate_login_to_translate")
            : busy
              ? t("ugc_translate_busy")
              : t("ugc_translate")}
        </button>
      ) : null}
      {showOriginalBtn ? (
        <button type="button" className={originalClass} onClick={onShowOriginal}>
          {t("ugc_translate_show_original")}
        </button>
      ) : null}
      {failed ? <span className="mt-1 block text-meta text-slate-500">{t("ugc_translate_failed")}</span> : null}
    </Wrapper>
  );
}
