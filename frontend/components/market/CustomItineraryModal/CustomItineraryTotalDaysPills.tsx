"use client";

import { TOTAL_DAYS_OPTIONS } from "./constants";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

type Props = {
  value: number;
  onChange: (days: number) => void;
  pillSelected: string;
  pillIdle: string;
  focusRingClass: string;
  groupAriaLabel: string;
  dayLabel: (n: number) => string;
};

/** 总天数：与英雄区「快捷天数」同 pill 语法，避免仅 GlassSelect 难对齐 */
export default function CustomItineraryTotalDaysPills({
  value,
  onChange,
  pillSelected,
  pillIdle,
  focusRingClass,
  groupAriaLabel,
  dayLabel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={groupAriaLabel}>
      {TOTAL_DAYS_OPTIONS.map((d) => {
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(d)}
            className={`${touchTargetLink44Classes} ${active ? pillSelected : `${pillIdle} ${focusRingClass}`}`}
          >
            {dayLabel(d)}
          </button>
        );
      })}
    </div>
  );
}
