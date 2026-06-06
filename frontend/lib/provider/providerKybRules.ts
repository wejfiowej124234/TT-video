/**
 * 商家入驻 KYB 分国规则（与 `crates/api/src/chain_off/provider_kyb.rs` 同源 · ① 本地）。
 */
import { isAllowedProductIso3166, type ProductCountryIso } from "@/lib/productCountries";

export const PROVIDER_ENTITY_COMPANY = "company";
export const PROVIDER_ENTITY_INDIVIDUAL = "individual";

export const PROVIDER_ID_TYPE_PASSPORT = "passport";
export const PROVIDER_ID_TYPE_NATIONAL_ID = "national_id";

export type ProviderKybCountryRule = {
  requiresTravelAgencyPermit: boolean;
};

/** CN / TH 须旅行社业务许可证；其余十国仅营业执照。 */
export function kybRuleForCountry(countryCode: string): ProviderKybCountryRule {
  const iso = countryCode.trim().toUpperCase();
  if (iso === "CN" || iso === "TH") {
    return { requiresTravelAgencyPermit: true };
  }
  return { requiresTravelAgencyPermit: false };
}

export type ProviderAddressInput = {
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  countryCode: string;
};

export type BeneficialOwnerInput = {
  fullName: string;
  idType: string;
  idNumber: string;
  idDocFile: File | null;
  pendingIdDocName?: string | null;
};

export function isProviderEntityType(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === PROVIDER_ENTITY_COMPANY || v === PROVIDER_ENTITY_INDIVIDUAL;
}

export function isProviderIdType(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === PROVIDER_ID_TYPE_PASSPORT || v === PROVIDER_ID_TYPE_NATIONAL_ID;
}

export function normalizeProviderCountryCode(code: string): ProductCountryIso | null {
  const iso = code.trim().toUpperCase();
  return isAllowedProductIso3166(iso) ? (iso as ProductCountryIso) : null;
}

export function buildProviderAddressPayload(
  input: ProviderAddressInput,
): ProviderAddressInput | null {
  const countryCode = normalizeProviderCountryCode(input.countryCode);
  const line1 = input.line1.trim();
  const city = input.city.trim();
  if (!countryCode || !line1 || !city) return null;
  return {
    line1,
    line2: input.line2?.trim() || undefined,
    city,
    postalCode: input.postalCode?.trim() || undefined,
    countryCode,
  };
}
