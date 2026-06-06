"use client";

import { guideRegFocusRing, guideRegLabel } from "./guideRegisterUiClasses";

export default function GuideRegisterChipGroup({
  label,
  options,
  selected,
  onToggle,
  t,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
      <legend className={`${guideRegLabel} float-left w-full mb-1`}>{label}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const on = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(opt.value)}
              className={`min-h-[44px] rounded-full border px-3 py-1.5 text-meta font-medium motion-sub ${guideRegFocusRing} ${
                on
                  ? "border-ref-sun/55 bg-ref-sun/20 text-ref-sun"
                  : "border-ref-sun/22 bg-ref-sun/[0.04] text-slate-200 hover:border-ref-sun/35"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {selected.size === 0 ? (
        <p className="text-meta text-slate-400">{t("guideRegister_chipSelectHint")}</p>
      ) : null}
    </fieldset>
  );
}
