import { useState, useCallback, useRef } from "react";
import type { FeedbackMediaItem } from "@/lib/communityFeedbackDisplay";
import { MAX_MEDIA, fileToDataUrl, feedbackMediaRejectI18n } from "./communityFeedbackPageConstants";
import type { LocaleTranslateFn } from "@/lib/i18n";

export function useCommunityFeedbackPageMedia(t: LocaleTranslateFn) {
  const [mediaPreviews, setMediaPreviews] = useState<FeedbackMediaItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const addMediaFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setMediaError(null);
      const toAdd: File[] = [];
      for (let i = 0; i < files.length && mediaPreviews.length + toAdd.length < MAX_MEDIA; i++) {
        const f = files[i];
        if (f.type.startsWith("image/") || f.type.startsWith("video/")) toAdd.push(f);
      }
      Promise.all(
        toAdd.map((file) =>
          fileToDataUrl(file).then((url) => ({
            type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
            url,
          })),
        ),
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
    },
    [mediaPreviews.length, t],
  );

  const removeMedia = useCallback((index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetMedia = useCallback(() => {
    setMediaPreviews([]);
    setMediaError(null);
  }, []);

  return {
    mediaPreviews,
    setMediaPreviews,
    mediaError,
    setMediaError,
    photoInputRef,
    videoInputRef,
    addMediaFiles,
    removeMedia,
    resetMedia,
  };
}
