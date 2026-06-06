"use client";

import { hasCommunityPublishAuth } from "@/lib/marketProductCommunityPublish";
import { TT_MARKETING_FOCUS_RING_DARK_SURFACE } from "@/lib/marketingUi";
import { touchTargetLink44Classes} from "@/lib/travelLinkFocus";
import { ActionGateChecklist } from "@/components/ui/ActionGateChecklist";

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  canPublish: boolean;
  saving: boolean;
  publishBlockedKeys: string[];
  requestClose: () => void;
  runPersistAndSync: () => Promise<void>;
};

export function AcquisitionCarryStudioModalFooter({
  t,
  canPublish,
  saving,
  publishBlockedKeys,
  requestClose,
  runPersistAndSync,
}: Props) {
  return (
    <div className="shrink-0 border-t border-white/10 bg-ink-900/40">
      {!canPublish ? (
        <>
          {!hasCommunityPublishAuth() ? (
            <p className="border-b border-white/10 px-6 py-2 text-[0.7rem] text-slate-300" role="status">
              {t("market_studio_publish_footer_strip_no_session")}
            </p>
          ) : (
            <p className="border-b border-white/10 px-6 py-2 text-[0.7rem] text-slate-300" role="status">
              {t("market_studio_publish_footer_strip_form_acquisition")}
            </p>
          )}
          <ActionGateChecklist variant="marketFooter" itemKeys={publishBlockedKeys} t={t} />
        </>
      ) : null}
      <div className="flex flex-col-reverse gap-2 px-6 py-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={requestClose}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} w-full sm:w-auto rounded-[var(--radius-sm)] border border-white/20 bg-white/[0.06] px-4 py-2.5 text-small font-medium text-slate-100 hover:bg-white/10`}
        >
          {t("market_merchantStudio_cancel")}
        </button>
        <button
          type="button"
          disabled={saving || !canPublish}
          title={
            saving
              ? t("market_acquisitionStudio_saving")
              : !canPublish
                ? t(publishBlockedKeys[0] ?? "market_studio_publish_form_incomplete_hint")
                : t("market_studio_publish_tooltip")
          }
          onClick={() => void runPersistAndSync()}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} w-full sm:w-auto rounded-[var(--radius-sm)] border px-4 py-2.5 text-small font-medium ${
            saving || !canPublish
              ? "cursor-not-allowed border-white/15 bg-white/[0.04] text-white/45"
              : "border-warning/45 bg-warning/15 text-white hover:bg-warning/25 motion-sub"
          }`}
        >
          {t("market_studio_publish")}
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} w-full sm:w-auto rounded-[var(--radius-sm)] bg-gradient-to-r from-warning/90 via-warning to-warning/90 px-5 py-2.5 text-small font-semibold text-white shadow-[0_0_20px_-6px_rgba(245,158,11,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {saving ? t("market_acquisitionStudio_saving") : t("market_acquisitionStudio_save_draft")}
        </button>
      </div>
    </div>
  );
}
