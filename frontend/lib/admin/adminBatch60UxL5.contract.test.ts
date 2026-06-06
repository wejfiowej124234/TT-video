import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第六十批 UX · 队列 slate 页头 · 详情字段 token · 队列折叠可观测。 */
describe("admin batch60 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch60 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch60UxL5.contract.test.ts");
  });

  it("adminUi exports detail field typography tokens for warm panels", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_DETAIL_FIELD_LABEL_CLASS");
    expect(adminUi).toMatch(/ADMIN_DETAIL_FIELD_LABEL_CLASS[\s\S]*text-slate-400/);
    expect(adminUi).toMatch(/ADMIN_DETAIL_FIELD_VALUE_CLASS[\s\S]*text-slate-200/);
    expect(adminUi).toMatch(/ADMIN_DETAIL_SECTION_TITLE_CLASS[\s\S]*text-slate-400/);
  });

  it("queue list chrome uses slate page chrome tokens without header back-link wall", () => {
    const chrome = readFileSync(join(fe, "components/admin/AdminQueueListPageChrome.tsx"), "utf8");
    expect(chrome).toContain("ADMIN_PAGE_CHROME_TITLE_CLASS");
    expect(chrome).toContain("ADMIN_PAGE_CHROME_SUBTITLE_CLASS");
    expect(chrome).not.toContain("AdminOnboardingQueueBackLinks");
    expect(chrome).not.toContain("text-ink-900");
    expect(chrome).not.toContain("text-ink-600");
  });

  it("onboarding queue related folds include users + observability", () => {
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    for (const block of ["PROVIDER_QUEUE_RELATED_FOLD_LINKS", "STEWARD_QUEUE_RELATED_FOLD_LINKS"] as const) {
      expect(model).toMatch(new RegExp(`${block}[\\s\\S]*admin_users_title`));
      expect(model).toMatch(new RegExp(`${block}[\\s\\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK`));
    }
  });

  it("ops detail pages use detail field + section title tokens on warm panels", () => {
    for (const rel of [
      "app/admin/orders/[id]/AdminOrderDetailPageMain.tsx",
      "app/admin/users/[id]/AdminUserDetailPageMain.tsx",
      "app/admin/approvals/[id]/AdminApprovalDetailPageMain.tsx",
      "app/admin/reviews/[id]/AdminReviewDetailPageMain.tsx",
      "app/admin/guides/[id]/AdminGuideDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("ADMIN_DETAIL_FIELD_LABEL_CLASS");
      expect(src, rel).toContain("ADMIN_DETAIL_SECTION_TITLE_CLASS");
      expect(src, rel).not.toMatch(/<dt className="text-meta text-ink-500"/);
    }
  });

  it("config release detail uses detail field tokens without section h2", () => {
    const src = readFileSync(
      join(fe, "app/admin/config/releases/[id]/AdminConfigReleaseDetailPageMain.tsx"),
      "utf8",
    );
    expect(src).toContain("ADMIN_DETAIL_FIELD_LABEL_CLASS");
    expect(src).toContain("ADMIN_DETAIL_FIELD_VALUE_MONO_CLASS");
    expect(src).not.toMatch(/<dt className="text-meta text-ink-500"/);
  });

  it("community related label uses slate detail field label token", () => {
    const related = readFileSync(join(fe, "components/admin/AdminCommunityRelatedLinks.tsx"), "utf8");
    expect(related).toContain("ADMIN_DETAIL_FIELD_LABEL_CLASS");
    expect(related).not.toContain("text-ink-500");
  });
});
