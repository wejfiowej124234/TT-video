/**
 * B-452-REVIEW-JSON-CONTRACT-CLIENT · 机读回归（`vitest`）
 */
import { describe, it, expect } from "vitest";
import {
  CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED,
  REVIEW_JSON_CONTRACT_ANCHOR_V1,
  parseReviewJsonContractMeta,
} from "./reviewJsonContract";

describe("parseReviewJsonContractMeta (B-452)", () => {
  it("none: v1 + anchor + expected anchor constant", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: {
        schema_version: 1,
        anchor: REVIEW_JSON_CONTRACT_ANCHOR_V1,
      },
    });
    expect(v.degrade).toBe("none");
    expect(v.schemaVersionEffective).toBe(1);
    expect(v.schemaVersionReported).toBe(1);
    expect(v.anchorEffective).toBe(REVIEW_JSON_CONTRACT_ANCHOR_V1);
  });

  it("none: v1 with non-canonical anchor string still none (lenient)", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: { schema_version: 1, anchor: "CUSTOM-ANCHOR-ALIAS" },
    });
    expect(v.degrade).toBe("none");
    expect(v.schemaVersionEffective).toBe(1);
  });

  it("missing_meta: no review_json_contract", () => {
    expect(parseReviewJsonContractMeta({ review_weight_rule_version: "review_weight_v1" }).degrade).toBe(
      "missing_meta"
    );
    expect(parseReviewJsonContractMeta(null).degrade).toBe("missing_meta");
  });

  it("unknown_future_schema: schema > CLIENT_MAX clamps effective", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: {
        schema_version: CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED + 1,
        anchor: REVIEW_JSON_CONTRACT_ANCHOR_V1,
      },
    });
    expect(v.degrade).toBe("unknown_future_schema");
    expect(v.schemaVersionReported).toBe(CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED + 1);
    expect(v.schemaVersionEffective).toBe(CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED);
  });

  it("malformed_meta: bad schema_version", () => {
    expect(
      parseReviewJsonContractMeta({ review_json_contract: { schema_version: 0, anchor: "x" } }).degrade
    ).toBe("malformed_meta");
    expect(
      parseReviewJsonContractMeta({ review_json_contract: { schema_version: 1.5, anchor: "x" } }).degrade
    ).toBe("malformed_meta");
  });

  it("malformed_meta: empty anchor", () => {
    expect(
      parseReviewJsonContractMeta({ review_json_contract: { schema_version: 1, anchor: "" } }).degrade
    ).toBe("malformed_meta");
  });
});
