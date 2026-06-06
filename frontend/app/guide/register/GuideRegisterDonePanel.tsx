"use client";

import Link from "next/link";
import type { RefObject } from "react";
import AuthL5Card from "@/components/auth/AuthL5Card";
import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { guideRegisterL5MainDataAttrs, TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";
import { guideRegLink, guideRegFocusRing } from "./guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export default function GuideRegisterDonePanel({
  successFocusRef,
  t,
}: {
  successFocusRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}) {
  return (
    <main
      className={TT_GUIDE_REGISTER_L5.pageShell}
      aria-label={t("guideRegister_doneMessage")}
      {...guideRegisterL5MainDataAttrs()}
    >
      <AuthL5PageBackdrop />
      <div className={`${TT_GUIDE_REGISTER_L5.pageColumn} flex flex-1 flex-col items-center justify-center gap-8`}>
        <div className={TT_GUIDE_REGISTER_L5.statusCardWrap}>
          <AuthL5Card surface="guide_register_done">
            <div ref={successFocusRef} tabIndex={-1} className="outline-none" aria-hidden="true" />
            <p className="text-small font-semibold text-ref-sun" role="status" aria-live="polite">
              {t("guideRegister_doneMessage")}
            </p>
            <p className="mt-2 text-meta text-slate-300/95">{t("guideRegister_doneTimeline")}</p>
            <p className="mt-2 text-meta text-slate-400/95">{t("guideRegister_doneStakingNote")}</p>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/guide" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
                {t("guideRegister_doneGuideWorkbench")}
              </Link>
              <Link href="/guides" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
                {t("guideRegister_doneGuideList")}
              </Link>
              <Link href="/me/identities" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
                {t("header_multiIdentity")}
              </Link>
              <Link href="/me/settings/profile" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>
                {t("guideRegister_doneMe")}
              </Link>
            </p>
          </AuthL5Card>
        </div>
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
