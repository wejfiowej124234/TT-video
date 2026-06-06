import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** 页身门态须与顶栏会话同源，并在登出后重探（① · 防「顶栏访客 + 页身已登录门态」）。 */
describe("accountSessionPageSync (① · header vs page body)", () => {
  it("shared probe listens to traveltrust:auth-change", () => {
    const probe = read("lib/auth/accountSessionProbe.ts");
    const register = read("lib/auth/registerPageAccountSession.ts");
    expect(probe).toContain("traveltrust:auth-change");
    expect(probe).toContain("clearGetMeCache");
    expect(register).toContain("onAccountSessionChange");
    expect(register).toContain("probeAccountLoggedInViaGetMe");
  });

  it("header session uses getMe + auth-change", () => {
    const header = read("components/header/headerSession.ts");
    expect(header).toContain("traveltrust:auth-change");
    expect(header).toContain("clearGetMeCache");
    expect(header).toContain("getMe()");
  });

  const registerSurfaces: Array<{
    name: string;
    hook: string;
    page: string;
    pendingGuard: RegExp;
  }> = [
    {
      name: "steward/register",
      hook: "app/steward/register/useStewardRegisterPage.ts",
      page: "app/steward/register/StewardRegisterPageMain.tsx",
      pendingGuard: /isPending && !done && isLoggedIn === true/,
    },
    {
      name: "provider/register",
      hook: "app/provider/register/useProviderRegisterPage.ts",
      page: "app/provider/register/ProviderRegisterPageMain.tsx",
      pendingGuard: /isPending && !done && isLoggedIn === true/,
    },
    {
      name: "guide/register",
      hook: "app/guide/register/useGuideRegisterPage.ts",
      page: "app/guide/register/GuideRegisterPageMain.tsx",
      pendingGuard: /isPendingGuide && isLoggedIn === true/,
    },
  ];

  for (const { name, hook, page, pendingGuard } of registerSurfaces) {
    it(`${name} uses shared register session hook and gates pending on login`, () => {
      const hookSrc = read(hook);
      const pageSrc = read(page);
      expect(hookSrc).toContain("useRegisterPageAccountSession");
      expect(hookSrc).not.toMatch(/localStorage\.getItem\("traveltrust_user_id"\)/);
      expect(hookSrc).toMatch(/setIsPending(Guide)?\(false\)/);
      expect(pageSrc).toMatch(pendingGuard);
    });
  }

  it("me/onboarding uses header session SSOT and clears entitlements on logout", () => {
    const hook = read("app/me/onboarding/useMeOnboardingPage.ts");
    const main = read("app/me/onboarding/MeOnboardingPageMain.tsx");
    const probe = read("app/me/onboarding/MeOnboardingWritesProbeShell.tsx");
    expect(hook).toContain("useHeaderSession");
    expect(hook).toContain("sessionChecking");
    expect(hook).toContain("getMeFull");
    expect(hook).toContain("setEntJson(null)");
    expect(main).toContain("MeOnboardingWritesProbeShell");
    expect(probe).toContain("data-tt-me-onboarding-writes-session-probe");
  });

  it("community auth context syncs with header", () => {
    const ctx = read("components/community/CommunityAuthContext.tsx");
    expect(ctx).toContain("traveltrust:auth-change");
    expect(ctx).toContain("clearGetMeCache");
  });

  it("me profile page syncs on auth-change", () => {
    const me = read("components/me/useMePage.ts");
    expect(me).toContain("traveltrust:auth-change");
    expect(me).toContain("clearGetMeCache");
  });
});
