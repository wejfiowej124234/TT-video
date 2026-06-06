"use client";

import type { RefObject } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import {
  MeSettingsExtensionIngressBlock,
  meSettingsExtensionIngressDataAttrs,
} from "@/components/me/MeSettingsExtensionIngressBlock";
import { useMeSettingsExtensionFromUrl } from "@/lib/me/useMeSettingsExtensionFromUrl";
import { providerRegisterL5MainDataAttrs, TT_PROVIDER_REGISTER_L5 } from "@/lib/provider/providerRegisterL5";
import { providerRejectionCodeLabel } from "@/lib/provider/providerRejectionCodes";
import { guideRegFocusRing, guideRegPrimaryCta } from "@/app/guide/register/guideRegisterUiClasses";

export default function ProviderRegisterRejectedGate({
  successFocusRef,
  t,
  rejectionCodes,
  rejectionMessage,
  onReapply,
}: {
  successFocusRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  rejectionCodes: string[];
  rejectionMessage: string | null;
  onReapply: () => void;
}) {
  const fromSettings = useMeSettingsExtensionFromUrl();

  return (
    <main
      className={TT_PROVIDER_REGISTER_L5.pageShell}
      aria-label={t("providerRegister_rejectedTitle")}
      {...providerRegisterL5MainDataAttrs()}
      {...meSettingsExtensionIngressDataAttrs(fromSettings, "data-tt-provider-register-from-settings")}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_PROVIDER_REGISTER_L5.pageColumn} flex flex-1 flex-col items-center justify-center gap-8`}>
        <MeSettingsExtensionIngressBlock
          fromSettings={fromSettings}
          noticeKey="me_settings_provider_register_from_settings_notice"
          t={t}
        />
        <div className={TT_PROVIDER_REGISTER_L5.statusCardWrap}>
          <AuthL5Card>
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-h4 font-semibold text-slate-100" role="status" aria-live="polite">
              {t("providerRegister_rejectedTitle")}
            </p>
            <p className="mt-2 text-small text-slate-300/95">{t("providerRegister_rejectedDesc")}</p>
            {rejectionCodes.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {rejectionCodes.map((c) => (
                  <li key={c}>
                    <span
                      className="inline-block rounded-md border border-ref-coral/40 bg-ref-coral/10 px-2 py-0.5 text-meta text-ref-coral/95"
                      title={c}
                    >
                      {providerRejectionCodeLabel(t, c)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {rejectionMessage ? (
              <p className="mt-3 text-meta text-slate-300/95">
                <span className="text-slate-400">{t("providerRegister_rejectionMessageLabel")}</span>{" "}
                {rejectionMessage}
              </p>
            ) : null}
            <button type="button" onClick={onReapply} className={`mt-6 w-full ${guideRegPrimaryCta} ${guideRegFocusRing}`}>
              {t("providerRegister_rejectedReapply")}
            </button>
            <p className="mt-3 text-meta text-slate-400/95">{t("providerRegister_rejectedReapplyHint")}</p>
          </AuthL5Card>
        </div>
        <AuthL5CrossNavFooter hideFeeRouterLinks className={TT_PROVIDER_REGISTER_L5.footerLinks} />
      </div>
    </main>
  );
}
