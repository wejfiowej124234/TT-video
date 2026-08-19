import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import en from "@/locales/en";
import { TRAVELTRUST_PROTOCOL_PAPER_HREF } from "@/lib/traveltrust/l5";
import { isTraveltrustV6AllowedHref } from "@/lib/traveltrustFundraisingLinkPolicy";

const __dir = join(__dirname);

function read(rel: string): string {
  return readFileSync(join(__dir, rel), "utf8");
}

describe("protocol paper placeholder page (local · L5)", () => {
  it("keeps official reading href off the whitepaper fragment", () => {
    expect(TRAVELTRUST_PROTOCOL_PAPER_HREF).toBe("/protocol");
    expect(isTraveltrustV6AllowedHref(TRAVELTRUST_PROTOCOL_PAPER_HREF)).toBe(true);
    expect(isTraveltrustV6AllowedHref("/whitepaper")).toBe(false);
  });

  it("renders a cinematic placeholder without signed body or download", () => {
    const main = read("ProtocolPaperPageMain.tsx");
    const page = read("page.tsx");
    expect(page).toContain("ProtocolPaperPageMain");
    expect(main).toContain('data-tt-protocol-paper-placeholder="1"');
    expect(main).toContain("protocol_paper_status");
    expect(main).toContain("protocol_paper_outline_title");
    expect(main).toContain("protocol_paper_outline_1");
    expect(main).toContain('href="/traveltrust"');
    expect(main).toContain('href="/governance"');
    expect(main).not.toContain("/whitepaper");
    expect(main).not.toContain("github.com");
    expect(main).not.toContain(".pdf");
    expect(main).not.toContain("docs/spec/governance-token");
    expect(main).not.toContain("docs/fundraising");
  });

  it("copy stays listing-grade and honest about unsigned text", () => {
    expect(zh.protocol_paper_title).toBe("白皮书");
    expect(en.protocol_paper_title).toBe("Whitepaper");
    expect(zh.protocol_paper_status).toMatch(/待签核/);
    expect(en.protocol_paper_status).toMatch(/pending/i);
    expect(zh.protocol_paper_body).toMatch(/不是证券发行材料/);
    expect(en.protocol_paper_body).toMatch(/not a.*securities offering/i);
    expect(zh.protocol_paper_body).not.toMatch(/保证收益|认购|招股已获批/);
    expect(en.protocol_paper_body).not.toMatch(/guaranteed return|presale|prospectus approved/i);
    expect(zh.traveltrust_footer_protocol_paper).toBe("白皮书");
    expect(en.traveltrust_footer_protocol_paper).toBe("Whitepaper");
  });
});
