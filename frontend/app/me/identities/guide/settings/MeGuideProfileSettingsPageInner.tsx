"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { IdentitySlotBlockedReasonsPanel } from "@/components/me/identitySettings/IdentitySlotBlockedReasonsPanel";
import { IdentitySlotReviewStatusPanel } from "@/components/me/identitySettings/IdentitySlotReviewStatusPanel";
import { IdentitySlotSettingsPatchGatePanel } from "@/components/me/identitySettings/IdentitySlotSettingsPatchGatePanel";
import { GuideProfileApplicationMaterialsPanel } from "@/components/me/identitySettings/GuideProfileApplicationMaterialsPanel";
import { IdentitySlotSettingsShell } from "@/components/me/identitySettings/IdentitySlotSettingsShell";
import { IdentitySlotProfileImageField } from "@/components/me/identitySettings/IdentitySlotProfileImageField";
import { GuideProfileMarketPreview } from "./GuideProfileMarketPreview";
import { useGuideRegisterCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import {
  cityOptionsForCountryIso,
  languageOptionsForCountryIso,
  parseCommaList,
  SERVICE_TYPE_OPTIONS,
  toggleCommaListValue,
} from "@/lib/guide/guideRegisterGeo";
import {
  buildGuideProfileMarketPreviewDraft,
  guideProfileToForm,
  resolveGuideProfileSettingsView,
} from "@/lib/guide/guideProfileSettingsModel";
import { guideRegFieldClass, guideRegLabel, guideRegTextarea } from "@/app/guide/register/guideRegisterUiClasses";
import GuideRegisterChipGroup from "@/app/guide/register/GuideRegisterChipGroup";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { getMeGuideProfile, patchMeGuideProfile, type MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";
import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";
import {
  guideProfileFormSnapshot,
  validateGuideProfileForm,
  type GuideProfileSettingsValidationIssue,
} from "@/lib/guide/guideProfileSettingsValidation";
import { resolveGuideProfileSettingsBack } from "@/lib/guide/guideProfileSettingsNav";
import { GUIDE_WORKSPACE_HREF } from "@/lib/workspace/workspaceIdentityModel";

function touchForm(setSaved: (v: boolean) => void) {
  setSaved(false);
}

export function MeGuideProfileSettingsPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromGuideWorkbench = searchParams.get("from") === "guide";
  const profileBack = resolveGuideProfileSettingsBack({ from: searchParams.get("from") });
  const countryOptions = useGuideRegisterCountryOptions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<MeGuideProfile | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [publicTitle, setPublicTitle] = useState("");
  const [languages, setLanguages] = useState("");
  const [serviceTypes, setServiceTypes] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [validationIssues, setValidationIssues] = useState<GuideProfileSettingsValidationIssue[]>([]);
  const [avatarPendingSave, setAvatarPendingSave] = useState(false);

  const applyLoadedForm = useCallback((f: ReturnType<typeof guideProfileToForm>) => {
    setCountryCode(f.countryCode);
    setCity(f.city);
    setPublicTitle(f.publicTitle);
    setLanguages(f.languages);
    setServiceTypes(f.serviceTypes);
    setBio(f.bio);
    setHourlyRate(f.hourlyRate);
    setAvatarUrl(f.avatarUrl);
    setSavedSnapshot(guideProfileFormSnapshot(f));
    setValidationIssues([]);
    setAvatarPendingSave(false);
  }, []);

  const cityOptions = useMemo(() => cityOptionsForCountryIso(countryCode), [countryCode]);
  const langOptions = useMemo(() => languageOptionsForCountryIso(countryCode), [countryCode]);
  const langSelected = useMemo(() => new Set(parseCommaList(languages)), [languages]);
  const serviceSelected = useMemo(() => new Set(parseCommaList(serviceTypes)), [serviceTypes]);

  const settingsView = useMemo(() => resolveGuideProfileSettingsView(profile), [profile]);
  const { formReadOnly, showOnboardingPanels, patchGate } = settingsView;
  const applicationStatus = profile?.application_status ?? profile?.status;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getMeGuideProfile();
      const p = body.profile ?? null;
      setProfile(p);
      if (p) {
        applyLoadedForm(guideProfileToForm(p));
      }
    } catch (e) {
      setProfile(null);
      setError(mapApiReadError(e, t, "me_guide_profile_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, applyLoadedForm]);

  useEffect(() => {
    void load();
  }, [load]);

  const formDraft = useMemo(
    () => ({
      countryCode,
      city,
      publicTitle,
      languages,
      serviceTypes,
      bio,
      hourlyRate,
      avatarUrl,
    }),
    [countryCode, city, publicTitle, languages, serviceTypes, bio, hourlyRate, avatarUrl],
  );

  const previewGuide = useMemo(
    () =>
      buildGuideProfileMarketPreviewDraft(profile, formDraft, (raw) =>
        resolveApiUploadUrl(raw?.trim() || undefined) || undefined,
      ),
    [profile, formDraft],
  );

  const isDirty = Boolean(savedSnapshot) && guideProfileFormSnapshot(formDraft) !== savedSnapshot;

  const onAvatarUrlChange = (url: string) => {
    setAvatarUrl(url);
    touchForm(setSaved);
    setAvatarPendingSave(Boolean(url.trim()));
    setValidationIssues([]);
  };

  const onSave = async () => {
    const issues = validateGuideProfileForm(formDraft);
    setValidationIssues(issues);
    if (issues.length) return;

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const body = await patchMeGuideProfile({
        city: city.trim(),
        country_code: countryCode.trim(),
        public_title: publicTitle.trim(),
        languages: parseCommaList(languages),
        service_types: parseCommaList(serviceTypes),
        bio: bio.trim(),
        hourly_rate: hourlyRate.trim(),
        avatar_url: avatarUrl.trim(),
      });
      const nextProfile = body.profile ?? null;
      setProfile(nextProfile);
      if (nextProfile) {
        applyLoadedForm(guideProfileToForm(nextProfile));
      }
      setSaved(true);
    } catch (e) {
      setSaveError(mapApiReadError(e, t, "me_guide_profile_saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IdentitySlotSettingsShell
      route="identities-guide-settings"
      ariaLabel={t("me_guide_profile_settings_title")}
      showMinimalFooter={!fromGuideWorkbench}
      backHref={profileBack.href}
      backLabelKey={profileBack.labelKey}
      eyebrowKey={showOnboardingPanels ? "header_identity_applyGuide" : "me_guide_profile_settings_eyebrow_active"}
      titleKey="me_guide_profile_settings_title"
      subtitleKey="me_guide_profile_settings_subtitle"
      t={t}
      dataAttrs={{
        "data-tt-me-identities-guide-settings": "1",
        "data-tt-me-guide-profile-settings": "1",
        ...(showOnboardingPanels ? {} : { "data-tt-me-guide-profile-active-edit": "1" }),
      }}
    >
      {loading ? (
        <p className="text-meta text-slate-400" role="status">
          {t("common_loading")}
        </p>
      ) : null}

      {!loading && error ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {error}{" "}
          <button type="button" className={`text-ref-sun underline ${authL5InlineLinkFocusClasses}`} onClick={() => void load()}>
            {t("common_retry")}
          </button>
        </p>
      ) : null}

      {!loading && !error && !profile ? (
        <section className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} text-center`}>
          <p className="text-meta text-slate-400">{t("me_guide_profile_none")}</p>
          <Link href="/guide/register" className={`${TT_AUTH_L5_FORM.primaryCta} mt-4 inline-flex`}>
            {t("me_identities_card_cta")}
          </Link>
        </section>
      ) : null}

      {!loading && !error && profile ? (
        <div className="space-y-6">
          {showOnboardingPanels ? (
            <>
              <IdentitySlotBlockedReasonsPanel
                blockedReasons={profile.blocked_reasons}
                applicationStatus={applicationStatus}
              />
              <IdentitySlotReviewStatusPanel
                applicationStatus={applicationStatus}
                rejectionCodes={profile.rejection_codes}
                rejectionMessage={profile.rejection_message}
              />
              <GuideProfileApplicationMaterialsPanel materials={profile.application_materials} />
              <IdentitySlotSettingsPatchGatePanel slotState={patchGate.slotState} patchAllowed={patchGate.patchAllowed} />
              <section
                className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-2`}
                data-tt-me-guide-profile-workspace="1"
              >
                <Link href={GUIDE_WORKSPACE_HREF} className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}>
                  {t("me_guide_profile_open_workspace")}
                </Link>
              </section>
            </>
          ) : null}

          <section
            className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-4`}
            data-tt-me-guide-profile-form="1"
            {...(formReadOnly ? { "data-tt-me-guide-profile-readonly": "1" } : {})}
          >
            {!showOnboardingPanels ? (
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-950/40 px-2.5 py-0.5 text-small font-medium text-emerald-100">
                    {t("me_identities_core_phase_active")}
                  </span>
                </div>
                <h2 className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>{t("me_guide_profile_form_title")}</h2>
                <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>{t("me_guide_profile_form_subtitle_edit_only")}</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-guide-profile-country">
                {t("guideRegister_country")}
              </label>
              <select
                id="me-guide-profile-country"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setCity("");
                  setLanguages("");
                  touchForm(setSaved);
                  setValidationIssues([]);
                }}
                className={guideRegFieldClass(false)}
                disabled={formReadOnly}
              >
                {countryOptions.map((c) => (
                  <option key={c.value || "empty"} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-guide-profile-city">
                {t("guideRegister_city")}
              </label>
              <select
                id="me-guide-profile-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  touchForm(setSaved);
                  setValidationIssues([]);
                }}
                className={guideRegFieldClass(false)}
                disabled={formReadOnly}
              >
                <option value="">{t("guideRegister_pleaseSelect")}</option>
                {cityOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-guide-profile-public-title">
                {t("me_guide_profile_public_title")}
              </label>
              <input
                id="me-guide-profile-public-title"
                type="text"
                value={publicTitle}
                onChange={(e) => {
                  setPublicTitle(e.target.value);
                  touchForm(setSaved);
                  setValidationIssues([]);
                }}
                className={guideRegFieldClass(false)}
                disabled={formReadOnly}
                placeholder={t("me_guide_profile_public_title_placeholder")}
                data-tt-me-guide-profile-public-title="1"
                maxLength={80}
              />
              <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>{t("me_guide_profile_public_title_hint")}</p>
            </div>

            <IdentitySlotProfileImageField
              id="me-guide-profile-avatar"
              labelKey="me_guide_profile_avatar"
              imageUrl={avatarUrl}
              onImageUrlChange={onAvatarUrlChange}
              t={t}
              readOnly={formReadOnly}
            />

            <GuideRegisterChipGroup
              label={t("guideRegister_languages")}
              options={langOptions}
              selected={langSelected}
              onToggle={(value) => {
                setLanguages(toggleCommaListValue(languages, value));
                touchForm(setSaved);
                setValidationIssues([]);
              }}
              t={t}
              disabled={formReadOnly}
            />

            <GuideRegisterChipGroup
              label={t("guideRegister_serviceTypes")}
              options={SERVICE_TYPE_OPTIONS}
              selected={serviceSelected}
              onToggle={(value) => {
                setServiceTypes(toggleCommaListValue(serviceTypes, value));
                touchForm(setSaved);
                setValidationIssues([]);
              }}
              t={t}
              disabled={formReadOnly}
            />
            <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>{t("me_guide_profile_service_types_hint")}</p>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-guide-profile-bio">
                {t("guideRegister_bio")}
              </label>
              <textarea
                id="me-guide-profile-bio"
                rows={4}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  touchForm(setSaved);
                  setValidationIssues([]);
                }}
                className={guideRegTextarea}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-guide-profile-hourly">
                {t("me_guide_profile_hourly_rate")}
              </label>
              <input
                id="me-guide-profile-hourly"
                type="text"
                inputMode="decimal"
                value={hourlyRate}
                onChange={(e) => {
                  setHourlyRate(e.target.value);
                  touchForm(setSaved);
                  setValidationIssues([]);
                }}
                className={guideRegFieldClass(false)}
                disabled={formReadOnly}
                placeholder={t("me_guide_profile_hourly_placeholder")}
              />
            </div>

            {avatarPendingSave && !formReadOnly ? (
              <p className="text-meta text-amber-200/90" role="status" data-tt-me-guide-profile-avatar-pending-save="1">
                {t("me_guide_profile_avatar_uploaded_pending_save")}
              </p>
            ) : null}

            {validationIssues.length ? (
              <ul className="list-inside list-disc space-y-1 text-meta text-danger/90" role="alert" data-tt-me-guide-profile-validation="1">
                {validationIssues.map((issue) => (
                  <li key={`${issue.field}-${issue.messageKey}`}>{t(issue.messageKey)}</li>
                ))}
              </ul>
            ) : null}

            {!formReadOnly ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  className={TT_AUTH_L5_FORM.primaryCta}
                  disabled={saving}
                  onClick={() => void onSave()}
                  data-tt-me-guide-profile-save="1"
                >
                  {saving ? t("me_guide_profile_saving") : t("me_guide_profile_save")}
                </button>
                {saved ? (
                  <p className="text-meta text-emerald-300/90" role="status">
                    {t("me_guide_profile_saved")}
                  </p>
                ) : null}
                {isDirty && !saved ? (
                  <p className="text-meta text-slate-400/90" role="status" data-tt-me-guide-profile-unsaved="1">
                    {t("me_guide_profile_unsaved_hint")}
                  </p>
                ) : null}
                {saveError ? (
                  <p className="text-meta text-danger" role="alert">
                    {saveError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          {!formReadOnly && (isDirty || avatarPendingSave) ? (
            <GuideProfileMarketPreview draft={previewGuide} profileMeta={profile} dirtyOnly />
          ) : null}
        </div>
      ) : null}
    </IdentitySlotSettingsShell>
  );
}
