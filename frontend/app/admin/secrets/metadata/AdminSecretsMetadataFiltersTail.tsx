"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";

import type { AdminSecretsMetadataPageViewModel } from "./useAdminSecretsMetadataPage";

type Props = Pick<
  AdminSecretsMetadataPageViewModel,
  "keyAlias" | "status" | "envScope" | "appliedFilters"
> & {
  adminFilterHintId: string;
  secretsActiveKeyAliasDescId: string;
  secretsActiveStatusDescId: string;
  secretsActiveEnvScopeDescId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminSecretsMetadataFiltersTail({
  adminFilterHintId,
  secretsActiveKeyAliasDescId,
  secretsActiveStatusDescId,
  secretsActiveEnvScopeDescId,
  adminAppliedFiltersDescId,
  keyAlias,
  status,
  envScope,
  appliedFilters,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_secrets_meta_filter_hint")}
      </p>

      {keyAlias ? (
        <p id={secretsActiveKeyAliasDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_secrets_meta_active_key_alias").replace("{key}", keyAlias)}
        </p>
      ) : null}
      {status ? (
        <p id={secretsActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_secrets_meta_active_status").replace("{status}", status)}
        </p>
      ) : null}
      {envScope ? (
        <p id={secretsActiveEnvScopeDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_secrets_meta_active_env_scope").replace("{scope}", envScope)}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_secrets_meta_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}
    </>
  );
}
