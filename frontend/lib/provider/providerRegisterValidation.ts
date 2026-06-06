import { isAllowedProductIso3166 } from "@/lib/productCountries";
import { isValidWalletAddress } from "@/app/guide/register/utils";
import { cityOptionsForCountryIso } from "@/lib/guide/guideRegisterGeo";
import {
  buildProviderAddressPayload,
  kybRuleForCountry,
  PROVIDER_ENTITY_COMPANY,
  PROVIDER_ENTITY_INDIVIDUAL,
  PROVIDER_ID_TYPE_NATIONAL_ID,
  PROVIDER_ID_TYPE_PASSPORT,
  type BeneficialOwnerInput,
} from "@/lib/provider/providerKybRules";

export type ProviderRegisterStep = 1 | 2 | 3;

export type ProviderRegisterFieldKey =
  | "wallet"
  | "legalName"
  | "entityType"
  | "registrationNumber"
  | "businessLicense"
  | "travelAgencyPermit"
  | "legalRepresentativeId"
  | "registeredAddressLine1"
  | "operatingAddressLine1"
  | "country"
  | "city"
  | "contactName"
  | "contactPhone"
  | "contactEmail"
  | "beneficialOwnerName"
  | "beneficialOwnerId"
  | "beneficialOwnerDoc"
  | "shopName"
  | "categories"
  | "agree"
  | "login";

export type ProviderRegisterValidationFailure = {
  messageKey: string;
  field: ProviderRegisterFieldKey;
};

export function isProviderAlreadyActive(role: string | null | undefined): boolean {
  return role?.toLowerCase() === "provider";
}

export function isProviderApplicationPending(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "submitted" || s === "reviewing" || s === "pending";
}

export function isProviderApplicationRejected(status: string | null | undefined): boolean {
  return status?.toLowerCase() === "rejected";
}

export type ProviderRegisterStep1Input = {
  legalName: string;
  entityType: string;
  registrationNumber: string;
  businessLicenseFile: File | null;
  pendingBusinessLicenseName: string | null;
  walletAddress: string;
  walletVerified: boolean;
};

