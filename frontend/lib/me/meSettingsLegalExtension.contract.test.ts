import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { meSettingsNavExtensionHref } from "@/lib/me/meSettingsExtensionContext";

const ROOT = process.cwd();

describe("me settings legal & help L5 extensions (①)", () => {
  it("meSettingsNavExtensionHref appends from=settings", () => {
    expect(meSettingsNavExtensionHref("/privacy")).toBe("/privacy?from=settings");
    expect(meSettingsNavExtensionHref("/terms")).toBe("/terms?from=settings");
    expect(meSettingsNavExtensionHref("/help")).toBe("/help?from=settings");
  });

  it("privacy and terms use L5 document shell when from=settings", () => {
    const privacy = readFileSync(join(ROOT, "app/privacy/page.tsx"), "utf8");
    const terms = readFileSync(join(ROOT, "app/terms/page.tsx"), "utf8");
    expect(privacy).toContain("MeSettingsExtensionDocumentShell");
    expect(privacy).toContain("data-tt-privacy-from-settings");
    expect(terms).toContain("data-tt-terms-from-settings");
    const shell = readFileSync(join(ROOT, "components/me/MeSettingsExtensionDocumentShell.tsx"), "utf8");
    expect(shell).toContain("MeSettingsL5FlowPage");
  });

  it("help page uses full L5 shell via document shell", () => {
    const help = readFileSync(join(ROOT, "app/help/page.tsx"), "utf8");
    expect(help).toContain("MeSettingsExtensionDocumentShell");
    expect(help).toContain("meSettingsExtensionDocDetailsClass");
    expect(help).not.toMatch(/fromSettings \? \([\s\S]*bg-bg-console/);
  });

  it("community guidelines use L5 document shell when from=settings", () => {
    const guidelines = readFileSync(join(ROOT, "app/terms/community-guidelines/page.tsx"), "utf8");
    expect(guidelines).toContain("MeSettingsExtensionDocumentShell");
    expect(guidelines).toContain("data-tt-guidelines-from-settings");
    expect(guidelines).toContain("me_settings_guidelines_from_settings_notice");
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/terms/community-guidelines")');
  });

  it("hub nav links legal pages with meSettingsNavExtensionHref", () => {
    const nav = readFileSync(join(ROOT, "lib/me/meSettingsNavModel.ts"), "utf8");
    expect(nav).toContain('meSettingsNavExtensionHref("/privacy")');
    expect(nav).toContain('meSettingsNavExtensionHref("/terms")');
    expect(nav).toContain('meSettingsNavExtensionHref("/help")');
    expect(nav).not.toMatch(/id: "help"[\s\S]*external: true/);
    expect(nav).not.toMatch(/id: "privacy"[\s\S]*external: true/);
  });
});
