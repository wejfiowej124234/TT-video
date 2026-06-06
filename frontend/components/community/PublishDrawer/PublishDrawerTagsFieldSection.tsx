"use client";

import {
  COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
  COMMUNITY_POST_TAGS_MAX_COUNT,
} from "@/lib/apiClient/community";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export type PublishDrawerTagsFieldSectionProps = {
  t: LocaleTranslateFn;
  form: Pick<PublishDrawerFormModel, "tagsInput" | "setTagsInput">;
  publishTagsLabelId: string;
  publishTagsInputId: string;
  publishTagsFieldErrorId: string;
  publishTopicsHintId: string;
  tagsFieldErr: boolean;
  tagsMessage?: string;
  publishError?: boolean;
  onRetryPublish?: () => void;
};

export function PublishDrawerTagsFieldSection({
  t,
  form,
  publishTagsLabelId,
  publishTagsInputId,
  publishTagsFieldErrorId,
  publishTopicsHintId,
  tagsFieldErr,
  tagsMessage,
  publishError,
  onRetryPublish,
}: PublishDrawerTagsFieldSectionProps) {
  return (
    <section
      className={`${TT_COMMUNITY_DRAWER_L5.publishFieldSection} ${tagsFieldErr ? "border-danger/45" : TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
      aria-labelledby={publishTagsLabelId}
    >
      <label id={publishTagsLabelId} htmlFor={publishTagsInputId} className="block text-small font-medium text-slate-300 mb-2">
        {t("community_publish_tags_label")}
      </label>
      {tagsFieldErr ? (
        <p id={publishTagsFieldErrorId} className="text-meta text-danger/95 mb-2" role="alert">
          {tagsMessage}
        </p>
      ) : null}
      <input
        id={publishTagsInputId}
        type="text"
        value={form.tagsInput}
        onChange={(e) => {
          form.setTagsInput(e.target.value);
          if (publishError) onRetryPublish?.();
        }}
        placeholder={t("community_add_topics_placeholder")}
        autoComplete="off"
        className={
          "w-full rounded-[var(--radius-md)] border bg-ink-900/80 px-3 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] " +
          (tagsFieldErr
            ? "border-danger/60 focus-visible:ring-danger/50 focus:border-danger/50"
            : TT_COMMUNITY_DRAWER_L5.publishFieldBorderInput)
        }
        aria-describedby={[publishTopicsHintId, tagsFieldErr && publishTagsFieldErrorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={tagsFieldErr}
        aria-errormessage={tagsFieldErr ? publishTagsFieldErrorId : undefined}
        data-tt-community-publish-tags-input="1"
      />
      <p id={publishTopicsHintId} className="mt-2 text-meta text-slate-400">
        {t("community_publish_tags_hint", {
          maxCount: COMMUNITY_POST_TAGS_MAX_COUNT,
          maxLen: COMMUNITY_FEED_TAG_QUERY_MAX_LEN,
        })}
      </p>
    </section>
  );
}
