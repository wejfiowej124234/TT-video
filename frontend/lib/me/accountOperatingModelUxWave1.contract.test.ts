import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC,
} from "@/lib/me/accountOperatingModelUxWave0Model";
import {
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_ADR,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_HONEST_BOUNDARY,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SCORE_DOC,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SUMMARY,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_PHASE,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_PREREQS,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_SPRINT_DOC,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE,
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SUMMARY,
} from "@/lib/me/accountOperatingModelUxWave1Model";
import { PUBLISH_HUB_PHASE_B_ITEMS } from "@/lib/me/publishHubPhaseBModel";
import { PUBLISH_HUB_WORKSPACE_CONTEXT_URL_WINS_TOAST_KEY } from "@/lib/me/publishHubWorkspaceContextSync";

const ROOT = process.cwd();

describe("account operating model UX wave1 sprint (② · prepared backlog)", () => {
  const sprintDoc = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE1_SPRINT_DOC), "utf8");
  const adr = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE1_ADR), "utf8");
  const wave0 = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC), "utf8");
  const stagingSmoke = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE), "utf8");

  it("sprint SSOT declares ② discipline and G gates", () => {
    expect(ACCOUNT_OPERATING_MODEL_UX_WAVE1_PHASE).toBe("testnet-2");
    expect(sprintDoc).toContain("G-1/G-2");
    expect(sprintDoc).toContain("PHASE2-START-CHECKLIST");
    expect(sprintDoc).toContain("禁止");
    for (const g of ACCOUNT_OPERATING_MODEL_UX_WAVE1_PREREQS) {
      expect(sprintDoc).toContain(g);
    }
  });

  it("ADR proposed with context switcher decision", () => {
    expect(adr).toContain("accepted");
    expect(adr).toContain("Workspace Context");
    expect(adr).toContain("PH-B-2");
    expect(sprintDoc).toContain("ADR-20260613");
  });

  it("W1-A4 BFF upstream-first publish-summary route", () => {
    const route = readFileSync(join(ROOT, "app/api/v1/me/publish-summary/route.ts"), "utf8");
    expect(route).toContain("fetchUpstreamJson(req, \"/api/v1/me/publish-summary\")");
    expect(route).toContain("PUBLISH_HUB_SUMMARY_BFF_IMPL_STATUS");
  });

  it("W1-A3 api route registered in traveltrust-api me router", () => {
    const meRoutes = readFileSync(join(ROOT, "../crates/api/src/routes/me_subroutes.rs"), "utf8");
    expect(meRoutes).toContain("/api/v1/me/publish-summary");
    expect(meRoutes).toContain("get_me_publish_summary");
  });

  it("W1-A2 activeWorkspaceContext module exists with storage key", () => {
    const src = readFileSync(join(ROOT, "lib/header/activeWorkspaceContext.ts"), "utf8");
    expect(src).toContain("tt_active_workspace_context_v1");
    expect(src).toContain("resolveActiveWorkspaceContext");
  });

  it("W1-B1 header workspace context switcher wired in authL5 nav", () => {
    const nav = readFileSync(join(ROOT, "components/header/HeaderUserMenuNavLinks.tsx"), "utf8");
    const switcher = readFileSync(join(ROOT, "components/header/HeaderWorkspaceContextSwitcher.tsx"), "utf8");
    expect(nav).toContain("HeaderWorkspaceContextSwitcher");
    expect(switcher).toContain("data-tt-header-workspace-context");
  });

  it("W1-B2 publish hub workspace context sync module", () => {
    const sync = readFileSync(join(ROOT, "lib/me/publishHubWorkspaceContextSync.ts"), "utf8");
    const main = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
    expect(sync).toContain("resolvePublishHubWorkspaceContextInit");
    expect(sync).toContain(PUBLISH_HUB_WORKSPACE_CONTEXT_URL_WINS_TOAST_KEY);
    expect(main).toContain("PublishHubWorkspaceContextToast");
    expect(main).toContain("applyFilterWithWorkspaceSync");
  });

  it("W1-B3 workbench deep link guard and header CTA", () => {
    const nav = readFileSync(join(ROOT, "lib/header/workspaceContextWorkbenchNav.ts"), "utf8");
    const switcher = readFileSync(join(ROOT, "components/header/HeaderWorkspaceContextSwitcher.tsx"), "utf8");
    const provider = readFileSync(join(ROOT, "app/provider/page.tsx"), "utf8");
    expect(nav).toContain("resolveOperatorWorkbenchRedirect");
    expect(switcher).toContain("data-tt-header-workspace-context-workbench");
    expect(provider).toContain("useWorkspaceContextWorkbenchGuard");
  });

  it("W1-B4 publish hub operating spine line", () => {
    const spine = readFileSync(join(ROOT, "lib/me/publishHubOperatingSpineModel.ts"), "utf8");
    const main = readFileSync(join(ROOT, "app/me/publish/PublishHubPageMain.tsx"), "utf8");
    expect(spine).toContain("publish_hub_operating_spine");
    expect(main).toContain("publishHubOperatingSpineLine");
    expect(main).toContain("PUBLISH_HUB_OPERATING_SPINE_DATA_ATTR");
  });

  it("Wave1 ① local items closed; ②③ backlog", () => {
    const phase1 = ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "①");
    const phase2 = ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "②");
    const phase3 = ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "③");
    expect(phase1.every((i) => i.status === "closed")).toBe(true);
    expect(phase1.some((i) => i.id === "W1-L1")).toBe(true);
    expect(phase2.every((i) => i.status === "backlog")).toBe(true);
    expect(phase3.every((i) => i.status === "backlog")).toBe(true);
    expect(phase2.some((i) => i.id === "W1-C1")).toBe(true);
    expect(phase3.some((i) => i.id === "W1-P3")).toBe(true);
    expect(ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.some((i) => i.id === "W1-A3" && i.stagingRecheck)).toBe(
      true,
    );
  });

  it("PH-B items remain backlog and link staging smoke", () => {
    expect(PUBLISH_HUB_PHASE_B_ITEMS.every((i) => i.status === "backlog")).toBe(true);
    expect(PUBLISH_HUB_PHASE_B_ITEMS.find((i) => i.id === "PH-B-1")?.verify).toContain(
      "smoke-publish-hub-staging.sh",
    );
  });

  it("staging smoke script exists with honest G-2 gate", () => {
    expect(stagingSmoke).toContain("STAGING_API_BASE");
    expect(stagingSmoke).toContain("G-2");
    expect(stagingSmoke).toContain(ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SUMMARY);
  });

  it("Wave 0 prerequisite marked complete in wave0 doc", () => {
    expect(wave0).toContain("100 / 100");
    expect(sprintDoc).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE");
  });

  it("local score doc declares ① closure and ②③ backlog", () => {
    const localScore = readFileSync(join(ROOT, ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SCORE_DOC), "utf8");
    expect(localScore).toContain("W1-L1");
    expect(localScore).toContain("W1-C1");
    expect(localScore).toContain("W1-P3");
    expect(localScore).toContain("① 本地 closure");
    expect(sprintDoc).toContain("ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE");
  });

  it("local smoke summary constant matches script", () => {
    const localSmoke = readFileSync(join(ROOT, "../scripts/dev/smoke-publish-hub-local.sh"), "utf8");
    expect(localSmoke).toContain(ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SUMMARY);
  });
});
