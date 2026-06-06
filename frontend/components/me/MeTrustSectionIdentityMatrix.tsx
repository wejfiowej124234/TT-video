import type { MeIdentitySlot } from "@/lib/meIdentitySlots";
import { meTrustSlotLabelKey, meTrustStateLabelKey, meTrustStatePillClass } from "./meTrustSectionLabels";

export default function MeTrustSectionIdentityMatrix({
  t,
  compact,
  matrixId,
  summaryText,
  travelerSlot,
  stakeSlots,
}: {
  t: (k: string) => string;
  compact: boolean;
  matrixId: string;
  summaryText: string;
  travelerSlot: MeIdentitySlot | undefined;
  stakeSlots: MeIdentitySlot[];
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-success/25 bg-ink-800/45 ${compact ? "mb-2 px-2.5 py-2 sm:px-3" : "mb-4 px-3 py-3 sm:px-4"}`}
      aria-labelledby={matrixId}
    >
      <h3 id={matrixId} className={`font-semibold text-success/95 ${compact ? "text-small mb-0.5" : "text-meta mb-1"}`}>
        {t("me_identity_matrix_title")}
      </h3>
      <p className={`text-slate-400/95 leading-snug ${compact ? "text-[0.65rem] mb-1" : "text-[0.7rem] mb-2 leading-relaxed"}`}>
        {t("me_identity_matrix_subtitle")}
      </p>
      <p className={`text-slate-300/95 leading-snug ${compact ? "text-[0.7rem] mb-2" : "text-meta mb-3 leading-relaxed"}`}>{summaryText}</p>
      <ul className={`grid grid-cols-2 lg:grid-cols-4 list-none p-0 m-0 ${compact ? "gap-2" : "gap-2.5"}`}>
        {travelerSlot ? (
          <li
            className={`col-span-2 lg:col-span-4 rounded-[var(--radius-md)] border border-slate-600/55 bg-ink-900/55 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
              compact ? "px-2.5 py-2" : "px-3 py-3"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-small font-semibold text-slate-100">{t(meTrustSlotLabelKey("traveler"))}</span>
              <span
                className={`inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${meTrustStatePillClass(travelerSlot.state)}`}
              >
                {t(meTrustStateLabelKey(travelerSlot.state))}
              </span>
            </div>
            <p className="text-[0.7rem] text-slate-400/95 leading-snug sm:text-right sm:max-w-[14rem]">
              {t("me_identity_traveler_no_stake_caption")}
            </p>
          </li>
        ) : null}
        {stakeSlots.map((slot) => (
          <li
            key={slot.id}
            className={`rounded-[var(--radius-md)] border border-slate-600/55 bg-ink-900/55 px-2.5 flex flex-col ${
              compact ? "py-2 min-h-[92px]" : "py-2.5 min-h-[104px]"
            }`}
          >
            <span className="text-small font-semibold text-slate-100 leading-tight">{t(meTrustSlotLabelKey(slot.id))}</span>
            <span
              className={`mt-1.5 inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${meTrustStatePillClass(slot.state)}`}
            >
              {t(meTrustStateLabelKey(slot.state))}
            </span>
            <div className="mt-auto pt-2 border-t border-slate-600/40">
              <span className="text-[0.65rem] text-slate-400 block">{t("me_identity_stake_label")}</span>
              <span className="text-meta font-mono text-slate-200/95 break-all">
                {slot.stake_display ?? t("me_identity_stake_empty")}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {!compact ? <p className="text-[0.7rem] text-slate-400/95 mt-2.5 leading-relaxed">{t("me_identity_stake_chain_hint")}</p> : null}
    </div>
  );
}
