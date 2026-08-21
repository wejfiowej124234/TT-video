import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_FORBIDDEN_HREF_FRAGMENTS } from "@/lib/traveltrustFundraisingLinkPolicy";

const __dir = dirname(fileURLToPath(import.meta.url));
const cinematicDir = join(__dir, "../../components/traveltrust/cinematic");

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listTsx(path));
    else if (name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

describe("traveltrust v6 fundraising link density (TT-PH1-111/112)", () => {
  it("cinematic components avoid forbidden href fragments and raw http(s) links", () => {
    const hits: string[] = [];
    for (const file of listTsx(cinematicDir)) {
      const text = readFileSync(file, "utf8");
      if (/href\s*=\s*["']https?:\/\//i.test(text)) {
        hits.push(`${file}: absolute http(s) href`);
      }
      for (const frag of TRAVELTRUST_FORBIDDEN_HREF_FRAGMENTS) {
        if (text.includes(frag)) hits.push(`${file}: ${frag}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("policy module is referenced from cross-links or compliance tests", () => {
    const cross = readFileSync(join(__dir, "traveltrustV6CrossLinks.contract.test.ts"), "utf8");
    expect(cross).toContain("FORBIDDEN_TRAVELTRUST_HREFS");
    expect(
      readFileSync(join(__dir, "../../lib/traveltrustFundraisingLinkPolicy.ts"), "utf8"),
    ).toContain("TRAVELTRUST_FORBIDDEN_HREF_FRAGMENTS");
  });
});
