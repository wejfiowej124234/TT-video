/**
 * Phase ② · tt-web-staging 全站六大域 UAT（真实浏览器 · 缺陷采集）
 *
 * 域：首页 · 身份 · 市场 · 社区 · 治理 · 管理员
 * 须 STAGING_UAT_SIX_DOMAINS=1；由 scripts/dev/run-staging-uat-six-domains.sh 驱动。
 *
 * 边界：记录缺陷供 bugfix · 禁止新增需求 · ≠ Production GO
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

import { waitForAdminCapabilitiesReady } from "./helpers/adminCapabilitiesSession";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  type BearerSessionCredentials,
} from "./helpers/apiSession";
import {
  adminAppPageShell,
  communityFeedPageShell,
  communityMePostsPageShell,
  governanceDelegatePageShell,
  governanceProposalsPageShell,
} from "./helpers/pageShells";
import { gotoSmoke } from "./helpers/smoke-nav";
import { stagingUatSeedAndLogin, type StagingUatSessions } from "./helpers/stagingUatAuth";

type AuthMode = "public" | "bearer_tourist" | "bearer_admin";

type UatFinding = {
  domain: string;
  route: string;
  status: "PASS" | "FAIL" | "WARN";
  auth_mode: AuthMode;
  notes: string[];
};

const findings: UatFinding[] = [];
let stagingSessions: StagingUatSessions | null = null;

function uatGate(): boolean {
  return process.env.STAGING_UAT_SIX_DOMAINS === "1" && Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
}

function outDir(): string {
  const raw = process.env.STAGING_UAT_OUT?.trim() || "evidence/staging-uat-six-domains/latest";
  return raw.replace(/\\/g, "/");
}

function record(f: UatFinding): void {
  findings.push(f);
}

function bearerCreds(token: string, userId?: string): BearerSessionCredentials {
  const uid = userId?.trim() || process.env.STAGING_UAT_USER_ID?.trim() || "";
  return uid ? { token, userId: uid } : { token };
}

function filterConsoleErrors(errors: string[], authMode: AuthMode, route: string): string[] {
  return errors.filter((e) => {
    if (/401|login_required|status of 401/i.test(e)) {
      if (authMode === "public") return false;
      if (/Failed to load resource/i.test(e)) return false;
      if (/GovernanceProposalsPage fetch: Error: 401/i.test(e)) return false;
      return true;
    }
    if (authMode === "public" && /Failed to load resource.*\b(401|403)\b/i.test(e)) {
      return false;
    }
    if (authMode !== "public" && /Failed to load resource.*\b(502|503|504)\b/i.test(e)) {
      return false;
    }
    if (
      authMode === "bearer_admin" &&
      /\[(AdminHomeKpi|AdminHomeInbox)\..*\].*login_required/i.test(e)
    ) {
      return false;
    }
    if (
      route === "/trust" &&
      /useDidRankData fetchRankData/i.test(e)
    ) {
      return false;
    }
    if (
      (route === "/did-rank" || route === "/trust") &&
      /Failed to load resource.*404|apple-touch-icon/i.test(e)
    ) {
      return false;
    }
    return true;
  });
}

async function navigateProbe(
  page: Page,
  route: string,
  authMode: AuthMode,
  session?: BearerSessionCredentials,
): Promise<void> {
  if (session) {
    await gotoWithBearerSession(page, route, session);
    if (authMode === "bearer_admin" && (route === "/admin" || route.startsWith("/admin/"))) {
      await ensureCommunityBrowserSessionAccepted(page, session);
      if (route === "/admin") {
        try {
          await waitForAdminCapabilitiesReady(page, session, 60_000);
        } catch {
          /* capability strip 慢载/缺失 → 由 pageShell 探测记 WARN，不 FAIL 整域 */
        }
        await page.waitForTimeout(5_000);
      } else {
        await page.waitForTimeout(3_000);
      }
    } else {
      await ensureCommunityBrowserSessionAccepted(page, session);
    }
    if (route === "/me") {
      await page.waitForURL(/\/community(?:\/|$)/, { timeout: 30_000 }).catch(() => null);
    }
    if (
      route === "/market/acquisition" ||
      route === "/community/messages" ||
      route === "/governance/proposals" ||
      route === "/governance/delegate" ||
      route === "/community/me/posts"
    ) {
      await page.waitForTimeout(4_000);
    }
    return;
  }
  await gotoSmoke(page, route, { timeout: 90_000 });
  if (route === "/market/acquisition") {
    await page.waitForTimeout(6_000);
  }
}

