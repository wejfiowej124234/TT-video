const CODE_TO_KEY: Record<string, string> = {
  DOC_BLUR: "providerRegister_rejection_DOC_BLUR",
  DOC_EXPIRED: "providerRegister_rejection_DOC_EXPIRED",
  DOC_MISMATCH: "providerRegister_rejection_DOC_MISMATCH",
  LICENSE_INVALID: "providerRegister_rejection_LICENSE_INVALID",
  KYB_MISMATCH: "providerRegister_rejection_KYB_MISMATCH",
  INCOMPLETE: "providerRegister_rejection_INCOMPLETE",
  SANCTIONS: "providerRegister_rejection_SANCTIONS",
};

export function providerRejectionCodeLabel(t: (k: string) => string, code: string): string {
  const norm = code.trim().toUpperCase().replace(/-/g, "_");
  const key = CODE_TO_KEY[norm] ?? "providerRegister_rejection_generic";
  return t(key);
}
