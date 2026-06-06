import { describe, expect, it } from "vitest";
import zh from "@/locales/zh";
import { resolveHeroGlobeCompactRosterLabel } from "./traveltrustHeroGlobeRosterCopy";

describe("traveltrustHeroGlobeRosterCopy", () => {
  const t = (key: string, vars?: Record<string, string>) => {
    const raw = zh[key as keyof typeof zh] as string;
    if (!vars) return raw;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), raw);
  };

  it("prefers visible hub destination labels over atlantic bias", () => {
    const label = resolveHeroGlobeCompactRosterLabel(t, "atlantic", ["jp", "cn", "th"]);
    expect(label).toContain("东京·银座");
    expect(label).toContain("北京·皇城");
    expect(label).not.toContain("大西洋");
    expect(label).not.toContain("{{");
  });
});
