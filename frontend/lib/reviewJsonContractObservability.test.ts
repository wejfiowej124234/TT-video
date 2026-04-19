/**
 * B-453 · `reviewJsonContract` 降级计数与埋点
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  observeReviewJsonContractClient,
  getReviewJsonContractDegradeCounters,
  resetReviewJsonContractDegradeCounters,
} from "./reviewJsonContractObservability";
import { parseReviewJsonContractMeta, REVIEW_JSON_CONTRACT_ANCHOR_V1 } from "./reviewJsonContract";

describe("reviewJsonContractObservability (B-453)", () => {
  beforeEach(() => {
    resetReviewJsonContractDegradeCounters();
  });
  afterEach(() => {
    resetReviewJsonContractDegradeCounters();
  });

  it("increments missing_meta and leaves others at 0", () => {
    const v = parseReviewJsonContractMeta(null);
    observeReviewJsonContractClient(v, "get_reviews");
    const c = getReviewJsonContractDegradeCounters();
    expect(c.missing_meta).toBe(1);
    expect(c.malformed_meta).toBe(0);
    expect(c.unknown_future_schema).toBe(0);
  });

  it("increments malformed_meta", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: { schema_version: 0, anchor: "x" },
    });
    observeReviewJsonContractClient(v, "post_review");
    const c = getReviewJsonContractDegradeCounters();
    expect(c.malformed_meta).toBe(1);
    expect(c.missing_meta).toBe(0);
    expect(c.unknown_future_schema).toBe(0);
  });

  it("increments unknown_future_schema", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: {
        schema_version: 99,
        anchor: REVIEW_JSON_CONTRACT_ANCHOR_V1,
      },
    });
    observeReviewJsonContractClient(v, "get_reviews");
    const c = getReviewJsonContractDegradeCounters();
    expect(c.unknown_future_schema).toBe(1);
  });

  it("does not increment on degrade none", () => {
    const v = parseReviewJsonContractMeta({
      review_json_contract: {
        schema_version: 1,
        anchor: REVIEW_JSON_CONTRACT_ANCHOR_V1,
      },
    });
    observeReviewJsonContractClient(v, "post_review");
    expect(getReviewJsonContractDegradeCounters()).toEqual({
      missing_meta: 0,
      malformed_meta: 0,
      unknown_future_schema: 0,
    });
  });
});
