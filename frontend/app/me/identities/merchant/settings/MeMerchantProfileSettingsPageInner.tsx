"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ME_IDENTITIES_MERCHANT_WORKSPACE_HREF,
  ME_IDENTITIES_PROVIDER_ACTIVE_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import { useTranslation } from "@/components/LocaleProvider";
import { IdentitySlotBlockedReasonsPanel } from "@/components/me/identitySettings/IdentitySlotBlockedReasonsPanel";
import { IdentitySlotReviewStatusPanel } from "@/components/me/identitySettings/IdentitySlotReviewStatusPanel";
import { IdentitySlotSettingsPatchGatePanel } from "@/components/me/identitySettings/IdentitySlotSettingsPatchGatePanel";
import { IdentitySlotSettingsShell } from "@/components/me/identitySettings/IdentitySlotSettingsShell";
import { IdentitySlotProfileImageField } from "@/components/me/identitySettings/IdentitySlotProfileImageField";
import { MerchantProfileMarketPreview } from "@/components/me/identitySettings/MerchantProfileMarketPreview";
import { guideRegFieldClass, guideRegLabel, guideRegTextarea } from "@/app/guide/register/guideRegisterUiClasses";
import { useGuideRegisterCountryOptions } from "@/lib/catalogApi/useCatalogGeo";
import { cityOptionsForCountryIso, parseCommaList } from "@/lib/guide/guideRegisterGeo";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { resolveIdentityProfilePatchGate } from "@/lib/me/identitySlotSettingsGate";
import { resolveMerchantProfileSettingsBack } from "@/lib/provider/merchantProfileSettingsNav";
import { merchantProfileFormSnapshot } from "@/lib/provider/merchantProfileFormSnapshot";
import { ME_IDENTITIES_HUB_PATH } from "@/lib/me/meIdentitiesL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  getMeMerchantProfile,
  patchMeMerchantProfile,
  type MeMerchantProfile,
} from "@/lib/apiClient/meMerchantProfile";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

function profileToForm(p: MeMerchantProfile) {
  return {
    shopName: p.shop_name ?? "",
    city: p.city ?? "",
    countryCode: p.country_code ?? "",
    categories: (p.categories ?? []).join(", "),
    bio: p.bio ?? "",
    avatarUrl: p.avatar_url ?? "",
    coverUrl: p.cover_url ?? "",
  };
}

export function MeMerchantProfileSettingsPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromProviderWorkbench = searchParams.get("from") === "provider";
  const profileBack = resolveMerchantProfileSettingsBack({ from: searchParams.get("from") });
  const countryOptions = useGuideRegisterCountryOptions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<MeMerchantProfile | null>(null);
  const [shopName, setShopName] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [categories, setCategories] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const cityOptions = useMemo(() => cityOptionsForCountryIso(countryCode), [countryCode]);
  const categoryList = useMemo(() => parseCommaList(categories), [categories]);

  const formDraft = useMemo(
    () => ({
      shopName,
      city,
      countryCode,
      categories,
      bio,
      avatarUrl,
      coverUrl,
    }),
    [shopName, city, countryCode, categories, bio, avatarUrl, coverUrl],
  );
  const isDirty = Boolean(savedSnapshot) && merchantProfileFormSnapshot(formDraft) !== savedSnapshot;

  const patchGate = useMemo(() => resolveIdentityProfilePatchGate(profile), [profile]);
  const formReadOnly = profile != null && !patchGate.patchAllowed;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getMeMerchantProfile();
      const p = body.profile ?? null;
      setProfile(p);
      if (p) {
        const f = profileToForm(p);
        setShopName(f.shopName);
        setCity(f.city);
        setCountryCode(f.countryCode);
        setCategories(f.categories);
        setBio(f.bio);
        setAvatarUrl(f.avatarUrl);
        setCoverUrl(f.coverUrl);
        setSavedSnapshot(merchantProfileFormSnapshot(f));
      }
    } catch (e) {
      setProfile(null);
      setError(mapApiReadError(e, t, "me_merchant_profile_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const body = await patchMeMerchantProfile({
        shop_name: shopName.trim(),
        city: city.trim(),
        country_code: countryCode.trim(),
        categories: parseCommaList(categories),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        cover_url: coverUrl.trim(),
      });
      const next = body.profile ?? null;
      setProfile(next);
      if (next) {
        const f = profileToForm(next);
        setSavedSnapshot(merchantProfileFormSnapshot(f));
      }
      setSaved(true);
    } catch (e) {
      setSaveError(mapApiReadError(e, t, "me_merchant_profile_saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IdentitySlotSettingsShell
      route="identities-merchant-settings"
      ariaLabel={t("me_merchant_profile_settings_title")}
      showMinimalFooter={!fromProviderWorkbench}
      backHref={profileBack.href}
      backLabelKey={profileBack.labelKey}
      eyebrowKey="header_identity_provider"
      titleKey="me_merchant_profile_settings_title"
      subtitleKey="me_merchant_profile_settings_subtitle"
      t={t}
      dataAttrs={{
        "data-tt-me-identities-merchant-settings": "1",
        "data-tt-me-merchant-profile-settings": "1",
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
          <p className="text-meta text-slate-400">{t("me_merchant_profile_none")}</p>
          <Link href={ME_IDENTITIES_HUB_PATH} className={`${TT_AUTH_L5_FORM.primaryCta} mt-4 inline-flex`}>
            {t("me_identities_card_cta")}
          </Link>
        </section>
      ) : null}

      {!loading && !error && profile ? (
        <div className="space-y-5 sm:space-y-6">
          <IdentitySlotBlockedReasonsPanel
            blockedReasons={profile.blocked_reasons}
            applicationStatus={profile.application_status}
          />
          <IdentitySlotReviewStatusPanel
            applicationStatus={profile.application_status}
            rejectionCodes={profile.rejection_codes}
            rejectionMessage={profile.rejection_message}
          />

          <IdentitySlotSettingsPatchGatePanel slotState={patchGate.slotState} patchAllowed={patchGate.patchAllowed} />

          {!fromProviderWorkbench ? (
            <section
              className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} flex flex-col gap-2`}
              data-tt-me-merchant-profile-workspace="1"
            >
              <Link
                href={ME_IDENTITIES_MERCHANT_WORKSPACE_HREF}
                className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}
              >
                {t("me_merchant_profile_open_workspace")}
              </Link>
              <Link
                href={ME_IDENTITIES_PROVIDER_ACTIVE_HREF}
                className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}
              >
                {t("me_merchant_profile_open_storefront")}
              </Link>
            </section>
          ) : null}

          <section
            className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-4`}
            data-tt-me-merchant-profile-form="1"
            {...(formReadOnly ? { "data-tt-me-merchant-profile-readonly": "1" } : {})}
          >
            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-merchant-profile-shop">
                {t("me_merchant_profile_shop_name")}
              </label>
              <input
                id="me-merchant-profile-shop"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={guideRegFieldClass(false)}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-merchant-profile-country">
                {t("guideRegister_country")}
              </label>
              <select
                id="me-merchant-profile-country"
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setCity("");
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
              <label className={guideRegLabel} htmlFor="me-merchant-profile-city">
                {t("guideRegister_city")}
              </label>
              <select
                id="me-merchant-profile-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
              <label className={guideRegLabel} htmlFor="me-merchant-profile-categories">
                {t("providerRegister_categories")}
              </label>
              <input
                id="me-merchant-profile-categories"
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className={guideRegFieldClass(false)}
                disabled={formReadOnly}
                placeholder={t("providerRegister_categoriesPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-merchant-profile-bio">
                {t("providerRegister_bio")}
              </label>
              <textarea
                id="me-merchant-profile-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={guideRegTextarea}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <IdentitySlotProfileImageField
              id="me-merchant-profile-avatar"
              labelKey="me_merchant_profile_avatar"
              imageUrl={avatarUrl}
              onImageUrlChange={setAvatarUrl}
              t={t}
              readOnly={formReadOnly}
            />

            <IdentitySlotProfileImageField
              id="me-merchant-profile-cover"
              labelKey="me_merchant_profile_cover"
              imageUrl={coverUrl}
              onImageUrlChange={setCoverUrl}
              t={t}
              readOnly={formReadOnly}
            />

            {!formReadOnly ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                className={TT_AUTH_L5_FORM.primaryCta}
                disabled={saving}
                onClick={() => void onSave()}
              >
                {saving ? t("me_merchant_profile_saving") : t("me_merchant_profile_save")}
              </button>
              {saved ? (
                <p className="text-meta text-emerald-300/90" role="status">
                  {t("me_merchant_profile_saved")}
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

          {!fromProviderWorkbench && !formReadOnly && isDirty ? (
            <MerchantProfileMarketPreview
              shopName={shopName}
              city={city}
              countryCode={countryCode}
              categories={categoryList}
              bio={bio}
              avatarUrl={avatarUrl}
              coverUrl={coverUrl}
              dirtyOnly
            />
          ) : null}
        </div>
      ) : null}
    </IdentitySlotSettingsShell>
  );
}
