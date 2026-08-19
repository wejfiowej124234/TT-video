import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  TRAVELTRUST_ASSURANCE_HREF,
  TRAVELTRUST_CONTACT_HREF,
  TRAVELTRUST_FOOTER_DISCLOSURE_LINKS,
  TRAVELTRUST_TTG_AVATAR_256_SRC,
  TRAVELTRUST_TTG_AVATAR_HREF,
  TRAVELTRUST_TTG_AVATAR_SRC,
  assertListingDisclosureHrefsAllowed,
  isListingDocDarkL5HeaderPath,
  isOfficialTeamLinkedInProfileUrl,
} from "@/lib/traveltrustListingDisclosure";
import { TRAVELTRUST_PROTOCOL_PAPER_HREF } from "@/lib/traveltrust/l5";
import { TRAVELTRUST_OFFICIAL_TEAM } from "@/lib/traveltrustOfficialTeam";

const REPO = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf8");
}

describe("listing disclosure placeholders (local · L5)", () => {
  it("keeps disclosure hrefs off fundraising / whitepaper fragments", () => {
    expect(assertListingDisclosureHrefsAllowed()).toEqual([]);
    expect(TRAVELTRUST_PROTOCOL_PAPER_HREF).toBe("/protocol");
    expect(TRAVELTRUST_TTG_AVATAR_HREF).toBe("/brand");
    expect(TRAVELTRUST_ASSURANCE_HREF).toBe("/assurance");
    expect(TRAVELTRUST_CONTACT_HREF).toBe("/contact");
    expect(TRAVELTRUST_FOOTER_DISCLOSURE_LINKS.map((l) => l.href)).toEqual([
      "/terms",
      "/privacy",
      "/brand",
      "/assurance",
      "/contact",
    ]);
  });

  it("pins the Owner TTG avatar files for ETH listing cards", () => {
    expect(existsSync(join(REPO, "public", TRAVELTRUST_TTG_AVATAR_SRC.replace(/^\//, "")))).toBe(true);
    expect(existsSync(join(REPO, "public", TRAVELTRUST_TTG_AVATAR_256_SRC.replace(/^\//, "")))).toBe(true);
    expect(read("app/brand/BrandMarkPageMain.tsx")).toContain("TRAVELTRUST_TTG_AVATAR_SRC");
    expect(zh.listing_brand_title).toBe("品牌头像");
    expect(en.listing_brand_title).toBe("Brand mark");
    expect(zh.listing_brand_body).not.toMatch(/保证收益|认购|招股已获批/);
  });

  it("states independent audit is not commissioned and forbids fake badges", () => {
    expect(zh.listing_assurance_status).toMatch(/尚未委托/);
    expect(en.listing_assurance_status).toMatch(/not commissioned/i);
    expect(zh.listing_assurance_body).toMatch(/不会悬挂/);
    expect(en.listing_assurance_body).toMatch(/will not display/i);
    expect(zh.listing_assurance_body).toMatch(/CertiK/);
    expect(read("app/assurance/AssurancePageMain.tsx")).not.toContain(".pdf");
    expect(read("components/traveltrust/cinematic/TravelTrustSettlementStrip.tsx")).toContain(
      "TRAVELTRUST_ASSURANCE_HREF",
    );
  });

  it("keeps GitHub and Telegram as pending fields without outbound URLs", () => {
    const contact = read("app/contact/ContactPageMain.tsx");
    expect(contact).toContain("listing_contact_github_value");
    expect(contact).toContain("listing_contact_telegram_value");
    expect(contact).not.toContain("github.com");
    expect(contact).not.toContain("t.me/");
    expect(zh.listing_contact_github_value).toMatch(/无外链/);
    expect(zh.listing_contact_telegram_value).toMatch(/无外链/);
  });

  it("does not treat LinkedIn homepage as a real profile", () => {
    expect(isOfficialTeamLinkedInProfileUrl(null)).toBe(false);
    expect(isOfficialTeamLinkedInProfileUrl("https://www.linkedin.com/")).toBe(false);
    expect(isOfficialTeamLinkedInProfileUrl("https://www.linkedin.com/in/pending-owner")).toBe(true);
    expect(TRAVELTRUST_OFFICIAL_TEAM.every((m) => m.linkedinUrl == null)).toBe(true);
  });

  it("covers listing doc paths for cinematic header", () => {
    expect(isListingDocDarkL5HeaderPath("/protocol")).toBe(true);
    expect(isListingDocDarkL5HeaderPath("/brand")).toBe(true);
    expect(isListingDocDarkL5HeaderPath("/assurance")).toBe(true);
    expect(isListingDocDarkL5HeaderPath("/contact")).toBe(true);
    expect(isListingDocDarkL5HeaderPath("/traveltrust")).toBe(false);
  });

  it("settlement shows copyable full addresses", () => {
    const settlement = read("components/traveltrust/cinematic/TravelTrustSettlementStrip.tsx");
    expect(settlement).toContain("TravelTrustCopyableAddress");
    expect(settlement).not.toContain("shortAddr");
    expect(zh.traveltrust_settlement_copy).toBe("复制地址");
  });
});
