import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { pickHomeCmsAnnouncementText } from "./homeCmsAnnouncements";
import type { CmsPublicAnnouncementRow } from "./cmsPublicAnnouncementsTypes";

const root = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const sampleRow = (over: Partial<CmsPublicAnnouncementRow> = {}): CmsPublicAnnouncementRow => ({
  id: "1",
  slug: "home-cms-demo",
  lane: "product",
  kind: "product",
  content_tier: "live",
  pinned: true,
  sort_order: 10,
  title_zh: "中文标题",
  title_en: "English title",
  summary_zh: "中文摘要",
  summary_en: "English summary",
  body_zh: null,
  body_en: null,
  effective_at: null,
  release_at: null,
  target_at: null,
  cta_kind: null,
  cta_href: "/traveltrust/announcements",
  network_scope: "none",
  message_key: null,
  published_at: "2026-08-02T00:00:00Z",
  updated_at: "2026-08-02T00:00:00Z",
  ...over,
});

describe("homeCmsAnnouncements CMS-only contract", () => {
  it("mounts strip on home page beside Cold Start (data chain only)", () => {
    const page = read("app/(home)/page.tsx");
    expect(page).toContain("HomeCmsAnnouncementStrip");
    expect(page).toContain("ColdStartHomeHeroHighlights");
    const strip = read("components/landing/HomeCmsAnnouncementStrip.tsx");
    expect(strip).toContain('data-tt-home-cms-announcements="1"');
    expect(strip).toContain("fetchHomeCmsAnnouncements");
    expect(strip).not.toContain("TRAVELTRUST_NETWORK_ANNOUNCEMENTS");
    expect(strip).not.toContain("traveltrustAnnouncementCatalog");
  });

  it("fetcher is CMS-only (for_home=1, no static merge)", () => {
    const src = read("lib/homeCmsAnnouncements.ts");
    expect(src).toContain("for_home: true");
    expect(src).toContain("getPublicCmsAnnouncements");
    expect(src).not.toContain("TRAVELTRUST_NETWORK");
    expect(src).not.toContain("mergeTraveltrust");
  });

  it("picks zh/en copy without inventing static titles", () => {
    expect(pickHomeCmsAnnouncementText(sampleRow(), "zh-CN").title).toBe("中文标题");
    expect(pickHomeCmsAnnouncementText(sampleRow(), "en").title).toBe("English title");
  });

  it("admin announcements form exposes sort_order + effective_at + reason", () => {
    const hook = read("app/admin/content/announcements/useAdminContentAnnouncementsPage.ts");
    expect(hook).toContain("sort_order");
    expect(hook).toContain("effective_at");
    expect(hook).toContain("workflow_reason");
    const main = read("app/admin/content/announcements/AdminContentAnnouncementsPageMain.tsx");
    expect(main).toContain("admin_content_announcements_sort_order");
    expect(main).toContain("admin_content_announcements_effective_at");
    expect(main).toContain("admin_content_announcements_workflow_reason");
  });
});
