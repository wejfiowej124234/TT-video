import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("traveltrust SEO surface (TT-PH1-167 · ①)", () => {
  const layout = readFileSync(join(__dir, "layout.tsx"), "utf8");
  const pageMain = readFileSync(join(__dir, "TravelTrustNetworkPageMain.tsx"), "utf8");
  const hero = readFileSync(
    join(__dir, "../../components/traveltrust/cinematic/TravelTrustCinematicHero.tsx"),
    "utf8",
  );
  const jsonLd = readFileSync(
    join(__dir, "../../components/traveltrust/TravelTrustJsonLd.tsx"),
    "utf8",
  );

  it("exports layout metadata and JSON-LD", () => {
    expect(layout).toContain("export const metadata");
    expect(layout).toContain("traveltrust_meta_title");
    expect(layout).toContain("canonical: \"/traveltrust\"");
    expect(layout).toContain("applicationName");
    expect(jsonLd).toContain("data-tt-traveltrust-jsonld=\"1\"");
    expect(jsonLd).toContain("@type");
  });

  it("keeps a single marketing h1 on the network page shell", () => {
    const h1Opens = (hero.match(/<motion\.h1/g) ?? []).length;
    expect(h1Opens).toBe(1);
    expect(hero).toContain("id={titleId}");
    expect(pageMain).not.toMatch(/<h1[\s>]/);
  });
});