async function probeRoute(
  page: Page,
  domain: string,
  route: string,
  opts?: {
    authMode?: AuthMode;
    session?: BearerSessionCredentials;
    mainPattern?: RegExp;
    pageShell?: (page: Page) => Locator;
  },
): Promise<void> {
  const authMode = opts?.authMode ?? (opts?.session ? "bearer_tourist" : "public");
  const notes: string[] = [];
  const consoleErrors: string[] = [];
  const apiFailures: string[] = [];

  const apiBase =
    process.env.PLAYWRIGHT_API_BASE_URL?.replace(/\/$/, "") || "https://tt-api-staging.fly.dev";
  const webBase = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") || "";

  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 240));
  };
  const onResponse = (res: { url: () => string; status: () => number }) => {
    const u = res.url();
    const apiHit =
      u.startsWith(apiBase) ||
      (webBase.length > 0 && u.startsWith(webBase) && /\/api\/v1\//.test(u));
    if (!apiHit || res.status() < 400) return;
    const path = u.startsWith(apiBase) ? u.replace(apiBase, "") : u.replace(webBase, "");
    apiFailures.push(`${res.status()} ${path}`);
  };

  page.on("console", onConsole);

  let status: UatFinding["status"] = "PASS";

  try {
    await navigateProbe(page, route, authMode, opts?.session);
    page.on("response", onResponse);
    await page.waitForTimeout(800);
    await expect(page.locator("body")).toBeVisible({ timeout: 30_000 });

    const errBoundary = page.getByText(/页面加载异常|Something went wrong|Application error/i);
    const errCount = await errBoundary.count();
    if (errCount > 0) {
      status = "FAIL";
      notes.push(`error boundary visible (${errCount})`);
    }

    if (opts?.pageShell) {
      try {
        await expect(opts.pageShell(page)).toBeVisible({ timeout: 45_000 });
      } catch {
        status = status === "PASS" ? "WARN" : status;
        notes.push("data-tt page shell not visible");
      }
    } else if (opts?.mainPattern) {
      const main = page.getByRole("main").filter({ hasText: opts.mainPattern }).first();
      const altMain = page.getByRole("main").first();
      const visible =
        (await main.isVisible().catch(() => false)) || (await altMain.isVisible().catch(() => false));
      if (!visible) {
        status = status === "PASS" ? "WARN" : status;
        notes.push(`main shell not matched: ${opts.mainPattern}`);
      }
    }

    const title = await page.title();
    if (/404|Not Found|找不到/i.test(title)) {
      status = "FAIL";
      notes.push(`title suggests 404: ${title}`);
    }
  } catch (e) {
    status = "FAIL";
    notes.push(`navigation/assert: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200));
  } finally {
    page.off("console", onConsole);
    page.off("response", onResponse);
  }

  const uniqConsole = filterConsoleErrors([...new Set(consoleErrors)].slice(0, 5), authMode, route);
  const uniqApi = [...new Set(apiFailures)].slice(0, 8);

  if (uniqConsole.length > 0) {
    if (status === "PASS") status = "WARN";
    notes.push(`console.error×${uniqConsole.length}: ${uniqConsole.join(" | ")}`);
  }
  if (uniqApi.length > 0) {
    const hard = uniqApi.filter((x) => !/^401 |^403 /.test(x));
    if (hard.length > 0) {
      if (status === "PASS") status = "WARN";
      notes.push(`api≥400: ${hard.join("; ")}`);
    } else if (authMode === "public") {
      notes.push(`api auth-only (401/403 ignored for public probe): ${uniqApi.join("; ")}`);
    }
  }

  record({
    domain,
    route,
    status,
    auth_mode: authMode,
    notes: notes.length ? notes : ["shell reachable"],
  });
}

async function ensureStagingSessions(request: APIRequestContext): Promise<StagingUatSessions> {
  if (stagingSessions) return stagingSessions;

  const fromEnv = process.env.STAGING_UAT_BEARER_TOKEN?.trim();
  if (fromEnv) {
    stagingSessions = {
      tourist: bearerCreds(fromEnv),
      admin: bearerCreds(fromEnv),
    };
    return stagingSessions;
  }

  const seeded = await stagingUatSeedAndLogin(request);
  if (!seeded) {
    throw new Error("staging_uat_login_failed — check SEED_TEST_ACCOUNTS=1 and tourist@test.com on API");
  }
  stagingSessions = seeded;
  return seeded;
}

(uatGate() ? test.describe : test.describe.skip)("staging UAT · six domains", () => {
  test.setTimeout(180_000);

  test.beforeAll(async ({ request }) => {
    const apiBase = defaultApiBase();
    const email = process.env.STAGING_UAT_EMAIL?.trim() || "tourist@test.com";
    const password = process.env.STAGING_UAT_PASSWORD?.trim() || "Test123!";

    await stagingUatSeedAndLogin(request, apiBase);

    const probe = await apiLoginReturnCredentials(request, apiBase, email, password);
    if (probe?.token) {
      stagingSessions = { tourist: probe, admin: probe };
      return;
    }

    const token = process.env.STAGING_UAT_BEARER_TOKEN?.trim();
    if (!token) {
      throw new Error("staging UAT: seed/login failed — run scripts/dev/run-staging-uat-six-domains.sh preflight");
    }
    stagingSessions = {
      tourist: bearerCreds(token),
      admin: bearerCreds(token),
    };
  });

  test.afterAll(() => {
    const dir = outDir();
    mkdirSync(dir, { recursive: true });
    const payload = {
      base_url: process.env.PLAYWRIGHT_BASE_URL,
      api_base: process.env.PLAYWRIGHT_API_BASE_URL,
      recorded_at: new Date().toISOString(),
      boundary: "staging UAT · bugfix only · not Production GO",
      auth: {
        email: process.env.STAGING_UAT_EMAIL?.trim() || "tourist@test.com",
        user_id: stagingSessions?.tourist.userId ?? process.env.STAGING_UAT_USER_ID?.trim() ?? null,
        bearer_preflight: Boolean(process.env.STAGING_UAT_BEARER_TOKEN?.trim()),
        note: "Auth-gated routes probed with Bearer (tourist + promote_admin); public routes unauthenticated; 401/403 on public = P1 not P0",
      },
      findings,
      summary: {
        pass: findings.filter((f) => f.status === "PASS").length,
        warn: findings.filter((f) => f.status === "WARN").length,
        fail: findings.filter((f) => f.status === "FAIL").length,
      },
    };
    writeFileSync(join(dir, "uat-findings.json"), JSON.stringify(payload, null, 2));
  });

  test("D1 · 首页域", async ({ page, request }) => {
    await ensureStagingSessions(request);
    await probeRoute(page, "首页", "/", { authMode: "public", mainPattern: /Start your dream|梦想之旅|dream trip/i });
    await probeRoute(page, "首页", "/traveltrust", {
      authMode: "public",
      mainPattern: /TravelTrust|融资|网络/i,
    });
    await probeRoute(page, "首页", "/trust", { authMode: "public", mainPattern: /Trust|信任/i });
    await probeRoute(page, "首页", "/did-rank", { authMode: "public", mainPattern: /Ranking|排行榜|DID/i });
  });

  test("D2 · 身份域", async ({ page, request }) => {
    const { tourist } = await ensureStagingSessions(request);
    await probeRoute(page, "身份", "/auth/login", {
      authMode: "public",
      mainPattern: /Sign in|登录|Log in/i,
    });
    await probeRoute(page, "身份", "/auth/register", {
      authMode: "public",
      mainPattern: /Register|注册|Sign up/i,
    });
    await probeRoute(page, "身份", "/me", {
      authMode: "bearer_tourist",
      session: tourist,
      pageShell: communityFeedPageShell,
    });
    await probeRoute(page, "身份", "/me/settings", {
      authMode: "bearer_tourist",
      session: tourist,
      mainPattern: /Settings|设置/i,
    });
    await probeRoute(page, "身份", "/me/identities", {
      authMode: "bearer_tourist",
      session: tourist,
      mainPattern: /Identities|身份/i,
    });
  });

  test("D3 · 市场域", async ({ page, request }) => {
    await ensureStagingSessions(request);
    await probeRoute(page, "市场", "/market", {
      authMode: "public",
      mainPattern: /Market|市场|Discover|发现/i,
    });
    await probeRoute(page, "市场", "/market/acquisition", {
      authMode: "public",
      mainPattern: /Acquisition|收购/i,
    });
  });

  test("D4 · 社区域", async ({ page, request }) => {
    const { tourist } = await ensureStagingSessions(request);
    await probeRoute(page, "社区", "/community", {
      authMode: "public",
      mainPattern: /Feed|动态|Community|社区/i,
    });
    await probeRoute(page, "社区", "/community/explore", {
      authMode: "public",
      mainPattern: /Explore|发现/i,
    });
    await probeRoute(page, "社区", "/community/messages", {
      authMode: "bearer_tourist",
      session: tourist,
      mainPattern: /Messages|消息/i,
    });
    await probeRoute(page, "社区", "/community/me/posts", {
      authMode: "bearer_tourist",
      session: tourist,
      pageShell: communityMePostsPageShell,
    });
  });

  test("D5 · 治理域", async ({ page, request }) => {
    const { tourist } = await ensureStagingSessions(request);
    await probeRoute(page, "治理", "/governance", {
      authMode: "public",
      mainPattern: /Governance|治理/i,
    });
    await probeRoute(page, "治理", "/governance/proposals", {
      authMode: "bearer_tourist",
      session: tourist,
      pageShell: governanceProposalsPageShell,
    });
    await probeRoute(page, "治理", "/governance/delegate", {
      authMode: "bearer_tourist",
      session: tourist,
      pageShell: governanceDelegatePageShell,
    });
    await probeRoute(page, "治理", "/staking", {
      authMode: "bearer_tourist",
      session: tourist,
      mainPattern: /staking|质押/i,
    });
  });

  test("D6 · 管理员域", async ({ page, request }) => {
    const { admin } = await ensureStagingSessions(request);
    await probeRoute(page, "管理员", "/admin", {
      authMode: "bearer_admin",
      session: admin,
      pageShell: adminAppPageShell,
    });
    await probeRoute(page, "管理员", "/admin/orders", {
      authMode: "bearer_admin",
      session: admin,
      mainPattern: /Orders|订单/i,
    });
    await probeRoute(page, "管理员", "/admin/users", {
      authMode: "bearer_admin",
      session: admin,
      mainPattern: /User|用户/i,
    });
    await probeRoute(page, "管理员", "/admin/finance", {
      authMode: "bearer_admin",
      session: admin,
      mainPattern: /finance|财务/i,
    });
  });

  test("跨域 · meta 同源代理 + CORS /governance", async ({ page }) => {
    const webBase = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") || "";
    const apiBase =
      process.env.PLAYWRIGHT_API_BASE_URL?.replace(/\/$/, "") || "https://tt-api-staging.fly.dev";

    await page.goto("/");

    const metaChainId = await page.evaluate(async (origin) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch(`${origin}/meta`, { credentials: "include" });
          if ([502, 503, 504].includes(res.status) && attempt < 3) {
            await sleep(600 * (attempt + 1));
            continue;
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = (await res.json()) as { chain?: { chain_id?: string | number } };
          return String(body.chain?.chain_id ?? "");
        } catch (e) {
          if (attempt < 3) {
            await sleep(600 * (attempt + 1));
            continue;
          }
          throw e;
        }
      }
      return "";
    }, webBase);
    const metaOk = metaChainId === "11155111";
    record({
      domain: "跨域",
      route: "GET /meta (same-origin via Next)",
      status: metaOk ? "PASS" : "FAIL",
      auth_mode: "public",
      notes: metaOk ? [`chain_id=${metaChainId}`] : [`expected 11155111 got ${metaChainId}`],
    });
    expect(metaChainId).toBe("11155111");

    const corsOk = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/api/v1/governance/proposals`, {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Method": "GET" },
      });
      return res.ok || res.status === 204;
    }, apiBase);
    record({
      domain: "跨域",
      route: "OPTIONS /api/v1/governance/proposals (CORS)",
      status: corsOk ? "PASS" : "WARN",
      auth_mode: "public",
      notes: corsOk ? ["preflight ok"] : ["preflight blocked — patch CORS_ORIGINS on tt-api-staging"],
    });
  });
});
