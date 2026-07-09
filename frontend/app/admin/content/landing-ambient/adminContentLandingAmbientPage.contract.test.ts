import { describe, expect, it } from "vitest";

import { landingAmbientUrlFromRow } from "./useAdminContentLandingAmbientPage";

describe("admin content landing ambient page", () => {
  it("landingAmbientUrlFromRow reads url from landing payload", () => {
    const row = {
      id: "c1",
      iso3166: "CN",
      name_zh: "中国",
      name_en: "China",
      publish_status: "draft",
      version: 1,
      landing: {
        country_id: "c1",
        iso3166: "CN",
        name_zh: "中国",
        publish_status: "draft",
        version: 2,
        landing_ambient: { url: "https://example.com/cn.jpg" },
      },
    } as Parameters<typeof landingAmbientUrlFromRow>[0];

    expect(landingAmbientUrlFromRow(row)).toBe("https://example.com/cn.jpg");
  });

  it("landingAmbientUrlFromRow returns empty when url missing", () => {
    const row = {
      id: "c1",
      iso3166: "CN",
      name_zh: "中国",
      name_en: "China",
      publish_status: "draft",
      version: 1,
      landing: null,
    } as Parameters<typeof landingAmbientUrlFromRow>[0];

    expect(landingAmbientUrlFromRow(row)).toBe("");
  });
});
