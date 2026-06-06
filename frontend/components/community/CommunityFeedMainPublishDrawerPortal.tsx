"use client";

import type { ComponentType } from "react";
import { createPortal } from "react-dom";
import type { PublishDrawerProps } from "@/components/community/PublishDrawer/types";
import type { CommunityFeedMainPortalsProps } from "./communityFeedMainPortalsTypes";

type PublishSlice = Pick<
  CommunityFeedMainPortalsProps,
  | "t"
  | "publishOpen"
  | "closePublishDrawer"
  | "handlePublishSubmit"
  | "publishSendFailed"
  | "publishErrorMessage"
  | "publishFieldMessages"
  | "clearPublishSendError"
>;

export function CommunityFeedMainPublishDrawerPortal(
  props: PublishSlice & { PublishDrawer: ComponentType<PublishDrawerProps> }
) {
  const {
    PublishDrawer,
    t,
    publishOpen,
    closePublishDrawer,
    handlePublishSubmit,
    publishSendFailed,
    publishErrorMessage,
    publishFieldMessages,
    clearPublishSendError,
  } = props;
  if (!publishOpen || typeof document === "undefined") return null;
  return createPortal(
    <PublishDrawer
      onClose={closePublishDrawer}
      onSubmit={handlePublishSubmit}
      t={t}
      publishError={publishSendFailed}
      publishErrorMessage={publishErrorMessage}
      publishFieldMessages={publishFieldMessages}
      onRetryPublish={clearPublishSendError}
    />,
    document.body
  );
}
