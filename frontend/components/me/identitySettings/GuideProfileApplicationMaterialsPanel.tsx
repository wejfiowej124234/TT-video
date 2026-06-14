"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_IDENTITY_SLOT_SETTINGS_L5 } from "@/lib/me/identitySlotSettingsL5";
import type { MeGuideApplicationMaterials } from "@/lib/apiClient/meGuideProfile";
import { resolveApiUploadUrl } from "@/lib/me/resolveApiUploadUrl";

function maskWallet(addr: string): string {
  const t = addr.trim();
  if (t.length <= 12) return t;
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}

function MaterialRow({
  label,
  submitted,
  detail,
  documentUrl,
}: {
  label: string;
  submitted: boolean;
  detail?: string | null;
  documentUrl?: string | null;
}) {
  const { t } = useTranslation();
  const resolved = documentUrl ? resolveApiUploadUrl(documentUrl) : null;

  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-200">
        {!submitted && !detail?.trim() ? (
          <span className="text-slate-500">{t("me_guide_profile_materials_not_submitted")}</span>
        ) : null}
        {detail?.trim() ? <span>{detail}</span> : null}
        {submitted && !detail?.trim() ? (
          <span className="text-emerald-300/90">{t("me_guide_profile_materials_submitted")}</span>
        ) : null}
        {resolved ? (
          <a
            href={resolved}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-ref-sun/88 underline"
          >
            {t("me_guide_profile_materials_view_document")}
          </a>
        ) : null}
      </dd>
    </div>
  );
}

export function GuideProfileApplicationMaterialsPanel({
  materials,
}: {
  materials?: MeGuideApplicationMaterials | null;
}) {
  const { t } = useTranslation();
  if (!materials) return null;

  const hasAny =
    materials.wallet_address?.trim() ||
    materials.real_name?.trim() ||
    materials.id_photo_submitted ||
    materials.language_cert_submitted ||
    materials.guide_license_submitted ||
    materials.submitted_at?.trim();

  if (!hasAny) return null;

  const walletDisplay = materials.wallet_address?.trim()
    ? maskWallet(materials.wallet_address)
    : null;

  return (
    <section
      className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionCard}
      data-tt-guide-profile-application-materials="1"
      aria-labelledby="guide-profile-materials-title"
    >
      <h2 id="guide-profile-materials-title" className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionTitle}>
        {t("me_guide_profile_materials_title")}
      </h2>
      <p className={TT_IDENTITY_SLOT_SETTINGS_L5.sectionHint}>{t("me_guide_profile_materials_subtitle")}</p>
      <dl className="mt-4 grid gap-3 text-meta sm:grid-cols-2">
        <MaterialRow
          label={t("me_guide_profile_materials_wallet")}
          submitted={Boolean(materials.wallet_address?.trim())}
          detail={walletDisplay}
        />
        <MaterialRow
          label={t("me_guide_profile_materials_real_name")}
          submitted={Boolean(materials.real_name?.trim())}
          detail={materials.real_name ?? null}
        />
        <MaterialRow
          label={t("me_guide_profile_materials_id_photo")}
          submitted={Boolean(materials.id_photo_submitted)}
          documentUrl={materials.id_photo_url}
        />
        <MaterialRow
          label={t("me_guide_profile_materials_language_cert")}
          submitted={Boolean(materials.language_cert_submitted)}
          documentUrl={materials.language_cert_url}
        />
        <MaterialRow
          label={t("me_guide_profile_materials_guide_license")}
          submitted={Boolean(materials.guide_license_submitted)}
          documentUrl={materials.guide_license_url}
        />
        {materials.submitted_at?.trim() ? (
          <div>
            <dt className="text-slate-400">{t("me_guide_profile_materials_submitted_at")}</dt>
            <dd className="mt-0.5 font-mono text-slate-300">{materials.submitted_at}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
