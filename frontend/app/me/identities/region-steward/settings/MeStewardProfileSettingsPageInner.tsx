"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { IdentitySlotBlockedReasonsPanel } from "@/components/me/identitySettings/IdentitySlotBlockedReasonsPanel";
import { IdentitySlotReviewStatusPanel } from "@/components/me/identitySettings/IdentitySlotReviewStatusPanel";
import { IdentitySlotSettingsPatchGatePanel } from "@/components/me/identitySettings/IdentitySlotSettingsPatchGatePanel";
import { IdentitySlotSettingsShell } from "@/components/me/identitySettings/IdentitySlotSettingsShell";
import { guideRegFieldClass, guideRegLabel, guideRegTextarea } from "@/app/guide/register/guideRegisterUiClasses";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import {
  ME_IDENTITIES_STEWARD_STAKE_HREF,
  ME_IDENTITIES_STEWARD_WORKSPACE_HREF,
} from "@/lib/me/meIdentitiesCoreCardModel";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import { resolveIdentityProfilePatchGate } from "@/lib/me/identitySlotSettingsGate";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  getMeStewardProfile,
  patchMeStewardProfile,
  type MeStewardProfile,
} from "@/lib/apiClient/meStewardProfile";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

function profileToForm(p: MeStewardProfile) {
  return {
    motivation: p.motivation ?? "",
    tagline: p.tagline ?? "",
  };
}

export function MeStewardProfileSettingsPageInner() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<MeStewardProfile | null>(null);
  const [motivation, setMotivation] = useState("");
  const [tagline, setTagline] = useState("");

  const patchGate = useMemo(() => resolveIdentityProfilePatchGate(profile), [profile]);
  const formReadOnly = profile != null && !patchGate.patchAllowed;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getMeStewardProfile();
      const p = body.profile ?? null;
      setProfile(p);
      if (p) {
        const f = profileToForm(p);
        setMotivation(f.motivation);
        setTagline(f.tagline);
      }
    } catch (e) {
      setProfile(null);
      setError(mapApiReadError(e, t, "me_steward_profile_loadFailed"));
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
      const body = await patchMeStewardProfile({
        motivation: motivation.trim(),
        tagline: tagline.trim(),
      });
      setProfile(body.profile ?? null);
      setSaved(true);
    } catch (e) {
      setSaveError(mapApiReadError(e, t, "me_steward_profile_saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IdentitySlotSettingsShell
      route="identities-region-steward-settings"
      ariaLabel={t("me_steward_profile_settings_title")}
      backLabelKey="me_steward_profile_back_identities"
      eyebrowKey="header_identity_steward"
      titleKey="me_steward_profile_settings_title"
      subtitleKey="me_steward_profile_settings_subtitle"
      t={t}
      dataAttrs={{
        "data-tt-me-identities-steward-settings": "1",
        "data-tt-me-steward-profile-settings": "1",
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
          <p className="text-meta text-slate-400">{t("me_steward_profile_none")}</p>
          <Link href="/steward/register" className={`${TT_AUTH_L5_FORM.primaryCta} mt-4 inline-flex`}>
            {t("me_identities_card_cta")}
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

          <section
            className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-3`}
            data-tt-me-steward-profile-readonly="1"
            aria-labelledby="me-steward-profile-readonly-title"
          >
            <h2 id="me-steward-profile-readonly-title" className="text-small font-semibold uppercase tracking-wide text-ref-sun/85">
              {t("me_steward_profile_readonly_title")}
            </h2>
            <dl className="space-y-2 text-meta text-slate-300/95">
              <div>
                <dt className="text-slate-400">{t("me_steward_profile_jurisdictions")}</dt>
                <dd className="mt-0.5 font-mono">{profile.jurisdictions?.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t("me_steward_profile_status")}</dt>
                <dd className="mt-0.5">{profile.status?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t("me_steward_profile_stake")}</dt>
                <dd className="mt-0.5">{profile.stake_display?.trim() || profile.stake_amount?.trim() || "—"}</dd>
              </div>
            </dl>
            <Link href={ME_IDENTITIES_STEWARD_WORKSPACE_HREF} className={`text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}>
              {t("me_steward_profile_open_governance")}
            </Link>
            <Link href={ME_IDENTITIES_STEWARD_STAKE_HREF} className={`mt-2 inline-block text-meta text-ref-sun/88 underline ${authL5InlineLinkFocusClasses}`}>
              {t("me_steward_profile_open_stake")}
            </Link>
          </section>

          <section className={`${TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard} space-y-4`} data-tt-me-steward-profile-form="1" {...(formReadOnly ? { "data-tt-me-steward-profile-form-readonly": "1" } : {})}>
            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-steward-profile-motivation">
                {t("me_steward_profile_motivation")}
              </label>
              <textarea
                id="me-steward-profile-motivation"
                rows={4}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className={guideRegTextarea}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={guideRegLabel} htmlFor="me-steward-profile-tagline">
                {t("me_steward_profile_tagline")}
              </label>
              <input
                id="me-steward-profile-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={guideRegFieldClass(false)}
                readOnly={formReadOnly}
                disabled={formReadOnly}
              />
            </div>

            {!formReadOnly ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                className={TT_AUTH_L5_FORM.primaryCta}
                disabled={saving}
                onClick={() => void onSave()}
              >
                {saving ? t("me_steward_profile_saving") : t("me_steward_profile_save")}
              </button>
              {saved ? (
                <p className="text-meta text-emerald-300/90" role="status">
                  {t("me_steward_profile_saved")}
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
        </div>
      ) : null}
    </IdentitySlotSettingsShell>
  );
}
