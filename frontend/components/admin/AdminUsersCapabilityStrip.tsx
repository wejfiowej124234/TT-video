"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { resolveUsersCapabilityHonesty } from "@/lib/admin/usersSearchSuspendL5";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";

/** Batch-11 HU-424 · 用户页能力诚实条：资料只读 ≠ 收购门闸可写 */
export function AdminUsersCapabilityStrip() {
  const { t } = useTranslation();
  const pack = resolveUsersCapabilityHonesty();

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
      role="note"
      aria-label={t("admin_users_cap_aria")}
      data-tt-admin-users-capability-honesty="1"
      data-tt-admin-users-capability-policy={pack.policy}
    >
      <p className="text-body font-medium text-ink-800">{t("admin_users_cap_title")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_users_cap_lead")}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3" data-tt-admin-users-capability-lanes="1">
        {pack.lanes.map((lane) => (
          <li
            key={lane.id}
            className="rounded-[var(--radius-sm)] border border-ink-200/60 bg-bg-elevated/40 px-3 py-2"
            data-tt-admin-users-capability-lane={lane.id}
            data-tt-admin-users-capability-write={lane.writeKind}
          >
            <p className="text-meta font-medium text-ink-800">{t(lane.titleKey)}</p>
            <p className={`mt-1 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>{t(lane.bodyKey)}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
