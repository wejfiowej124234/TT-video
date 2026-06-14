import { describe, expect, it } from "vitest";
import { CITIES_BY_COUNTRY } from "@/lib/geoOptions";
import {
  getInterCityTransportLabelKey,
  getInterCityTransportModes,
  needsInterCityTransport,
  normalizeInterCityTransport,
} from "./interCityTransport";

describe("interCityTransport", () => {
  it("东京→大阪仅铁路", () => {
    expect(getInterCityTransportModes("东京", "大阪")).toEqual(["rail"]);
    expect(getInterCityTransportLabelKey("rail", "东京", "大阪")).toBe("market_transportShinkansen");
  });

  it("东京→札幌仅飞机", () => {
    expect(getInterCityTransportModes("东京", "札幌")).toEqual(["flight"]);
  });

  it("首尔→济州仅飞机；首尔→釜山仅 KTX", () => {
    expect(getInterCityTransportModes("首尔", "济州")).toEqual(["flight"]);
    expect(getInterCityTransportModes("首尔", "釜山")).toEqual(["rail"]);
    expect(getInterCityTransportLabelKey("rail", "首尔", "釜山")).toBe("market_transportRailKtx");
  });

  it("迪拜→阿布扎比为城际陆路（无高铁/航班）", () => {
    expect(getInterCityTransportModes("迪拜", "阿布扎比")).toEqual(["rail"]);
    expect(getInterCityTransportLabelKey("rail", "迪拜", "阿布扎比")).toBe("market_transportIntercityGround");
  });

  it("纽约→洛杉矶仅飞机", () => {
    expect(getInterCityTransportModes("纽约", "洛杉矶")).toEqual(["flight"]);
  });

  it("曼谷→清迈仅飞机", () => {
    expect(getInterCityTransportModes("曼谷", "清迈")).toEqual(["flight"]);
  });

  it("新加坡单城无跨城", () => {
    expect(getInterCityTransportModes("新加坡", "新加坡")).toEqual([]);
  });

  it("同城不需要跨城交通", () => {
    expect(needsInterCityTransport("东京", "东京")).toBe(false);
  });

  it("非法交通方式回落到首选", () => {
    expect(normalizeInterCityTransport("东京", "大阪", "flight")).toBe("rail");
    expect(normalizeInterCityTransport("东京", "札幌", "rail")).toBe("flight");
  });

  it("十国任意相邻不同城线路均有至少一种交通或合理解释（单城国除外）", () => {
    for (const [country, cities] of Object.entries(CITIES_BY_COUNTRY)) {
      if (cities.length < 2) continue;
      const a = cities[0]!.value;
      const b = cities[1]!.value;
      const modes = getInterCityTransportModes(a, b);
      expect(modes.length, `${country} ${a}→${b}`).toBeGreaterThan(0);
    }
  });
});
