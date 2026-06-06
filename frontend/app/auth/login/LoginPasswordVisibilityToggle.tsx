"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12C4.5 7 8.5 4 12 4s7.5 3 10 8c-2.5 5-6.5 8-10 8S4.5 17 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M6.2 6.2C4.5 7.6 3 9.6 2 12c2.5 5 6.5 8 10 8 1.8 0 3.5-.5 5-1.5M9.9 5.1A10.8 10.8 0 0 1 12 4c3.5 0 7.5 3 10 8-.8 1.6-1.9 3-3.2 4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPasswordVisibilityToggle({
  visible,
  onToggle,
  showLabel,
  hideLabel,
  disabled,
}: {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={TT_AUTH_L5_FORM.passwordToggle}
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={visible ? hideLabel : showLabel}
      disabled={disabled}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
