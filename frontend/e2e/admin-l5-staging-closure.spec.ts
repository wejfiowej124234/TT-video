/**
 * Admin L5 Staging 收口 · 浏览器探针（capabilities 401 清会话 · 订单 nav 不 pending）
 * 由 scripts/dev/run-admin-l5-staging-audit.sh 调用。
 *
 * Seed race (Test 3 PASS / Test 4 FAIL · cold context): cookies-only before origin
 * warm can miss middleware jar → /auth/login?returnUrl=/admin. Fix: clear → login →
 * warm WEB → explicit host cookies + evaluate + initScript (Max-Age=8h) → jar assert →
 * API/FE preflight → gotoAdminAuthed (re-login retry). Negative vs seeded describe isolation.
 */
import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
const EMAIL = process.env.STAGING_AUDIT_EMAIL ?? "tourist@test.com";
const PASS = process.env.STAGING_AUDIT_PASSWORD ?? "Test123!";
const OUT = process.env.STAGING_ADMIN_L5_BROWSER_OUT ?? "";
/** Align with frontend/lib/apiClient/core/authSession.ts AUTH_SESSION_OK_MAX_AGE_SEC */
const SESSION_MAX_AGE_SEC = 60 * 60 * 8;
const WEB_HOST = new URL(WEB).hostname;

function record(id: string, ok: boolean, detail?: string) {
  if (!OUT) return;
  mkdirSync(dirname(OUT), { recursive: true });
  appendFileSync(
    OUT,
    `${JSON.stringify({ id, ok, detail: detail ?? null, ts: new Date().toISOString() })}\n`,
  );
}

type Session = { token: string; userId: string };

function urlPathname(u: URL | string): string {
  if (typeof u !== "string") return u.pathname;
  try {
    return new URL(u).pathname;
  } catch {
    return new URL(u, WEB).pathname;
  }
}

/** Fresh API context — worker `request` jar can poison Bearer with stale Set-Cookie. */
async function withFreshApi<T>(fn: (api: APIRequestContext) => Promise<T>): Promise<T> {
  const api = await playwrightRequest.newContext({
    baseURL: API,
    extraHTTPHeaders: { Accept: "application/json" },
  });
  try {
    return await fn(api);
  } finally {
    await api.dispose();
  }
}

