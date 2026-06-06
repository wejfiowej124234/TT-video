import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMUNITY_ME_HEADER_NAV_TRACKER_V1,
  COMMUNITY_ME_PAGE_TRACKER_V1,
} from "@/lib/communityMePageTracker.v1";

const ROOT = process.cwd();
const REPO = join(ROOT, "..");

function readFrontend(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertTrackerEntry(entry: {
  route: string;
  sourceFiles: readonly string[];
  mustContain: readonly string[];
  mustNotContain?: readonly string[];
}) {
  const combined = entry.sourceFiles.map((rel) => readFrontend(rel)).join("\n");
  for (const needle of entry.mustContain) {
    expect(combined, `${entry.route} missing: ${needle}`).toContain(needle);
  }
  for (const rel of entry.sourceFiles) {
    for (const banned of entry.mustNotContain ?? []) {
      expect(readFrontend(rel), `${rel} must not contain: ${banned}`).not.toContain(banned);
    }
  }
}

describe("community me page tracker v1 (① · ME-P1-8)", () => {
  it.each(COMMUNITY_ME_PAGE_TRACKER_V1.map((e) => [e.route, e] as const))(
    "route %s passes L5 markers",
    (_route, entry) => {
      assertTrackerEntry(entry);
    },
  );

  it.each(COMMUNITY_ME_HEADER_NAV_TRACKER_V1.map((e) => [e.route, e] as const))(
    "nav %s aligned with header IA",
    (_route, entry) => {
      assertTrackerEntry(entry);
    },
  );

  it("header mine nav has no reports tab (reports only in header tools + drawer footer nav)", () => {
    const header = readFrontend("components/header/headerUserMenuNavModel.ts");
    expect(header).toContain('href: "/community/me/reports"');
    expect(header).toMatch(/function toolsNavItems[\s\S]*\/community\/me\/reports/);
  });

  it("hub page does not duplicate dedicated list VMs in monolith fetch", () => {
    const hub = readFrontend("app/community/me/page.tsx");
    expect(hub).not.toContain("getMyPosts");
    expect(hub).not.toContain("fetchAllPostsForCommunityMeDrawer");
  });

  it("community-me-l5-local-gate hub_tab_redirects match dedicated path SSOT", () => {
    const gate = JSON.parse(
      readFrontend("evidence/GO_local_community_me_l5/community-me-l5-local-gate.v1.json"),
    ) as {
      routes: { path: string; hub_tab_redirects?: { tab: string; dedicated_path: string }[] }[];
    };
    const hub = gate.routes.find((r) => r.path === "/community/me");
    expect(hub?.hub_tab_redirects?.length).toBe(4);
    const nav = readFrontend("lib/communityMeContentNav.ts");
    for (const row of hub?.hub_tab_redirects ?? []) {
      expect(nav).toContain(row.dedicated_path);
      expect(nav).toContain(row.tab);
    }
    expect(nav).toContain("communityMeDedicatedPathForTab");
  });

  it("community-me gate lists tab redirect matrix Playwright spec", () => {
    const gate = JSON.parse(
      readFrontend("evidence/GO_local_community_me_l5/community-me-l5-local-gate.v1.json"),
    ) as { playwright_tab_redirect_matrix: string; playwright_deterministic: string[] };
    expect(gate.playwright_tab_redirect_matrix).toBe("e2e/community-me-hub-tab-redirect-matrix.spec.ts");
    expect(gate.playwright_deterministic).toContain(gate.playwright_tab_redirect_matrix);
    const green = readFileSync(join(REPO, "scripts/dev/run-community-me-l5-green.sh"), "utf8");
    expect(green).toContain("community-me-hub-tab-redirect-matrix.spec.ts");
  });

  it("account-nav full smoke delegates community green with skip env", () => {
    const gate = JSON.parse(
      readFrontend("evidence/GO_local_community_me_l5/community-me-l5-local-gate.v1.json"),
    ) as {
      related_gates: { account_nav: string; me_settings_l5: string };
      account_nav_full_smoke: {
        script: string;
        summary_line: string;
        delegate_skip_env: string[];
        playwright_layer_env_any: string[];
      };
    };
    expect(readFrontend(gate.related_gates.account_nav)).toContain("traveltrust.account-nav-page-tracker.v1");
    expect(readFrontend(gate.related_gates.me_settings_l5)).toContain("traveltrust.me-settings-l5-local-gate.v1");
    const full = readFileSync(join(REPO, gate.account_nav_full_smoke.script), "utf8");
    expect(full).toContain(gate.account_nav_full_smoke.summary_line);
    for (const env of gate.account_nav_full_smoke.delegate_skip_env) {
      expect(full).toContain(env.split("=")[0]);
    }
    expect(full).toContain("run-community-me-l5-green.sh");
    expect(full).toContain("COMMUNITY_ME_L5_GREEN_REUSE");
    expect(full).toContain("SKIP_COMMUNITY_ME_ACCOUNT_NAV_IA");
    expect(gate.account_nav_full_smoke.playwright_layer_env_any).toContain("PLAYWRIGHT_FULL=1");
  });
});
