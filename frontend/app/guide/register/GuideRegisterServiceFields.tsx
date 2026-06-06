"use client";

import { useMemo } from "react";
import { COUNTRY_OPTIONS } from "./constants";
import {
  cityOptionsForCountryIso,
  languageOptionsForCountryIso,
  parseCommaList,
  SERVICE_TYPE_OPTIONS,
  toggleCommaListValue,
} from "@/lib/guide/guideRegisterGeo";
import GuideRegisterChipGroup from "./GuideRegisterChipGroup";
import GuideRegisterInlineFieldError from "./GuideRegisterInlineFieldError";
import { guideRegFieldClass, guideRegFocusRing, guideRegLabel, guideRegTextarea } from "./guideRegisterUiClasses";
import type { GuideRegisterFieldKey } from "@/lib/guide/guideRegisterValidation";
import { TT_GUIDE_REGISTER_L5 } from "@/lib/guide/guideRegisterL5";

export default function GuideRegisterServiceFields({
  t,
  fieldError,
  fieldInlineError,
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
  clearSubmitError,
}: {
  t: (key: string) => string;
  fieldError: GuideRegisterFieldKey | null;
  fieldInlineError: (field: GuideRegisterFieldKey) => string | null;
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
  clearSubmitError: () => void;
}) {
  const cityOptions = useMemo(() => cityOptionsForCountryIso(countryCode), [countryCode]);
  const langOptions = useMemo(() => languageOptionsForCountryIso(countryCode), [countryCode]);
  const langSelected = useMemo(() => new Set(parseCommaList(languages)), [languages]);
  const serviceSelected = useMemo(() => new Set(parseCommaList(serviceTypes)), [serviceTypes]);

  return (
    <section className={TT_GUIDE_REGISTER_L5.formSection} aria-labelledby="guide-reg-step2-title">
      <h2 id="guide-reg-step2-title" className={TT_GUIDE_REGISTER_L5.didSectionTitle}>
        {t("guideRegister_step2Title")}
      </h2>
      <p className="text-meta text-slate-300/95">{t("guideRegister_step2Lead")}</p>

      <div className="flex flex-col gap-2">
        <label className={guideRegLabel} htmlFor="guide-reg-country">
          {t("guideRegister_country")} <span className="text-ref-coral">*</span>
        </label>
        <select
          id="guide-reg-country"
          value={countryCode}
          required
          onChange={(e) => {
            setCountryCode(e.target.value);
            setCity("");
            setLanguages("");
            clearSubmitError();
          }}
          className={guideRegFieldClass(fieldError === "country")}
          aria-invalid={fieldError === "country" || undefined}
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value || "empty"} value={c.value}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>
        <GuideRegisterInlineFieldError message={fieldInlineError("country")} />
      </div>

      <div className="flex flex-col gap-2">
        <label className={guideRegLabel} htmlFor="guide-reg-city">
          {t("guideRegister_city")} <span className="text-ref-coral">*</span>
        </label>
        {cityOptions.length > 0 ? (
          <select
            id="guide-reg-city"
            value={city}
            required
            disabled={!countryCode}
            onChange={(e) => {
              setCity(e.target.value);
              clearSubmitError();
            }}
            className={guideRegFieldClass(fieldError === "city")}
            aria-invalid={fieldError === "city" || undefined}
          >
            <option value="">{t("guideRegister_pleaseSelectCity")}</option>
            {cityOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="guide-reg-city"
            type="text"
            value={city}
            required
            disabled={!countryCode}
            onChange={(e) => {
              setCity(e.target.value);
              clearSubmitError();
            }}
            className={guideRegFieldClass(fieldError === "city")}
            aria-invalid={fieldError === "city" || undefined}
            placeholder={t("guideRegister_placeholderCity")}
          />
        )}
        <GuideRegisterInlineFieldError message={fieldInlineError("city")} />
      </div>

      {countryCode ? (
        <>
          <GuideRegisterChipGroup
            label={t("guideRegister_languages")}
            options={langOptions}
            selected={langSelected}
            onToggle={(v) => {
              setLanguages(toggleCommaListValue(languages, v));
              clearSubmitError();
            }}
            t={t}
          />
          <GuideRegisterInlineFieldError message={fieldInlineError("languages")} />
          <GuideRegisterChipGroup
            label={t("guideRegister_serviceTypes")}
            options={SERVICE_TYPE_OPTIONS}
            selected={serviceSelected}
            onToggle={(v) => {
              setServiceTypes(toggleCommaListValue(serviceTypes, v));
              clearSubmitError();
            }}
            t={t}
          />
          <GuideRegisterInlineFieldError message={fieldInlineError("serviceTypes")} />
        </>
      ) : (
        <p className="text-meta text-slate-400">{t("guideRegister_selectCountryFirst")}</p>
      )}

      <div className="flex flex-col gap-2">
        <label className={guideRegLabel} htmlFor="guide-reg-bio">
          {t("guideRegister_bio")}
        </label>
        <textarea
          id="guide-reg-bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            clearSubmitError();
          }}
          rows={3}
          className={guideRegTextarea}
          placeholder={t("guideRegister_placeholderBio")}
        />
      </div>
    </section>
  );
}
