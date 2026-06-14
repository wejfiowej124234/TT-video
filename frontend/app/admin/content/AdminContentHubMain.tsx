"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminContentPageShell } from "@/components/admin/content/AdminContentPageShell";
import { AdminOpsPlaneSidebarHint } from "@/components/admin/ops/AdminOpsPlaneSidebarHint";

export function AdminContentHubMain() {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <AdminContentPageShell
      titleId={titleId}
      titleKey="admin_content_hub_title"
      subtitleKey="admin_content_hub_subtitle_ops"
      loading={false}
      error={null}
    >
      <p className="mb-4 text-body-m text-ink-600">{t("admin_content_hub_body_cs1")}</p>
      <AdminOpsPlaneSidebarHint />
    </AdminContentPageShell>
  );
}
