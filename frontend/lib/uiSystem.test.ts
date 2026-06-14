import { describe, expect, it } from "vitest";
import {
  bodyShellClassForZone,
  headerBarClassForPathname,
  isAuthL5DarkHeaderPath,
  isAuthLoginL5HeaderPath,
  isGovernanceDarkL5HeaderPath,
  isHeaderUtilityL5Path,
  headerUtilityVariantForPathname,
  isCommunityPremiumHeaderPath,
  isMarketDarkPremiumHeaderPath,
  isOrdersListDarkL5HeaderPath,
  isOrdersNewDarkL5HeaderPath,
  isOrdersDarkL5HeaderPath,
  headerSurfaceKindForPathname,
  headerBrandWordmarkClasses,
  headerLoginLinkClasses,
  headerNavItemIsActive,
  headerNavLinkClasses,
  headerRegisterPillClasses,
  resolveHeaderBrandHref,
  resolveUiZone,
  isAdminHeaderPath,
  shouldSuppressGlobalSiteNav,
  TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM,
  TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM,
  TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM,
  TT_MARKETING_HEADER_BAR_DARK,
  TT_MARKETING_HEADER_BAR_LIGHT,
  TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC,
  TT_MARKETING_REGISTER_PILL_COMMUNITY,
  TT_MARKETING_REGISTER_PILL_WARM,
} from "./uiSystem";

describe("uiSystem zones", () => {
  it("resolveUiZone maps main route families", () => {
    expect(resolveUiZone("/")).toBe("experience");
    expect(resolveUiZone("/traveltrust")).toBe("experience");
    expect(resolveUiZone("/orders")).toBe("console");
    expect(resolveUiZone("/pay")).toBe("console");
    expect(resolveUiZone("/escrow/abc")).toBe("console");
    expect(resolveUiZone("/market")).toBe("marketDark");
    expect(resolveUiZone("/community/me")).toBe("marketDark");
    expect(resolveUiZone("/me/security")).toBe("console");
    expect(resolveUiZone("/me/onboarding")).toBe("console");
    expect(resolveUiZone("/did-rank")).toBe("marketDark");
    expect(resolveUiZone("/admin/users")).toBe("admin");
  });

  it("isAdminHeaderPath matches /admin namespace only", () => {
    expect(isAdminHeaderPath("/admin")).toBe(true);
    expect(isAdminHeaderPath("/admin/users")).toBe(true);
    expect(isAdminHeaderPath("/administrator")).toBe(false);
    expect(isAdminHeaderPath("/")).toBe(false);
  });

  it("admin L0 header uses cinematic bar + authL5 utility (dark lang switcher)", () => {
    expect(headerSurfaceKindForPathname("/admin")).toBe("dark");
    expect(headerSurfaceKindForPathname("/admin/users")).toBe("dark");
    expect(headerBarClassForPathname("/admin")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerUtilityVariantForPathname("/admin/users")).toBe("authL5");
    expect(isHeaderUtilityL5Path("/admin/approvals")).toBe(true);
  });

  it("shouldSuppressGlobalSiteNav keeps L0 four links except /admin*", () => {
    expect(shouldSuppressGlobalSiteNav("/admin")).toBe(true);
    expect(shouldSuppressGlobalSiteNav("/admin/approvals")).toBe(true);
    expect(shouldSuppressGlobalSiteNav("/traveltrust")).toBe(false);
    expect(shouldSuppressGlobalSiteNav("/traveltrust/foo")).toBe(false);
    expect(shouldSuppressGlobalSiteNav("/market")).toBe(false);
    expect(shouldSuppressGlobalSiteNav("/community/me")).toBe(false);
    expect(shouldSuppressGlobalSiteNav("/")).toBe(false);
    expect(shouldSuppressGlobalSiteNav("/orders")).toBe(false);
  });

  it("bodyShellClassForZone returns product shell for console", () => {
    expect(bodyShellClassForZone("console")).toContain("bg-bg-main");
  });

  it("bodyShellClassForZone uses dark route shell for marketDark", () => {
    expect(bodyShellClassForZone("marketDark")).toContain("#0a0a0a");
  });
});

