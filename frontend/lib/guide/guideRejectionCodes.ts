/** Admin `rejection_codes` → i18n（① 本地展示） */
const CODE_TO_KEY: Record<string, string> = {
  DOC_BLUR: "guideRegister_rejection_DOC_BLUR",
  DOC_EXPIRED: "guideRegister_rejection_DOC_EXPIRED",
  DOC_MISMATCH: "guideRegister_rejection_DOC_MISMATCH",
  ID_MISMATCH: "guideRegister_rejection_ID_MISMATCH",
  WALLET_RISK: "guideRegister_rejection_WALLET_RISK",
  INCOMPLETE: "guideRegister_rejection_INCOMPLETE",
};

export function guideRejectionCodeLabel(t: (k: string) => string, code: string): string {
  const norm = code.trim().toUpperCase().replace(/-/g, "_");
  const key = CODE_TO_KEY[norm] ?? "guideRegister_rejection_generic";
  return t(key);
}
