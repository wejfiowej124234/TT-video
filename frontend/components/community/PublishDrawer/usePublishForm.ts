"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CommunityPostType } from "@/lib/communityMockData";
import { centerSquareCropImageFile } from "@/lib/communityImageCenterCrop";
import {
  communityObjectStorageVideoBannerKey,
  communityVideoPublishPipelineReady,
} from "@/lib/communityVideoPublishGate";
import {
  MAX_CHARS,
  MAX_IMAGES,
  ACCEPT_IMAGE,
  MAX_FILE_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
  getCommunityPostMediaMaxDecodedBytes,
  getCommunityMediaAssetMaxBytesClient,
  communityPostMediaMaxSizeMbLabel,
} from "./constants";
import type { PublishPayload } from "./types";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { usePublishFormDrawerEffects } from "./usePublishFormDrawerEffects";
import { probeCommunityPublishVideoBlob } from "./publishFormVideoBlobProbe";
import { persistCommunityMediaUrlIfBlob } from "./publishFormMediaPersistence";
import { getCommunityMediaCapabilities, type CommunityMediaCapabilities } from "@/lib/apiClient/community/mediaCapabilities";
import type { CommunityMultipartProgress } from "@/lib/apiClient/community/mediaAssetsMultipart";
import { uploadPosterJpegFromVideoBlobUrl } from "@/lib/communityVideoPosterCapture";
import {
  normalizeCommunityPostTagsForApi,
  splitCommunityPostTagsInput,
} from "@/lib/communityPostTagsPayload";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { isCommunityPublishParentOwnedError } from "@/lib/communityPublishSubmitError";

export interface UsePublishFormOptions {
  onClose: () => void;
  onSubmit: (payload: PublishPayload) => void | Promise<void>;
  t: LocaleTranslateFn;
}

function isAcceptedCoverImage(file: File): boolean {
  const ct = (file.type || "").trim().toLowerCase();
  return ct === "image/jpeg" || ct === "image/png" || ct === "image/webp";
}

function multipartErrCode(err: unknown): string | null {
  if (!(err instanceof Error) || err.name !== "CommunityMultipartUploadError") return null;
  const code = (err as { code?: string }).code;
  return typeof code === "string" && code.trim() ? code.trim() : err.message.trim() || null;
}

function mapMultipartUploadError(err: unknown, t: LocaleTranslateFn): string {
  const code = multipartErrCode(err);
  if (code) {
    if (code === "multipart_not_configured" || code === "community_video_requires_object_storage_multipart") {
      const mb = communityPostMediaMaxSizeMbLabel(getCommunityPostMediaMaxDecodedBytes());
      return t("community_video_multipart_not_configured").replace(/\{\{mb\}\}/g, mb);
    }
    if (code.includes("part") || code.startsWith("part_upload")) {
      return t("community_video_multipart_part_failed").replace(/\{\{code\}\}/g, code);
    }
    if (code.includes("complete") || code === "presign_missing_part") {
      return t("community_video_multipart_complete_failed").replace(/\{\{code\}\}/g, code);
    }
    if (code.includes("asset") || code === "media_asset_poll_timeout") {
      const detail = err instanceof Error ? err.message || code : code;
      return t("community_video_multipart_asset_failed").replace(/\{\{detail\}\}/g, detail);
    }
    return t("community_publish_failed");
  }
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (msg.startsWith("file_too_large|")) {
      const m = msg.match(/max_bytes=(\d+)/);
      const maxMb = m
        ? communityPostMediaMaxSizeMbLabel(Number.parseInt(m[1]!, 10))
        : String(MAX_FILE_SIZE_MB);
      return t("community_upload_error_size").replace(/\{\{max\}\}/g, maxMb);
    }
    if (msg.startsWith("video_too_long|")) {
      const m = msg.match(/max_duration_sec=(\d+)/);
      const sec = m ? m[1]! : String(MAX_VIDEO_DURATION_SEC);
      return t("community_upload_error_video_duration").replace(/\{\{max\}\}/g, sec);
    }
  }
  return mapApiReadError(err, t, "community_publish_failed");
}

