"use client";

import Link from "next/link";
import { ACCEPT_ID, ACCEPT_LANG } from "./constants";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import AuthL5Checkbox from "@/components/auth/AuthL5Checkbox";

type RegisterGuideFormDidProfileSectionProps = {
  t: (key: string) => string;
  labelClass: string;
  inputClass: string;
  textareaClass: string;
  fieldWrapClass: string;
  footerLinkClass: string;
  idNumberInputId: string;
  idPhotoInputId: string;
  languageCertInputId: string;
  realNameInputId: string;
  walletAddressInputId: string;
  cityInputId: string;
  countryCodeInputId: string;
  languagesInputId: string;
  serviceTypesInputId: string;
  bioInputId: string;
  agreePrivacyInputId: string;
  idNumber: string;
  setIdNumber: (v: string) => void;
  idPhotoFile: File | null;
  setIdPhotoFile: (f: File | null) => void;
  languageCertFile: File | null;
  setLanguageCertFile: (f: File | null) => void;
  realName: string;
  setRealName: (v: string) => void;
  walletAddress: string;
  setWalletAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  languages: string;
  setLanguages: (v: string) => void;
  serviceTypes: string;
  setServiceTypes: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  agreePrivacy: boolean;
  setAgreePrivacy: (v: boolean) => void;
};

const fileInputClass = TT_AUTH_L5_FORM.fileInput;

export default function RegisterGuideFormDidProfileSection({
  t,
  labelClass,
  inputClass,
  textareaClass,
  fieldWrapClass,
  footerLinkClass,
  idNumberInputId,
  idPhotoInputId,
  languageCertInputId,
  realNameInputId,
  walletAddressInputId,
  cityInputId,
  countryCodeInputId,
  languagesInputId,
  serviceTypesInputId,
  bioInputId,
  agreePrivacyInputId,
  idNumber,
  setIdNumber,
  idPhotoFile,
  setIdPhotoFile,
  languageCertFile,
  setLanguageCertFile,
  realName,
  setRealName,
  walletAddress,
  setWalletAddress,
  city,
  setCity,
  countryCode,
  setCountryCode,
  languages,
  setLanguages,
  serviceTypes,
  setServiceTypes,
  bio,
  setBio,
  agreePrivacy,
  setAgreePrivacy,
}: RegisterGuideFormDidProfileSectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className={TT_AUTH_L5_FORM.sectionTitle}>{t("auth_register_didSection")}</h2>
      <div className={fieldWrapClass}>
        <label htmlFor={idNumberInputId} className={labelClass}>
          {t("auth_register_idNumber")}
        </label>
        <input
          id={idNumberInputId}
          type="text"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          required
          className={inputClass}
          placeholder={t("auth_register_idNumber")}
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={idPhotoInputId} className={labelClass}>
          {t("auth_register_idPhoto")}
        </label>
        <input
          id={idPhotoInputId}
          type="file"
          accept={ACCEPT_ID}
          onChange={(e) => setIdPhotoFile(e.target.files?.[0] ?? null)}
          className={fileInputClass}
        />
        <p className="text-meta text-ink-500 mt-0.5">{t("auth_register_idPhotoHint")}</p>
        {idPhotoFile && <p className="text-meta text-ref-sun/90 mt-0.5">{idPhotoFile.name}</p>}
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={languageCertInputId} className={labelClass}>
          {t("auth_register_languageCert")}
        </label>
        <input
          id={languageCertInputId}
          type="file"
          accept={ACCEPT_LANG}
          onChange={(e) => setLanguageCertFile(e.target.files?.[0] ?? null)}
          className={fileInputClass}
        />
        <p className="text-meta text-ink-500 mt-0.5">{t("auth_register_languageCertOptional")}</p>
        {languageCertFile && <p className="text-meta text-ref-sun/90 mt-0.5">{languageCertFile.name}</p>}
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={realNameInputId} className={labelClass}>
          {t("auth_register_realName")}
        </label>
        <input
          id={realNameInputId}
          type="text"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          required
          className={inputClass}
          autoComplete="name"
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={walletAddressInputId} className={labelClass}>
          {t("auth_register_walletAddress")}
        </label>
        <input
          id={walletAddressInputId}
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          required
          className={inputClass}
          placeholder={t("auth_register_placeholder_wallet")}
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={cityInputId} className={labelClass}>
          {t("auth_register_city")}
        </label>
        <input
          id={cityInputId}
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className={inputClass}
          autoComplete="address-level2"
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={countryCodeInputId} className={labelClass}>
          {t("auth_register_countryCode")}
        </label>
        <input
          id={countryCodeInputId}
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className={inputClass}
          placeholder={t("auth_register_placeholder_countryCode")}
          autoComplete="country"
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={languagesInputId} className={labelClass}>
          {t("auth_register_languages")}
        </label>
        <input
          id={languagesInputId}
          type="text"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          className={inputClass}
          placeholder={t("auth_register_placeholder_languages")}
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={serviceTypesInputId} className={labelClass}>
          {t("auth_register_serviceTypes")}
        </label>
        <input
          id={serviceTypesInputId}
          type="text"
          value={serviceTypes}
          onChange={(e) => setServiceTypes(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={bioInputId} className={labelClass}>
          {t("auth_register_bio")}
        </label>
        <textarea id={bioInputId} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={textareaClass} />
      </div>
      <AuthL5Checkbox
        id={agreePrivacyInputId}
        checked={agreePrivacy}
        onChange={setAgreePrivacy}
        asRow
        className={`${TT_AUTH_L5_FORM.rememberRow} items-start gap-2.5 mb-0 min-h-[44px]`}
        labelClassName={`${TT_AUTH_L5_FORM.agreeText} pt-0.5`}
        label={
          <>
            {t("auth_register_agreePrefix")}
            <Link href="/terms" className={footerLinkClass}>
              {t("auth_register_agreeTerms")}
            </Link>
            {t("auth_register_agreeAnd")}
            <Link href="/privacy" className={footerLinkClass}>
              {t("auth_register_agreePrivacyLink")}
            </Link>
            {t("auth_register_agreeSuffix")}
          </>
        }
      />
    </section>
  );
}
