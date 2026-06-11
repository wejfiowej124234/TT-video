"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsDataRequestDialog } from "@/components/me/MeSettingsDataRequestDialog";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsL5ActionRow } from "@/components/me/MeSettingsL5ActionRow";
import { MeSettingsL5Row } from "@/components/me/MeSettingsL5Row";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { useMeSettingsL5Confirm } from "@/hooks/useMeSettingsL5Confirm";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import {
  buildMeSettingsDataExportPackage,
  downloadMeSettingsDataJson,
} from "@/lib/me/meSettingsDataExport";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

const LINK_ROWS = [
  {
    id: "sessions",
    iconId: "shield",
    labelKey: "me_settings_data_item_sessions",
    descKey: "me_settings_data_desc_sessions",
    href: meSecurityHref("sessions"),
  },
  {
    id: "feedback",
    iconId: "feedback",
    labelKey: "me_link_feedback",
    descKey: "me_settings_data_desc_feedback",
    href: "/community/feedback?from=settings-data",
  },
  {
    id: "help",
    iconId: "help",
    labelKey: "help_title",
    descKey: "me_settings_data_desc_help",
    href: "/help?from=settings",
  },
] as const;

/** 账户与数据（L5）· JSON 导出 + 删号工单 + 设备管理 */
export default function MeSettingsDataPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const confirm = useMeSettingsL5Confirm();
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  function openExportDownload() {
    setExportError(null);
    confirm.request({
      titleKey: "me_settings_data_export_download_title",
      descKey: "me_settings_data_export_download_desc",
      confirmLabelKey: "me_settings_data_export_download_action",
      onConfirm: async () => {
        try {
          const pkg = await buildMeSettingsDataExportPackage();
          downloadMeSettingsDataJson(pkg);
          setExportDone(true);
        } catch (e) {
          setExportError(e instanceof Error ? e.message : t("me_settings_data_export_failed"));
        }
      },
    });
  }

  function openDeleteRequest() {
    confirm.request({
      titleKey: "me_settings_data_delete_confirm_title",
      descKey: "me_settings_data_delete_confirm_desc",
      danger: true,
      confirmLabelKey: "me_settings_data_request_continue",
      onConfirm: () => {
        router.push("/community/feedback?from=settings-data&intent=delete-account");
      },
    });
  }

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_data_page_title")}
      route="settings-data"
      dataAttrs={{
        "data-tt-me-settings-route": "data",
        "data-tt-me-settings-data-export": "1",
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_general"
        titleKey="me_settings_data_page_title"
        subtitleKey="me_settings_data_subtitle"
      />

      <p className="rounded-xl border border-ref-sun/28 bg-ref-sun/[0.06] px-4 py-3 text-meta leading-relaxed text-slate-400/95">
        {t("me_settings_data_notice")}
      </p>

      {exportError ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {exportError}
        </p>
      ) : null}

      {exportDone ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="status" data-tt-me-settings-data-export-done="1">
          {t("me_settings_data_export_done")}
        </p>
      ) : null}

      <section className={TT_ME_SETTINGS_L5.section} aria-labelledby="me-settings-data-actions">
        <h2 id="me-settings-data-actions" className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t("me_settings_data_section_actions")}
        </h2>
        <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">
          <li className="list-none">
            <MeSettingsL5ActionRow
              id="export_data"
              iconId="privacy"
              label={t("me_settings_data_item_export")}
              desc={t("me_settings_data_desc_export")}
              onClick={openExportDownload}
            />
          </li>
          <li className="list-none">
            <MeSettingsL5ActionRow
              id="delete_account"
              iconId="privacy"
              label={t("me_settings_data_item_delete")}
              desc={t("me_settings_data_desc_delete")}
              onClick={openDeleteRequest}
            />
          </li>
          {LINK_ROWS.map((row) => (
            <li key={row.id} className="list-none">
              <MeSettingsL5Row
                item={{
                  id: row.id,
                  iconId: row.iconId,
                  labelKey: row.labelKey,
                  descKey: row.descKey,
                  href: row.href,
                }}
                label={t(row.labelKey)}
                desc={row.descKey ? t(row.descKey) : undefined}
                soonLabel={t("me_settings_badge_soon")}
              />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-meta text-slate-500/90">
        <Link
          href="/me/settings/privacy"
          className={`text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
        >
          {t("me_settings_item_privacy_hub")}
        </Link>
      </p>

      <MeSettingsDataRequestDialog
        open={confirm.open}
        busy={confirm.busy}
        t={t}
        titleKey={confirm.pending?.titleKey ?? "me_settings_data_export_download_title"}
        descKey={confirm.pending?.descKey ?? "me_settings_data_export_download_desc"}
        confirmLabelKey={confirm.pending?.confirmLabelKey}
        onCancel={confirm.cancel}
        onConfirm={() => void confirm.confirm()}
      />
    </MeSettingsL5FlowPage>
  );
}
