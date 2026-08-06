"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** Permission / 2FA / approval hints for ops-plane API errors (157 backend · FE honest · Cut B R057). */
export function OpsPlaneAuthHints(props: { errorKey?: string | null }) {
  const { t } = useTranslation();
  const key = props.errorKey ?? "";
  if (!key) return null;
  const lower = key.toLowerCase();
  let hintKey: string | null = null;
  if (lower.includes("2fa") || lower.includes("totp")) hintKey = "ops_plane_hint_2fa";
  else if (lower.includes("forbidden") || lower.includes("perm") || lower.includes("denied") || lower.includes("403"))
    hintKey = "ops_plane_hint_permission";
  else if (lower.includes("approval")) hintKey = "ops_plane_hint_approval";
  else if (lower.includes("503") || lower.includes("unavailable") || lower.includes("timeout"))
    hintKey = "ops_plane_hint_unavailable";
  else if (lower.includes("missing_table") || lower.includes("undefined_table") || lower.includes("404"))
    hintKey = "ops_plane_hint_missing_resource";
  if (!hintKey) return null;
  return (
    <p className="mb-2 text-small text-ink-500" data-tt-ops-plane-auth-hint="1" role="note">
      {t(hintKey)}
    </p>
  );
}
