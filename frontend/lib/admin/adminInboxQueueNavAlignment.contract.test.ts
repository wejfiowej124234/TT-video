import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF, ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { ADMIN_SHELL_COMMUNITY_NAV_LINKS } from "./adminShellCommunityNavLinks";
import { ADMIN_SHELL_ONBOARDING_NAV_LINKS } from "./adminShellOnboardingNavLinks";
import { buildAdminUnifiedInboxTasks } from "./adminUnifiedInboxTasks";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin inbox ↔ shell nav alignment (① · U2)", () => {
  it("SSOT queue hrefs are stable", () => {
    expect(ADMIN_INBOX_QUEUE_HREFS.provider).toContain("status=submitted");
    expect(ADMIN_INBOX_QUEUE_HREFS.reports).toContain("status=open");
    expect(ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF).toContain("limit=100");
    expect(ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF).toContain("status=pending");
  });

  it("unified inbox tasks use ADMIN_INBOX_QUEUE_HREFS", () => {
    const tasks = buildAdminUnifiedInboxTasks({
      counts: { provider: 1, steward: 0, approvals: 2, reports: 3 },
      channels: {
        provider: { count: 1, permissionDenied: false, errorKind: null },
        steward: { count: 0, permissionDenied: false, errorKind: null },
        approvals: { count: 2, permissionDenied: false, errorKind: null },
        reports: { count: 3, permissionDenied: false, errorKind: null },
      },
    });
    expect(tasks.find((t) => t.id === "provider")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(tasks.find((t) => t.id === "reports")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("AdminShellBar wires onboarding + community nav SSOT (queue hrefs via SSOT modules)", () => {
    const shell = readFileSync(join(fe, "components", "admin", "AdminShellBar.tsx"), "utf8");
    expect(shell).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(shell).toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
    const onboardingHrefs = ADMIN_SHELL_ONBOARDING_NAV_LINKS.map((l) => l.href);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(onboardingHrefs).toContain(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(ADMIN_SHELL_COMMUNITY_NAV_LINKS[0]?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("adminUnifiedInboxTasks imports queue SSOT", () => {
    const src = readFileSync(join(__dir, "adminUnifiedInboxTasks.ts"), "utf8");
    expect(src).toContain("ADMIN_INBOX_QUEUE_HREFS");
  });

  it("config publish + community related links use queue SSOT", () => {
    expect(readFileSync(join(fe, "components", "admin", "AdminConfigPublishApprovalNotice.tsx"), "utf8")).toContain(
      "ADMIN_INBOX_QUEUE_HREFS.approvals",
    );
    const related = readFileSync(join(fe, "components", "admin", "AdminCommunityRelatedLinks.tsx"), "utf8");
    expect(related).toContain("ADMIN_INBOX_QUEUE_HREFS.reports");
    expect(related).toContain('href: "/admin/inbox"');
    expect(related).toContain("data-tt-admin-back-observability-hub");
    expect(readFileSync(join(fe, "components", "admin", "AdminCommunityListHeaderAside.tsx"), "utf8")).not.toContain(
      "AdminInboxQueueBackLinks",
    );
  });

  it("lib/admin model layers avoid literal inbox queue page hrefs outside SSOT module", () => {
    const offenders: string[] = [];
    const literalRe =
      /\/admin\/(?:provider-applications\?status=submitted|steward-applications\?status=stake_pending|approvals\?(?:limit=100&)?status=pending|community\/reports\?status=open)/;
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
      }
      return out;
    };
    for (const file of walk(join(fe, "lib", "admin"))) {
      if (file.endsWith("adminInboxQueueHrefs.ts")) continue;
      if (file.includes(".contract.test.")) continue;
      const src = readFileSync(file, "utf8");
      if (literalRe.test(src)) offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("app/admin avoids literal inbox queue filter hrefs outside SSOT module", () => {
    const offenders: string[] = [];
    const literalRe =
      /\/admin\/(?:provider-applications\?status=submitted|steward-applications\?status=stake_pending|approvals\?(?:limit=100&)?status=pending|community\/reports\?status=open)/;
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
      }
      return out;
    };
    for (const file of walk(join(fe, "app", "admin"))) {
      if (file.includes(".contract.test.")) continue;
      const src = readFileSync(file, "utf8");
      if (literalRe.test(src)) offenders.push(file.replace(/\\/g, "/"));
    }
    expect(offenders).toEqual([]);
  });

  it("home inbox surfaces import queue SSOT for queue deep links", () => {
    for (const rel of [
      "components/admin/AdminHomePrimaryCtas.tsx",
      "components/admin/AdminHomeInboxStrip.tsx",
      "components/admin/AdminHomePinnedShortcuts.tsx",
      "lib/admin/adminHomePrimaryCtaByRole.ts",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("ADMIN_INBOX_QUEUE_HREFS");
      expect(src, rel).not.toContain("?status=submitted");
      expect(src, rel).not.toContain("?status=pending");
      expect(src, rel).not.toContain("?status=open");
    }
    const sidebarModel = readFileSync(join(fe, "lib/admin/adminShellSidebarModel.ts"), "utf8");
    expect(sidebarModel).toContain("ADMIN_SHELL_ONBOARDING_NAV_LINKS");
    expect(sidebarModel).toContain("ADMIN_SHELL_COMMUNITY_NAV_LINKS");
  });
});
