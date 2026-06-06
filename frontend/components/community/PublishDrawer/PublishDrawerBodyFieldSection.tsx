"use client";

import { useEffect, useRef } from "react";
import { MAX_CHARS } from "./constants";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerBodyFieldSectionProps = {
  t: LocaleTranslateFn;
  form: Pick<PublishDrawerFormModel, "content" | "setContent" | "charCount" | "atLimit" | "nearLimit">;
  publishContentLabelId: string;
  publishBodyFieldErrorId: string;
  publishCharCountId: string;
  publishFormErrorId: string;
  bodyFieldErr: boolean;
  showGenericPublishError: boolean;
  bodyMessage?: string;
  publishError?: boolean;
  onRetryPublish?: () => void;
};

export function PublishDrawerBodyFieldSection({
  t,
  form,
  publishContentLabelId,
  publishBodyFieldErrorId,
  publishCharCountId,
  publishFormErrorId,
  bodyFieldErr,
  showGenericPublishError,
  bodyMessage,
  publishError,
  onRetryPublish,
}: PublishDrawerBodyFieldSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!bodyFieldErr) return;
    textareaRef.current?.focus({ preventScroll: false });
  }, [bodyFieldErr, bodyMessage]);

  return (
    <section
      className={`${TT_COMMUNITY_DRAWER_L5.publishFieldSection} ${bodyFieldErr ? "border-danger/45" : TT_COMMUNITY_DRAWER_L5.publishFieldBorderOk}`}
      aria-labelledby={publishContentLabelId}
    >
      <label id={publishContentLabelId} className="block text-small font-medium text-slate-300 mb-3">
        {t("community_publish_content")}
      </label>
      {bodyFieldErr ? (
        <p id={publishBodyFieldErrorId} className="text-meta text-danger/95 mb-2" role="alert">
          {bodyMessage}
        </p>
      ) : null}
      <textarea
        ref={textareaRef}
        value={form.content}
        onChange={(e) => {
          form.setContent(e.target.value.slice(0, MAX_CHARS));
          if (publishError) onRetryPublish?.();
        }}
        placeholder={t("community_publish_content_placeholder")}
        rows={5}
        maxLength={MAX_CHARS}
        className={
          `${TT_COMMUNITY_DRAWER_L5.publishTextarea} ` +
          (bodyFieldErr
            ? "border-danger/60 focus-visible:ring-danger/50 focus:border-danger/50"
            : TT_COMMUNITY_DRAWER_L5.publishFieldBorderInput)
        }
        aria-describedby={
          [showGenericPublishError && publishFormErrorId, bodyFieldErr && publishBodyFieldErrorId, publishCharCountId]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={bodyFieldErr}
        aria-errormessage={
          bodyFieldErr ? publishBodyFieldErrorId : showGenericPublishError ? publishFormErrorId : undefined
        }
      />
      <p id={publishCharCountId} className="mt-1 text-right text-meta text-slate-400" aria-live="polite">
        <span className={form.atLimit ? "text-warning font-medium" : form.nearLimit ? "text-warning/90" : ""}>
          {form.charCount}/{MAX_CHARS}
          {t("community_char_count")}
        </span>
      </p>
    </section>
  );
}
