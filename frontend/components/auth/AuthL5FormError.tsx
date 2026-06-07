"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

export type AuthL5FormErrorProps = {
  id: string;
  message: string;
  surface: string;
};

/** Login/register form errors: localized copy + assertive live region for screen readers. */
export default function AuthL5FormError({ id, message, surface }: AuthL5FormErrorProps) {
  return (
    <p
      id={id}
      className={`${TT_AUTH_L5_FORM.error} whitespace-pre-line`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-tt-auth-surface={surface}
    >
      {message}
    </p>
  );
}