export type ProviderRegisterStep2Input = {
  countryCode: string;
  city: string;
  registeredAddressLine1: string;
  registeredAddressLine2: string;
  registeredPostalCode: string;
  operatingSameAsRegistered: boolean;
  operatingAddressLine1: string;
  operatingAddressLine2: string;
  operatingCity: string;
  operatingPostalCode: string;
  travelAgencyPermitFile: File | null;
  pendingTravelAgencyPermitName: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export type ProviderRegisterStep3Input = {
  entityType: string;
  shopName: string;
  agree: boolean;
  beneficialOwner: BeneficialOwnerInput;
  legalRepresentativeIdFile: File | null;
  pendingLegalRepresentativeIdName: string | null;
};

export function validateProviderRegisterStep1(
  input: ProviderRegisterStep1Input,
): ProviderRegisterValidationFailure | null {
  if (!input.legalName.trim()) {
    return { messageKey: "providerRegister_errorLegalName", field: "legalName" };
  }
  if (!input.entityType.trim()) {
    return { messageKey: "providerRegister_errorEntityType", field: "entityType" };
  }
  if (!input.registrationNumber.trim()) {
    return { messageKey: "providerRegister_errorRegistrationNumber", field: "registrationNumber" };
  }
  if (!input.businessLicenseFile && !input.pendingBusinessLicenseName) {
    return { messageKey: "providerRegister_errorBusinessLicense", field: "businessLicense" };
  }
  const wallet = input.walletAddress.trim();
  if (!wallet) return { messageKey: "providerRegister_errorWalletRequired", field: "wallet" };
  if (!isValidWalletAddress(wallet)) return { messageKey: "providerRegister_errorWallet", field: "wallet" };
  if (!input.walletVerified) return { messageKey: "providerRegister_walletVerifyRequired", field: "wallet" };
  return null;
}

export function validateProviderRegisterStep2(
  input: ProviderRegisterStep2Input,
): ProviderRegisterValidationFailure | null {
  if (!input.countryCode.trim() || !isAllowedProductIso3166(input.countryCode)) {
    return { messageKey: "providerRegister_errorCountry", field: "country" };
  }
  const city = input.city.trim();
  if (!city) return { messageKey: "providerRegister_errorCity", field: "city" };
  const allowed = cityOptionsForCountryIso(input.countryCode);
  if (allowed.length > 0 && !allowed.some((c) => c.value === city)) {
    return { messageKey: "providerRegister_errorCity", field: "city" };
  }
  const registered = buildProviderAddressPayload({
    line1: input.registeredAddressLine1,
    line2: input.registeredAddressLine2,
    city,
    postalCode: input.registeredPostalCode,
    countryCode: input.countryCode,
  });
  if (!registered) {
    return { messageKey: "providerRegister_errorRegisteredAddress", field: "registeredAddressLine1" };
  }
  if (registered.city !== city) {
    return { messageKey: "providerRegister_errorRegisteredCityMismatch", field: "city" };
  }
  if (
    kybRuleForCountry(input.countryCode).requiresTravelAgencyPermit &&
    !input.travelAgencyPermitFile &&
    !input.pendingTravelAgencyPermitName
  ) {
    return {
      messageKey: "providerRegister_errorTravelAgencyPermit",
      field: "travelAgencyPermit",
    };
  }
  if (!input.operatingSameAsRegistered) {
    const opCity = input.operatingCity.trim() || city;
    const operating = buildProviderAddressPayload({
      line1: input.operatingAddressLine1,
      line2: input.operatingAddressLine2,
      city: opCity,
      postalCode: input.operatingPostalCode,
      countryCode: input.countryCode,
    });
    if (!operating) {
      return { messageKey: "providerRegister_errorOperatingAddress", field: "operatingAddressLine1" };
    }
  }
  if (!input.contactName.trim()) {
    return { messageKey: "providerRegister_errorContactName", field: "contactName" };
  }
  if (!input.contactPhone.trim()) {
    return { messageKey: "providerRegister_errorContactPhone", field: "contactPhone" };
  }
  const email = input.contactEmail.trim();
  if (!email.includes("@")) {
    return { messageKey: "providerRegister_errorContactEmail", field: "contactEmail" };
  }
  return null;
}

export function validateProviderRegisterStep3(
  input: ProviderRegisterStep3Input,
): ProviderRegisterValidationFailure | null {
  if (!input.shopName.trim()) return { messageKey: "providerRegister_errorShopName", field: "shopName" };
  if (!input.agree) return { messageKey: "providerRegister_errorAgree", field: "agree" };

  const entity = input.entityType.trim().toLowerCase();
  if (entity === PROVIDER_ENTITY_COMPANY) {
    const owner = input.beneficialOwner;
    if (!owner.fullName.trim()) {
      return { messageKey: "providerRegister_errorBeneficialOwnerName", field: "beneficialOwnerName" };
    }
    const idType = owner.idType.trim().toLowerCase();
    if (idType !== PROVIDER_ID_TYPE_PASSPORT && idType !== PROVIDER_ID_TYPE_NATIONAL_ID) {
      return { messageKey: "providerRegister_errorBeneficialOwnerIdType", field: "beneficialOwnerId" };
    }
    if (!owner.idNumber.trim()) {
      return { messageKey: "providerRegister_errorBeneficialOwnerIdNumber", field: "beneficialOwnerId" };
    }
    if (!owner.idDocFile && !owner.pendingIdDocName) {
      return { messageKey: "providerRegister_errorBeneficialOwnerDoc", field: "beneficialOwnerDoc" };
    }
  } else if (entity === PROVIDER_ENTITY_INDIVIDUAL) {
    if (!input.legalRepresentativeIdFile && !input.pendingLegalRepresentativeIdName) {
      return {
        messageKey: "providerRegister_errorLegalRepresentativeId",
        field: "legalRepresentativeId",
      };
    }
  }
  return null;
}

export function parseProviderRegisterStepParam(raw: string | null): ProviderRegisterStep {
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}
