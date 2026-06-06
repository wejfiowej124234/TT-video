/**
 * ① 仅诊断：**`community-feed-publish-entry`** 未出现时，落盘 DOM / 控制台 / pageerror / 网络摘要 / 截图与清单（**不**录 HAR、**不**宣称整条证据链完成）。
 *
 * 与 MinIO 证据同源：**`tourist@test.com`** + **`gotoWithBearerSession(page, "/community", cred)`**。
 *
 * 产出目录（相对仓库根）：**`evidence/community-media-local-minio-chain/out/publish-entry-diagnostic/`**
 *
 * 运行：**`bash scripts/evidence/run-community-publish-entry-diagnostic.sh`**（须已有 **`24-env-snapshot.txt`**，全栈与证据脚本一致）。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { communityLoginForPublishShell } from "./helpers/pageShells";

const outDir = () =>
  join(process.cwd(), "..", "evidence", "community-media-local-minio-chain", "out", "publish-entry-diagnostic");

type NetLine = { method: string; url: string; status: number };

test.describe("community publish entry · diagnostic artifacts", () => {
  test.setTimeout(240_000);

  test("DOM + console + pageerror + network + screenshot + checklist", async ({ page, request }) => {
    const out = outDir();
    mkdirSync(out, { recursive: true });

    const consoleLines: string[] = [];
    const netLines: NetLine[] = [];

    page.on("console", (msg) => {
      consoleLines.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      consoleLines.push(`[pageerror] ${String(err)}`);
    });
    const maxNet = 1_200;
    page.on("response", (res) => {
      try {
        const req = res.request();
        const u = res.url();
        if (!u.includes("/api/")) return;
        if (netLines.length >= maxNet) return;
        netLines.push({ method: req.method(), url: u, status: res.status() });
      } catch {
        /* ignore */
      }
    });

    const apiBase = defaultApiBase();
    const nextBase = (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3012").replace(/\/$/, "");
    const nextOrigin = new URL(nextBase).origin;
    const apiOrigin = new URL(apiBase).origin;

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const cred = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    expect(cred, "login tourist@test.com").toBeTruthy();
    if (!cred) return;

    /** 须在导航前挂上，否则 RSC/首包已返回 `feed`/`following` 时 `waitForResponse` 永等（与 onboarding quote 同源）。 */
    const feedOrFollowing = page.waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        const u = r.url();
        return u.includes("/api/v1/community/feed") || u.includes("/api/v1/community/me/following");
      },
      { timeout: 120_000 },
    );
    await gotoWithBearerSession(page, "/community", cred);

    await page.waitForSelector('[data-tt-community-feed-page="1"]', { timeout: 120_000 });
    await feedOrFollowing;

    await page.waitForTimeout(1_500);

    const pageUrl = page.url();
    const pageOrigin = new URL(pageUrl).origin;
    const storage = await page.evaluate(() => {
      try {
        return {
          tokenLen: (localStorage.getItem("traveltrust_session_token") ?? "").length,
          userId: localStorage.getItem("traveltrust_user_id"),
          skipMeFetch: (window as unknown as { __TT_PUBLIC_SKIP_ME_FETCH?: string }).__TT_PUBLIC_SKIP_ME_FETCH ?? "",
        };
      } catch {
        return { tokenLen: -1, userId: null as string | null, skipMeFetch: "" };
      }
    });

    const feedPage = page.locator('[data-tt-community-feed-page="1"]');
    const loginForPublish = communityLoginForPublishShell(page);
    const entryScoped = feedPage.getByTestId("community-feed-publish-entry");
    const entryGlobal = page.getByTestId("community-feed-publish-entry");
    const fab = page.getByTestId("community-feed-publish-fab");

    const counts = {
      feedPage: await feedPage.count(),
      loginForPublish: await loginForPublish.count(),
      publishEntryScoped: await entryScoped.count(),
      publishEntryGlobal: await entryGlobal.count(),
      publishFab: await fab.count(),
    };

    const layout = await page.evaluate(() => {
      const probe = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return { present: false as const };
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          present: true as const,
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          rect: { w: r.width, h: r.height, top: r.top, left: r.left },
        };
      };
      return {
        lang: document.documentElement.lang || "",
        viewport: { w: window.innerWidth, h: window.innerHeight },
        entry: probe('[data-testid="community-feed-publish-entry"]'),
        fab: probe('[data-testid="community-feed-publish-fab"]'),
      };
    });

    const hitsNextOrigin = pageOrigin === nextOrigin;
    const originLooksLikeApi = pageOrigin === apiOrigin;

    const checklistMd = [
      "# publish-entry diagnostic checklist",
      "",
      `- **page URL**: \`${pageUrl}\``,
      `- **page origin**: \`${pageOrigin}\` — **matches PLAYWRIGHT_BASE_URL origin (${nextOrigin})**: ${hitsNextOrigin ? "yes" : "no"}`,
      `- **same origin as default API (${apiOrigin})** (suspect wrong tab / API HTML): ${originLooksLikeApi ? "yes — investigate" : "no"}`,
      `- **localStorage session token length**: ${storage.tokenLen}`,
      `- **localStorage traveltrust_user_id**: ${storage.userId ?? "(empty)"}`,
      `- **window.__TT_PUBLIC_SKIP_ME_FETCH**: \`${storage.skipMeFetch || "(empty)"}\``,
      `- **document.documentElement.lang**: \`${layout.lang || "(empty)"}\``,
      `- **viewport (inner)**: ${layout.viewport.w}x${layout.viewport.h}`,
      `- **data-tt-community-feed-page="1"** (main feed shell): count **${counts.feedPage}**`,
      `- **data-tt-community-login-for-publish="1"** (login-to-publish modal): count **${counts.loginForPublish}** (expect **0** when session is accepted as logged-in)`,
      `- **data-testid community-feed-publish-entry** (scoped under feed / global): **${counts.publishEntryScoped}** / **${counts.publishEntryGlobal}**`,
      `- **data-testid community-feed-publish-fab**: count **${counts.publishFab}**`,
      "",
      "## counts",
      "",
      "```json",
      JSON.stringify(counts, null, 2),
      "```",
      "",
      "## layout probes (first matching selector in document)",
      "",
      "```json",
      JSON.stringify(layout, null, 2),
      "```",
      "",
      "## responsive / layout (source-of-truth in repo)",
      "",
      "- **`CommunityFeedMainPublishWideEntry`**: `className=\"… block w-full\"` — **no** `hidden` / `md:` breakpoint that removes the wide row.",
      "- **`CommunityFeedMainPageChrome` FAB**: fixed `bottom-24`; **not** `hidden md:flex` — FAB is intended at all widths.",
      "- **ActionGateChecklist**: used in **PublishDrawer** footer only; it does not remove feed publish controls.",
      "",
    ].join("\n");

    let html = "";
    try {
      html = await page.content();
    } catch (e) {
      html = `<!-- failed to read page.content(): ${String(e)} -->`;
    }
    const maxDom = 1_800_000;
    const domPath = join(out, "dom-snapshot.html");
    if (html.length > maxDom) {
      writeFileSync(domPath, `${html.slice(0, maxDom)}\n<!-- truncated from ${html.length} bytes -->\n`, "utf8");
    } else {
      writeFileSync(domPath, `${html}\n`, "utf8");
    }

    writeFileSync(join(out, "browser-console.log"), `${consoleLines.join("\n")}\n`, "utf8");
    const netBody =
      netLines.length >= maxNet
        ? `${netLines.map((l) => `${l.status}\t${l.method}\t${l.url}`).join("\n")}\n# truncated at ${maxNet} lines\n`
        : `${netLines.map((l) => `${l.status}\t${l.method}\t${l.url}`).join("\n")}\n`;
    writeFileSync(join(out, "network-api.log"), netBody, "utf8");
    writeFileSync(join(out, "diagnostic-checklist.md"), checklistMd, "utf8");
    writeFileSync(
      join(out, "diagnostic-report.json"),
      `${JSON.stringify(
        {
          pageUrl,
          pageOrigin,
          nextOrigin,
          apiOrigin,
          hitsNextOrigin,
          originLooksLikeApi,
          storage,
          counts,
          layout,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    await page.screenshot({ path: join(out, "screenshot-full.png"), fullPage: true });

    await test.info().attach("diagnostic-checklist.md", {
      path: join(out, "diagnostic-checklist.md"),
      contentType: "text/markdown",
    });

    expect(counts.feedPage, "feed page shell must exist").toBeGreaterThan(0);
    expect(storage.tokenLen, "expect seeded bearer in localStorage").toBeGreaterThan(0);

    if (counts.publishEntryGlobal === 0 && counts.publishFab === 0) {
      throw new Error(
        `Neither community-feed-publish-entry nor community-feed-publish-fab in DOM. Artifacts: ${out}`,
      );
    }
  });
});
