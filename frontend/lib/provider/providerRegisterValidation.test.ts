import { describe, expect, it } from "vitest";
import {
  validateProviderRegisterStep1,
  validateProviderRegisterStep2,
  validateProviderRegisterStep3,
} from "./providerRegisterValidation";
import { kybRuleForCountry } from "./providerKybRules";

describe("providerRegisterValidation", () => {
  it("step1 requires wallet verify and license", () => {
    const fail = validateProviderRegisterStep1({
      legalName: "Acme Travel",
      entityType: "company",
      registrationNumber: "91110000",
      businessLicenseFile: null,
      pendingBusinessLicenseName: null,
      walletAddress: "0x1111111111111111111111111111111111111111",
      walletVerified: false,
    });
    expect(fail?.field).toBe("businessLicense");

    const ok = validateProviderRegisterStep1({
      legalName: "Acme",
      entityType: "company",
      registrationNumber: "91110000",
      businessLicenseFile: new File(["x"], "lic.pdf"),
      pendingBusinessLicenseName: null,
      walletAddress: "0x1111111111111111111111111111111111111111",
      walletVerified: true,
    });
    expect(ok).toBeNull();
  });

  it("step2 requires CN travel agency permit and registered address", () => {
    const base = {
      countryCode: "CN",
      city: "北京",
      registeredAddressLine1: "",
      registeredAddressLine2: "",
      registeredPostalCode: "",
      operatingSameAsRegistered: true,
      operatingAddressLine1: "",
      operatingAddressLine2: "",
      operatingCity: "",
      operatingPostalCode: "",
      travelAgencyPermitFile: null,
      pendingTravelAgencyPermitName: null,
      contactName: "Li",
      contactPhone: "13800000000",
      contactEmail: "a@b.c",
    };
    expect(validateProviderRegisterStep2(base)?.field).toBe("registeredAddressLine1");
    const withAddr = {
      ...base,
      registeredAddressLine1: "朝阳区示例路 1 号",
      travelAgencyPermitFile: new File(["p"], "permit.pdf"),
    };
    expect(validateProviderRegisterStep2(withAddr)).toBeNull();
    expect(kybRuleForCountry("CN").requiresTravelAgencyPermit).toBe(true);
  });

  it("step3 requires shop name and agree", () => {
    expect(
      validateProviderRegisterStep3({
        entityType: "company",
        shopName: "",
        agree: false,
        beneficialOwner: {
          fullName: "",
          idType: "passport",
          idNumber: "",
          idDocFile: null,
        },
        legalRepresentativeIdFile: null,
        pendingLegalRepresentativeIdName: null,
      })?.field,
    ).toBe("shopName");
    expect(
      validateProviderRegisterStep3({
        entityType: "individual",
        shopName: "Shop",
        agree: true,
        beneficialOwner: {
          fullName: "",
          idType: "passport",
          idNumber: "",
          idDocFile: null,
        },
        legalRepresentativeIdFile: new File(["x"], "id.pdf"),
        pendingLegalRepresentativeIdName: null,
      }),
    ).toBeNull();
  });

  it("step2 validates email", () => {
    const fail = validateProviderRegisterStep2({
      countryCode: "US",
      city: "纽约",
      registeredAddressLine1: "123 Main St",
      registeredAddressLine2: "",
      registeredPostalCode: "",
      operatingSameAsRegistered: true,
      operatingAddressLine1: "",
      operatingAddressLine2: "",
      operatingCity: "",
      operatingPostalCode: "",
      travelAgencyPermitFile: null,
      pendingTravelAgencyPermitName: null,
      contactName: "Li",
      contactPhone: "13800000000",
      contactEmail: "bad",
    });
    expect(fail?.field).toBe("contactEmail");
  });
});
