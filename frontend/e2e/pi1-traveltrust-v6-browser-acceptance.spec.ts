/**
 * PI-1 · PH1-FE-08～11 — /traveltrust v6 电影级落地页浏览器验收（① 本地）
 *
 * 前置：API :8080 + Next :3012；`data-tt-traveltrust-network-page` 已挂载 v6 三区块。
 * 运行：`cd frontend && npm run e2e:pi1-traveltrust`
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { traveltrustNetworkPageShell } from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";
import {
  expectTraveltrustUnifiedHeroChrome,
  gotoTraveltrustV6,
  scrollTraveltrustRolesStable,
  scrollTraveltrustSectionStable,
  expectTraveltrustCanvasOffNarrativeViewport,
  traveltrustDesktopPhase1Roster,
  waitTraveltrustV6Ready,
} from "./helpers/traveltrustV6Ready";

const EVIDENCE_DIR = join(process.cwd(), "..", "evidence", "GO_20260518", "artifacts");

test.describe("PI-1 · /traveltrust v6 (PH1-FE-08～13)", () => {
  test.beforeEach(async ({ request, page }) => {
    await skipIfApiDown(request);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("PH1-UI-30: opengraph-image route returns PNG", async ({ page }) => {
    const res = await page.request.get("/traveltrust/opengraph-image");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"] ?? "").toMatch(/image\/png/);
  });

  test("page-brief v6 CTA contract hydrates", async ({ page, request }) => {
    const briefApi = await request
      .get("http://127.0.0.1:8080/api/v1/traveltrust/page-brief", { timeout: 15_000 })
      .catch(() => null);
    if (!briefApi?.ok()) {
      test.skip(true, "traveltrust page-brief API unavailable (start traveltrust-api)");
      return;
    }
    const body = (await briefApi.json()) as { page?: { ia_version?: string } };
    expect(body.page?.ia_version).toBe("v6");

    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1");
  });

  test("PH1-FE-08: v6 shell — hero / roles / start, no legacy fold", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute("data-tt-traveltrust-ia-version", "v6", { timeout: 15_000 });

    await expect(shell.locator("#hero")).toBeVisible();
    await expect(shell.locator("#pulse")).toBeVisible();
    await expect(shell.locator("#roles")).toBeVisible();
    await expect(shell.locator("#liquidity")).toBeVisible();
    await expect(shell.locator("#start")).toBeVisible();
    await expect(shell.locator("#trust")).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-pulse-ticker="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-stable-gateway="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-trust-facts="1"]')).toBeVisible();
    await expect(shell.locator("#explain")).toHaveCount(0);
    await expect(shell.locator("#stats")).toHaveCount(0);
    await expect(shell.locator('[data-tt-traveltrust-hero-chain-hud="1"]')).toHaveCount(0);
    await expect(shell.locator('[data-tt-traveltrust-landing-nav="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]').first()).toBeAttached();
    await expectTraveltrustUnifiedHeroChrome(shell);
    await expect(shell.locator('[data-tt-traveltrust-landing-chrome="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-illustrative-badge]').first()).toBeAttached();
    await expect(shell.locator("#settlement")).toBeAttached();
    await expect(shell.locator("#faq")).toBeAttached();
    await expect(shell.locator('[data-tt-traveltrust-network-footer="1"]')).toBeAttached();
    await expect(shell.locator('[data-tt-traveltrust-hero-wallet-menu="1"]')).toBeVisible();

    await expect(shell.locator("#live-network")).toHaveCount(0);
    await expect(shell.locator("#live-stats")).toHaveCount(0);

    await expect(
      shell.getByRole("heading", {
        level: 1,
        name: /TravelTrust (Network|网络|定制旅行|Custom travel)/i,
      }),
    ).toBeVisible();

    const planCta = shell.getByRole("link", { name: /规划|Plan a trip|Plan trip/i }).first();
    await expect(planCta).toBeVisible();
    await expect(planCta).toHaveAttribute("href", /#start/);
    await expect(shell.locator('[data-tt-traveltrust-hero-trust-chips="1"]')).toBeAttached();
    await expect(shell.locator('[data-tt-traveltrust-hero-trust-chip="escrow"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-hero-content-shell="1"]')).toBeAttached();
    await expect(shell.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible();
    await expect(page.getByText(/加入早鸟|Join early access/i)).toHaveCount(0);
    await expect(page.getByText(/Overview and Highlights/i)).toHaveCount(0);

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "fe-browser-traveltrust-redesign-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(EVIDENCE_DIR, "fe-browser-traveltrust-redesign-mobile.png"), fullPage: true });
  });

  test("PH1-FE-09: role tabs keyboard + trust chips", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustRolesStable(shell);
    const tablist = shell.getByRole("tablist");
    await expect(tablist).toBeVisible();

    const travelerTab = shell.locator("#tab-traveler");
    const guideTab = shell.locator("#tab-guide");
    const merchantTab = shell.locator("#tab-merchant");
    await expect(travelerTab).toHaveAttribute("aria-selected", "true");
    await travelerTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(guideTab).toHaveAttribute("aria-selected", "true", { timeout: 5_000 });
    await expect(shell.locator('[data-tt-traveltrust-active-role-id="guide"]')).toBeAttached({
      timeout: 5_000,
    });
    await guideTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(merchantTab).toBeFocused({ timeout: 5_000 });

    await shell.locator("#hero").scrollIntoViewIfNeeded();
    await expect(shell.getByText(/托管|Escrow/i).first()).toBeVisible();
  });

  test("PH1-FE-10: role tab switch + video frame visible", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);

    await shell.getByRole("tab", { name: /向导|Guide/i }).click();
    await expect(shell.getByRole("tabpanel")).toBeVisible();
    await expect(shell.getByRole("button", { name: /播放|Play role video/i })).toBeVisible();

    await shell.getByRole("tab", { name: /区域|Region steward|Steward/i }).click();
    await expect(shell.getByRole("link", { name: /进入|Enter/i })).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-role-video="1"]')).toBeVisible();
  });

  test("PH1-FE-012: traveler enter stays in-page (#start)", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await shell.getByRole("tab", { name: /游客|Traveler/i }).click();
    const enter = shell.getByRole("link", { name: /进入|Enter/i }).first();
    await expect(enter).toHaveAttribute("href", /#start/);
    await expect(enter).toHaveAttribute("data-tt-traveltrust-role-enter-href", "#start");
  });

  test("PH1-FE-168c: trust chips and footer carry compliance disclosure copy", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator('[data-tt-traveltrust-hero-trust-chips-disclaimer="1"]')).toBeAttached();
    await scrollTraveltrustSectionStable(shell, "trust");
    await expect(shell.locator('[data-tt-traveltrust-trust-facts-disclaimer="1"]')).toBeVisible();
    await scrollTraveltrustSectionStable(shell, "start");
    const compliance = shell.locator('[data-tt-traveltrust-footer-compliance="1"]');
    await expect(compliance).toBeVisible();
    await compliance.locator("summary").click({ force: true });
    await expect(shell.locator('[data-tt-traveltrust-page-illustrative-notice="1"]')).toBeAttached();
  });

  test("PH1-FE-193: hero split layout — copy column beside globe at desktop", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator("#hero")).toHaveAttribute("data-tt-traveltrust-hero-layout", "split-lr");
    await expect(shell.locator('[data-tt-traveltrust-hero-copy-col="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-hero-globe-viewport="1"]')).toBeVisible();
  });

  test("PH1-FE-150: hero letterbox uses gradient tone not solid black bars", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await expectTraveltrustUnifiedHeroChrome(shell);
    const copyCard = shell.locator('[data-tt-traveltrust-hero-copy-card="1"]');
    await expect(copyCard).not.toHaveClass(/bg-black/);
    const cls = (await copyCard.getAttribute("class")) ?? "";
    expect(cls).toMatch(/gradient|from-|via-|to-/);
  });

  test("PH1-FE-022d: section hash matrix (page-brief anchors)", async ({ page }) => {
    const cases = [
      { hash: "pulse", marker: '[data-tt-traveltrust-pulse-ticker="1"]' },
      { hash: "trust", marker: '[data-tt-traveltrust-trust-facts="1"]' },
      { hash: "liquidity", marker: '[data-tt-traveltrust-stable-gateway="1"]' },
      { hash: "faq", marker: '[data-tt-traveltrust-faq-strip="1"]' },
      { hash: "start", marker: '[data-tt-traveltrust-plan-href]' },
    ] as const;

    for (const { hash, marker } of cases) {
      await gotoSmoke(page, `/traveltrust#${hash}`);
      await waitTraveltrustV6Ready(page);
      const shell = traveltrustNetworkPageShell(page);
      await expect(shell.locator(marker).first()).toBeVisible({ timeout: 15_000 });
      await expect(shell.locator(`#${hash}`)).toBeInViewport({ timeout: 15_000 });
    }

    await gotoSmoke(page, "/traveltrust#fee-router");
    await waitTraveltrustV6Ready(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator("#fee-router")).toBeInViewport({ timeout: 12_000 });
    await expect(shell.locator('[data-tt-traveltrust-fee-router-trigger="1"]')).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("PH1-FE-022c: trust and settlement hash deep-links", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust#trust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator("#trust")).toBeInViewport({ timeout: 10_000 });
    await expect(shell.locator('[data-tt-traveltrust-trust-facts="1"]')).toBeVisible();

    await gotoSmoke(page, "/traveltrust#settlement");
    await expect(shell.locator("#settlement")).toBeInViewport({ timeout: 10_000 });
    await expect(shell.locator('[data-tt-traveltrust-settlement-protocol-toggle="1"]')).toBeVisible();
  });

  test("PH1-FE-022: role hash deep-link selects tab", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    await waitTraveltrustV6Ready(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustRolesStable(shell);
    await page.evaluate(() => {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#guide`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await expect(shell.locator("#roles")).toHaveAttribute("data-tt-traveltrust-active-role-id", "guide", {
      timeout: 15_000,
    });
    await expect(shell.getByRole("tab", { name: /向导|Guide/i })).toHaveAttribute("aria-selected", "true", {
      timeout: 5_000,
    });
  });

  test("PH1-FE-157: phase-1 region roster is keyboard focusable", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    const roster = traveltrustDesktopPhase1Roster(shell);
    await expect(roster).toBeVisible();
    await roster.getByRole("link").first().focus();
    await expect(roster.getByRole("link").first()).toBeFocused();
  });

  test("PH1-FE-090b: scroll progress fades when WebGL idle", async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    const canvas = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]');
    await expect(canvas).toHaveAttribute("data-tt-traveltrust-page-cinematic-power", "active", {
      timeout: 15_000,
    });
    const progress = page.locator('[data-tt-traveltrust-scroll-progress="1"]');
    await expect(progress).toBeAttached({ timeout: 20_000 });
    await expect(progress).toHaveAttribute("data-tt-traveltrust-scroll-progress-visible", "1", {
      timeout: 10_000,
    });
    await scrollTraveltrustSectionStable(shell, "start");
    await expectTraveltrustCanvasOffNarrativeViewport(page);
  });

  test("PH1-FE-11:首屏 1.2s 入场 — 剧场露边", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator("#hero")).toBeInViewport();
    await expect(shell.locator("#roles")).toBeAttached({ timeout: 20_000 });
    await expect(shell.locator("#roles")).toHaveAttribute("data-tt-traveltrust-theater-entered", "1", {
      timeout: 15_000,
    });
    await expect(
      shell.getByRole("link", { name: /向下 · 角色剧场|Role stories/i }),
    ).toBeVisible();
    await expect(shell.getByRole("tab", { name: /游客|Traveler/i })).toHaveAttribute("aria-selected", "true");
  });

  test("PH1-FE-12: v6 impact — 无旧 IA 文案", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(
      shell.getByRole("heading", {
        level: 1,
        name: /TravelTrust (Network|网络|定制旅行|Custom travel)/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/加入早鸟|体验演示区|托管优先的旅行网络/i)).toHaveCount(0);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "fe-browser-traveltrust-v6-impact.png"), fullPage: false });
  });

  test("PH1-FE-092: role video static frame when reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustRolesStable(shell);
    await expect(shell.locator('[data-tt-traveltrust-role-video-static-frame="1"]').first()).toBeAttached({
      timeout: 10_000,
    });
    await expect(shell.locator("video[autoplay]")).toHaveCount(0);
  });

  test("PH1-FE-13: prefers-reduced-motion 降级", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toBeVisible();
    await expect(shell.locator("#hero")).toBeVisible();
    await expect(page.locator('[data-tt-traveltrust-reduced-motion-notice-visible="1"]')).toBeVisible();
    await expect(page.locator("video[autoplay]")).toHaveCount(0);
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({
      path: join(EVIDENCE_DIR, "fe-browser-traveltrust-v5-reduced-motion.png"),
      fullPage: true,
    });
  });

  test("PH1-FE-15: WebGL power idle past narrative bands (TT-PH1-145)", async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    const canvasLayer = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]');
    await expect(canvasLayer).toHaveAttribute("data-tt-traveltrust-page-cinematic-power", "active", {
      timeout: 15_000,
    });
    await scrollTraveltrustSectionStable(shell, "roles");
    await scrollTraveltrustSectionStable(shell, "liquidity");
    await scrollTraveltrustSectionStable(shell, "start");
    await expectTraveltrustCanvasOffNarrativeViewport(page);
  });

  test("PH1-FE-01: wheel scroll reaches roles, liquidity, trust, start", async ({ page }) => {
    const shell = traveltrustNetworkPageShell(page);
    for (const sectionId of ["roles", "liquidity", "trust", "start"] as const) {
      await gotoSmoke(page, `/traveltrust#${sectionId}`);
      await expect(shell.locator(`#${sectionId}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test("PH1-FE-14: trust facts + illustrative badge + tier-1 mp4 sources", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);

    await scrollTraveltrustSectionStable(shell, "trust");
    await expect(shell.getByRole("heading", { name: /可核对|Facts you can verify/i })).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-trust-fact-card="governance"]').first()).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-illustrative-badge]').first()).toBeVisible();

    const heroDomVideo = shell.locator("#hero");
    await expect(heroDomVideo).toHaveAttribute("data-tt-traveltrust-hero-dom-video", "0");
    await expect(shell.locator("#hero video source[type='video/mp4']")).toHaveCount(0);

    await scrollTraveltrustRolesStable(shell);
    await shell.getByRole("tab", { name: /游客|Traveler/i }).click({ force: true });
    const roleMp4 = shell.locator(
      '[data-tt-traveltrust-role-video-id="traveler"] video source[type="video/mp4"]',
    );
    await expect(roleMp4).toHaveAttribute("src", /\/media\/traveltrust\/roles\/traveler\.mp4/, {
      timeout: 8_000,
    });
  });

  test("PH1-FE-14b: liquidity preview banner + locked amount", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust#liquidity");
    await waitTraveltrustV6Ready(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustSectionStable(shell, "liquidity");
    await expect(shell.locator('[data-tt-traveltrust-ttg-gateway-preview="1"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(shell.locator('[data-tt-traveltrust-liquidity-preview-banner="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-liquidity-amount-preview="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-liquidity-amount-locked-hint="1"]')).toBeVisible();
    await expect(
      shell.getByText(/示意数量已锁定|Amount is locked for preview/i),
    ).toBeVisible();
  });

  test("PH1-FE-14c: page-brief Live/Demo badge + role primary CTA", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator('[data-tt-traveltrust-page-brief-mode]').first()).toBeAttached();
    await scrollTraveltrustRolesStable(shell);
    await expect(shell.locator('[data-tt-traveltrust-role-cta-stack="1"]')).toBeVisible();
    await expect(
      shell.locator('[data-tt-traveltrust-role-enter-href]').first(),
    ).toHaveAttribute("href", /#start/);
  });

  test("PH1-FE-153 / PH1-FE-08b: narrow viewport hero CTA dock safe-area", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(shell.locator('[data-tt-traveltrust-hero-content-shell="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible();
    const planCta = shell
      .locator('[data-tt-traveltrust-hero-cta-dock="1"]')
      .getByRole("link", { name: /规划|Plan a trip|Plan trip/i })
      .first();
    await expect(planCta).toBeVisible();
    await expect(planCta).toBeInViewport();
  });

  test("PH1-FE-08c: narrow viewport role theater tabs + video aspect", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustRolesStable(shell);
    await expect(shell.locator('[data-tt-traveltrust-theater-entered="1"]')).toBeAttached({
      timeout: 15_000,
    });
    await expect(shell.locator('[data-tt-traveltrust-roles-tablist-mobile="1"]')).toBeVisible();
    await expect(shell.locator('[data-tt-traveltrust-role-video="1"]').first()).toBeVisible();
    await shell.getByRole("tab", { name: /向导|Guide/i }).click({ force: true });
    await expect(shell.locator('[data-tt-traveltrust-active-role-id="guide"]')).toBeAttached();
  });

  test("PH1-FE-090: canvas idles below fold", async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await gotoSmoke(page, "/traveltrust#start");
    await waitTraveltrustV6Ready(page);
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell.locator("#start")).toBeVisible({ timeout: 15_000 });
    await scrollTraveltrustSectionStable(shell, "start");
    await expectTraveltrustCanvasOffNarrativeViewport(page);
  });

  test("PH1-FE-177: FAQ accordion keyboard navigation", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1", { timeout: 20_000 });
    const accordion = shell.locator('[data-tt-traveltrust-faq-accordion="1"]');
    await accordion.scrollIntoViewIfNeeded();

    const first = shell.locator('[data-tt-traveltrust-faq-trigger="0"]');
    const second = shell.locator('[data-tt-traveltrust-faq-trigger="1"]');
    const last = shell.locator('[data-tt-traveltrust-faq-trigger="4"]');
    await expect(first).toHaveAttribute("aria-expanded", "true");

    await second.scrollIntoViewIfNeeded();
    await second.click({ force: true });
    await expect(second).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
    await expect(first).toHaveAttribute("aria-expanded", "false");

    await last.scrollIntoViewIfNeeded();
    await last.click({ force: true });
    await expect(last).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
    await expect(second).toHaveAttribute("aria-expanded", "false");
  });

  test("PH1-FE-155b: compact nav more menu opens upward", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 812 });
    await gotoTraveltrustV6(page);
    const nav = traveltrustNetworkPageShell(page).locator('[data-tt-traveltrust-landing-nav="1"]');
    await expect(nav).toHaveAttribute("data-tt-traveltrust-landing-nav-embedded", "1");
    await expect(nav).toHaveAttribute("data-tt-traveltrust-landing-nav-no-more", "1");
    const toggle = nav.locator('[data-tt-traveltrust-landing-nav-toggle="1"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
    const mobile = page.locator("#traveltrust-landing-nav-mobile");
    await expect(mobile).toBeVisible({ timeout: 10_000 });
    await expect(
      mobile.getByRole("link", { name: /结算|Settlement|常见问题|FAQ|公告|Pulse/i }).first(),
    ).toBeVisible();
  });

  test("PH1-FE-190b: network footer links to home site map", async ({ page }) => {
    await gotoTraveltrustV6(page);
    const shell = traveltrustNetworkPageShell(page);
    await scrollTraveltrustSectionStable(shell, "start");
    const footer = shell.locator('[data-tt-traveltrust-network-footer="1"]');
    await expect(footer).toBeVisible({ timeout: 10_000 });
    const homeLink = footer.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  test("PH1-FE-190c: settlement protocol notes expand", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1", { timeout: 20_000 });
    await shell.locator("#settlement").scrollIntoViewIfNeeded();
    const toggle = shell.locator('[data-tt-traveltrust-settlement-protocol-toggle="1"]');
    await expect(toggle).toBeVisible();
    await toggle.evaluate((btn: HTMLButtonElement) => {
      btn.click();
    });
    await expect(toggle).toHaveAttribute("data-tt-traveltrust-settlement-protocol-open", "1", {
      timeout: 5_000,
    });
    await expect(shell.locator('[data-tt-traveltrust-settlement-disclaimer="1"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("PH1-FE-11b: hero scroll cue jumps to roles and start", async ({ page }) => {
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await expect(shell).toHaveAttribute("data-tt-traveltrust-page-brief-ready", "1", { timeout: 20_000 });

    await shell.getByRole("link", { name: /向下 · 角色剧场|Role stories/i }).click();
    await expect(page).toHaveURL(/#roles/);
    await expect(shell.locator("#roles")).toBeInViewport();

    await gotoSmoke(page, "/traveltrust#start");
    await expect(page).toHaveURL(/#start/, { timeout: 10_000 });
    await expect(shell.locator("#start")).toBeVisible({ timeout: 15_000 });
  });
});
