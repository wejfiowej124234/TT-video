"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { DisputesL5FooterLinks } from "@/components/disputes/DisputesL5FooterLinks";
import { DisputesL5PageShell } from "@/components/disputes/DisputesL5PageShell";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import type { DisputeDetailPageModel } from "./useDisputeDetailPage";

type Props = Pick<DisputeDetailPageModel, "t" | "error" | "onDisputeLoadRetry">;

export function DisputeDetailPageErrorView({ t, error, onDisputeLoadRetry }: Props) {
  return (
    <DisputesL5PageShell t={t} ariaLabel={t("dispute_detailTitle")} variant="detail">
      <div className="space-y-4" data-tt-dispute-detail-page="1" role="alert">
        <h1 className="sr-only">{t("dispute_detailTitle")}</h1>
        <ApiErrorAlert message={error ?? ""} />
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onDisputeLoadRetry();
          }}
        >
          <button
            type="submit"
            aria-label={t("common_retry")}
            className={`${TT_ME_SETTINGS_L5.logoutBtn} min-h-[44px] border-ref-sun/35 bg-ref-sun/10 text-ref-sun hover:bg-ref-sun/15`}
          >
            {t("common_retry")}
          </button>
        </form>
        <DisputesL5FooterLinks t={t} showList />
      </div>
    </DisputesL5PageShell>
  );
}