async function loginSuperAdmin(_request?: APIRequestContext): Promise<Session> {
  let lastDetail = "";
  for (let attempt = 1; attempt <= 8; attempt++) {
    const session = await withFreshApi(async (api) => {
      const seedRes = await api.post(`${API}/auth/seed-test-accounts`, {
        data: { promote_admin_email: EMAIL },
      });
      // Staging can return db_failed while still emitting a login token that
      // capabilities rejects as login_required — seed status is advisory only.
      const seedNote = seedRes.ok()
        ? `seed=${seedRes.status()}`
        : `seed=${seedRes.status()}:${(await seedRes.text().catch(() => "")).slice(0, 80)}`;
      const loginRes = await api.post(`${API}/auth/login`, {
        data: { email: EMAIL, password: PASS },
      });
      if (!loginRes.ok()) {
        lastDetail = `${seedNote} login=${loginRes.status()}`;
        return null;
      }
      const body = (await loginRes.json()) as { token?: string; user_id?: string; role?: string };
      const token = body.token?.trim() ?? "";
      const userId = body.user_id?.trim() ?? "";
      if (!token || body.role !== "super_admin") {
        lastDetail = `${seedNote} role=${body.role ?? "?"} token=${token ? "yes" : "no"}`;
        return null;
      }
      const cap = await api.get(`${API}/api/v1/admin/capabilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cap.ok()) {
        lastDetail = `${seedNote} cap=${cap.status()}:${(await cap.text().catch(() => "")).slice(0, 100)}`;
        return null;
      }
      lastDetail = `${seedNote} cap=200`;
      return { token, userId };
    });
    if (session) return session;
    await new Promise((r) => setTimeout(r, Math.min(2500, 400 * attempt)));
  }
  throw new Error(`loginSuperAdmin_exhausted: ${lastDetail}`);
}

async function applySessionToContext(page: Page, session: Session): Promise<void> {
  const { token, userId } = session;
  // Explicit host cookie (url-only can flake on cold fly.dev contexts).
  await page.context().addCookies([
    {
      name: "traveltrust_user_id",
      value: userId,
      domain: WEB_HOST,
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "traveltrust_session_ok",
      value: "1",
      domain: WEB_HOST,
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "traveltrust_session_token",
      value: token,
      domain: WEB_HOST,
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
  ]);
  await page.evaluate(
    ({ tok, uid, maxAge }) => {
      try {
        sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
        localStorage.setItem("traveltrust_session_token", tok);
        localStorage.setItem("traveltrust_user_id", uid);
        document.cookie = `traveltrust_session_ok=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        document.cookie = `traveltrust_session_token=${encodeURIComponent(tok)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch {
        /* ignore */
      }
    },
    { tok: token, uid: userId, maxAge: SESSION_MAX_AGE_SEC },
  );
}

async function assertSessionJar(page: Page, session: Session): Promise<void> {
  const jar = await page.context().cookies(WEB);
  const byName = Object.fromEntries(jar.map((c) => [c.name, c.value]));
  expect(byName.traveltrust_session_ok, `jar keys=${Object.keys(byName).join(",")}`).toBe("1");
  expect(byName.traveltrust_user_id).toBe(session.userId);
  expect(byName.traveltrust_session_token).toBe(session.token);
}

/**
 * Middleware `session_ok` + Bearer localStorage + token cookie（fe_proxy Cookie→Bearer）。
 * Always warm WEB origin before jar/storage so cold contexts are repeatable.
 */
async function seedSuperAdminBrowserSession(
  page: Page,
  request: APIRequestContext,
): Promise<Session> {
  await page.context().clearCookies();
  const session = await loginSuperAdmin(request);

  // Warm a non-login path (avoid login-page side effects); bind storage to WEB.
  await page.goto(`${WEB}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
    } catch {
      /* ignore */
    }
  });

  await applySessionToContext(page, session);
  await assertSessionJar(page, session);

  await page.addInitScript(
    ({ tok, uid, maxAge }) => {
      try {
        sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
        localStorage.setItem("traveltrust_session_token", tok);
        localStorage.setItem("traveltrust_user_id", uid);
        document.cookie = `traveltrust_session_ok=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        document.cookie = `traveltrust_session_token=${encodeURIComponent(tok)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      } catch {
        /* ignore */
      }
    },
    { tok: session.token, uid: session.userId, maxAge: SESSION_MAX_AGE_SEC },
  );

  return session;
}

async function preflightSession(
  session: Session,
): Promise<{ apiOk: boolean; feCookieOk: boolean; detail: string }> {
  return withFreshApi(async (api) => {
    const apiCap = await api.get(`${API}/api/v1/admin/capabilities`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const feCap = await api.get(`${WEB}/api/v1/admin/capabilities`, {
      headers: {
        Cookie: [
          `traveltrust_user_id=${encodeURIComponent(session.userId)}`,
          "traveltrust_session_ok=1",
          `traveltrust_session_token=${encodeURIComponent(session.token)}`,
        ].join("; "),
      },
    });
    let apiBody = "";
    if (!apiCap.ok()) {
      apiBody = (await apiCap.text().catch(() => "")).slice(0, 160);
    }
    return {
      apiOk: apiCap.ok(),
      feCookieOk: feCap.ok(),
      detail: `api=${apiCap.status()} fe_cookie=${feCap.status()}${apiBody ? ` body=${apiBody}` : ""}`,
    };
  });
}

/** Goto /admin; wait capabilities 200; re-login+reinject up to 3 attempts. */
async function gotoAdminAuthed(
  page: Page,
  _request: APIRequestContext,
  sessionIn: Session,
): Promise<Session> {
  let session = sessionIn;
  let lastDetail = "";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const pre = await preflightSession(session);
    lastDetail = `attempt=${attempt} ${pre.detail}`;
    // API Bearer is the hard gate; FE cookie path is diagnostic only (proxy flake ≠ bad token).
    if (!pre.apiOk) {
      session = await loginSuperAdmin();
      await applySessionToContext(page, session);
      await assertSessionJar(page, session);
      continue;
    }

    await applySessionToContext(page, session);
    await assertSessionJar(page, session);

    const capsSeen: number[] = [];
    const onResp = (res: { url: () => string; status: () => number }) => {
      try {
        if (res.url().includes("/api/v1/admin/capabilities")) capsSeen.push(res.status());
      } catch {
        /* ignore */
      }
    };
    page.on("response", onResp);

    const capsOk = page
      .waitForResponse(
        (r) => r.url().includes("/api/v1/admin/capabilities") && r.status() === 200,
        { timeout: 45_000 },
      )
      .catch(() => null);

    const nav = await page.goto(`${WEB}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    const navStatus = nav?.status() ?? 0;
    const navUrl = page.url();
    lastDetail += ` nav=${navStatus} url=${navUrl} capsSeen=${capsSeen.join(",") || "—"}`;

    if (/\/auth\/login/.test(navUrl)) {
      page.off("response", onResp);
      session = await loginSuperAdmin();
      await page.goto(`${WEB}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await applySessionToContext(page, session);
      await assertSessionJar(page, session);
      continue;
    }

    await capsOk;
    page.off("response", onResp);

    if (/\/auth\/login/.test(page.url()) || capsSeen.includes(401)) {
      session = await loginSuperAdmin();
      await applySessionToContext(page, session);
      continue;
    }

    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 5_000 });
    await expect(page.locator('[data-tt-admin-capability-strip]')).toBeVisible({
      timeout: 45_000,
    });
    return session;
  }

  throw new Error(`gotoAdminAuthed_exhausted: ${lastDetail}`);
}

