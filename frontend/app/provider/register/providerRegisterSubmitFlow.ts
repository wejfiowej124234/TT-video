import { clearGetMeCache, postGuideUploadDoc, postProviderApplication } from "@/lib/apiClient";
import { clearProviderRegisterDraft } from "@/lib/provider/providerRegisterDraft";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { compressGuideRegisterImageFile } from "@/lib/guide/compressGuideRegisterImage";
import { MAX_FILE_SIZE } from "@/app/guide/register/constants";
import { fileToBase64 } from "@/app/guide/register/utils";
import { buildProviderAddressPayload, PROVIDER_ENTITY_COMPANY } from "@/lib/provider/providerKybRules";
import type { PostProviderApplicationBody } from "@/lib/apiClient/providerApplications";

export type ProviderRegisterT = (key: string) => string;

async function uploadDocFile(file: File): Promise<string | undefined> {
  const compressed = await compressGuideRegisterImageFile(file, MAX_FILE_SIZE);
  const b64 = await fileToBase64(compressed, MAX_FILE_SIZE);
  const up = await postGuideUploadDoc({
    content_base64: b64,
    filename: compressed.name,
  });
  return up.url;
}

export type ProviderRegisterSubmitInput = {
  t: ProviderRegisterT;
  legalName: string;
  entityType: string;
  registrationNumber: string;
  taxId: string;
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
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  shopName: string;
  categories: string;
  bio: string;
  walletAddress: string;
  businessLicenseFile: File | null;
  travelAgencyPermitFile: File | null;
  insuranceFile: File | null;
  legalRepresentativeIdFile: File | null;
  beneficialOwnerFullName: string;
  beneficialOwnerIdType: string;
  beneficialOwnerIdNumber: string;
  beneficialOwnerIdDocFile: File | null;
  setError: (msg: string | null) => void;
  setDone: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setUploadPhase: (p: "idle" | "uploading" | "submitting") => void;
};

export async function runProviderRegisterSubmitFlow(input: ProviderRegisterSubmitInput): Promise<void> {
  const {
    t,
    legalName,
    entityType,
    registrationNumber,
    taxId,
    countryCode,
    city,
    registeredAddressLine1,
    registeredAddressLine2,
    registeredPostalCode,
    operatingSameAsRegistered,
    operatingAddressLine1,
    operatingAddressLine2,
    operatingCity,
    operatingPostalCode,
    contactName,
    contactPhone,
    contactEmail,
    shopName,
    categories,
    bio,
    walletAddress,
    businessLicenseFile,
    travelAgencyPermitFile,
    insuranceFile,
    legalRepresentativeIdFile,
    beneficialOwnerFullName,
    beneficialOwnerIdType,
    beneficialOwnerIdNumber,
    beneficialOwnerIdDocFile,
    setError,
    setDone,
    setLoading,
    setUploadPhase,
  } = input;

  const registered = buildProviderAddressPayload({
    line1: registeredAddressLine1,
    line2: registeredAddressLine2,
    city: city.trim(),
    postalCode: registeredPostalCode,
    countryCode,
  });
  if (!registered) {
    setError(t("providerRegister_errorRegisteredAddress"));
    return;
  }

  const operatingPayload = operatingSameAsRegistered
    ? registered
    : buildProviderAddressPayload({
        line1: operatingAddressLine1,
        line2: operatingAddressLine2,
        city: (operatingCity.trim() || city.trim()),
        postalCode: operatingPostalCode,
        countryCode,
      });
  if (!operatingPayload) {
    setError(t("providerRegister_errorOperatingAddress"));
    return;
  }

  try {
    setUploadPhase("uploading");
    let businessLicenseUrl: string | undefined;
    let travelAgencyPermitUrl: string | undefined;
    let insuranceUrl: string | undefined;
    let legalRepresentativeIdUrl: string | undefined;
    let beneficialOwnerIdDocUrl: string | undefined;

    if (businessLicenseFile) {
      businessLicenseUrl = await uploadDocFile(businessLicenseFile);
    }
    if (!businessLicenseUrl) {
      setError(t("providerRegister_errorBusinessLicense"));
      return;
    }

    if (travelAgencyPermitFile) {
      travelAgencyPermitUrl = await uploadDocFile(travelAgencyPermitFile);
    }

    if (insuranceFile) {
      insuranceUrl = await uploadDocFile(insuranceFile);
    }

    if (legalRepresentativeIdFile) {
      legalRepresentativeIdUrl = await uploadDocFile(legalRepresentativeIdFile);
    }

    if (beneficialOwnerIdDocFile) {
      beneficialOwnerIdDocUrl = await uploadDocFile(beneficialOwnerIdDocFile);
    }

    setUploadPhase("submitting");

    const body: PostProviderApplicationBody = {
      legal_name: legalName.trim(),
      entity_type: entityType.trim(),
      registration_number: registrationNumber.trim(),
      country_code: registered.countryCode,
      city: registered.city,
      registered_address: {
        line1: registered.line1,
        line2: registered.line2,
        city: registered.city,
        postal_code: registered.postalCode,
        country_code: registered.countryCode,
      },
      operating_same_as_registered: operatingSameAsRegistered,
      operating_address: operatingSameAsRegistered
        ? undefined
        : {
            line1: operatingPayload.line1,
            line2: operatingPayload.line2,
            city: operatingPayload.city,
            postal_code: operatingPayload.postalCode,
            country_code: operatingPayload.countryCode,
          },
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      shop_name: shopName.trim(),
      categories: categories.trim() || undefined,
      bio: bio.trim() || undefined,
      wallet_address: walletAddress.trim(),
      tax_id: taxId.trim() || undefined,
      business_license_url: businessLicenseUrl,
      insurance_url: insuranceUrl,
      travel_agency_permit_url: travelAgencyPermitUrl,
      legal_representative_id_url: legalRepresentativeIdUrl,
      beneficial_owners:
        entityType.trim().toLowerCase() === PROVIDER_ENTITY_COMPANY && beneficialOwnerIdDocUrl
          ? [
              {
                full_name: beneficialOwnerFullName.trim(),
                id_type: beneficialOwnerIdType.trim(),
                id_number: beneficialOwnerIdNumber.trim(),
                id_doc_url: beneficialOwnerIdDocUrl,
              },
            ]
          : [],
    };

    await postProviderApplication(body);

    clearProviderRegisterDraft();
    clearGetMeCache();
    setDone(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "provider_application_failed";
    if (msg === "provider_application_pending") {
      setError(t("providerRegister_errorPending"));
    } else if (msg === "provider_application_already_provider") {
      setError(t("providerRegister_errorAlreadyProvider"));
    } else if (msg === "provider_application_travel_agency_permit_required") {
      setError(t("providerRegister_errorTravelAgencyPermit"));
    } else if (msg === "provider_application_beneficial_owners_required") {
      setError(t("providerRegister_errorBeneficialOwnerDoc"));
    } else if (msg === "provider_application_legal_representative_id_required") {
      setError(t("providerRegister_errorLegalRepresentativeId"));
    } else {
      setError(mapApiReadError(err, t, "providerRegister_submitFailed"));
    }
  } finally {
    setUploadPhase("idle");
    setLoading(false);
  }
}
