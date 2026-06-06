import { API_ROUTES } from "@/lib/api/routes";
import { getAuthHeaders, parseResponse } from "./core";

export type ProviderAddressBody = {
  line1: string;
  line2?: string;
  city: string;
  postal_code?: string;
  country_code: string;
};

export type BeneficialOwnerBody = {
  full_name: string;
  id_type: string;
  id_number: string;
  id_doc_url: string;
};

export type PostProviderApplicationBody = {
  legal_name: string;
  entity_type: string;
  registration_number: string;
  country_code: string;
  city: string;
  registered_address: ProviderAddressBody;
  operating_same_as_registered?: boolean;
  operating_address?: ProviderAddressBody;
  beneficial_owners?: BeneficialOwnerBody[];
  legal_representative_id_url?: string;
  travel_agency_permit_url?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  shop_name: string;
  categories?: string;
  bio?: string;
  wallet_address: string;
  tax_id?: string;
  business_license_url?: string;
  insurance_url?: string;
};

export async function getMeProviderApplication(): Promise<unknown> {
  const res = await fetch(API_ROUTES.meProviderApplication, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return parseResponse(res);
}

export async function postProviderApplication(body: PostProviderApplicationBody): Promise<unknown> {
  const res = await fetch(API_ROUTES.providerApplications, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}
