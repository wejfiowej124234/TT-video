import type { ProviderRegisterStep } from "./providerRegisterValidation";



export const PROVIDER_REGISTER_DRAFT_KEY = "traveltrust_provider_register_draft_v1";



export type ProviderRegisterDraft = {

  v: 1;

  step?: ProviderRegisterStep;

  legalName?: string;

  entityType?: string;

  registrationNumber?: string;

  taxId?: string;

  countryCode?: string;

  city?: string;

  registeredAddressLine1?: string;

  registeredAddressLine2?: string;

  registeredPostalCode?: string;

  operatingSameAsRegistered?: boolean;

  operatingAddressLine1?: string;

  beneficialOwnerFullName?: string;

  beneficialOwnerIdType?: string;

  beneficialOwnerIdNumber?: string;

  contactName?: string;

  contactPhone?: string;

  contactEmail?: string;

  shopName?: string;

  categories?: string;

  bio?: string;

  walletAddress?: string;

  pendingBusinessLicenseName?: string | null;

  pendingTravelAgencyPermitName?: string | null;

};



export function readProviderRegisterDraft(): ProviderRegisterDraft | null {

  if (typeof window === "undefined") return null;

  try {

    const raw = window.sessionStorage.getItem(PROVIDER_REGISTER_DRAFT_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw) as ProviderRegisterDraft;

    if (data?.v !== 1) return null;

    return data;

  } catch {

    return null;

  }

}



export function writeProviderRegisterDraft(draft: ProviderRegisterDraft): void {

  if (typeof window === "undefined") return;

  try {

    window.sessionStorage.setItem(PROVIDER_REGISTER_DRAFT_KEY, JSON.stringify({ v: 1, ...draft }));

  } catch {

    /* quota */

  }

}



export function clearProviderRegisterDraft(): void {

  if (typeof window === "undefined") return;

  try {

    window.sessionStorage.removeItem(PROVIDER_REGISTER_DRAFT_KEY);

  } catch {

    /* ignore */

  }

}

