import { getMeFull } from "@/lib/apiClient";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";

export type AcquisitionPublishEligibility = {
  ok: boolean;
  sessionOk: boolean;
  walletOk: boolean;
  publishEligible: boolean;
  bondActive: boolean;
  bondWaived: boolean;
  trustScore: number | null;
};

export async function fetchAcquisitionPublishEligibility(): Promise<AcquisitionPublishEligibility> {
  try {
    const me = await getMeFull({ force: true });
    const user = userFromGetMePayload(me);
    const trust = parseMeTrustFromMeResponse(me, user);
    const walletOk = trust?.wallet_linked === true;
    const publishEligible = trust?.acquisition_publish_eligible === true;
    const bondActive = trust?.acquisition_publish_bond_active === true;
    const bondWaived = trust?.acquisition_publish_bond_waived === true;
    return {
      ok: Boolean(user) && walletOk && publishEligible,
      sessionOk: user != null,
      walletOk,
      publishEligible,
      bondActive,
      bondWaived,
      trustScore:
        typeof trust?.acquisition_trust_score === "number"
          ? trust.acquisition_trust_score
          : null,
    };
  } catch {
    return {
      ok: false,
      sessionOk: false,
      walletOk: false,
      publishEligible: false,
      bondActive: false,
      bondWaived: false,
      trustScore: null,
    };
  }
}
