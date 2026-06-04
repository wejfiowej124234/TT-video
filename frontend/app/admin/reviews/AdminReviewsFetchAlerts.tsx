"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

type Props = {
  error: AdminFetchErrorKind | null;
  itemsNotArrayError: boolean;
};

export function AdminReviewsFetchAlerts({ error, itemsNotArrayError }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {error ? (
        <div className="mt-6">
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        </div>
      ) : null}

      {!error && itemsNotArrayError ? (
        <AdminNoticeBanner className="mt-6" tone="warning" message={t("admin_reviews_itemsNotArray")} />
      ) : null}
    </>
  );
}
