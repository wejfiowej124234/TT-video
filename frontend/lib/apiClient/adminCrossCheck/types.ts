/**
 * **Epic C-01 / C-02**：**`GET /api/v1/admin/cross-check`**、**`GET /api/v1/admin/drift-summary`**（**`crates/api/src/routes/admin/mod.rs`** **`get_admin_cross_check` / `get_admin_drift_summary`**）。
 *
 * **门禁**：经 **`require_admin_actor`** — **未登录** → **401** **`login_required`**；**无 `chain_off`** → **503** **`chain_off_unavailable`**（path 形如 **`GET /api/v1/admin/*`**）；**非 `admin`/`super_admin`** → **403** **`admin_required`**。请求须 **`getAuthHeaders()`**（Bearer / 会话）。
 * **上游失败**：组装对拍体失败 → **502** **`cross_check_upstream_failed`**（**`parseResponse`** 抛 **`cross_check_upstream_failed`** 或等价文案）。成功体为宽 JSON；本模块归一化函数**不**收窄 **`body`** 语义。
 */

export type AdminCrossCheckSourceKind = "projection" | "chain_ssot" | "reference";

export type CrossCheckSlot = {
  source_kind: AdminCrossCheckSourceKind;
  /** 各槽同源 handler 的完整成功体；勿收窄类型 */
  body: unknown;
};

/** 宽顶壳：除三槽与 `drift_summary` 外不承诺字段 */
export type AdminCrossCheckResponse = Record<string, unknown> & {
  status?: string;
  fee_pool_projection?: CrossCheckSlot;
  governance_pool_chain?: CrossCheckSlot;
  protocol_reference?: CrossCheckSlot;
  drift_summary?: unknown;
};

export type AdminDriftSummaryResponse = Record<string, unknown> & {
  status?: string;
  drift_detected?: unknown;
  delta?: unknown;
};

/** C-02：槽只读视图（`source_kind` 仅在三元字面量内保留，否则 `undefined`） */
export type NormalizedCrossCheckSlot = {
  source_kind: AdminCrossCheckSourceKind | undefined;
  body: unknown;
};

/** C-02：`cross-check` 根上 `drift_summary` 的浅层切片（`delta` 仍为 `unknown`） */
export type NormalizedCrossCheckDriftSummary = {
  drift_detected: boolean | undefined;
  delta: unknown;
};

/** C-02：`GET …/cross-check` 成功体的只读归一化视图 */
export type NormalizedAdminCrossCheck = {
  status: string | undefined;
  fee_pool_projection: NormalizedCrossCheckSlot | undefined;
  governance_pool_chain: NormalizedCrossCheckSlot | undefined;
  protocol_reference: NormalizedCrossCheckSlot | undefined;
  drift_summary: NormalizedCrossCheckDriftSummary | undefined;
};

/** C-02：`GET …/drift-summary` 成功体的只读归一化视图 */
export type NormalizedAdminDriftSummary = {
  status: string | undefined;
  drift_detected: boolean | undefined;
  delta: unknown;
};
