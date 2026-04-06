/**
 * 07 §5.3A / 85 §十四：`/traveltrust` 三币分层与首页 Hero CTA 文案键齐全（zh/en）。
 */
import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";

const KEYS = [
  "landing_cta_traveltrust_network",
  "traveltrust_link_tokenSystem",
  "traveltrust_token_intro",
  "traveltrust_token_layer_settlement_title",
  "traveltrust_token_layer_settlement_body",
  "traveltrust_token_layer_governance_title",
  "traveltrust_token_layer_governance_body",
  "traveltrust_token_layer_utility_title",
  "traveltrust_token_layer_utility_body",
  "traveltrust_token_layers_note",
] as const;

describe("traveltrustTokenI18n (85 §14 + Hero CTA)", () => {
  it.each([
    { locale: "zh", dict: zh as Record<string, string> },
    { locale: "en", dict: en as Record<string, string> },
  ] as const)("non-empty strings for %s", ({ locale, dict }) => {
    for (const key of KEYS) {
      const v = dict[key];
      expect(v, `${locale}: missing ${key}`).toBeTruthy();
      expect(String(v).trim().length, `${locale}: empty ${key}`).toBeGreaterThan(0);
    }
  });
});
