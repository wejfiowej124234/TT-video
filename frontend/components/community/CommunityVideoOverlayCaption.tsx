"use client";

import { useEffect, useRef, useState } from "react";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

const CAPTION_CLAMP_LINES = 2;

/** 小红书式底部文案：默认两行，可展开全文 */
export function CommunityVideoOverlayCaption({
  author,
  caption,
  expandLabel,
  collapseLabel,
  postId,
}: {
  author?: string;
  caption?: string;
  expandLabel: string;
  collapseLabel: string;
  postId?: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [author, caption]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !caption?.trim()) {
      setClampable(false);
      return;
    }
    const check = () => {
      if (expanded) return;
      setClampable(el.scrollHeight > el.clientHeight + 2);
    };
    check();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [caption, expanded]);

  if (!author && !caption?.trim()) return null;

  return (
    <div className="min-w-0 pr-16">
      {author ? (
        <p className="text-meta font-semibold text-white drop-shadow-md">@{author}</p>
      ) : null}
      {caption?.trim() ? (
        <>
          <p
            ref={textRef}
            className={`mt-1 text-small text-white/90 drop-shadow-md whitespace-pre-wrap ${
              expanded ? "" : TT_COMMUNITY_VIDEO_OVERLAY_L5.captionClamp
            }`}
          >
            {postId ? (
              <UgcTranslatedText
                as="span"
                policy="on_demand"
                actionSurface="overlay"
                contentClass="community_post"
                contentId={postId}
                field="body"
                originalText={caption}
              />
            ) : (
              caption
            )}
          </p>
          {(clampable || expanded) ? (
            <button
              type="button"
              className="pointer-events-auto mt-1 text-meta font-medium text-white/75 hover:text-white"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? collapseLabel : expandLabel}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
