import type { GuideRegisterStep } from "./guideRegisterValidation";

/** 页内草稿（仅字段，不含文件 base64）· 与 DB `guides` / `role_applications` 提交分离 */
export const GUIDE_REGISTER_DRAFT_KEY = "traveltrust_guide_register_draft_v1";

export type GuideRegisterDraft = {
  v: 1;
  step?: GuideRegisterStep;
  walletAddress?: string;
  realName?: string;
  idNumber?: string;
  city?: string;
  countryCode?: string;
  languages?: string;
  serviceTypes?: string;
  bio?: string;
  guideLicenseUrl?: string;
  pendingIdPhotoName?: string | null;
  pendingLangCertName?: string | null;
};

export function readGuideRegisterDraft(): GuideRegisterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUIDE_REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GuideRegisterDraft;
    if (data?.v !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeGuideRegisterDraft(draft: GuideRegisterDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUIDE_REGISTER_DRAFT_KEY, JSON.stringify({ v: 1, ...draft }));
  } catch {
    /* quota */
  }
}

export function clearGuideRegisterDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUIDE_REGISTER_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function parseGuideRegisterStepParam(raw: string | null): GuideRegisterStep {
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}
