"use client";

import { useState, useRef, useEffect } from "react";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

export interface GlassSelectOption {
  value: string | number;
  label: string;
}

/** 自定义下拉：深色背景（触发区与展开列表），白字可读 */
export default function GlassSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel =
    value !== "" && value !== undefined
      ? options.find((o) => o.value === value)?.label ?? String(value)
      : placeholder ?? "";

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const triggerClass = TT_MARKETING_MARKET_DARK_PATH.glassSelectTrigger;
  const panelClass = TT_MARKETING_MARKET_DARK_PATH.glassSelectPanel;
  const optionBase =
    "px-3 py-2 text-small text-white cursor-pointer hover:bg-ref-sun/12 focus:outline-none";
  const optionSelected = TT_MARKETING_MARKET_DARK_PATH.glassSelectOptionSelected;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? placeholder}
        onClick={() => setOpen((o) => !o)}
        className={`${triggerClass} ${className ?? ""} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <span className={currentLabel ? "" : "text-white/50"}>{currentLabel || placeholder}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-white/80 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
        {open && (
        <ul
          role="listbox"
          aria-activedescendant={value !== "" && value !== undefined ? `${id}-opt-${value}` : undefined}
          className={panelClass}
        >
          {placeholder != null && placeholder !== "" && (
            <li
              role="option"
              aria-selected={value === ""}
              className={`${optionBase} ${value === "" ? optionSelected : ""}`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {placeholder}
            </li>
          )}
          {options.map((opt) => (
            <li
              key={String(opt.value)}
              id={value === opt.value ? `${id}-opt-${opt.value}` : undefined}
              role="option"
              aria-selected={value === opt.value}
              className={`${optionBase} ${value === opt.value ? optionSelected : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
