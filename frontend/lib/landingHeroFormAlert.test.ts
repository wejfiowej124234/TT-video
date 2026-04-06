import { describe, expect, it } from "vitest";
import { landingHeroFormAlertText } from "./landingHeroFormAlert";

describe("landingHeroFormAlertText", () => {
  const t = (k: string) => (k === "landing_error_country" ? "请选择国家" : k);

  it("prefers submitError over validation key", () => {
    expect(landingHeroFormAlertText("landing_error_country", "API 已翻译", t)).toBe("API 已翻译");
  });

  it("translates validation key when no submit error", () => {
    expect(landingHeroFormAlertText("landing_error_country", null, t)).toBe("请选择国家");
  });

  it("returns null when both empty", () => {
    expect(landingHeroFormAlertText(null, null, t)).toBeNull();
  });
});
