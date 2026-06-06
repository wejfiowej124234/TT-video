"use client";

import { ActionGateChecklist } from "@/components/ui/ActionGateChecklist";
import { communityPublishFabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5, TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import type { PublishDrawerFormModel } from "./usePublishForm";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerFooterProps = {
  t: LocaleTranslateFn;
  form: Pick<PublishDrawerFormModel, "submitting">;
  publishDisabled: boolean;
  submit: () => void;
  publishBlockedKeys: string[];
  publishRequiredHintId: string;
  publishFormErrorId: string;
  publishError?: boolean;
};

export function PublishDrawerFooter({
  t,
  form,
  publishDisabled,
  submit,
  publishBlockedKeys,
  publishRequiredHintId,
  publishFormErrorId,
  publishError,
}: PublishDrawerFooterProps) {
  const formIncomplete = publishBlockedKeys.length > 0;
  const footerHintKey = formIncomplete
    ? null
    : publishError
      ? "community_publish_error_footer_hint"
      : form.submitting
        ? null
        : "community_publish_ready_hint";

  return (
    <footer className={TT_COMMUNITY_DRAWER_L5.publishFooter} aria-label={t("community_publish_submit")}>
      <div className="w-full">
        <button
          type="button"
          disabled={publishDisabled}
          onClick={() => {
            if (!publishDisabled) submit();
          }}
          aria-describedby={
            [formIncomplete && publishRequiredHintId, publishError && publishFormErrorId]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-busy={form.submitting ? true : undefined}
          className={`${TT_COMMUNITY_FEED_ACTION.publishSubmit} ${TT_COMMUNITY_FEED_ACTION.publishSubmitFocus} ${communityPublishFabFocus}`}
        >
          {form.submitting && (
            <svg className="h-5 w-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {form.submitting ? t("community_publish_submitting") : t("community_publish_submit")}
        </button>

        {formIncomplete && !form.submitting ? (
          <ActionGateChecklist
            id={publishRequiredHintId}
            variant="community"
            titleKey="action_gate_title_before_publish"
            itemKeys={publishBlockedKeys}
            t={t}
          />
        ) : footerHintKey ? (
          <p id={publishRequiredHintId} className="mt-3 text-center text-meta text-slate-400" role="status">
            {t(footerHintKey)}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
