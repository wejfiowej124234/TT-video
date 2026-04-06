import { describe, expect, it } from "vitest";
import { mapReviewSubmitError } from "./mapReviewSubmitError";

const t = (k: string) => k;

describe("mapReviewSubmitError", () => {
  it("maps review-persist and review-rate-limit before shared mapper", () => {
    expect(mapReviewSubmitError(new Error("review_db_persist_failed"), t)).toBe("escrow_reviewDbUnavailable");
    expect(mapReviewSubmitError(new Error("review_rate_limit_exceeded"), t)).toBe("escrow_reviewRateLimited");
  });
  it("delegates shared API codes via mapApiReadError", () => {
    expect(mapReviewSubmitError(new Error("review_window_expired"), t)).toBe("order_error_rating_window_expired");
    expect(mapReviewSubmitError(new Error("order_not_found"), t)).toBe("order_error_order_not_found");
    expect(mapReviewSubmitError(new Error("already_reviewed"), t)).toBe("order_error_already_reviewed");
    expect(mapReviewSubmitError(new Error("review_comment_required_for_low_score"), t)).toBe(
      "order_error_review_comment_required"
    );
    expect(mapReviewSubmitError(new Error("score_must_be_1_to_5"), t)).toBe("order_error_score_range");
    expect(mapReviewSubmitError(new Error("order_has_no_completed_at"), t)).toBe("order_error_rating_not_ready");
    expect(mapReviewSubmitError(new Error("rate_limit_exceeded"), t)).toBe("common_apiRateLimitExceeded");
    expect(mapReviewSubmitError(new Error("rate_limit_unavailable"), t)).toBe("common_apiRateLimitUnavailable");
    expect(mapReviewSubmitError(new Error("critical_write_rate_limit_exceeded"), t)).toBe(
      "common_apiCriticalWriteRateLimit"
    );
    expect(mapReviewSubmitError(new Error("evidence_rate_limit_exceeded"), t)).toBe("common_apiEvidenceRateLimit");
    expect(mapReviewSubmitError(new Error("outbox_persist_failed"), t)).toBe("escrow_intentOutboxFailed");
    expect(mapReviewSubmitError(new Error("order_not_final_financial_state"), t)).toBe(
      "order_error_rating_not_ready"
    );
  });
  it("uses submit fallback for unknown errors (no raw passthrough)", () => {
    expect(mapReviewSubmitError(new Error("internal_server_detail"), t)).toBe("escrow_submitReviewFailed");
  });

  it("delegates request_failed_<HTTP> through mapApiReadError → mapOrderWriteError", () => {
    expect(mapReviewSubmitError(new Error("request_failed_404"), t)).toBe("common_apiHttpNotFound");
    expect(mapReviewSubmitError(new Error("request_failed_503"), t)).toBe("common_apiHttpServer");
  });
});
