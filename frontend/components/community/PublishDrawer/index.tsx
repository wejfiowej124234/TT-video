"use client";

import { useId, useMemo, useEffect, useCallback } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  MAX_FILE_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
  getCommunityPostMediaMaxDecodedBytes,
  getCommunityMediaAssetMaxBytesClient,
  communityPostMediaMaxSizeMbLabel,
} from "./constants";
import { usePublishForm } from "./usePublishForm";
import type { PublishDrawerProps } from "./types";
import { PublishDrawerHeader } from "./PublishDrawerHeader";
import { PublishDrawerAlerts } from "./PublishDrawerAlerts";
import { PublishDrawerTypeSection } from "./PublishDrawerTypeSection";
import { PublishDrawerPhotoSection } from "./PublishDrawerPhotoSection";
import { PublishDrawerTextTypePanel } from "./PublishDrawerTextTypePanel";
import { PublishDrawerVideoSection } from "./PublishDrawerVideoSection";
import { PublishDrawerBodyFieldSection } from "./PublishDrawerBodyFieldSection";
import { PublishDrawerTagsFieldSection } from "./PublishDrawerTagsFieldSection";
import { PublishDrawerDestinationSection } from "./PublishDrawerDestinationSection";
import { PublishDrawerFooter } from "./PublishDrawerFooter";
import { publishDrawerMergeRefs } from "./publishDrawerMergeRefs";
import { communityPublishBlockedKeys } from "@/lib/publishActionBlockedKeys";
import { hasCommunityPublishAuth } from "@/lib/marketProductCommunityPublish";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

function buildVideoHintText(
  t: LocaleTranslateFn,
  capsLoaded: boolean,
  caps: ReturnType<typeof usePublishForm>["mediaCapabilities"],
): string {
  if (caps?.public_video_publish_ready) {
    const mb = communityPostMediaMaxSizeMbLabel(
      caps.max_video_bytes > 0 ? caps.max_video_bytes : getCommunityMediaAssetMaxBytesClient(),
    );
    const sec = caps.max_video_seconds > 0 ? caps.max_video_seconds : MAX_VIDEO_DURATION_SEC;
    return t("community_publish_video_hint_multipart_on")
      .replace(/\{\{mb\}\}/g, mb)
      .replace(/\{\{sec\}\}/g, String(sec));
  }
  if (capsLoaded && caps && !caps.public_video_publish_ready) {
    const mb = communityPostMediaMaxSizeMbLabel(getCommunityPostMediaMaxDecodedBytes());
    return t("community_publish_video_hint_fallback_only").replace(/\{\{mb\}\}/g, mb);
  }
  const mb = communityPostMediaMaxSizeMbLabel(getCommunityMediaAssetMaxBytesClient());
  return t("community_publish_video_hint")
    .replace(/\{\{mb\}\}/g, mb)
    .replace(/\{\{sec\}\}/g, String(MAX_VIDEO_DURATION_SEC));
}

