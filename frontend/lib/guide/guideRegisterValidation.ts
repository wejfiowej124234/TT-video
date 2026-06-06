import { isAllowedProductIso3166 } from "@/lib/productCountries";
import { isValidWalletAddress } from "@/app/guide/register/utils";
import { cityOptionsForCountryIso } from "./guideRegisterGeo";

export type GuideRegisterStep = 1 | 2 | 3;

export type GuideRegisterFieldKey =
  | "wallet"
  | "realName"
  | "passportNumber"
  | "passportPhoto"
  | "country"
  | "city"
  | "languages"
  | "serviceTypes"
  | "agree"
  | "login";

export type GuideRegisterValidationFailure = {
  messageKey: string;
  field: GuideRegisterFieldKey;
};

export function isGuideAlreadyRegistered(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "active" || s === "approved";
}

export function isGuidePendingReview(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "pending" || s === "pending_review" || s === "reviewing" || s === "submitted";
}

export function isGuideRejected(status: string | null | undefined): boolean {
  if (!status) return false;
  return status.toLowerCase() === "rejected";
}

export function isGuideSuspended(status: string | null | undefined): boolean {
  if (!status) return false;
  return status.toLowerCase() === "suspended";
}

export type GuideRegisterStep1Input = {
  walletAddress: string;
  realName: string;
  idNumber: string;
  idPhotoFile: File | null;
  pendingIdPhoto: string | null;
  walletVerified: boolean;
};

export type GuideRegisterStep2Input = {
  city: string;
  countryCode: string;
  languages: string;
  serviceTypes: string;
};

export function validateGuideRegisterStep1(input: GuideRegisterStep1Input): GuideRegisterValidationFailure | null {
  const wallet = input.walletAddress.trim();
  if (!wallet) return { messageKey: "guideRegister_errorWalletRequired", field: "wallet" };
  if (!isValidWalletAddress(wallet)) return { messageKey: "guideRegister_errorWallet", field: "wallet" };
  if (!input.walletVerified) return { messageKey: "guideRegister_walletVerifyRequired", field: "wallet" };
  if (!input.realName.trim()) return { messageKey: "guideRegister_errorRealName", field: "realName" };
  if (!input.idNumber.trim()) return { messageKey: "guideRegister_errorPassportNumber", field: "passportNumber" };
  if (!input.idPhotoFile && !input.pendingIdPhoto) {
    return { messageKey: "guideRegister_passportPhotoRequired", field: "passportPhoto" };
  }
  return null;
}

export function validateGuideRegisterStep2(input: GuideRegisterStep2Input): GuideRegisterValidationFailure | null {
  if (!input.countryCode.trim() || !isAllowedProductIso3166(input.countryCode)) {
    return { messageKey: "guideRegister_errorCountry", field: "country" };
  }
  const city = input.city.trim();
  if (!city) return { messageKey: "guideRegister_errorCity", field: "city" };
  const allowed = cityOptionsForCountryIso(input.countryCode);
  if (allowed.length > 0 && !allowed.some((c) => c.value === city)) {
    return { messageKey: "guideRegister_errorCityForCountry", field: "city" };
  }
  if (!input.languages.trim()) return { messageKey: "guideRegister_errorLanguages", field: "languages" };
  if (!input.serviceTypes.trim()) return { messageKey: "guideRegister_errorServiceTypes", field: "serviceTypes" };
  return null;
}

export function isKycBlockingGuideApply(kycStatus: string | null | undefined, requireVerified: boolean): boolean {
  if (!kycStatus) return requireVerified;
  const s = kycStatus.toLowerCase();
  if (s === "suspended" || s === "rejected") return true;
  if (requireVerified && s !== "verified") return true;
  return false;
}
