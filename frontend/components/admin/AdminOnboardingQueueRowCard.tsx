"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { formatAdminAbsoluteTime } from "@/lib/admin/formatAdminAbsoluteTime";
import { formatRelativeAge } from "@/lib/admin/formatRelativeAge";
import {
  onboardingApplicationDetailHref,
  onboardingQueueTechIds,
  resolveOnboardingQueueKeyFieldsPreview,
  resolveOnboardingQueuePrimaryLabel,
  type OnboardingQueueKind,
  type OnboardingQueueRowInput,
} from "@/lib/admin/adminOnboardingQueueRowDisplay";
import {
  ADMIN_QUEUE_LIST_ROW_CARD_CLASS,
  ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS,
  adminTableRowPrimaryActionClass,
} from "@/lib/adminUi";

type Props = {
  kind: OnboardingQueueKind;
  row: OnboardingQueueRowInput;
  statusLabelKey: string;
  reviewLinkKey: string;
  reviewAriaKey: string;
};

function statusBadgeClass(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "submitted" || s === "reviewing" || s === "stake_pending" || s === "pending") {
    return ADMIN_QUEUE_STATUS_ATTENTION_BADGE_CLASS;
  }
  if (s === "approved") return ADMIN_QUEUE_STATUS_SUCCESS_BADGE_CLASS;
  if (s === "rejected") return ADMIN_QUEUE_STATUS_DANGER_BADGE_CLASS;
  return ADMIN_QUEUE_STATUS_NEUTRAL_BADGE_CLASS;
}

export function AdminOnboardingQueueRowCard({
  kind,
  row,
  statusLabelKey,
  reviewLinkKey,
  reviewAriaKey,
}: Props) {
  const { t } = useTranslation();
  const uid = row.user_id ?? "";
  const app = row.application;
  const primary = resolveOnboardingQueuePrimaryLabel(kind, row);
  const keyFields = resolveOnboardingQueueKeyFieldsPreview(kind, row);
  const tech = onboardingQueueTechIds(row);
  const status = app?.status;
  const submittedAt = app?.submitted_at;

  return (
    <li className={ADMIN_QUEUE_LIST_ROW_CARD_CLASS} data-tt-admin-onboarding-queue-row={kind}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold text-[#ffe8d4] break-words">{primary}</p>
          {keyFields.length > 0 ? (
            <p
              className="mt-1 text-meta text-ink-400"
              data-tt-admin-onboarding-key-fields="1"
              data-testid="admin-onboarding-key-fields"
            >
              {keyFields.join(" · ")}
            </p>
          ) : null}
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-small text-ink-400">
            <span className="text-ink-500">{t(statusLabelKey)}</span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-meta font-medium ${statusBadgeClass(status)}`}
            >
              {status ?? "—"}
            </span>
            {submittedAt ? (
              <span className="text-meta text-ink-500">
                {t("admin_queue_wait_age", { age: formatRelativeAge(submittedAt) })}
              </span>
            ) : null}
          </p>
          {submittedAt ? (
            <p className="mt-1 text-meta text-ink-500">{formatAdminAbsoluteTime(submittedAt)}</p>
          ) : null}
          {(tech.email || tech.userId) && primary !== tech.email && primary !== tech.userId ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-meta text-ink-500">
                {t("admin_onboarding_queue_tech_fold")}
              </summary>
              <div className="mt-1 space-y-0.5 font-mono text-meta text-ink-500 break-all">
                {tech.email ? <p>{tech.email}</p> : null}
                {tech.userId ? <p>{tech.userId}</p> : null}
              </div>
            </details>
          ) : tech.email || tech.userId ? (
            <p className="mt-1 font-mono text-meta text-ink-500 break-all">
              {tech.email || tech.userId}
            </p>
          ) : null}
        </div>
        <Link
          href={onboardingApplicationDetailHref(kind, uid)}
          className={adminTableRowPrimaryActionClass()}
          aria-label={t(reviewAriaKey, { id: uid })}
          data-tt-admin-onboarding-detail-link={kind}
        >
          {t(reviewLinkKey)}
        </Link>
      </div>
    </li>
  );
}