/** 发布动态弹窗：多图/视频 + 本机封面 + 话题；子组件与 E2E/vitest 同源 */
export function PublishDrawer({
  onClose,
  onSubmit,
  t,
  publishError,
  publishErrorMessage,
  publishFieldMessages,
  onRetryPublish,
}: PublishDrawerProps) {
  const form = usePublishForm({ onClose, onSubmit, t });
  const submit = () => void form.handleSubmit();
  const focusTrapRef = useFocusTrap(form.entered, onClose);

  const handleClearPublishError = useCallback(() => {
    form.clearUploadError();
    onRetryPublish?.();
  }, [form, onRetryPublish]);

  const photoHintText = t("community_publish_media_hint").replace(/\{\{mb\}\}/g, String(MAX_FILE_SIZE_MB));
  const videoHintText = buildVideoHintText(t, form.capabilitiesLoaded, form.mediaCapabilities);

  const pf = publishFieldMessages ?? {};
  const bodyFieldErr = !!pf.body;
  const mediaFieldErr = !!pf.media_urls;
  const coverFieldErr = !!pf.cover_url;
  const tagsFieldErr = !!pf.tags;
  const showPublishErrorBanner = !!(publishError && publishErrorMessage?.trim());
  const showGenericPublishError = showPublishErrorBanner;

  const videoPipelineOk =
    form.capabilitiesLoaded && form.mediaCapabilities
      ? form.mediaCapabilities.public_video_publish_ready
      : undefined;

  const publishBlockedKeys = useMemo(
    () =>
      communityPublishBlockedKeys({
        sessionOk: hasCommunityPublishAuth(),
        type: form.type,
        hasBody: !!form.content.trim(),
        photoCount: form.previewUrls.length,
        hasVideoPreview: !!form.videoPreviewUrl,
        videoPipelineOk: form.type === "video" ? videoPipelineOk : undefined,
      }),
    [form.type, form.content, form.previewUrls.length, form.videoPreviewUrl, videoPipelineOk],
  );

  const publishDisabled = publishBlockedKeys.length > 0 || form.submitting;

  const drawerTitleId = useId();
  const publishEntryHintId = useId();
  const publishFormErrorId = useId();
  const publishTypeLabelId = useId();
  const publishMediaFieldErrorId = useId();
  const publishVideoCoverHintId = useId();
  const publishVideoCoverFieldErrorId = useId();
  const publishContentLabelId = useId();
  const publishBodyFieldErrorId = useId();
  const publishTagsLabelId = useId();
  const publishTagsInputId = useId();
  const publishTagsFieldErrorId = useId();
  const publishTopicsHintId = useId();
  const publishDestinationLabelId = useId();
  const publishCharCountId = useId();
  const publishRequiredHintId = useId();
  const photoPickInputId = useId();
  const videoPickInputId = useId();
  const videoCoverPickInputId = useId();

  useEffect(() => {
    if (!showPublishErrorBanner) return;
    const el = typeof document !== "undefined" ? document.getElementById(publishFormErrorId) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [showPublishErrorBanner, publishErrorMessage, publishFormErrorId]);

  const videoTypeDisabled = form.capabilitiesLoaded && form.videoPublishPipelineReady === false;
  const objectStorageBanner = form.objectStorageVideoBanner
    ? t(form.objectStorageVideoBanner)
    : null;
  const showPhotoSection =
    form.type === "photo" || form.type === "food" || form.type === "travel";

  return (
    <div
      className={`fixed top-16 left-0 right-0 bottom-0 z-[200] flex items-center justify-center p-4 overflow-auto text-slate-100 transition-opacity duration-200 ease-out motion-reduce:opacity-100 ${form.entered ? "opacity-100" : "opacity-0"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={showPublishErrorBanner ? `${publishEntryHintId} ${publishFormErrorId}` : publishEntryHintId}
      data-tt-community-publish-drawer="1"
    >
      <div className={TT_COMMUNITY_DRAWER_L5.publishScrim} aria-hidden onClick={onClose} />

      <div
        ref={publishDrawerMergeRefs(form.containerRef, focusTrapRef)}
        onClick={(e) => e.stopPropagation()}
        data-tt-publish-drawer-type={form.type}
        className={`relative z-10 w-full max-w-2xl max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden transition-all duration-200 ease-out ${TT_COMMUNITY_DRAWER_L5.sheet} ${form.entered ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <PublishDrawerHeader
          t={t}
          drawerTitleId={drawerTitleId}
          backButtonRef={form.backButtonRef}
          onClose={onClose}
        />

        <PublishDrawerAlerts
          t={t}
          showPublishErrorBanner={showPublishErrorBanner}
          publishFormErrorId={publishFormErrorId}
          publishErrorMessage={publishErrorMessage}
          onRetryPublish={handleClearPublishError}
          publishError={publishError}
          bodyFieldErr={bodyFieldErr}
          mediaFieldErr={mediaFieldErr}
          coverFieldErr={coverFieldErr}
          tagsFieldErr={tagsFieldErr}
        />

        <div className="flex-1 overflow-y-auto min-h-0" role="main" aria-label={t("community_publish_title")}>
          <div className="px-4 sm:px-5 pt-5 pb-6 space-y-5">
            <p id={publishEntryHintId} className="text-small text-slate-300" role="doc-subtitle">
              {t("community_publish_entry_hint")}
            </p>

            {!form.capabilitiesLoaded && form.type === "video" ? (
              <p className="text-meta text-slate-400" role="status">
                {t("community_media_capabilities_loading_hint")}
              </p>
            ) : null}

            {objectStorageBanner ? (
              <div
                className="rounded-[var(--radius-md)] border border-warning/45 bg-warning/10 px-3 py-2 text-meta text-warning/95"
                role="status"
                data-testid="community-publish-capabilities-banner"
              >
                {objectStorageBanner}
              </div>
            ) : null}

            <PublishDrawerTypeSection
              t={t}
              publishTypeLabelId={publishTypeLabelId}
              form={form}
              videoTypeDisabled={videoTypeDisabled}
              videoDisabledHint={objectStorageBanner ?? t("community_object_storage_video_unavailable_hint")}
            />

            {showPhotoSection ? (
              <PublishDrawerPhotoSection
                t={t}
                form={form}
                photoPickInputId={photoPickInputId}
                publishMediaFieldErrorId={publishMediaFieldErrorId}
                mediaFieldErr={mediaFieldErr}
                mediaUrlsMessage={pf.media_urls}
                photoHintText={photoHintText}
                optionalMedia={form.type === "food" || form.type === "travel"}
              />
            ) : null}

            {form.type === "text" ? <PublishDrawerTextTypePanel t={t} /> : null}

            {form.type === "video" ? (
              <PublishDrawerVideoSection
                t={t}
                form={form}
                videoPickInputId={videoPickInputId}
                videoCoverPickInputId={videoCoverPickInputId}
                publishMediaFieldErrorId={publishMediaFieldErrorId}
                publishVideoCoverHintId={publishVideoCoverHintId}
                publishVideoCoverFieldErrorId={publishVideoCoverFieldErrorId}
                mediaFieldErr={mediaFieldErr}
                coverFieldErr={coverFieldErr}
                mediaUrlsMessage={pf.media_urls}
                coverUrlMessage={pf.cover_url}
                videoHintText={videoHintText}
                videoPickDisabled={videoTypeDisabled}
                publishError={publishError}
                onRetryPublish={handleClearPublishError}
              />
            ) : null}

            <PublishDrawerBodyFieldSection
              t={t}
              form={form}
              publishContentLabelId={publishContentLabelId}
              publishBodyFieldErrorId={publishBodyFieldErrorId}
              publishCharCountId={publishCharCountId}
              publishFormErrorId={publishFormErrorId}
              bodyFieldErr={bodyFieldErr}
              showGenericPublishError={showGenericPublishError}
              bodyMessage={pf.body}
              publishError={publishError}
              onRetryPublish={handleClearPublishError}
            />

            <PublishDrawerTagsFieldSection
              t={t}
              form={form}
              publishTagsLabelId={publishTagsLabelId}
              publishTagsInputId={publishTagsInputId}
              publishTagsFieldErrorId={publishTagsFieldErrorId}
              publishTopicsHintId={publishTopicsHintId}
              tagsFieldErr={tagsFieldErr}
              tagsMessage={pf.tags}
              publishError={publishError}
              onRetryPublish={handleClearPublishError}
            />

            <PublishDrawerDestinationSection
              t={t}
              publishDestinationLabelId={publishDestinationLabelId}
              destination={form.destination}
              onDestinationChange={form.setDestination}
            />
          </div>
        </div>

        <PublishDrawerFooter
          t={t}
          form={form}
          publishDisabled={publishDisabled}
          submit={submit}
          publishBlockedKeys={publishBlockedKeys}
          publishRequiredHintId={publishRequiredHintId}
          publishFormErrorId={publishFormErrorId}
          publishError={publishError}
        />
      </div>
    </div>
  );
}
