"use client";

import { CommunityFeedbackListPanel } from "./CommunityFeedbackListPanel";
import { CommunityFeedbackPageHeader } from "./CommunityFeedbackPageHeader";
import { CommunityFeedbackPostModal } from "./CommunityFeedbackPostModal";
import { CommunityFeedbackToast } from "./CommunityFeedbackToast";
import { useCommunityFeedbackPage } from "./useCommunityFeedbackPage";

/** 54-S19：反馈窗 · `GET/POST /api/v1/community/feedback` 为主；失败或未同步时合并本机 localStorage（见 `data-tt-community-feedback-list-source`） */
export function CommunityFeedbackPageMain() {
  const {
    t,
    list,
    serverListSynced,
    listFetchError,
    hydrated,
    retryFetch,
    feedbackListHeadingId,
    feedbackModalTitleId,
    feedbackModalDescId,
    feedbackMediaErrId,
    feedbackContentErrId,
    feedbackFormErrId,
    feedbackCategoryId,
    feedbackContentId,
    postOpen,
    setPostOpen,
    category,
    setCategory,
    content,
    setContent,
    mediaPreviews,
    mediaError,
    submitting,
    feedbackFieldMessages,
    feedbackFormError,
    feedbackToast,
    modalFocusRef,
    photoInputRef,
    videoInputRef,
    handleSubmit,
    addMediaFiles,
    clearFeedbackFormErrors,
  } = useCommunityFeedbackPage();

  return (
    <main
      className="max-w-3xl mx-auto px-4 py-6 sm:px-6"
      aria-label={t("community_feedback_title")}
      data-tt-community-feedback-page="1"
    >
      <CommunityFeedbackPageHeader
        t={t}
        onOpenPost={() => setPostOpen(true)}
        clearFeedbackFormErrors={clearFeedbackFormErrors}
      />

      <CommunityFeedbackListPanel
        feedbackListHeadingId={feedbackListHeadingId}
        t={t}
        hydrated={hydrated}
        listFetchError={listFetchError}
        serverListSynced={serverListSynced}
        list={list}
        onRetryFetch={retryFetch}
        onOpenPost={() => setPostOpen(true)}
        clearFeedbackFormErrors={clearFeedbackFormErrors}
      />

      {postOpen && (
        <CommunityFeedbackPostModal
          t={t}
          feedbackModalTitleId={feedbackModalTitleId}
          feedbackModalDescId={feedbackModalDescId}
          feedbackMediaErrId={feedbackMediaErrId}
          feedbackContentErrId={feedbackContentErrId}
          feedbackFormErrId={feedbackFormErrId}
          feedbackCategoryId={feedbackCategoryId}
          feedbackContentId={feedbackContentId}
          modalFocusRef={modalFocusRef}
          photoInputRef={photoInputRef}
          videoInputRef={videoInputRef}
          handleSubmit={handleSubmit}
          feedbackFieldMessages={feedbackFieldMessages}
          feedbackFormError={feedbackFormError}
          category={category}
          setCategory={setCategory}
          content={content}
          setContent={setContent}
          clearFeedbackFormErrors={clearFeedbackFormErrors}
          mediaPreviews={mediaPreviews}
          mediaError={mediaError}
          addMediaFiles={addMediaFiles}
          submitting={submitting}
        />
      )}

      <CommunityFeedbackToast toastKey={feedbackToast} t={t} />
    </main>
  );
}
