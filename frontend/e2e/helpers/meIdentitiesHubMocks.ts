import type { Page, Route } from "@playwright/test";

export type MeIdentitiesHubMockScenario =
  | "provider_payment_pending"
  | "provider_confirm_pending"
  | "provider_active"
  | "steward_payment_pending"
  | "steward_active";

type MePayload = {
  user: {
    id: string;
    email: string;
    role: string;
    kyc_status: string;
    nickname: string;
  };
  identity_slots: Array<{ id: string; state: string; stake_display: null }>;
  trust: Record<string, unknown>;
};

type HubMockPayload = {
  me: MePayload;
  providerApplication: unknown;
  stewardApplication: unknown;
  entitlements: unknown;
};

const HUB_MOCK_PATHS = [
  "/api/v1/me",
  "/api/v1/me/provider-application",
  "/api/v1/me/steward-application",
  "/api/v1/me/provider-registration-draft",
  "/api/v1/onboarding/entitlements/me",
] as const;

function jsonRoute(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function hubPath(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/\/$/, "");
    return (HUB_MOCK_PATHS as readonly string[]).includes(path) ? path : null;
  } catch {
    return null;
  }
}

function baseMe(role: string, merchantState: string, stewardState: string): MePayload {
  return {
    user: {
      id: "00000000-0000-0000-0000-00000000e2e1",
      email: "tourist@test.com",
      role,
      kyc_status: "none",
      nickname: "E2E Tourist",
    },
    identity_slots: [
      { id: "traveler", state: "active", stake_display: null },
      { id: "guide", state: "inactive", stake_display: null },
      { id: "acquisition", state: "inactive", stake_display: null },
      { id: "merchant", state: merchantState, stake_display: null },
      { id: "region_steward", state: stewardState, stake_display: null },
    ],
    trust: {
      kyc_status: "none",
      wallet_linked: false,
      provider_registration_status: null,
    },
  };
}

function scenarioPayload(scenario: MeIdentitiesHubMockScenario): HubMockPayload {
  switch (scenario) {
    case "provider_payment_pending":
      return {
        me: {
          ...baseMe("tourist", "inactive", "inactive"),
          trust: {
            kyc_status: "none",
            wallet_linked: false,
            provider_registration_status: "approved",
          },
        },
        providerApplication: {
          status: "ok",
          application: { id: "pa1", status: "approved", payload: {}, submitted_at: "2026-01-01T00:00:00Z" },
        },
        stewardApplication: { status: "ok", application: null },
        entitlements: {
          status: "ok",
          entitlements: [],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
    case "provider_confirm_pending":
      return {
        me: baseMe("tourist", "inactive", "inactive"),
        providerApplication: {
          status: "ok",
          application: { id: "pa2", status: "approved", payload: {}, submitted_at: "2026-01-01T00:00:00Z" },
        },
        stewardApplication: { status: "ok", application: null },
        entitlements: {
          status: "ok",
          entitlements: [
            {
              id: "ent-paid-provider",
              role_target: "provider",
              sku: "onboarding_provider",
              status: "paid",
              paid_at: "2026-01-02T00:00:00Z",
              expires_at: null,
            },
          ],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
    case "provider_active":
      return {
        me: baseMe("provider", "active", "inactive"),
        providerApplication: {
          status: "ok",
          application: { status: "approved", user_role: "provider" },
        },
        stewardApplication: { status: "ok", application: null },
        entitlements: {
          status: "ok",
          entitlements: [
            {
              id: "ent-paid-provider",
              role_target: "provider",
              sku: "onboarding_provider",
              status: "paid",
              paid_at: "2026-01-02T00:00:00Z",
              expires_at: null,
            },
          ],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
    case "steward_payment_pending":
      return {
        me: {
          ...baseMe("tourist", "inactive", "pending"),
          trust: {
            kyc_status: "none",
            wallet_linked: false,
            provider_registration_status: null,
          },
        },
        providerApplication: { status: "ok", application: null },
        stewardApplication: {
          status: "ok",
          application: {
            id: "sa1",
            status: "approved",
            payload: {},
            submitted_at: "2026-01-01T00:00:00Z",
          },
        },
        entitlements: {
          status: "ok",
          entitlements: [],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
    case "steward_active":
      return {
        me: baseMe("region_steward", "inactive", "active"),
        providerApplication: { status: "ok", application: null },
        stewardApplication: {
          status: "ok",
          application: { status: "approved", user_role: "region_steward" },
        },
        entitlements: {
          status: "ok",
          entitlements: [
            {
              id: "ent-paid-steward",
              role_target: "region_steward",
              sku: "onboarding_steward",
              status: "paid",
              paid_at: "2026-01-02T00:00:00Z",
              expires_at: null,
            },
          ],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
    default:
      return {
        me: baseMe("tourist", "inactive", "inactive"),
        providerApplication: { status: "ok", application: null },
        stewardApplication: { status: "ok", application: null },
        entitlements: {
          status: "ok",
          entitlements: [],
          meta: { implementation_status: "onboarding_entitlements_stub" },
        },
      };
  }
}

/** ① Hub 核心卡 E2E：单 handler 按 pathname fulfill（与 me-onboarding route mock 同源）。 */
export async function installMeIdentitiesHubApiMocks(
  page: Page,
  scenario: MeIdentitiesHubMockScenario,
): Promise<void> {
  const payload = scenarioPayload(scenario);

  await page.route(
    (url) => hubPath(url.toString()) != null,
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const path = hubPath(route.request().url());
      if (!path) {
        await route.fallback();
        return;
      }
      switch (path) {
        case "/api/v1/me/provider-registration-draft":
          await jsonRoute(route, { status: "ok", draft: {} });
          return;
        case "/api/v1/me/provider-application":
          await jsonRoute(route, payload.providerApplication);
          return;
        case "/api/v1/me/steward-application":
          await jsonRoute(route, payload.stewardApplication);
          return;
        case "/api/v1/onboarding/entitlements/me":
          await jsonRoute(route, payload.entitlements);
          return;
        case "/api/v1/me":
          await jsonRoute(route, { status: "ok", ...payload.me });
          return;
        default:
          await route.fallback();
      }
    },
  );
}

export function providerCoreCard(page: Page) {
  return page.locator('[data-tt-me-identities-card="provider"]');
}

export function stewardCoreCard(page: Page) {
  return page.locator('[data-tt-me-identities-card="steward"]');
}

export function waitForCoreCardPhase(page: Page, surfaceId: "provider" | "steward", phase: string) {
  return page.waitForFunction(
    ({ card, expected }) =>
      document.querySelector(`[data-tt-me-identities-card="${card}"]`)?.getAttribute("data-tt-me-identities-core-phase") ===
      expected,
    { card: surfaceId, expected: phase },
    { timeout: 60_000 },
  );
}
