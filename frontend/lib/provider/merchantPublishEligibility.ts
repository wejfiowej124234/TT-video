import { getMeFull, getOnboardingEntitlementsMe } from "@/lib/apiClient";
import { parseOnboardingEntitlementsView } from "@/lib/me/meOnboardingViewModel";
import { parseMeTrustFromMeResponse, userFromGetMePayload } from "@/lib/meTrust";
import { isProviderAlreadyActive } from "@/lib/provider/providerRegisterValidation";

export type MerchantPublishEligibility = {
  ok: boolean;
  roleOk: boolean;
  applicationOk: boolean;
  entitlementPaidOk: boolean;
  sessionOk: boolean;
  userRole: string | null;
  applicationStatus: string | null;
};

function providerPaidEntitlementFromRaw(raw: unknown): boolean {
  const view = parseOnboardingEntitlementsView(raw);
  if (!view) return false;
  return view.items.some(
    (i) => i.roleTarget === "provider" && (i.status === "paid" || i.status === "active"),
  );
}

export async function fetchMerchantPublishEligibility(): Promise<MerchantPublishEligibility> {
  try {
    const me = await getMeFull({ force: true });
    const user = userFromGetMePayload(me);
    const trust = parseMeTrustFromMeResponse(me);
    const role = user?.role?.toLowerCase() ?? null;
    const roleOk = isProviderAlreadyActive(role);
    const appStatus = trust?.provider_registration_status?.toLowerCase() ?? null;
    const applicationOk = appStatus === "approved" || roleOk;

    let entitlementPaidOk = false;
    try {
      const entRaw = await getOnboardingEntitlementsMe();
      entitlementPaidOk = providerPaidEntitlementFromRaw(entRaw);
    } catch {
      entitlementPaidOk = false;
    }

    return {
      ok: roleOk && applicationOk && entitlementPaidOk,
      roleOk,
      applicationOk,
      entitlementPaidOk,
      sessionOk: user != null,
      userRole: role,
      applicationStatus: appStatus,
    };
  } catch {
    return {
      ok: false,
      roleOk: false,
      applicationOk: false,
      entitlementPaidOk: false,
      sessionOk: false,
      userRole: null,
      applicationStatus: null,
    };
  }
}