describe("uiSystem L0 header", () => {
  it("headerSurfaceKindForPathname maps home / dark routes / console", () => {
    expect(headerSurfaceKindForPathname("/")).toBe("home");
    expect(headerSurfaceKindForPathname("/traveltrust")).toBe("dark");
    expect(headerSurfaceKindForPathname("/market")).toBe("dark");
    expect(headerSurfaceKindForPathname("/auth/login")).toBe("dark");
    expect(headerSurfaceKindForPathname("/orders")).toBe("home");
    expect(headerSurfaceKindForPathname("/orders/new")).toBe("home");
    expect(isOrdersListDarkL5HeaderPath("/orders")).toBe(true);
    expect(isOrdersListDarkL5HeaderPath("/orders/new")).toBe(false);
    expect(isOrdersNewDarkL5HeaderPath("/orders/new")).toBe(true);
    expect(isOrdersNewDarkL5HeaderPath("/orders/new/foo")).toBe(true);
    expect(isOrdersDarkL5HeaderPath("/orders")).toBe(true);
    expect(isOrdersDarkL5HeaderPath("/orders/new")).toBe(true);
    expect(isOrdersDarkL5HeaderPath("/pay")).toBe(false);
  });

  it("headerBarClassForPathname uses premium dark bar on auth L5 routes", () => {
    expect(isAuthL5DarkHeaderPath("/auth/login")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/auth/register")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/auth/forgot-password")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/me/identities")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/me/publish")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/guide")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/guide/register")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/staking")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/provider")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/provider/register")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/trust")).toBe(true);
    expect(isAuthL5DarkHeaderPath("/steward/register")).toBe(true);
    expect(isAuthLoginL5HeaderPath("/auth/login")).toBe(true);
    expect(headerBarClassForPathname("/auth/login")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerBarClassForPathname("/me/identities")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerBarClassForPathname("/guide")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerBarClassForPathname("/provider")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerBarClassForPathname("/trust")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerBarClassForPathname("/auth/register")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerUtilityVariantForPathname("/guide")).toBe("authL5");
    expect(headerBarClassForPathname("/staking")).toBe(TT_MARKETING_HEADER_BAR_DARK_ROUTE_PREMIUM);
    expect(headerUtilityVariantForPathname("/staking")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/provider")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/trust")).toBe("authL5");
    expect(headerLoginLinkClasses("/auth/register")).toContain("text-slate-100");
    expect(headerLoginLinkClasses("/auth/login")).toContain("text-ref-sun");
    expect(headerRegisterPillClasses("/auth/register")).toContain("ring-ref-sun");
    expect(headerRegisterPillClasses("/auth/login")).toBe(TT_MARKETING_REGISTER_PILL_COMMUNITY);
    expect(headerUtilityVariantForPathname("/auth/login")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/me/identities")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/market")).toBe("authL5");
    expect(headerUtilityVariantForPathname("/community")).toBe("authL5");
  });

  it("isHeaderUtilityL5Path covers five-main dark premium headers", () => {
    expect(isHeaderUtilityL5Path("/")).toBe(true);
    expect(isHeaderUtilityL5Path("/traveltrust")).toBe(true);
    expect(isHeaderUtilityL5Path("/orders")).toBe(true);
    expect(isHeaderUtilityL5Path("/orders/new")).toBe(true);
    expect(isHeaderUtilityL5Path("/escrow/abc")).toBe(true);
    expect(isHeaderUtilityL5Path("/governance/proposals")).toBe(true);
    expect(headerUtilityVariantForPathname("/escrow/abc")).toBe("authL5");
  });

  it("headerBarClassForPathname uses premium bar on market, did-rank, and guides (V2)", () => {
    expect(isMarketDarkPremiumHeaderPath("/market")).toBe(true);
    expect(isMarketDarkPremiumHeaderPath("/did-rank")).toBe(true);
    expect(isMarketDarkPremiumHeaderPath("/guides")).toBe(true);
    expect(isMarketDarkPremiumHeaderPath("/guides/abc")).toBe(true);
    expect(isMarketDarkPremiumHeaderPath("/community")).toBe(false);
    expect(headerBarClassForPathname("/market")).toBe(TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM);
    expect(headerBarClassForPathname("/did-rank")).toBe(TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM);
    expect(headerBarClassForPathname("/guides/abc")).toBe(TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM);
    expect(headerUtilityVariantForPathname("/guides/abc")).toBe("authL5");
    expect(headerBarClassForPathname("/orders")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerBarClassForPathname("/orders/new")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerBarClassForPathname("/escrow/abc")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerBarClassForPathname("/governance/proposals")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerSurfaceKindForPathname("/escrow/abc")).toBe("home");
    expect(headerSurfaceKindForPathname("/governance/proposals")).toBe("home");
  });

  it("isGovernanceDarkL5HeaderPath covers governance portal and subroutes", () => {
    expect(isGovernanceDarkL5HeaderPath("/governance")).toBe(true);
    expect(isGovernanceDarkL5HeaderPath("/governance/proposals")).toBe(true);
    expect(isGovernanceDarkL5HeaderPath("/governance/proposals/new")).toBe(true);
    expect(isGovernanceDarkL5HeaderPath("/governance/delegate")).toBe(true);
    expect(headerUtilityVariantForPathname("/governance/proposals")).toBe("authL5");
  });

  it("headerBarClassForPathname uses premium black bar on /community", () => {
    expect(isCommunityPremiumHeaderPath("/community")).toBe(true);
    expect(isCommunityPremiumHeaderPath("/community/me")).toBe(true);
    expect(isCommunityPremiumHeaderPath("/market")).toBe(false);
    expect(headerBarClassForPathname("/community")).toBe(TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM);
    expect(headerBarClassForPathname("/community/topic/japan")).toBe(TT_MARKETING_HEADER_BAR_COMMUNITY_PREMIUM);
  });

  it("headerBarClassForPathname uses merged cinematic bar on /traveltrust", () => {
    expect(headerBarClassForPathname("/traveltrust")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
    expect(headerBarClassForPathname("/traveltrust/foo")).toBe(TT_MARKETING_HEADER_BAR_TRAVELTRUST_CINEMATIC);
  });

  it("headerNavLinkClasses uses unified dark tokens or light console tokens", () => {
    expect(headerNavLinkClasses("/market", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/community", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/did-rank", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/orders", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/orders/new", false)).toContain("!text-[#d4cec6]");
    expect(headerNavLinkClasses("/governance/proposals", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/governance/proposals", false)).toContain("!text-[#d4cec6]");
    expect(headerNavLinkClasses("/traveltrust", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/traveltrust", false)).toContain("!text-[#d4cec6]");
    expect(headerNavLinkClasses("/", true)).toContain("!text-ref-sun");
    expect(headerNavLinkClasses("/", false)).toContain("!text-[#d4cec6]");
    expect(headerNavLinkClasses("/market", false)).toContain("!text-[#d4cec6]");
    expect(headerNavLinkClasses("/community", true)).not.toContain("ring-inset");
    expect(headerNavLinkClasses("/community", true)).not.toContain("bg-cyan/10");
  });

  it("headerNavItemIsActive matches L0 hrefs; traveltrust does not activate Web3", () => {
    expect(headerNavItemIsActive("/", "/")).toBe(true);
    expect(headerNavItemIsActive("/traveltrust", "/")).toBe(false);
    expect(headerNavItemIsActive("/traveltrust/announcements", "/")).toBe(false);
    expect(headerNavItemIsActive("/market", "/")).toBe(false);
    expect(headerNavItemIsActive("/market/foo", "/market")).toBe(true);
    expect(headerNavItemIsActive("/community/me", "/community")).toBe(true);
    expect(headerNavItemIsActive("/did-rank", "/did-rank")).toBe(true);
  });

  it("header chrome helpers align with Web3 travel tokens", () => {
    expect(headerBrandWordmarkClasses("/")).toContain("text-white");
    expect(headerBrandWordmarkClasses("/orders")).toContain("text-white");
    expect(headerBrandWordmarkClasses("/orders/new")).toContain("text-white");
    expect(headerBrandWordmarkClasses("/traveltrust")).toContain("text-slate-100");
    expect(headerLoginLinkClasses("/")).toContain("text-slate-100");
    expect(headerLoginLinkClasses("/orders")).toContain("text-slate-100");
    expect(headerLoginLinkClasses("/orders/new")).toContain("text-slate-100");
    expect(headerRegisterPillClasses("/")).toContain("gradient");
    expect(headerRegisterPillClasses("/traveltrust")).toContain("gradient");
    expect(headerRegisterPillClasses("/orders")).toContain("gradient");
    expect(headerRegisterPillClasses("/orders/new")).toContain("gradient");
    expect(headerRegisterPillClasses("/market")).toContain("gradient");
    expect(headerRegisterPillClasses("/community")).toBe(TT_MARKETING_REGISTER_PILL_COMMUNITY);
    expect(headerRegisterPillClasses("/market")).toBe(TT_MARKETING_REGISTER_PILL_WARM);
    expect(headerLoginLinkClasses("/community")).toContain("text-slate-100");
    expect(headerLoginLinkClasses("/market")).toContain("text-slate-100");
  });

  it("resolveHeaderBrandHref sends home to /", () => {
    expect(resolveHeaderBrandHref("/")).toBe("/");
    expect(resolveHeaderBrandHref("/traveltrust")).toBe("/traveltrust");
    expect(resolveHeaderBrandHref("/orders")).toBe("/traveltrust");
  });
});
