import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

/** ① 第四十二批 UX · P2-1 平台/可观测顶栏 link wall 瘦身。 */
describe("admin batch42 UX L5 (①)", () => {
  it("auth audit list uses AdminAuditSectionBackLinks", () => {
    const main = readFileSync(
      join(fe, "app/admin/auth-audit-events/AdminAuthAuditEventsPageMain.tsx"),
      "utf8",
    );
    expect(main).toContain("AdminAuditSectionBackLinks");
    expect(main).not.toContain("AdminPlatformHubHeaderLinks");
  });

  it("observability hub drops header link wall for inbox + folded related nav", () => {
    const main = readFileSync(join(fe, "app/admin/observability/AdminObservabilityPageMain.tsx"), "utf8");
    const related = readFileSync(
      join(fe, "components/admin/AdminObservabilityHubRelatedNav.tsx"),
      "utf8",
    );
    const model = readFileSync(join(fe, "lib/admin/adminObservabilityRelatedFoldLinks.ts"), "utf8");
    expect(main).toContain("AdminObservabilityHubRelatedNav");
    expect(main).not.toContain("headerAside={<AdminInboxQueueBackLinks />}");
    expect(main).not.toContain("AdminPlatformHubHeaderLinks");
    expect(related).toContain('data-tt-admin-obs-hub-related-fold="1"');
    expect(related).toContain("OBSERVABILITY_PEER_RELATED_FOLD_LINKS");
    expect(model).toContain("/admin/auth-audit-events");
  });

  it("zh/en define observability hub related fold keys", () => {
    const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
    const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");
    expect(zh).toContain("admin_observability_hub_related_fold");
    expect(en).toMatch(/admin_observability_hub_related_fold:\s*"Related ops links \(expand\)"/);
  });
});
