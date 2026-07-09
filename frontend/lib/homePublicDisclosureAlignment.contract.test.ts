import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_PRODUCT_ANNOUNCEMENTS,
  TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY,
} from "./traveltrustNetworkAnnouncements";

const ROOT = join(__dirname, "../..");
const LOCALES = ["en.ts", "zh.ts"] as const;

const PULSE_MESSAGE_KEYS = TRAVELTRUST_PRODUCT_ANNOUNCEMENTS.flatMap((item) => [
  item.messageKey,
  `${item.messageKey}_highlight`,
  `${item.messageKey}_benefit_b1`,
]);

const FORBIDDEN_IN_PULSE = [
  /testnet preview/i,
  /Sepolia Preview/i,
  /测试网预览/,
  /待上线/,
  /Opening Jul/i,
  /Round 1 Beta/i,
  /Engineering Mock/i,
  /预计 7 月 15 日正式开放/,
];

describe("home public disclosure alignment", () => {
  it("references registry SSOT path", () => {
    expect(TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY).toBe("registry/traveltrust-public-disclosure.v1.yaml");
    const reg = readFileSync(join(ROOT, TRAVELTRUST_PUBLIC_DISCLOSURE_REGISTRY), "utf8");
    expect(reg).toContain("HOME_PUBLIC_DISCLOSURE_ALIGNED");
    expect(reg).toContain("product-planned-launch");
    expect(reg).toContain("protocol_status_archive");
  });

  it("pulse message keys avoid stale preview / mock / 待上线 drift", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "frontend/locales", file), "utf8");
      for (const key of PULSE_MESSAGE_KEYS) {
        const re = new RegExp(`${key}:\\s*"([\\s\\S]*?)"`, "m");
        const match = src.match(re);
        if (!match?.[1]) continue;
        const value = match[1];
        for (const bad of FORBIDDEN_IN_PULSE) {
          expect(value, `${file} ${key}`).not.toMatch(bad);
        }
      }
    }
  });

  it("governance params strip keeps Sepolia ACTIVE kicker", () => {
    for (const file of LOCALES) {
      const src = readFileSync(join(ROOT, "frontend/locales", file), "utf8");
      expect(src).toContain("governance_params_web3_runtime_kicker");
      expect(src).toContain("Web3 Runtime ACTIVE");
    }
  });
});
