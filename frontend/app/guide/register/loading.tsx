"use client";

import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { useTranslation } from "@/components/LocaleProvider";
import { guideRegisterL5MainDataAttrs, TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export default function GuideRegisterLoading() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_GUIDE_REGISTER_L5.pageShell}
      role="status"
      aria-label={t("guideRegister_title")}
      aria-busy="true"
      {...guideRegisterL5MainDataAttrs()}
    >
      <AuthL5PageBackdrop />
      <div className={TT_GUIDE_REGISTER_L5.pageColumn} aria-hidden>
        <div className={`${TT_AUTH_L5_FORM.loadingSkeletonCard} w-full max-w-lg p-7 space-y-4`}>
          <div className={`h-9 w-48 max-w-full ${TT_AUTH_L5_FORM.loadingPulse}`} />
          <div className={`h-4 w-full max-w-md ${TT_AUTH_L5_FORM.loadingPulse}`} />
          <div className={`min-h-[120px] ${TT_AUTH_L5_FORM.loadingPulse}`} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`min-h-[44px] ${TT_AUTH_L5_FORM.loadingPulse}`} />
          ))}
          <div className={`min-h-[48px] ${TT_AUTH_L5_FORM.loadingPulse}`} />
        </div>
      </div>
    </main>
  );
}
