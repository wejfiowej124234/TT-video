"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AcquisitionProfileMarketPreview } from "@/components/me/identitySettings/AcquisitionProfileMarketPreview";
import { IdentitySlotProfileImageField } from "@/components/me/identitySettings/IdentitySlotProfileImageField";
import { IdentitySlotBlockedReasonsPanel } from "@/components/me/identitySettings/IdentitySlotBlockedReasonsPanel";
import { IdentitySlotReviewStatusPanel } from "@/components/me/identitySettings/IdentitySlotReviewStatusPanel";
import { IdentitySlotSettingsPatchGatePanel } from "@/components/me/identitySettings/IdentitySlotSettingsPatchGatePanel";
import { IdentitySlotSettingsShell } from "@/components/me/identitySettings/IdentitySlotSettingsShell";
import { guideRegFieldClass, guideRegLabel, guideRegTextarea } from "@/app/guide/register/guideRegisterUiClasses";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { resolveIdentityProfilePatchGate } from "@/lib/me/identitySlotSettingsGate";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  getMeAcquisitionProfile,
  patchMeAcquisitionProfile,
  type MeAcquisitionProfile,
} from "@/lib/apiClient/meAcquisitionProfile";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

function profileToForm(p: MeAcquisitionProfile) {
  return {
    publicBio: p.public_bio ?? "",
    tagline: p.tagline ?? "",
    avatarUrl: p.avatar_url ?? "",
  };
}

function AcquisitionTrustStrip({ profile }: { profile: MeAcquisitionProfile }) {
  const { t } = useTranslation();
  const score = profile.acquisition_trust_score;
  const bondDisplay = profile.acquisition_publish_bond_display?.trim();
  const bondActive = profile.acquisition_publish_bond_active;
  const bondWaived = profile.acquisition_publish_bond_waived;
  const eligible = profile.acquisition_publish_eligible;
  const suspended = profile.acquisition_publish_suspended;

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      data-tt-me-acquisition-profile-trust="1"
      aria-labelledby="me-acquisition-profile-trust-title"
    >
      <h2 id="me-acquisition-profile-trust-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_acquisition_profile_trust_title")}
      </h2>
      <dl className="mt-3 grid gap-2 text-meta text-slate-300/95 sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">{t("me_acquisition_profile_trust_score")}</dt>
          <dd className="mt-0.5 tabular-nums">{score != null ? score : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{t("me_acquisition_profile_publish_eligible")}</dt>
          <dd className="mt-0.5">
            {eligible == null ? "—" : eligible ? t("me_acquisition_profile_bool_yes") : t("me_acquisition_profile_bool_no")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{t("me_acquisition_profile_publish_bond")}</dt>
          <dd className="mt-0.5">
            {bondWaived
              ? t("me_acquisition_profile_bond_waived")
              : bondActive
                ? bondDisplay || t("me_acquisition_profile_bond_active")
                : t("me_acquisition_profile_bond_inactive")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">{t("me_acquisition_profile_publish_suspended")}</dt>
          <dd className="mt-0.5">
            {suspended == null ? "—" : suspended ? t("me_acquisition_profile_bool_yes") : t("me_acquisition_profile_bool_no")}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-meta leading-relaxed text-slate-400/90">{t("me_acquisition_profile_trust_bond_note")}</p>
    </section>
  );
}

export function MeAcquisitionProfileSettingsPageInner() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<MeAcquisitionProfile | null>(null);
  const [publicBio, setPublicBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const patchGate = useMemo(() => resolveIdentityProfilePatchGate(profile), [profile]);
  const formReadOnly = profile != null && !patchGate.patchAllowed;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getMeAcquisitionProfile();
      const p = body.profile ?? null;
      setProfile(p);
      if (p) {
        const f = profileToForm(p);
        setPublicBio(f.publicBio);
        setTagline(f.tagline);
        setAvatarUrl(f.avatarUrl);
      }
    } catch (e) {
      setProfile(null);
      setError(mapApiReadError(e, t, "me_acquisition_profile_loadFailed"));
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
      const body = await patchMeAcquisitionProfile({
        public_bio: publicBio.trim(),
        tagline: tagline.trim(),
        avatar_url: avatarUrl.trim(),
      });
      setProfile(body.profile ?? null);
      setSaved(true);
    } catch (e) {
      setSaveError(mapApiReadError(e, t, "me_acquisition_profile_saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IdentitySlotSettingsShell
      route="identities-acquisition-settings"
      ariaLabel={t("me_acquisition_profile_settings_title")}
      backLabelKey="me_acquisition_profile_back_identities"
      eyebrowKey="header_identity_acquisition"
      titleKey="me_acquisition_profile_settings_title"
      subtitleKey="me_acquisition_profile_settings_subtitle"
      t={t}
      dataAttrs={{
        "data-tt-me-identities-acquisition-settings": "1",
        "data-tt-me-acquisition-profile-settings": "1",
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
          <p className="text-meta text-slate-400">{t("me_acquisition_profile_none")}</p>
          <Link href="/market/acquisition" className={`${TT_AUTH_L5_FORM.primaryCta} mt-4 inline-flex`}>
            {t("me_identities_card_cta_market")}
          </Link>
        </section>
      ) : null}

      {!loading && !error && profile ? (
        <div className="space-y-6">
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
          <AcquisitionTrustStrip profile={profile} />

          <section
            className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-4`}
            data-tt-me-acquisition-profile-form="1"
            {...(formReadOnly ? { "data-tt-me-acquisition-profile-readonly": "1" } : {})}
          >
            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-acquisition-profile-tagline">
                {t("me_acquisition_profile_tagline")}
              </label>
              <input
                id="me-acquisition-profile-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={guideRegFieldClass(false)}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-acquisition-profile-bio">
                {t("me_acquisition_profile_public_bio")}
              </label>
              <textarea
                id="me-acquisition-profile-bio"
                rows={4}
                value={publicBio}
                onChange={(e) => setPublicBio(e.target.value)}
                className={guideRegTextarea}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <IdentitySlotProfileImageField
              id="me-acquisition-profile-avatar"
              labelKey="me_acquisition_profile_avatar"
              imageUrl={avatarUrl}
              onImageUrlChange={setAvatarUrl}
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
                {saving ? t("me_acquisition_profile_saving") : t("me_acquisition_profile_save")}
              </button>
              {saved ? (
                <p className="text-meta text-emerald-300/90" role="status">
                  {t("me_acquisition_profile_saved")}
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

          <AcquisitionProfileMarketPreview tagline={tagline} publicBio={publicBio} avatarUrl={avatarUrl} />
        </div>
      ) : null}
    </IdentitySlotSettingsShell>
  );
}
