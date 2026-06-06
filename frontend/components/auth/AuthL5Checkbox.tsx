"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Auth L5 自定义勾选：整行 44px 可点，无原生白底 */
export default function AuthL5Checkbox({
  id,
  checked,
  onChange,
  disabled,
  label,
  labelClassName = TT_AUTH_L5_FORM.rememberLabel,
  className = TT_AUTH_L5_FORM.rememberRowHit,
  /** 含链接等复杂内容时用 `div` + `rememberRow` */
  asRow = false,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: React.ReactNode;
  labelClassName?: string;
  className?: string;
  asRow?: boolean;
}) {
  const track = (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={`${TT_AUTH_L5_FORM.checkboxTrack} ${TT_AUTH_L5_FORM.checkboxTrackFocus} shrink-0 ${
        checked ? TT_AUTH_L5_FORM.checkboxTrackChecked : ""
      }`}
    >
      {checked ? <CheckIcon className={TT_AUTH_L5_FORM.checkboxIcon} /> : null}
    </button>
  );

  if (asRow) {
    return (
      <div className={`${className} ${disabled ? "pointer-events-none opacity-55" : ""}`}>
        {track}
        <span className={labelClassName}>{label}</span>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      className={`${className} ${disabled ? "pointer-events-none opacity-55" : ""}`}
    >
      {track}
      <span className={labelClassName}>{label}</span>
    </label>
  );
}
