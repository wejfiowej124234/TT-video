"use client";

import {
  guideRegBanner,
  guideRegCallout,
  guideRegCalloutStrong,
} from "./guideRegisterUiClasses";
import { TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";

export default function GuideRegisterIntroBanners({
  pendingIdPhoto,
  pendingLangCert,
  sessionDraftRestored,
  t,
  compact = false,
}: {
  pendingIdPhoto: string | null;
  pendingLangCert: string | null;
  sessionDraftRestored: boolean;
  t: (key: string) => string;
  compact?: boolean;
}) {
  return (
    <>
      <p className={compact ? "text-meta text-slate-300/95" : TT_GUIDE_REGISTER_L5.intro}>
        {pendingIdPhoto || pendingLangCert ? t("guideRegister_introFromRegister") : t("guideRegister_introDirect")}
      </p>
      {sessionDraftRestored ? (
        <p className={`${guideRegBanner} ${compact ? "" : "mb-4"}`} role="note">
          {t("guideRegister_draftLocalOnly")}
        </p>
      ) : null}
      {!compact ? (
        <details className={`mb-4 ${guideRegCallout}`}>
          <summary className={`cursor-pointer list-none ${guideRegCalloutStrong}`}>
            {t("guideRegister_didAboutTitle")}
          </summary>
          <p className="mt-2 text-meta text-slate-300/95">{t("guideRegister_didAboutDesc")}</p>
        </details>
      ) : null}
      {(pendingIdPhoto || pendingLangCert) && (
        <p className={`mb-4 ${guideRegBanner}`}>
          {t("guideRegister_uploaded")}
          {pendingIdPhoto && (
            <>
              {t("guideRegister_uploadedPassport")}「{pendingIdPhoto}」
            </>
          )}
          {pendingIdPhoto && pendingLangCert && "；"}
          {pendingLangCert && (
            <>
              {t("guideRegister_uploadedLangCert")}「{pendingLangCert}」
            </>
          )}
          {t("guideRegister_willSubmit")}
        </p>
      )}
    </>
  );
}