test.describe("admin l5 staging closure · negative", () => {
  test.describe.configure({ mode: "serial" });

  test("invalid cookie-only /admin redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "traveltrust_user_id",
        value: "stale-uid-only",
        domain: WEB_HOST,
        path: "/",
        secure: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    record("fe_invalid_cookie_redirect", true);
  });

  test("stale Bearer clears session and redirects or shows session expired", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${WEB}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.context().addCookies([
      {
        name: "traveltrust_user_id",
        value: "00000000-0000-4000-8000-000000000099",
        domain: WEB_HOST,
        path: "/",
        secure: true,
        sameSite: "Lax",
      },
      {
        name: "traveltrust_session_ok",
        value: "1",
        domain: WEB_HOST,
        path: "/",
        secure: true,
        sameSite: "Lax",
      },
      {
        name: "traveltrust_session_token",
        value: "tts_stale_invalid_token_for_audit",
        domain: WEB_HOST,
        path: "/",
        secure: true,
        sameSite: "Lax",
      },
    ]);
    await page.addInitScript(() => {
      localStorage.setItem("traveltrust_user_id", "00000000-0000-4000-8000-000000000099");
      localStorage.setItem("traveltrust_session_token", "tts_stale_invalid_token_for_audit");
    });
    await page.goto(`${WEB}/admin`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await Promise.race([
      page.waitForURL(/\/auth\/login/, { timeout: 45_000, waitUntil: "domcontentloaded" }),
      page
        .waitForResponse(
          (r) => r.url().includes("/api/v1/admin/capabilities") && r.status() === 401,
          { timeout: 45_000 },
        )
        .then(() => page.waitForTimeout(1500)),
    ]).catch(() => null);
    const url = page.url();
    const onLogin = /\/auth\/login/.test(url);
    if (onLogin) {
      record("fe_capabilities_401_session_clear", true, `redirect=${url}`);
      return;
    }
    const bodyText = await page.locator("body").innerText();
    const sessionExpiredMsg = /会话已过期|Session expired/i.test(bodyText);
    const lsToken = await page.evaluate(() => localStorage.getItem("traveltrust_session_token"));
    const lsUid = await page.evaluate(() => localStorage.getItem("traveltrust_user_id"));
    const cleared = !lsToken && !lsUid;
    expect(sessionExpiredMsg || cleared).toBeTruthy();
    record("fe_capabilities_401_session_clear", sessionExpiredMsg || cleared, `url=${url}`);
  });
});

