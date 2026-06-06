"use client";

import type { RefObject } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { guideRegisterL5MainDataAttrs, TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";
import { guideRejectionCodeLabel } from "@/lib/guide/guideRejectionCodes";
import { guideRegFocusRing, guideRegPrimaryCta } from "./guideRegisterUiClasses";

export default function GuideRegisterRejectedGate({
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
  return (
    <main
      className={TT_GUIDE_REGISTER_L5.pageShell}
      aria-label={t("guideRegister_rejectedTitle")}
      {...guideRegisterL5MainDataAttrs()}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_GUIDE_REGISTER_L5.pageColumn} flex flex-1 flex-col items-center justify-center gap-8`}>
        <div className={TT_GUIDE_REGISTER_L5.statusCardWrap}>
          <AuthL5Card surface="guide_register_rejected">
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-h4 font-semibold text-slate-100" role="status" aria-live="polite">
              {t("guideRegister_rejectedTitle")}
            </p>
            <p className="mt-2 text-small text-slate-300/95">{t("guideRegister_rejectedDesc")}</p>
            {rejectionCodes.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {rejectionCodes.map((c) => (
                  <li key={c}>
                    <span
                      className="inline-block rounded-md border border-ref-coral/40 bg-ref-coral/10 px-2 py-0.5 text-meta text-ref-coral/95"
                      title={c}
                    >
                      {guideRejectionCodeLabel(t, c)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {rejectionMessage ? (
              <p className="mt-3 text-meta text-slate-300/95">
                <span className="text-slate-400">{t("guide_registration_banner_message")}</span> {rejectionMessage}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onReapply}
              className={`mt-6 w-full ${guideRegPrimaryCta} ${guideRegFocusRing}`}
            >
              {t("guideRegister_rejectedReapply")}
            </button>
            <p className="mt-3 text-meta text-slate-400/95">{t("guideRegister_rejectedReapplyHint")}</p>
          </AuthL5Card>
        </div>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
