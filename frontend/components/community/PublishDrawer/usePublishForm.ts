"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CommunityPostType } from "@/lib/communityMockData";
import {
  MAX_CHARS,
  MAX_IMAGES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
  MAX_VIDEO_SIZE,
  MAX_VIDEO_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
  VIDEO_METADATA_TIMEOUT_MS,
} from "./constants";
import type { PublishPayload } from "./types";
import { mapApiReadError } from "@/lib/mapApiReadError";

export interface UsePublishFormOptions {
  onClose: () => void;
  onSubmit: (payload: PublishPayload) => void | Promise<void>;
  t: (key: string) => string;
}

function isHttpImageUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function usePublishForm({ onClose, onSubmit, t }: UsePublishFormOptions) {
  const [type, setType] = useState<CommunityPostType>("photo");
  const [content, setContent] = useState("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** 与 `/orders/new` 同口径：在 `setSubmitting(true)` 提交前阻断同帧连点，避免重复 POST `/community/posts`。 */
  const submitInFlightRef = useRef(false);
  const [entered, setEntered] = useState(false);
  const [videoCoverUrl, setVideoCoverUrl] = useState("");

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusables = "button:not([disabled]), [href], input:not([type=hidden]):not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=-1])";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = el.querySelectorAll<HTMLElement>(focusables);
      const list = Array.from(nodes).filter((n) => n.offsetParent != null && !n.hasAttribute("aria-hidden"));
      if (list.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? list.indexOf(active) : -1;
      const first = list[0];
      const last = list[list.length - 1];
      let target: HTMLElement | undefined;
      if (e.shiftKey) {
        target = active === first ? last : idx > 0 ? list[idx - 1] : undefined;
      } else {
        target = active === last ? first : idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;
      }
      if (target) {
        e.preventDefault();
        target.focus();
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, []);

  const removeVideo = useCallback(() => {
    if (videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setVideoCoverUrl("");
    setUploadError(null);
  }, [videoPreviewUrl]);

  const removeImage = useCallback((index: number) => {
    setPreviewUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return next;
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    const urls: string[] = [];
    setPreviewUrls((prev) => {
      const rest = MAX_IMAGES - prev.length;
      for (let i = 0; i < Math.min(files.length, rest); i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(t("community_upload_error_size").replace("{{max}}", String(MAX_FILE_SIZE_MB)));
          break;
        }
        urls.push(URL.createObjectURL(file));
      }
      return [...prev, ...urls].slice(0, MAX_IMAGES);
    });
    e.target.value = "";
  }, [t]);

  /** 51-31-2：视频大小与时长校验 + i18n 错误文案 */
  const handleVideoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > MAX_VIDEO_SIZE) {
      setUploadError(t("community_upload_error_video_size").replace("{{max}}", String(MAX_VIDEO_SIZE_MB)));
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    let settled = false;
    let timeoutId: number | undefined;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
    timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      URL.revokeObjectURL(url);
      setUploadError(t("community_upload_error_video_metadata"));
    }, VIDEO_METADATA_TIMEOUT_MS);
    video.onloadedmetadata = () => {
      if (settled) return;
      settle();
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0 || dur > MAX_VIDEO_DURATION_SEC) {
        URL.revokeObjectURL(url);
        setUploadError(t("community_upload_error_video_duration").replace("{{max}}", String(MAX_VIDEO_DURATION_SEC)));
        return;
      }
      setVideoPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    };
    video.onerror = () => {
      if (settled) return;
      settle();
      URL.revokeObjectURL(url);
      setUploadError(t("community_media_load_failed"));
    };
    video.src = url;
    e.target.value = "";
  }, [t]);

  const moveImage = useCallback((index: number, dir: 1 | -1) => {
    setPreviewUrls((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting || submitInFlightRef.current) return;
    if (type === "photo" && previewUrls.length === 0) {
      setUploadError(t("community_api_msg_media_required"));
      return;
    }
    if (type === "video" && !videoPreviewUrl) {
      setUploadError(t("community_api_msg_media_required"));
      return;
    }
    const coverTrim = type === "video" ? videoCoverUrl.trim() : "";
    if (type === "video" && coverTrim && !isHttpImageUrl(coverTrim)) {
      setUploadError(t("community_publish_video_cover_invalid"));
      return;
    }
    setUploadError(null);
    submitInFlightRef.current = true;
    setSubmitting(true);
    try {
      const mediaUrls =
        type === "text"
          ? undefined
          : type === "video" && videoPreviewUrl
            ? [videoPreviewUrl]
            : type === "photo" && previewUrls.length > 0
              ? previewUrls
              : undefined;
      await onSubmit({
        type,
        content: trimmed,
        mediaUrls,
        ...(type === "video" && coverTrim ? { coverUrl: coverTrim } : {}),
      });
      previewUrls.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      if (videoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(videoPreviewUrl);
      setPreviewUrls([]);
      setVideoPreviewUrl(null);
      setVideoCoverUrl("");
      onClose();
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("usePublishForm handleSubmit:", err);
      }
      setUploadError(mapApiReadError(err, t, "community_publish_failed"));
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [content, type, videoPreviewUrl, previewUrls, videoCoverUrl, submitting, onSubmit, onClose, t]);

  const previewUrlsRef = useRef<string[]>([]);
  previewUrlsRef.current = previewUrls;
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => { if (u.startsWith("blob:")) URL.revokeObjectURL(u); });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setTypeWithCleanup = useCallback((next: CommunityPostType) => {
    setType(next);
    setUploadError(null);
    if (next === "video" || next === "text") {
      setPreviewUrls((prev) => {
        prev.forEach((u) => {
          if (u.startsWith("blob:")) URL.revokeObjectURL(u);
        });
        return [];
      });
    }
    if (next !== "video") {
      removeVideo();
    }
  }, [removeVideo]);

  const charCount = content.length;
  const atLimit = charCount >= MAX_CHARS;
  const nearLimit = charCount >= MAX_CHARS * 0.9 && !atLimit;

  return {
    type,
    setType: setTypeWithCleanup,
    content,
    setContent,
    previewUrls,
    setPreviewUrls,
    videoPreviewUrl,
    fileInputRef,
    videoInputRef,
    backButtonRef,
    containerRef,
    uploadError,
    submitting,
    entered,
    removeVideo,
    removeImage,
    moveImage,
    handleFileChange,
    handleVideoChange,
    handleSubmit,
    charCount,
    atLimit,
    nearLimit,
    videoCoverUrl,
    setVideoCoverUrl,
  };
}
