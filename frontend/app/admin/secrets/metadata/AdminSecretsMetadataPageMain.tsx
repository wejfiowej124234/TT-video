"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminSecretsMetadataFiltersCard } from "./AdminSecretsMetadataFiltersCard";
import { AdminSecretsMetadataFiltersTail } from "./AdminSecretsMetadataFiltersTail";
import { AdminSecretsMetadataMetaNote } from "./AdminSecretsMetadataMetaNote";
import { AdminSecretsMetadataTableSection } from "./AdminSecretsMetadataTableSection";
import { useAdminSecretsMetadataPage } from "./useAdminSecretsMetadataPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 70 / 230：Secret 元数据只读（须 admin + DB；永不返回密钥明文）。 */
export function AdminSecretsMetadataPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const keyAliasInputId = useId();
  const statusSelectId = useId();
  const envScopeInputId = useId();
  const limitInputId = useId();
  const adminFilterHintId = useId();
  const secretsActiveKeyAliasDescId = useId();
  const secretsActiveStatusDescId = useId();
  const secretsActiveEnvScopeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const vm = useAdminSecretsMetadataPage();
  const {
    keyAlias,
    status,
    envScope,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftKeyAlias,
    setDraftKeyAlias,
    draftStatus,
    setDraftStatus,
    draftEnvScope,
    setDraftEnvScope,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_secrets_meta_title")}
      subtitle={t("admin_secrets_meta_subtitle_l5")}
      headerAside={
        <AdminInboxQueueBackLinks />
      }
    >
      <AdminSecretsMetadataFiltersCard
        keyAliasInputId={keyAliasInputId}
        statusSelectId={statusSelectId}
        envScopeInputId={envScopeInputId}
        limitInputId={limitInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        secretsActiveKeyAliasDescId={secretsActiveKeyAliasDescId}
        secretsActiveStatusDescId={secretsActiveStatusDescId}
        secretsActiveEnvScopeDescId={secretsActiveEnvScopeDescId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        keyAlias={keyAlias}
        status={status}
        envScope={envScope}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftKeyAlias={draftKeyAlias}
        setDraftKeyAlias={setDraftKeyAlias}
        draftStatus={draftStatus}
        setDraftStatus={setDraftStatus}
        draftEnvScope={draftEnvScope}
        setDraftEnvScope={setDraftEnvScope}
        apply={apply}
        clearNonLimitFilters={clearNonLimitFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <AdminSecretsMetadataFiltersTail
        adminFilterHintId={adminFilterHintId}
        secretsActiveKeyAliasDescId={secretsActiveKeyAliasDescId}
        secretsActiveStatusDescId={secretsActiveStatusDescId}
        secretsActiveEnvScopeDescId={secretsActiveEnvScopeDescId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        keyAlias={keyAlias}
        status={status}
        envScope={envScope}
        appliedFilters={appliedFilters}
      />
      <AdminSecretsMetadataMetaNote meta={meta} />

      <AdminConfigPublishApprovalNotice />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_secrets_meta_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!error && (!loading || items.length > 0) ? (
        <AdminSecretsMetadataTableSection items={items} refreshing={refreshing} />
      ) : null}
    </AdminListPageChrome>
  );
}
