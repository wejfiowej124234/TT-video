"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { disputeStatusLabelKey, DISPUTE_STATUS_FLOW } from "@/lib/admin/adminDisputesLabels";
import { ADMIN_DISPUTE_STATUS_ACTIVE_CLASS,
  ADMIN_CONSOLE_MUTED_PANEL_CLASS,
  ADMIN_WIZARD_STEP_IDLE_CLASS,
  ADMIN_WIZARD_STEP_DONE_CLASS,} from "@/lib/adminUi";

export function AdminDisputeDetailTimeline(props: {
  status: string | undefined;
  createdAt?: string;
}) {
  const { t } = useTranslation();
  const current = (props.status ?? "").trim().toLowerCase();
  const idx = DISPUTE_STATUS_FLOW.indexOf(current as (typeof DISPUTE_STATUS_FLOW)[number]);

  return (
    <div
      className={`mt-4 ${ADMIN_CONSOLE_MUTED_PANEL_CLASS} p-4`}
      data-tt-admin-dispute-timeline="1"
      aria-label={t("admin_dispute_timeline_aria")}
    >
      <h3 className="text-small font-semibold text-ink-900">{t("admin_dispute_timeline_title")}</h3>
      <p className="mt-1 text-meta text-ink-600">{t("admin_dispute_timeline_hint")}</p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {DISPUTE_STATUS_FLOW.map((step, i) => {
          const active = step === current;
          const past = idx >= 0 && i < idx;
          return (
            <li
              key={step}
              className={`rounded-full border px-3 py-1 text-small font-medium ${
                active
                  ? ADMIN_DISPUTE_STATUS_ACTIVE_CLASS
                  : past
                    ? ADMIN_WIZARD_STEP_DONE_CLASS
                    : ADMIN_WIZARD_STEP_IDLE_CLASS
              }`}
            >
              {t(disputeStatusLabelKey(step))}
            </li>
          );
        })}
      </ol>
      {props.createdAt ? (
        <p className="mt-2 text-meta text-ink-500">
          {t("admin_dispute_timeline_created")}: {props.createdAt}
        </p>
      ) : null}
    </div>
  );
}
