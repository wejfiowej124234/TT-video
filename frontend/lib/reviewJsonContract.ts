/**
 * B-452 · `GET`/`POST …/orders/:id/reviews` **`meta.review_json_contract`** 客户端解析与降级。
 * 与后端 **`REVIEW_JSON_CONTRACT_SCHEMA_VERSION`** 对齐：本文件 **`CLIENT_*_MAX`** 须在主版本升级时同批 bump。
 */

/** 本前端构建可完整消费的 **`schema_version`** 上限（与 `crates/api/.../reviews.rs` 同源语义）。 */
export const CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED = 1 as const;

/** v1 期望 **`anchor`**（用于测试与文档；运行时对 v1 仍允许非空字符串宽松通过，见 `parseReviewJsonContractMeta`）。 */
export const REVIEW_JSON_CONTRACT_ANCHOR_V1 = "REVIEW-SUBMIT-JSON-CONTRACT-V1" as const;

export type ReviewJsonContractDegrade =
  | "none"
  /** 无 `meta` / 无 `review_json_contract`：仍解析 `items[]`/`review`，按 v1 字段做防御性展示 */
  | "missing_meta"
  /** 服务端 **`schema_version` > CLIENT_MAX**：仅按 v1 形状读已知键；新键忽略 */
  | "unknown_future_schema"
  /** `schema_version` 非正整数、或 `anchor` 非非空字符串 */
  | "malformed_meta";

export type ReviewJsonContractClientView = {
  /** 服务端声明的版本；缺失时为 `null` */
  schemaVersionReported: number | null;
  /** 供 UI/逻辑使用的有效版本：`unknown_future_schema` 时钳制为 **CLIENT_MAX** */
  schemaVersionEffective: number;
  anchorEffective: string | null;
  degrade: ReviewJsonContractDegrade;
};

/**
 * 从 **`meta`**（`GET`/`POST` 成功体根级）解析合约元数据并给出降级标签。
 * 不抛错：任何输入均返回可消费的 **`ReviewJsonContractClientView`**。
 */
export function parseReviewJsonContractMeta(meta: unknown): ReviewJsonContractClientView {
  const max = CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED;
  if (meta == null || typeof meta !== "object") {
    return {
      schemaVersionReported: null,
      schemaVersionEffective: 1,
      anchorEffective: null,
      degrade: "missing_meta",
    };
  }
  const m = meta as Record<string, unknown>;
  const rc = m.review_json_contract;
  if (rc == null || typeof rc !== "object") {
    return {
      schemaVersionReported: null,
      schemaVersionEffective: 1,
      anchorEffective: null,
      degrade: "missing_meta",
    };
  }
  const r = rc as Record<string, unknown>;
  const sv = r.schema_version;
  const anchor = r.anchor;

  if (typeof sv !== "number" || !Number.isFinite(sv) || sv < 1 || !Number.isInteger(sv)) {
    return {
      schemaVersionReported: typeof sv === "number" && Number.isFinite(sv) ? sv : null,
      schemaVersionEffective: 1,
      anchorEffective: typeof anchor === "string" ? anchor : null,
      degrade: "malformed_meta",
    };
  }

  if (typeof anchor !== "string" || anchor.length === 0) {
    return {
      schemaVersionReported: sv,
      schemaVersionEffective: Math.min(sv, max),
      anchorEffective: null,
      degrade: "malformed_meta",
    };
  }

  if (sv > max) {
    return {
      schemaVersionReported: sv,
      schemaVersionEffective: max,
      anchorEffective: anchor,
      degrade: "unknown_future_schema",
    };
  }

  // 1..max：宽松接受任意非空 anchor（避免服务端别名时误判）；测试中断言 **REVIEW_JSON_CONTRACT_ANCHOR_V1**
  return {
    schemaVersionReported: sv,
    schemaVersionEffective: sv,
    anchorEffective: anchor,
    degrade: "none",
  };
}