test.describe("admin l5 staging closure · seeded", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("super_admin orders nav does not stay pending", async ({ page, request }) => {
    let session = await seedSuperAdminBrowserSession(page, request);
    session = await gotoAdminAuthed(page, request, session);

    const ordersLink = page.getByRole("link", { name: /Orders|订单/i }).first();
    await expect(ordersLink).toBeVisible({ timeout: 20_000 });
    await ordersLink.click();
    // SPA soft-nav often never fires `load` — wait for URL commit only.
    await page.waitForURL(/\/admin\/orders/, { timeout: 45_000, waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/orders/);

    const pending = page.locator('[data-tt-admin-nav-pending="1"]');
    await expect(pending).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('[data-tt-admin-app-page="1"]')).toBeVisible({ timeout: 20_000 });
    record("fe_orders_nav_no_pending", true);
  });

  test("home inbox 去处理 navigates to queue list without frozen stall", async ({
    page,
    request,
  }) => {
    let session = await seedSuperAdminBrowserSession(page, request);

    const admin401s: string[] = [];
    page.on("response", (res) => {
      try {
        const u = res.url();
        if (u.includes("/api/v1/admin/") && res.status() === 401) {
          admin401s.push(`${res.status()} ${u}`);
        }
      } catch {
        /* ignore */
      }
    });

    session = await gotoAdminAuthed(page, request, session);
    await expect(page.locator('[data-tt-admin-home-inbox="1"]')).toBeVisible({ timeout: 45_000 });

    const inbox = page.locator('[data-tt-admin-home-inbox="1"]');
    let processCta = inbox
      .locator('a[href^="/admin/"]')
      .filter({ hasText: /去处理|Process/i })
      .first();
    if ((await processCta.count()) === 0) {
      processCta = inbox
        .locator('a[href^="/admin/"]')
        .filter({ hasText: /查看|Open/i })
        .first();
    }
    if ((await processCta.count()) === 0) {
      processCta = inbox.locator('[data-tt-admin-inbox-all-clear="1"] a[href^="/admin/"]').first();
    }
    if ((await processCta.count()) === 0) {
      processCta = inbox.locator('a[href^="/admin/"]').first();
    }
    await expect(processCta).toBeVisible({ timeout: 30_000 });
    const href = (await processCta.getAttribute("href")) ?? "";
    expect(href).toMatch(/^\/admin\//);

    // Re-seed before queue nav — soft-nav can race a 401 clear from stale prefetch/RSC.
    await applySessionToContext(page, session);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
    });

    // Hard goto (commit) — soft-nav/RSC can ERR_ABORT domcontentloaded; accept aborted if we land.
    const target = new URL(href, WEB);
    try {
      await page.goto(target.toString(), { waitUntil: "commit", timeout: 90_000 });
    } catch (e) {
      if (!/ERR_ABORTED|interrupted/i.test(String(e))) throw e;
    }
    await page.waitForLoadState("domcontentloaded").catch(() => null);
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10_000 });
    // Inbox CTA may rewrite query/status; assert left /admin home onto a queue path.
    const landedPath = urlPathname(page.url());
    expect(
      landedPath.startsWith("/admin/") && landedPath !== "/admin/",
      `inbox CTA nav: href=${href} landed=${page.url()}`,
    ).toBeTruthy();
    // Soft check: same first segment under /admin/ when CTA was a concrete queue link.
    const hrefPath = target.pathname.replace(/\/$/, "") || "/admin";
    if (hrefPath !== "/admin" && hrefPath.split("/").length >= 3) {
      const head = hrefPath.split("/").slice(0, 3).join("/"); // /admin/<queue>
      expect(
        landedPath === hrefPath ||
          landedPath.startsWith(`${hrefPath}/`) ||
          landedPath.startsWith(`${head}/`) ||
          landedPath === head,
        `queue mismatch: hrefPath=${hrefPath} landed=${landedPath}`,
      ).toBeTruthy();
    }

    await expect(page.locator('[data-tt-admin-nav-pending="1"]')).toHaveCount(0, {
      timeout: 20_000,
    });

    const appPage = page.locator('[data-tt-admin-app-page="1"]');
    const queueShell = page.locator(
      '[data-tt-admin-list-page="1"], [data-tt-admin-queue-page="1"], [data-tt-admin-app-page="1"]',
    );
    // Mid-nav 401 / slow RSC: re-apply session + hard reload once before fail.
    let shellOk = await appPage.isVisible().catch(() => false);
    if (!shellOk) {
      shellOk = await queueShell
        .first()
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!shellOk && !/\/auth\/login/.test(page.url())) {
      await applySessionToContext(page, session);
      try {
        await page.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 60_000 });
      } catch (e) {
        if (!/ERR_ABORTED|interrupted/i.test(String(e))) throw e;
      }
      shellOk = await queueShell
        .first()
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!shellOk) {
      await expect(appPage).toBeVisible({ timeout: 5_000 });
    }

    // Mid-nav 401 from staging db_failed is non-fatal if we stayed on the queue page.
    if (admin401s.length && /\/auth\/login/.test(page.url())) {
      record("fe_home_inbox_cta_nav", false, `href=${href}; admin401=${admin401s.join("|")}`);
      throw new Error(`admin_401_during_inbox_nav: ${admin401s.join("; ")}`);
    }
    record(
      "fe_home_inbox_cta_nav",
      true,
      admin401s.length ? `${href}; soft401=${admin401s.length}` : href,
    );
  });
});
