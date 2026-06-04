"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import { AdminMediaSignedUrlTokensFiltersCard } from "./AdminMediaSignedUrlTokensFiltersCard";
import { AdminMediaSignedUrlTokensMetaNote } from "./AdminMediaSignedUrlTokensMetaNote";
import { AdminMediaSignedUrlTokensTableSection } from "./AdminMediaSignedUrlTokensTableSection";
import { useAdminMediaSignedUrlTokensPage } from "./useAdminMediaSignedUrlTokensPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 270 / 70：`signed_url_tokens` 签发台账只读（须 admin + DB）。 */
export function AdminMediaSignedUrlTokensPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const objectInputId = useId();
  const scopeInputId = useId();
  const issuedInputId = useId();
  const tokenInputId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const vm = useAdminMediaSignedUrlTokensPage();
  const { loading, error, items, meta } = vm;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_media_signed_url_tokens_title")}
      subtitle={t("admin_media_signed_url_tokens_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/media/access-logs"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_media_signed_url_tokens_link_logs")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_media_signed_url_tokens_back")}
          </Link>
        </>
      }
    >
      <AdminMediaSignedUrlTokensFiltersCard
        vm={vm}
        limitInputId={limitInputId}
        objectInputId={objectInputId}
        scopeInputId={scopeInputId}
        issuedInputId={issuedInputId}
        tokenInputId={tokenInputId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        adminListApplyResetHintId={adminListApplyResetHintId}
      />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_media_signed_url_tokens_loading")} />
      ) : null}
      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      <AdminMediaSignedUrlTokensMetaNote loading={loading} error={error} meta={meta} />
      <AdminMediaSignedUrlTokensTableSection loading={loading} error={error} items={items} />
    </AdminListPageChrome>
  );
}
