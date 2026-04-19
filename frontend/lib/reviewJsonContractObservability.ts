/**
 * B-453 · `review_json_contract` 客户端降级路径的运行时观测（计数 + 埋点钩子，供放量/回滚与告警管线接入）。
 */

import { trackReviewJsonContractDegrade } from "./analytics";
import {
  CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED,
  type ReviewJsonContractClientView,
} from "./reviewJsonContract";

export type ReviewJsonContractApiPath = "get_reviews" | "post_review";

type DegradeCounters = {
  missing_meta: number;
  malformed_meta: number;
  unknown_future_schema: number;
};

const degradeCounters: DegradeCounters = {
  missing_meta: 0,
  malformed_meta: 0,
  unknown_future_schema: 0,
};

/** 仅统计需告警的三类降级；`degrade === none` 不计入。 */
export function getReviewJsonContractDegradeCounters(): Readonly<DegradeCounters> {
  return { ...degradeCounters };
}

/** 单测或排障时复位进程内计数。 */
export function resetReviewJsonContractDegradeCounters(): void {
  degradeCounters.missing_meta = 0;
  degradeCounters.malformed_meta = 0;
  degradeCounters.unknown_future_schema = 0;
}

/**
 * 在 **`getOrderReviews` / `postReview`** 成功路径解析 **`meta`** 后调用：累加计数并触发埋点（生产可接 gtag/自建）。
 */
export function observeReviewJsonContractClient(
  view: ReviewJsonContractClientView,
  apiPath: ReviewJsonContractApiPath
): void {
  const d = view.degrade;
  if (d === "none") return;

  if (d === "missing_meta") degradeCounters.missing_meta += 1;
  else if (d === "malformed_meta") degradeCounters.malformed_meta += 1;
  else degradeCounters.unknown_future_schema += 1;

  trackReviewJsonContractDegrade({
    degrade: d,
    api_path: apiPath,
    schema_version_reported: view.schemaVersionReported,
    schema_version_effective: view.schemaVersionEffective,
    client_max_supported: CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED,
  });
}
