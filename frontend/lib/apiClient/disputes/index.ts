/**
 * 争议 / 证据 / 裁决 API 客户端 barrel（实现见 **`./http.ts`**；**04** / **48** 对读）。
 */

export {
  getDisputes,
  getDispute,
  getOrderEvidence,
  postOrderEvidence,
  postDisputeResolve,
  postDisputeExecuteResolutionIntent,
} from "./http";
