import { describe, expect, it } from "vitest";
import { validateGuideProfileForm } from "./guideProfileSettingsValidation";

const validForm = {
  countryCode: "CN",
  city: "杭州",
  publicTitle: "",
  languages: "zh, en",
  serviceTypes: "向导服务",
  bio: "简介",
  hourlyRate: "45",
  avatarUrl: "",
};

describe("guideProfileSettingsValidation", () => {
  it("accepts a complete form", () => {
    expect(validateGuideProfileForm(validForm)).toEqual([]);
  });

  it("requires city and languages", () => {
    const issues = validateGuideProfileForm({ ...validForm, city: "", languages: "" });
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining(["city", "languages"]));
  });

  it("rejects invalid hourly rate", () => {
    const issues = validateGuideProfileForm({ ...validForm, hourlyRate: "abc" });
    expect(issues.some((i) => i.field === "hourlyRate")).toBe(true);
  });

  it("rejects public title over 80 chars", () => {
    const issues = validateGuideProfileForm({ ...validForm, publicTitle: "x".repeat(81) });
    expect(issues.some((i) => i.field === "publicTitle")).toBe(true);
  });
});
