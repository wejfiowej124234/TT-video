"use client";

export function AdminUsersPageHeader({
  pageTitleId,
  t,
}: {
  pageTitleId: string;
  t: (key: string) => string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
          {t("admin_users_title")}
        </h1>
        <p className="mt-1 text-body text-ink-600">{t("admin_users_subtitle_l5")}</p>
      </div>
    </header>
  );
}
