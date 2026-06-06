"use client";

import { AuthFullBleedSearchParamsSuspense } from "@/components/auth/AuthSearchParamsSuspense";
import { RegisterPageMain } from "./RegisterPageMain";

export default function RegisterPage() {
  return (
    <AuthFullBleedSearchParamsSuspense mainAriaLabelKey="auth_register_title" variant="register">
      <RegisterPageMain />
    </AuthFullBleedSearchParamsSuspense>
  );
}
