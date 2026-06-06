import { describe, expect, it } from "vitest";
import {
  clampItineraryDays,
  resolveItineraryCreateDaysAndCities,
  splitCitiesExtraRaw,
} from "./itineraryCreateCitiesPayload";

describe("clampItineraryDays", () => {
  it("clamps to 1..30", () => {
    expect(clampItineraryDays(0)).toBe(1);
    expect(clampItineraryDays(31)).toBe(30);
    expect(clampItineraryDays(5)).toBe(5);
  });
});

describe("splitCitiesExtraRaw", () => {
  it("splits on newline and punctuation", () => {
    expect(splitCitiesExtraRaw("上海\n杭州")).toEqual(["上海", "杭州"]);
    expect(splitCitiesExtraRaw("上海,杭州")).toEqual(["上海", "杭州"]);
    expect(splitCitiesExtraRaw("上海，杭州、南京")).toEqual(["上海", "杭州", "南京"]);
  });
});

describe("resolveItineraryCreateDaysAndCities (56-S3)", () => {
  it("single-city mode when extra empty", () => {
    expect(resolveItineraryCreateDaysAndCities("北京", 5, "")).toEqual({
      cities: undefined,
      days: 5,
    });
  });

  it("multi-city: prepends primary and keeps form days", () => {
    expect(resolveItineraryCreateDaysAndCities("北京", 9, "上海\n杭州")).toEqual({
      cities: ["北京", "上海", "杭州"],
      days: 9,
    });
  });

  it("skips duplicate primary when it reappears in extras (same script)", () => {
    expect(resolveItineraryCreateDaysAndCities("北京", 4, "上海,北京")).toEqual({
      cities: ["北京", "上海"],
      days: 4,
    });
  });

  it("dedupes Latin city names case-insensitively", () => {
    expect(resolveItineraryCreateDaysAndCities("Paris", 4, "London,PARIS,london")).toEqual({
      cities: ["Paris", "London"],
      days: 4,
    });
  });

  it("falls back to form days when extras only duplicate primary", () => {
    expect(resolveItineraryCreateDaysAndCities("北京", 4, "北京\n北京")).toEqual({
      cities: undefined,
      days: 4,
    });
  });
});
