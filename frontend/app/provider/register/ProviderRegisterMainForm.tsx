"use client";

import { useMemo, type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import AuthL5Checkbox from "@/components/auth/AuthL5Checkbox";
import GuideRegisterFileField from "@/app/guide/register/GuideRegisterFileField";
import GuideRegisterWalletStepFlow from "@/app/guide/register/GuideRegisterWalletStepFlow";
import GuideRegisterInlineFieldError from "@/app/guide/register/GuideRegisterInlineFieldError";
import { useGuideRegisterCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import { cityOptionsForCountryIso } from "@/lib/guide/guideRegisterGeo";
import { guideRegFieldClass, guideRegFocusRing, guideRegLabel, guideRegPrimaryCta, guideRegSecondaryBtn } from "@/app/guide/register/guideRegisterUiClasses";
import { kybRuleForCountry, PROVIDER_ENTITY_COMPANY, PROVIDER_ENTITY_INDIVIDUAL } from "@/lib/provider/providerKybRules";
import { TT_PROVIDER_REGISTER_L5 } from "@/lib/provider/providerRegisterL5";
import type { ProviderRegisterFieldKey } from "@/lib/provider/providerRegisterValidation";
import type { useProviderRegisterPage } from "./useProviderRegisterPage";

type Props = ReturnType<typeof useProviderRegisterPage>;

export function ProviderRegisterMainForm(props: Props) {
  const {
    t,
    step,
    goToStep,
    legalName,
    setLegalName,
    entityType,
    setEntityType,
    registrationNumber,
    setRegistrationNumber,
    taxId,
    setTaxId,
    countryCode,
    setCountryCode,
    city,
    setCity,
    registeredAddressLine1,
    setRegisteredAddressLine1,
    registeredAddressLine2,
    setRegisteredAddressLine2,
    registeredPostalCode,
    setRegisteredPostalCode,
    operatingSameAsRegistered,
    setOperatingSameAsRegistered,
    operatingAddressLine1,
    setOperatingAddressLine1,
    operatingAddressLine2,
    setOperatingAddressLine2,
    operatingCity,
    setOperatingCity,
    operatingPostalCode,
    setOperatingPostalCode,
    contactName,
    setContactName,
    contactPhone,
    setContactPhone,
    contactEmail,
    setContactEmail,
    shopName,
    setShopName,
    categories,
    setCategories,
    bio,
    setBio,
    walletAddress,
    setWalletAddress,
    businessLicenseFile,
    setBusinessLicenseFile,
    travelAgencyPermitFile,
    setTravelAgencyPermitFile,
    insuranceFile,
    setInsuranceFile,
    legalRepresentativeIdFile,
    setLegalRepresentativeIdFile,
    beneficialOwnerFullName,
    setBeneficialOwnerFullName,
    beneficialOwnerIdType,
    setBeneficialOwnerIdType,
    beneficialOwnerIdNumber,
    setBeneficialOwnerIdNumber,
    beneficialOwnerIdDocFile,
    setBeneficialOwnerIdDocFile,
    agreePrivacy,
    setAgreePrivacy,
    loading,
    uploadPhase,
    error,
    fieldInlineError,
    isLoggedIn,
    walletVerify,
    walletInputId,
    walletErrorId,
    isConnected,
    connectedAddress,
    walletMatchConnected,
    clearSubmitError,
    handleUseConnectedWallet,
    handleNextFromStep1,
    handleNextFromStep2,
    handleSubmit,
  } = props;

  const countryOptions = useGuideRegisterCountryOptions();
  const cityOptions = useMemo(() => cityOptionsForCountryIso(countryCode), [countryCode]);
  const requiresTravelPermit = useMemo(
    () => (countryCode ? kybRuleForCountry(countryCode).requiresTravelAgencyPermit : false),
    [countryCode],
  );
  const isCompany = entityType === PROVIDER_ENTITY_COMPANY;
  const isIndividual = entityType === PROVIDER_ENTITY_INDIVIDUAL;
  const inputClass = `w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ref-sun/20 bg-black/30 px-3 text-small text-ink-100 ${guideRegFocusRing}`;

  const onForm = step === 1 ? handleNextFromStep1 : step === 2 ? handleNextFromStep2 : handleSubmit;
  const submitLabel =
    step === 3
      ? uploadPhase === "uploading"
        ? t("providerRegister_uploading")
        : uploadPhase === "submitting"
          ? t("providerRegister_submitting")
          : t("providerRegister_submit")
      : t("providerRegister_next");

  return (
    <form onSubmit={onForm} className={TT_PROVIDER_REGISTER_L5.formSection} noValidate>
      <p className="text-meta text-ink-400" aria-live="polite">
        {t("providerRegister_stepIndicator").replace("{step}", String(step))}
      </p>
      {error ? (
        <div className="mb-4">
          <ApiErrorAlert message={error} tone="dark" />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className={guideRegLabel} htmlFor="provider-legal-name">
              {t("providerRegister_legalName")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-legal-name"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("legalName"))}`}
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("legalName")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-entity-type">
              {t("providerRegister_entityType")} <span className="text-ref-coral">*</span>
            </label>
            <select
              id="provider-entity-type"
              className={`mt-1 ${inputClass}`}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="company">{t("providerRegister_entityCompany")}</option>
              <option value="individual">{t("providerRegister_entityIndividual")}</option>
            </select>
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-reg-number">
              {t("providerRegister_registrationNumber")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-reg-number"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("registrationNumber"))}`}
              value={registrationNumber}
              onChange={(e) => {
                setRegistrationNumber(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("registrationNumber")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-tax-id">
              {t("providerRegister_taxIdOptional")}
            </label>
            <input id="provider-tax-id" className={`mt-1 ${inputClass}`} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <GuideRegisterFileField
            id="provider-business-license"
            label={t("providerRegister_businessLicense")}
            accept="image/*,.pdf"
            required
            file={businessLicenseFile}
            pendingName={null}
            onPick={setBusinessLicenseFile}
            onClear={() => setBusinessLicenseFile(null)}
            invalid={!!fieldInlineError("businessLicense")}
            inlineError={fieldInlineError("businessLicense")}
            t={t}
          />
          <GuideRegisterWalletStepFlow
            t={t}
            walletInputId={walletInputId}
            walletErrorId={walletErrorId}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            clearSubmitError={clearSubmitError}
            isConnected={isConnected}
            connectedAddress={connectedAddress}
            walletMatchConnected={walletMatchConnected}
            copied={false}
            copyWalletBusy={false}
            walletVerified={walletVerify.walletVerified}
            walletVerifying={walletVerify.verifying}
            walletVerifyError={walletVerify.error}
            onWalletVerify={() => void walletVerify.runVerify()}
            onUseConnectedWallet={handleUseConnectedWallet}
            fieldInlineError={fieldInlineError("wallet")}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <label className={guideRegLabel} htmlFor="provider-country">
              {t("providerRegister_country")} <span className="text-ref-coral">*</span>
            </label>
            <select
              id="provider-country"
              className={`mt-1 ${inputClass}`}
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                setCity("");
                clearSubmitError();
              }}
            >
              <option value="">{t("providerRegister_selectCountry")}</option>
              {countryOptions
                .filter((c) => c.value !== "")
                .map((c) => (
                  <option key={c.value} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
            </select>
            <GuideRegisterInlineFieldError message={fieldInlineError("country")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-city">
              {t("providerRegister_city")} <span className="text-ref-coral">*</span>
            </label>
            {cityOptions.length > 0 ? (
              <select
                id="provider-city"
                className={`mt-1 ${inputClass}`}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  clearSubmitError();
                }}
              >
                <option value="">{t("providerRegister_selectCity")}</option>
                {cityOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="provider-city"
                className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("city"))}`}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  clearSubmitError();
                }}
              />
            )}
            <GuideRegisterInlineFieldError message={fieldInlineError("city")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-reg-addr-line1">
              {t("providerRegister_registeredAddressLine1")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-reg-addr-line1"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("registeredAddressLine1"))}`}
              value={registeredAddressLine1}
              onChange={(e) => {
                setRegisteredAddressLine1(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("registeredAddressLine1")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-reg-addr-line2">
              {t("providerRegister_registeredAddressLine2")}
            </label>
            <input
              id="provider-reg-addr-line2"
              className={`mt-1 ${inputClass}`}
              value={registeredAddressLine2}
              onChange={(e) => setRegisteredAddressLine2(e.target.value)}
            />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-reg-postal">
              {t("providerRegister_registeredPostalCode")}
            </label>
            <input
              id="provider-reg-postal"
              className={`mt-1 ${inputClass}`}
              value={registeredPostalCode}
              onChange={(e) => setRegisteredPostalCode(e.target.value)}
            />
          </div>
          {requiresTravelPermit ? (
            <GuideRegisterFileField
              id="provider-travel-agency-permit"
              label={t("providerRegister_travelAgencyPermit")}
              accept="image/*,.pdf"
              required
              file={travelAgencyPermitFile}
              pendingName={null}
              onPick={setTravelAgencyPermitFile}
              onClear={() => setTravelAgencyPermitFile(null)}
              invalid={!!fieldInlineError("travelAgencyPermit")}
              inlineError={fieldInlineError("travelAgencyPermit")}
              t={t}
            />
          ) : null}
          <AuthL5Checkbox
            id="provider-operating-same-as-registered"
            checked={operatingSameAsRegistered}
            onChange={setOperatingSameAsRegistered}
            label={t("providerRegister_operatingSameAsRegistered")}
          />
          {!operatingSameAsRegistered ? (
            <div className="space-y-4 rounded-[var(--radius-sm)] border border-ink-200/20 p-3">
              <div>
                <label className={guideRegLabel} htmlFor="provider-op-addr-line1">
                  {t("providerRegister_operatingAddressLine1")} <span className="text-ref-coral">*</span>
                </label>
                <input
                  id="provider-op-addr-line1"
                  className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("operatingAddressLine1"))}`}
                  value={operatingAddressLine1}
                  onChange={(e) => {
                    setOperatingAddressLine1(e.target.value);
                    clearSubmitError();
                  }}
                />
                <GuideRegisterInlineFieldError message={fieldInlineError("operatingAddressLine1")} />
              </div>
              <div>
                <label className={guideRegLabel} htmlFor="provider-op-city">
                  {t("providerRegister_operatingCity")}
                </label>
                <input
                  id="provider-op-city"
                  className={`mt-1 ${inputClass}`}
                  value={operatingCity}
                  onChange={(e) => setOperatingCity(e.target.value)}
                  placeholder={city}
                />
              </div>
            </div>
          ) : null}
          <div>
            <label className={guideRegLabel} htmlFor="provider-contact-name">
              {t("providerRegister_contactName")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-contact-name"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("contactName"))}`}
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("contactName")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-contact-phone">
              {t("providerRegister_contactPhone")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-contact-phone"
              type="tel"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("contactPhone"))}`}
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("contactPhone")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-contact-email">
              {t("providerRegister_contactEmail")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-contact-email"
              type="email"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("contactEmail"))}`}
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("contactEmail")} />
          </div>
          <button type="button" className={guideRegSecondaryBtn} onClick={() => goToStep(1)}>
            {t("providerRegister_back")}
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div>
            <label className={guideRegLabel} htmlFor="provider-shop-name">
              {t("providerRegister_shopName")} <span className="text-ref-coral">*</span>
            </label>
            <input
              id="provider-shop-name"
              className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("shopName"))}`}
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                clearSubmitError();
              }}
            />
            <GuideRegisterInlineFieldError message={fieldInlineError("shopName")} />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-categories">
              {t("providerRegister_categories")}
            </label>
            <input
              id="provider-categories"
              className={`mt-1 ${inputClass}`}
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder={t("providerRegister_categoriesPlaceholder")}
            />
          </div>
          <div>
            <label className={guideRegLabel} htmlFor="provider-bio">
              {t("providerRegister_bio")}
            </label>
            <textarea
              id="provider-bio"
              className={`mt-1 min-h-[88px] w-full ${inputClass}`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <GuideRegisterFileField
            id="provider-insurance"
            label={t("providerRegister_insuranceOptional")}
            accept="image/*,.pdf"
            file={insuranceFile}
            pendingName={null}
            onPick={setInsuranceFile}
            onClear={() => setInsuranceFile(null)}
            invalid={false}
            inlineError={null}
            t={t}
          />
          {isCompany ? (
            <div className="space-y-4 rounded-[var(--radius-sm)] border border-ink-200/20 p-3">
              <p className="text-small font-medium text-ink-200">{t("providerRegister_beneficialOwnerSection")}</p>
              <div>
                <label className={guideRegLabel} htmlFor="provider-ubo-name">
                  {t("providerRegister_beneficialOwnerName")} <span className="text-ref-coral">*</span>
                </label>
                <input
                  id="provider-ubo-name"
                  className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("beneficialOwnerName"))}`}
                  value={beneficialOwnerFullName}
                  onChange={(e) => {
                    setBeneficialOwnerFullName(e.target.value);
                    clearSubmitError();
                  }}
                />
                <GuideRegisterInlineFieldError message={fieldInlineError("beneficialOwnerName")} />
              </div>
              <div>
                <label className={guideRegLabel} htmlFor="provider-ubo-id-type">
                  {t("providerRegister_beneficialOwnerIdType")}
                </label>
                <select
                  id="provider-ubo-id-type"
                  className={`mt-1 ${inputClass}`}
                  value={beneficialOwnerIdType}
                  onChange={(e) => setBeneficialOwnerIdType(e.target.value)}
                >
                  <option value="passport">{t("providerRegister_beneficialOwnerIdPassport")}</option>
                  <option value="national_id">{t("providerRegister_beneficialOwnerIdNational")}</option>
                </select>
              </div>
              <div>
                <label className={guideRegLabel} htmlFor="provider-ubo-id-number">
                  {t("providerRegister_beneficialOwnerIdNumber")} <span className="text-ref-coral">*</span>
                </label>
                <input
                  id="provider-ubo-id-number"
                  className={`mt-1 ${guideRegFieldClass(!!fieldInlineError("beneficialOwnerId"))}`}
                  value={beneficialOwnerIdNumber}
                  onChange={(e) => {
                    setBeneficialOwnerIdNumber(e.target.value);
                    clearSubmitError();
                  }}
                />
                <GuideRegisterInlineFieldError message={fieldInlineError("beneficialOwnerId")} />
              </div>
              <GuideRegisterFileField
                id="provider-ubo-id-doc"
                label={t("providerRegister_beneficialOwnerIdDoc")}
                accept="image/*,.pdf"
                required
                file={beneficialOwnerIdDocFile}
                pendingName={null}
                onPick={setBeneficialOwnerIdDocFile}
                onClear={() => setBeneficialOwnerIdDocFile(null)}
                invalid={!!fieldInlineError("beneficialOwnerDoc")}
                inlineError={fieldInlineError("beneficialOwnerDoc")}
                t={t}
              />
            </div>
          ) : null}
          {isIndividual ? (
            <GuideRegisterFileField
              id="provider-legal-rep-id"
              label={t("providerRegister_legalRepresentativeId")}
              accept="image/*,.pdf"
              required
              file={legalRepresentativeIdFile}
              pendingName={null}
              onPick={setLegalRepresentativeIdFile}
              onClear={() => setLegalRepresentativeIdFile(null)}
              invalid={!!fieldInlineError("legalRepresentativeId")}
              inlineError={fieldInlineError("legalRepresentativeId")}
              t={t}
            />
          ) : null}
          <p className="text-meta text-ink-500">{t("providerRegister_stakeNote")}</p>
          <AuthL5Checkbox
            id="provider-agree-privacy"
            checked={agreePrivacy}
            onChange={setAgreePrivacy}
            label={t("providerRegister_agreePrivacy")}
          />
          <GuideRegisterInlineFieldError message={fieldInlineError("agree")} />
          <button type="button" className={guideRegSecondaryBtn} onClick={() => goToStep(2)}>
            {t("providerRegister_back")}
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        className={`${guideRegPrimaryCta} mt-6 w-full`}
        disabled={loading || isLoggedIn !== true}
      >
        {submitLabel}
      </button>
    </form>
  );
}
