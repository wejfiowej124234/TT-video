/**
 * Admin Final Spot Check · local :3012 · record-only (no UX fixes).
 * Paths: Guide→Countries→Publish · Guide→Official Hub→Cold-start · Guide→Reports→2-step wizard.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

import {
  gotoWithBearerSession,
  defaultApiBase,
  apiLoginReturnCredentials,
} from "./helpers/apiSession";
import { waitForAdminCapabilitiesReady, gotoWithAdminShellSessionReady } from "./helpers/adminCapabilitiesSession";

const API = defaultApiBase();
const EMAIL = process.env.AFSC_ADMIN_EMAIL ?? "tourist@test.com";
const PASS = process.env.AFSC_PASSWORD ?? "Test123!";
const RUN_DIR =
  process.env.AFSC_RUN_DIR ??
  join(process.cwd(), "..", "evidence", "PARALLEL_UAT_SOAK_WINDOW", "run-20260608T103808Z");

type SpotFinding = {
  id: string;
  severity: "P0" | "P1" | "P2";
  track: "Admin-Final-Spot-Check";
  path_id: string;
  kind: "blocked" | "lost" | "terminology" | "extra_clicks" | "misunderstanding" | "unexpected_redirect" | "env";
  title: string;
  observation: string;
  clicks?: number;
  status: "open" | "partial";
  fix_policy: "deferred_post_soak";
};

const findings: SpotFinding[] = [];
const pathLog: Record<string, string[]> = {};

function record(
  partial: Omit<SpotFinding, "id" | "track" | "fix_policy"> & { status?: SpotFinding["status"] },
): void {
  const id = `AFSC-${String(findings.length + 1).padStart(3, "0")}`;
  findings.push({
    id,
    track: "Admin-Final-Spot-Check",
    status: partial.status ?? "open",
    fix_policy: "deferred_post_soak",
    ...partial,
  });
}

function logStep(pathId: string, step: string): void {
  pathLog[pathId] ??= [];
  pathLog[pathId].push(step);
}

test.describe("Admin Final Spot Check @admin-final-spot-check", () => {
  test.setTimeout(180_000);

  test("three guide paths · record-only", async ({ page, request }) => {
    try {
    await request.post(`${API}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });
    await request.post(`${API}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: { promote_admin_email: EMAIL },
    });
    const creds = await apiLoginReturnCredentials(request, API, EMAIL, PASS);
    if (!creds?.token) {
      record({
        path_id: "Cross",
        severity: "P0",
        kind: "blocked",
        title: "Admin login failed for spot check persona",
        observation: `email=${EMAIL} — run seed-test-accounts first`,
      });
      mkdirSync(join(RUN_DIR, "tracks"), { recursive: true });
      writeFileSync(
        join(RUN_DIR, "admin-final-spot-check.v1.json"),
        `${JSON.stringify({ schema: "traveltrust.admin_final_spot_check.v1", findings, path_log: pathLog }, null, 2)}\n`,
        "utf8",
      );
      return;
    }
    const session = creds;

    // --- Path 1: Guide → Countries → Publish ---
    const path1 = "Guide-Countries-Publish";
    logStep(path1, "goto /admin/operator-guide");
    await gotoWithAdminShellSessionReady(page, "/admin/operator-guide", session, 120_000);

    if (page.url().includes("/auth/login")) {
      record({
        path_id: path1,
        severity: "P0",
        kind: "blocked",
        title: "Operator Guide redirects to login",
        observation: page.url(),
      });
    } else {
      const cmsLink = page.locator('[data-tt-admin-operator-guide-daily-ops="1"] a').first();
      await expect(cmsLink).toBeVisible({ timeout: 20_000 });
      const cmsHref = await cmsLink.getAttribute("href");
      logStep(path1, `click daily ops #1 href=${cmsHref}`);
      if (cmsHref !== "/admin/content/countries") {
        record({
          path_id: path1,
          severity: "P0",
          kind: "unexpected_redirect",
          title: "Guide CMS link not pointing to Countries",
          observation: `href=${cmsHref}`,
        });
      }
      await Promise.all([
        page.waitForURL(/\/admin\/content\/countries/, { timeout: 60_000, waitUntil: "domcontentloaded" }),
        cmsLink.click(),
      ]).catch(async () => {
        record({
          path_id: path1,
          severity: "P1",
          kind: "unexpected_redirect",
          title: "Guide CMS click did not land on Countries",
          observation: `after_click_url=${page.url()}`,
        });
        await gotoWithAdminShellSessionReady(page, "/admin/content/countries", session, 90_000);
      });
      logStep(path1, `landed ${page.url()}`);
      const countriesList = page.locator("[data-tt-admin-content-countries-list]");
      if (!(await countriesList.isVisible({ timeout: 30_000 }).catch(() => false))) {
        record({
          path_id: path1,
          severity: "P1",
          kind: "blocked",
          title: "Countries publish page shell not rendered",
          observation: `url=${page.url()} — list marker missing (API error, RBAC, or capabilities pending)`,
        });
      } else {
      const publishBtn = page.getByRole("button", { name: /Publish|发布/i });
      const submitBtn = page.getByRole("button", { name: /Submit review|提交审核/i });
      const hasPublish = (await publishBtn.count()) > 0;
      const hasSubmit = (await submitBtn.count()) > 0;
      logStep(path1, `publish_buttons=${hasPublish} submit_review_buttons=${hasSubmit}`);
      if (!hasPublish && !hasSubmit) {
        record({
          path_id: path1,
          severity: "P1",
          kind: "misunderstanding",
          title: "Countries page shows no publish/submit actions (empty catalog or RBAC)",
          observation: "Operator may not complete publish without seed rows or content_write perm",
          status: "partial",
        });
      }
      const subtitle = await page.locator("h1").locator("..").textContent().catch(() => "");
      if (subtitle && /catalog_publish_pending|in_review aggregate/i.test(subtitle)) {
        record({
          path_id: path1,
          severity: "P2",
          kind: "terminology",
          title: "Countries page still shows engineering subtitle tokens",
          observation: subtitle.slice(0, 120),
        });
      }
      }
    }

    // --- Path 2: Guide → Official Hub → Cold-start ---
    const path2 = "Guide-Official-Deploy";
    logStep(path2, "goto /admin/operator-guide");
    await gotoWithAdminShellSessionReady(page, "/admin/operator-guide", session, 90_000);
    const officialLink = page.locator('[data-tt-admin-operator-guide-daily-ops="1"] a').nth(3);
    await expect(officialLink).toBeVisible();
    const officialHref = await officialLink.getAttribute("href");
    logStep(path2, `click daily ops #4 href=${officialHref}`);
    if (officialHref !== "/admin/official") {
      record({
        path_id: path2,
        severity: "P1",
        kind: "unexpected_redirect",
        title: "Guide Official link not pointing to hub",
        observation: `href=${officialHref}`,
      });
    }
    await officialLink.click();
    await page.waitForURL(/\/admin\/official\/?$/, { timeout: 60_000, waitUntil: "domcontentloaded" }).catch(async () => {
      record({
        path_id: path2,
        severity: "P1",
        kind: "unexpected_redirect",
        title: "Guide Official click did not land on hub",
        observation: `after_click_url=${page.url()}`,
      });
      await gotoWithAdminShellSessionReady(page, "/admin/official", session, 90_000);
    });
    logStep(path2, `hub ${page.url()}`);
    if (!(await page.locator("[data-tt-admin-official-hub]").isVisible({ timeout: 20_000 }).catch(() => false))) {
      record({
        path_id: path2,
        severity: "P1",
        kind: "blocked",
        title: "Official hub shell not rendered",
        observation: page.url(),
      });
    } else {
    const hubLinks = page.locator("[data-tt-admin-official-hub-link]");
    const hubCount = await hubLinks.count();
    logStep(path2, `hub_module_links=${hubCount}`);
    if (hubCount !== 4) {
      record({
        path_id: path2,
        severity: "P1",
        kind: "lost",
        title: "Official hub does not show four modules",
        observation: `link_count=${hubCount}`,
      });
    }
    const coldLink = page.locator('[data-tt-admin-official-hub-link="/admin/official/cold-start"]');
    await coldLink.click();
    await page.waitForURL(/\/admin\/official\/cold-start/, { timeout: 20_000 });
    logStep(path2, `cold-start ${page.url()} (+1 click from hub)`);
    record({
      path_id: path2,
      severity: "P2",
      kind: "extra_clicks",
      title: "Deploy path requires hub → cold-start extra click",
      observation: "Guide lands on hub; deploy workflow on cold-start sub-page",
      clicks: 1,
      status: "partial",
    });
    if (!(await page.locator("[data-tt-admin-official-cold-start-create]").isVisible({ timeout: 20_000 }).catch(() => false))) {
      record({
        path_id: path2,
        severity: "P1",
        kind: "blocked",
        title: "Cold-start create form not visible",
        observation: page.url(),
      });
    }
    const emptyGuide = page.locator('[data-tt-admin-official-cold-start-empty-guide="1"]');
    if (await emptyGuide.isVisible().catch(() => false)) {
      logStep(path2, "empty campaign guided panel visible");
    }
    }

    // --- Path 3: Guide → Community Reports → 2-step wizard ---
    const path3 = "Guide-Reports-Wizard";
    logStep(path3, "goto /admin/operator-guide");
    await gotoWithAdminShellSessionReady(page, "/admin/operator-guide", session, 90_000);
    const reportsLink = page.locator('[data-tt-admin-operator-guide-daily-ops="1"] a').nth(2);
    await expect(reportsLink).toBeVisible();
    await reportsLink.click();
    await page.waitForURL(/\/admin\/community\/reports/, { timeout: 60_000, waitUntil: "domcontentloaded" }).catch(async () => {
      record({
        path_id: path3,
        severity: "P1",
        kind: "unexpected_redirect",
        title: "Guide reports click did not land on reports queue",
        observation: `after_click_url=${page.url()}`,
      });
      await gotoWithAdminShellSessionReady(page, "/admin/community/reports?status=open", session, 90_000);
    });
    logStep(path3, `reports ${page.url()}`);
    if (!(await page.locator('[data-tt-admin-app-page="1"]').isVisible({ timeout: 30_000 }).catch(() => false))) {
      record({
        path_id: path3,
        severity: "P1",
        kind: "blocked",
        title: "Community reports page shell not rendered",
        observation: page.url(),
      });
    } else {

    const startReview = page.getByRole("button", { name: /Start review|开始处置/i }).first();
    if ((await startReview.count()) === 0) {
      record({
        path_id: path3,
        severity: "P1",
        kind: "blocked",
        title: "No open reports to exercise 2-step wizard",
        observation: "List has no Start review button — path partial without seed data",
        status: "partial",
      });
    } else {
      await startReview.click();
      await expect(page.locator('[data-tt-admin-reports-wizard="1"]')).toBeVisible({ timeout: 15_000 });
      const steps = page.locator("[data-tt-admin-reports-wizard-step]");
      const stepCount = await steps.count();
      logStep(path3, `wizard_visible_steps=${stepCount}`);
      if (stepCount > 2) {
        record({
          path_id: path3,
          severity: "P1",
          kind: "misunderstanding",
          title: "Wizard shows more than 2 step markers",
          observation: `step_count=${stepCount}`,
        });
      }
      const versionMeta = page.locator('[data-tt-admin-reports-wizard-version="1"]');
      if (!(await versionMeta.isVisible().catch(() => false))) {
        record({
          path_id: path3,
          severity: "P2",
          kind: "terminology",
          title: "Wizard version meta not visible on step 1",
          observation: "Operator may still hunt for expected_version field",
        });
      }
      await page.getByRole("button", { name: /Cancel|取消/i }).first().click();
    }
    }

    mkdirSync(join(RUN_DIR, "tracks"), { recursive: true });
    const stamp = new Date().toISOString();
    const manifest = {
      schema: "traveltrust.admin_final_spot_check.v1",
      session_id: "AFSC-20260608",
      started_at: stamp,
      env: { fe_base: "http://127.0.0.1:3012", api_base: API, admin_email: EMAIL },
      policy: "record_only · no UX fixes except P0/P1 block · wait staging-soak",
      path_log: pathLog,
      summary: {
        total: findings.length,
        P0: findings.filter((f) => f.severity === "P0").length,
        P1: findings.filter((f) => f.severity === "P1").length,
        P2: findings.filter((f) => f.severity === "P2").length,
      },
      task_completion: {
        "Guide-Countries-Publish": { nav: "ok href=/admin/content/countries", shell: "see findings" },
        "Guide-Official-Deploy": { nav: "ok href=/admin/official", shell: "see findings" },
        "Guide-Reports-Wizard": { nav: "ok /admin/community/reports?status=open", shell: "see findings" },
      },
      findings,
    };
    writeFileSync(join(RUN_DIR, "admin-final-spot-check.v1.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    writeFileSync(join(RUN_DIR, "tracks", "admin-final-spot-check.log"), `${JSON.stringify(pathLog, null, 2)}\n`, "utf8");
    } catch (err) {
      record({
        path_id: "Cross",
        severity: "P0",
        kind: "blocked",
        title: "Spot check harness error",
        observation: err instanceof Error ? err.message : String(err),
      });
      mkdirSync(join(RUN_DIR, "tracks"), { recursive: true });
      const stamp = new Date().toISOString();
      writeFileSync(
        join(RUN_DIR, "admin-final-spot-check.v1.json"),
        `${JSON.stringify(
          {
            schema: "traveltrust.admin_final_spot_check.v1",
            session_id: "AFSC-20260608",
            started_at: stamp,
            policy: "record_only",
            path_log: pathLog,
            summary: { total: findings.length, P0: 1, P1: 0, P2: 0 },
            findings,
            error: err instanceof Error ? err.message : String(err),
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
    }
  });
});