import { getMeFull } from "@/lib/apiClient";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import { ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC } from "./acquisitionBondConstants";

export type AcquisitionFulfillmentEligibility = {
  sessionOk: boolean;
  fulfillmentBondActive: boolean;
  fulfillmentRequired: boolean;
  canAcceptHighBounty: boolean;
};

export function acquisitionFulfillmentRequiredForBounty(bountyMaxUsdc: number): boolean {
  return Number.isFinite(bountyMaxUsdc) && bountyMaxUsdc >= ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC;
}

export async function fetchAcquisitionFulfillmentEligibility(
  bountyMaxUsdc: number,
): Promise<AcquisitionFulfillmentEligibility> {
  const fulfillmentRequired = acquisitionFulfillmentRequiredForBounty(bountyMaxUsdc);
  try {
    const me = await getMeFull({ force: true });
    const user = userFromGetMePayload(me);
    const trust = parseMeTrustFromMeResponse(me, user);
    const fulfillmentBondActive = trust?.acquisition_fulfillment_bond_active === true;
    return {
      sessionOk: user != null,
      fulfillmentBondActive,
      fulfillmentRequired,
      canAcceptHighBounty: !fulfillmentRequired || fulfillmentBondActive,
    };
  } catch {
    return {
      sessionOk: false,
      fulfillmentBondActive: false,
      fulfillmentRequired,
      canAcceptHighBounty: !fulfillmentRequired,
    };
  }
}