function progressHint(t: LocaleTranslateFn, p: CommunityMultipartProgress): string {
  const pct = Math.round(p.ratio * 100);
  if (p.phase === "creating") return t("community_video_upload_phase_creating");
  if (p.phase === "uploading") {
    return t("community_video_upload_phase_uploading").replace(/\{\{pct\}\}/g, String(pct));
  }
  if (p.phase === "completing") return t("community_video_upload_phase_completing");
  return t("community_video_upload_phase_confirming");
}

export function usePublishForm({ onClose, onSubmit, t }: UsePublishFormOptions) {
  const [type, setType] = useState<CommunityPostType>("photo");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [destination, setDestination] = useState("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoCoverUrl, setVideoCoverUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const pendingVideoFileRef = useRef<File | null>(null);
  const capabilitiesRef = useRef<CommunityMediaCapabilities | null>(null);
  const [mediaCapabilities, setMediaCapabilities] = useState<CommunityMediaCapabilities | null>(null);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<{ pct: number } | null>(null);
  const [videoUploadHint, setVideoUploadHint] = useState<string | null>(null);

  const { entered } = usePublishFormDrawerEffects({
    onClose,
    backButtonRef,
    containerRef,
    previewUrls,
  });

  capabilitiesRef.current = mediaCapabilities;

  useEffect(() => {
    if (!entered) {
      setMediaCapabilities(null);
      setCapabilitiesLoaded(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCommunityMediaCapabilities();
        if (cancelled) return;
        setMediaCapabilities(data);
      } catch {
        if (cancelled) return;
        setMediaCapabilities(null);
      } finally {
        if (!cancelled) setCapabilitiesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entered]);

  const videoPublishPipelineReady = communityVideoPublishPipelineReady(
    capabilitiesLoaded,
    mediaCapabilities,
  );
  const objectStorageVideoBanner = communityObjectStorageVideoBannerKey(
    capabilitiesLoaded,
    mediaCapabilities,
  );

  const revokeBlob = useCallback((url: string | null | undefined) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const removeVideo = useCallback(() => {
    revokeBlob(videoPreviewUrl);
    setVideoPreviewUrl(null);
    pendingVideoFileRef.current = null;
    revokeBlob(videoCoverUrl);
    setVideoCoverUrl("");
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
    setVideoUploadProgress(null);
    setVideoUploadHint(null);
    setUploadError(null);
  }, [revokeBlob, videoCoverUrl, videoPreviewUrl]);

  const removeCover = useCallback(() => {
    revokeBlob(videoCoverUrl);
    setVideoCoverUrl("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, [revokeBlob, videoCoverUrl]);

  const removeImage = useCallback(
    (index: number) => {
      setPreviewUrls((prev) => {
        revokeBlob(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    },
    [revokeBlob],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      setUploadError(null);
      const maxDecoded = getCommunityPostMediaMaxDecodedBytes();
      const maxMb = communityPostMediaMaxSizeMbLabel(maxDecoded);
      const picked = Array.from(files);
      e.target.value = "";
      setPreviewUrls((prev) => {
        const next = [...prev];
        const rest = MAX_IMAGES - prev.length;
        for (let i = 0; i < Math.min(picked.length, rest); i++) {
          const file = picked[i]!;
          if (file.size > maxDecoded) {
            setUploadError(t("community_upload_error_size").replace(/\{\{max\}\}/g, maxMb));
            break;
          }
          const immediate = URL.createObjectURL(file);
          next.push(immediate);
          void centerSquareCropImageFile(file)
            .then((cropped) => {
              if (cropped === file) return;
              const croppedUrl = URL.createObjectURL(cropped);
              setPreviewUrls((current) =>
                current.map((u) => {
                  if (u !== immediate) return u;
                  revokeBlob(immediate);
                  return croppedUrl;
                }),
              );
            })
            .catch(() => undefined);
        }
        return next.slice(0, MAX_IMAGES);
      });
    },
    [revokeBlob, t],
  );

  const handleVideoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setUploadError(null);
      setVideoUploadProgress(null);
      setVideoUploadHint(null);

      const caps = capabilitiesRef.current;
      if (!caps?.public_video_publish_ready) {
        setUploadError(t("community_object_storage_video_unavailable_banner"));
        return;
      }

      const maxBytes =
        caps.max_video_bytes > 0 ? caps.max_video_bytes : getCommunityMediaAssetMaxBytesClient();
      const maxDur = caps.max_video_seconds > 0 ? caps.max_video_seconds : MAX_VIDEO_DURATION_SEC;
      const result = await probeCommunityPublishVideoBlob(file, maxBytes, maxDur, t);
      if (!result.ok) {
        setUploadError(result.errorMessage);
        return;
      }

      pendingVideoFileRef.current = file;
      setVideoPreviewUrl((prev) => {
        revokeBlob(prev);
        return result.objectUrl;
      });
      revokeBlob(videoCoverUrl);
      setVideoCoverUrl("");
      if (coverInputRef.current) coverInputRef.current.value = "";
    },
    [revokeBlob, t, videoCoverUrl],
  );

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setUploadError(null);
      if (!isAcceptedCoverImage(file)) {
        setUploadError(t("community_publish_video_cover_image_only"));
        return;
      }
      const maxDecoded = getCommunityPostMediaMaxDecodedBytes();
      if (file.size > maxDecoded) {
        setUploadError(
          t("community_upload_error_size").replace(
            /\{\{max\}\}/g,
            communityPostMediaMaxSizeMbLabel(maxDecoded),
          ),
        );
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoCoverUrl((prev) => {
        revokeBlob(prev);
        return url;
      });
    },
    [revokeBlob, t],
  );

  const moveImage = useCallback((index: number, dir: 1 | -1) => {
    setPreviewUrls((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next]!, arr[index]!];
      return arr;
    });
  }, []);

  const uploadPendingVideo = useCallback(
    async (file: File): Promise<{ assetId: string; playbackUrl: string }> => {
      setVideoUploadProgress({ pct: 2 });
      setVideoUploadHint(t("community_video_upload_phase_creating"));
      try {
        const { uploadCommunityVideoMultipart } = await import(
          "@/lib/apiClient/community/mediaAssetsMultipart"
        );
        const out = await uploadCommunityVideoMultipart(file, {
          onProgress: (p) => {
            setVideoUploadProgress({ pct: Math.round(p.ratio * 100) });
            setVideoUploadHint(progressHint(t, p));
          },
        });
        setVideoUploadProgress({ pct: 100 });
        return out;
      } finally {
        setVideoUploadProgress(null);
        setVideoUploadHint(null);
      }
    },
    [t],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting || submitInFlightRef.current) return;

    const tagNorm = normalizeCommunityPostTagsForApi(splitCommunityPostTagsInput(tagsInput));
    if (!tagNorm.ok) {
      setUploadError(t(`community_api_msg_${tagNorm.code}`));
      return;
    }

      if (type === "photo" && previewUrls.length === 0) {
        setUploadError(t("community_api_msg_media_required"));
        return;
      }
    if (type === "video" && !videoPreviewUrl) {
      setUploadError(t("community_api_msg_media_required"));
      return;
    }

    setUploadError(null);
    submitInFlightRef.current = true;
    setSubmitting(true);

    try {
      let mediaUrls: string[] | undefined;
      let mediaAssetId: string | undefined;
      let coverUrl: string | undefined;

      if (type === "photo" && previewUrls.length > 0) {
        mediaUrls = await Promise.all(previewUrls.map((u) => persistCommunityMediaUrlIfBlob(u)));
      } else if ((type === "food" || type === "travel") && previewUrls.length > 0) {
        mediaUrls = await Promise.all(previewUrls.map((u) => persistCommunityMediaUrlIfBlob(u)));
      } else if (type === "video" && videoPreviewUrl) {
        const caps = capabilitiesRef.current;
        const pendingFile = pendingVideoFileRef.current;
        if (caps?.public_video_publish_ready && pendingFile) {
          const uploaded = await uploadPendingVideo(pendingFile);
          mediaAssetId = uploaded.assetId;
          mediaUrls = [uploaded.playbackUrl];
        } else {
          mediaUrls = [await persistCommunityMediaUrlIfBlob(videoPreviewUrl)];
        }

        const coverTrim = videoCoverUrl.trim();
        if (coverTrim) {
          coverUrl = await persistCommunityMediaUrlIfBlob(coverTrim);
        } else if (videoPreviewUrl.startsWith("blob:")) {
          const autoCover = await uploadPosterJpegFromVideoBlobUrl(
            videoPreviewUrl,
            getCommunityPostMediaMaxDecodedBytes(),
          );
          if (autoCover) coverUrl = autoCover;
        }
      }

      await onSubmit({
        type,
        content: trimmed,
        ...(mediaUrls ? { mediaUrls } : {}),
        ...(coverUrl ? { coverUrl } : {}),
        ...(tagNorm.tags.length > 0 ? { tags: tagNorm.tags } : {}),
        ...(destination.trim() ? { destination: destination.trim() } : {}),
        ...(mediaAssetId ? { mediaAssetId } : {}),
      });

      previewUrls.forEach((u) => revokeBlob(u));
      revokeBlob(videoPreviewUrl);
      revokeBlob(videoCoverUrl);
      setPreviewUrls([]);
      setVideoPreviewUrl(null);
      setVideoCoverUrl("");
      setTagsInput("");
      pendingVideoFileRef.current = null;
      onClose();
    } catch (err) {
      if (isCommunityPublishParentOwnedError(err)) {
        return;
      }
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        console.error("usePublishForm handleSubmit:", err);
      }
      setUploadError(mapMultipartUploadError(err, t));
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [
    content,
    tagsInput,
    destination,
    type,
    videoPreviewUrl,
    previewUrls,
    videoCoverUrl,
    submitting,
    onSubmit,
    onClose,
    t,
    uploadPendingVideo,
    revokeBlob,
  ]);

  const retryVideoUpload = useCallback(() => {
    setUploadError(null);
    void handleSubmit();
  }, [handleSubmit]);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const setTypeWithCleanup = useCallback(
    (next: CommunityPostType) => {
      setType(next);
      setUploadError(null);
      if (next === "video" || next === "text") {
        setPreviewUrls((prev) => {
          prev.forEach((u) => revokeBlob(u));
          return [];
        });
      }
      if (next !== "video") {
        removeVideo();
      }
    },
    [removeVideo, revokeBlob],
  );

  const charCount = content.length;
  const atLimit = charCount >= MAX_CHARS;
  const nearLimit = charCount >= MAX_CHARS * 0.9 && !atLimit;

  return {
    type,
    setType: setTypeWithCleanup,
    content,
    setContent,
    tagsInput,
    setTagsInput,
    destination,
    setDestination,
    previewUrls,
    videoPreviewUrl,
    videoCoverUrl,
    fileInputRef,
    videoInputRef,
    coverInputRef,
    backButtonRef,
    containerRef,
    uploadError,
    submitting,
    entered,
    removeVideo,
    removeCover,
    removeImage,
    moveImage,
    handleFileChange,
    handleVideoChange,
    handleCoverChange,
    handleSubmit,
    retryVideoUpload,
    clearUploadError,
    charCount,
    atLimit,
    nearLimit,
    videoUploadProgress,
    videoUploadHint,
    videoPublishPipelineReady,
    objectStorageVideoBanner,
    mediaCapabilities,
    capabilitiesLoaded,
  };
}

export type PublishDrawerFormModel = ReturnType<typeof usePublishForm>;
