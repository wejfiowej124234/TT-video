"use client";

import Link from "next/link";
import { hasCommunityPublishAuth } from "@/lib/marketProductCommunityPublish";
import { ACTION_GATE_KEYS } from "@/lib/publishActionBlockedKeys";
import { TT_MARKETING_BTN_MARKET_PRIMARY, TT_MARKETING_FOCUS_RING_DARK_SURFACE, TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

const D = TT_MARKETING_MARKET_DARK_PATH;
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
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

export function MerchantShowcaseStudioModalFooter({
  t,
  canPublish,
  saving,
  publishBlockedKeys,
  requestClose,
  runPersistAndSync,
}: Props) {
  return (
    <div className={D.studioFooter}>
      {!canPublish ? (
        <>
          {!hasCommunityPublishAuth() ? (
            <p className={`border-b ${D.filterBarGlassDivider} px-6 py-2 text-[0.7rem] text-slate-300`} role="status">
              {t("market_studio_publish_footer_strip_no_session")}
            </p>
          ) : (
            <p className={`border-b ${D.filterBarGlassDivider} px-6 py-2 text-[0.7rem] text-slate-300`} role="status">
              {t("market_studio_publish_footer_strip_form")}
            </p>
          )}
          <p
            className={`border-b ${D.filterBarGlassDivider} px-6 py-2 text-small text-warning`}
            role="alert"
            aria-live="assertive"
            data-tt-publish-blocked-alert="1"
          >
            {t(publishBlockedKeys[0] ?? "market_studio_publish_form_incomplete_hint")}
          </p>
          <ActionGateChecklist variant="marketFooter" itemKeys={publishBlockedKeys} t={t} />
          {publishBlockedKeys.includes(ACTION_GATE_KEYS.merchantRole) ||
          publishBlockedKeys.includes(ACTION_GATE_KEYS.merchantApplication) ? (
            <p className={`border-b ${D.filterBarGlassDivider} px-6 py-2 text-[0.7rem] text-slate-300`}>
              <Link
                href="/provider/register"
                className={`${touchTargetLink44Classes} ${travelFocusRingOffset2Classes} text-ref-sun underline underline-offset-2`}
              >
                {t("market_provider_onboarding_link")}
              </Link>
            </p>
          ) : null}
          {publishBlockedKeys.includes(ACTION_GATE_KEYS.merchantEntitlementPaid) ? (
            <p className={`border-b ${D.filterBarGlassDivider} px-6 py-2 text-[0.7rem] text-slate-300`}>
              <Link
                href="/me/onboarding?role=provider"
                className={`${touchTargetLink44Classes} ${travelFocusRingOffset2Classes} text-ref-sun underline underline-offset-2`}
              >
                {t("me_onboarding_entitlementsEmptyCta")}
              </Link>
            </p>
          ) : null}
        </>
      ) : null}
      <div className="flex flex-col-reverse gap-2 px-6 py-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={requestClose}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} ${D.studioFooterGhost}`}
        >
          {t("market_merchantStudio_cancel")}
        </button>
        <button
          type="button"
          disabled={saving || !canPublish}
          title={
            saving
              ? t("market_merchantStudio_saving")
              : !canPublish
                ? t(publishBlockedKeys[0] ?? "market_studio_publish_form_incomplete_hint")
                : t("market_studio_publish_tooltip")
          }
          onClick={() => void runPersistAndSync()}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_FOCUS_RING_DARK_SURFACE} w-full sm:w-auto rounded-[var(--radius-sm)] border px-4 py-2.5 text-small font-medium ${
            saving || !canPublish
              ? D.studioPublishDisabled
              : "border-ref-sun/45 bg-ref-sun/14 text-slate-100 hover:bg-ref-sun/22 motion-sub"
          }`}
        >
          {t("market_studio_publish")}
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {saving ? t("market_merchantStudio_saving") : t("market_merchantStudio_save_draft")}
        </button>
      </div>
    </div>
  );
}
