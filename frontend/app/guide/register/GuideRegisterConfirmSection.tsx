"use client";



import Link from "next/link";

import AuthL5Checkbox from "@/components/auth/AuthL5Checkbox";

import type { GuideRegisterFieldKey } from "@/lib/guide/guideRegisterValidation";

import { countryIsoToZh } from "@/lib/guide/guideRegisterGeo";

import { COUNTRY_OPTIONS } from "./constants";

import { guideRegFocusRing, guideRegLink } from "./guideRegisterUiClasses";

import { TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";



function maskPassport(id: string): string {

  const t = id.trim();

  if (t.length <= 4) return "••••";

  return `${t.slice(0, 2)}••••${t.slice(-2)}`;

}



export default function GuideRegisterConfirmSection({

  t,

  agreeId,

  fieldError,

  walletAddress,

  realName,

  idNumber,

  city,

  countryCode,

  languages,

  serviceTypes,

  bio,

  idPhotoFile,

  pendingIdPhoto,

  languageCertFile,

  pendingLangCert,

  agreePrivacy,

  setAgreePrivacy,

  loading,

}: {

  t: (key: string) => string;

  agreeId: string;

  fieldError: GuideRegisterFieldKey | null;

  walletAddress: string;

  realName: string;

  idNumber: string;

  city: string;

  countryCode: string;

  languages: string;

  serviceTypes: string;

  bio: string;

  idPhotoFile: File | null;

  pendingIdPhoto: string | null;

  languageCertFile: File | null;

  pendingLangCert: string | null;

  agreePrivacy: boolean;

  setAgreePrivacy: (v: boolean) => void;

  loading: boolean;

}) {

  const countryOpt = COUNTRY_OPTIONS.find((c) => c.value === countryCode);

  const countryLabel = countryOpt ? t(countryOpt.labelKey) : countryIsoToZh(countryCode) ?? countryCode;

  const passportFile = idPhotoFile?.name ?? pendingIdPhoto ?? t("guideRegister_summaryFileMissing");

  const langFile = languageCertFile?.name ?? pendingLangCert;



  return (

    <section className="flex flex-col gap-4" aria-labelledby="guide-reg-step3-title">

      <h2 id="guide-reg-step3-title" className={TT_GUIDE_REGISTER_L5.didSectionTitle}>

        {t("guideRegister_step3Title")}

      </h2>

      <p className="text-meta text-slate-300/95">{t("guideRegister_step3Lead")}</p>



      <dl className="rounded-xl border border-ref-sun/18 bg-ref-sun/[0.04] p-4 text-meta text-slate-300/95 space-y-2">

        <div>

          <dt className="text-slate-400">{t("guideRegister_summaryWallet")}</dt>

          <dd className="font-mono text-ref-sun/90 break-all">{walletAddress.trim()}</dd>

        </div>

        <div>

          <dt className="text-slate-400">{t("guideRegister_realName")}</dt>

          <dd>{realName.trim()}</dd>

        </div>

        <div>

          <dt className="text-slate-400">{t("guideRegister_passportNumber")}</dt>

          <dd>{maskPassport(idNumber)}</dd>

        </div>

        <div>

          <dt className="text-slate-400">{t("guideRegister_passportPhoto")}</dt>

          <dd>{passportFile}</dd>

        </div>

        {langFile ? (

          <div>

            <dt className="text-slate-400">{t("guideRegister_languageCert")}</dt>

            <dd>{langFile}</dd>

          </div>

        ) : null}

        <div>

          <dt className="text-slate-400">{t("guideRegister_country")}</dt>

          <dd>

            {countryLabel} · {city.trim()}

          </dd>

        </div>

        <div>

          <dt className="text-slate-400">{t("guideRegister_languages")}</dt>

          <dd>{languages.trim()}</dd>

        </div>

        <div>

          <dt className="text-slate-400">{t("guideRegister_serviceTypes")}</dt>

          <dd>{serviceTypes.trim()}</dd>

        </div>

        {bio.trim() ? (

          <div>

            <dt className="text-slate-400">{t("guideRegister_bio")}</dt>

            <dd>{bio.trim()}</dd>

          </div>

        ) : null}

      </dl>



      <div className="rounded-xl border border-ref-sun/12 bg-ref-sun/[0.03] p-3 text-meta text-slate-400/95 space-y-2">

        <p>{t("guideRegister_dualPathNote")}</p>

        <p>{t("guideRegister_onboardingVsGuideNote")}</p>

      </div>



      <ul className="list-disc space-y-1 pl-5 text-meta text-slate-300/95">

        <li>{t("guideRegister_reviewWallet")}</li>

        <li>{t("guideRegister_reviewCountry")}</li>

        <li>{t("guideRegister_reviewStaking")}</li>

      </ul>



      <div
        className={fieldError === "agree" ? "rounded-lg ring-1 ring-ref-coral/40 p-1" : undefined}
        data-tt-guide-register-agree-wrap="1"
      >

        <AuthL5Checkbox

          id={agreeId}

          checked={agreePrivacy}

          onChange={setAgreePrivacy}

          disabled={loading}

          asRow

          label={

            <>

              {t("guideRegister_agreePrivacyBefore")}

              <Link href="/terms" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>

                {t("guideRegister_agreePrivacyTerms")}

              </Link>

              {t("guideRegister_agreePrivacyBetween")}

              <Link href="/privacy" className={`${touchTargetLink44Classes} ${guideRegLink} ${guideRegFocusRing}`}>

                {t("guideRegister_agreePrivacyPrivacy")}

              </Link>

              {t("guideRegister_agreePrivacyAfter")}

            </>

          }

        />

      </div>

    </section>

  );

}


