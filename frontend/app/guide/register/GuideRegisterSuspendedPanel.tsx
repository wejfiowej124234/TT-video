"use client";

import Link from "next/link";
import type { RefObject } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { guideRegisterL5MainDataAttrs, TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";
import { guideRegLink, guideRegFocusRing } from "./guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export default function GuideRegisterSuspendedPanel({
  successFocusRef,
  t,
}: {
  successFocusRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}) {
  return (
    <main
      className={TT_GUIDE_REGISTER_L5.pageShell}
      aria-label={t("guideRegister_suspendedTitle")}
      {...guideRegisterL5MainDataAttrs()}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_GUIDE_REGISTER_L5.pageColumn} flex flex-1 flex-col items-center justify-center gap-8`}>
        <div className={TT_GUIDE_REGISTER_L5.statusCardWrap}>
          <AuthL5Card surface="guide_register_suspended">
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-h4 font-semibold text-slate-100" role="status" aria-live="polite">
              {t("guideRegister_suspendedTitle")}
            </p>
            <p className="mt-2 text-meta text-slate-300/95">{t("guideRegister_suspendedDesc")}</p>
            <p className="mt-4">
              <Link href="/me/identities" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
                {t("header_multiIdentity")}
              </Link>
            </p>
          </AuthL5Card>
        </div>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
