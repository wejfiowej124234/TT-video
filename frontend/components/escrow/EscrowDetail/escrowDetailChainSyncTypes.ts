/** `GET /api/v1/orders/:id/chain-sync-status` 成功体 `chain_sync` 的只读视图（110 §3.3；702 起含 `tx_hash` / `block_hash`；703 起可选 `event_log_snapshot_absent_reason`；705 起可选根级 `note`；706 起可选 `last_event` chain_off；707 起根级 `order_id`；708 起非 chain_off 最小体根级 `requester`；709 起非 chain_off 最小体 `chain_sync.status`=`unknown`；710 起 `checkpoint` block/log/source 与 `GET /meta` `indexer.checkpoint` 同源；723 起 `checkpoint` 对象顶层键序与 `CHAIN_SYNC_CHECKPOINT_TOP_KEYS` / `GET /meta` `checkpoint_top_keys` / `checkpoint_keys_contract_723` 对读；724 起 `checkpoint.source` 合法取值有序表与 `CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES` / `GET /meta` `checkpoint_source_values` / `checkpoint_source_values_contract_724` 及 `chain_sync_checkpoint_source`（712/724）对读；725 起 `GET /meta` `indexer.finality_discipline.order_chain_sync_status` 对象顶层键序与 `ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS` / `order_chain_sync_status_top_keys` / `order_chain_sync_status_top_keys_contract_725` 对读；711 起 `finalityN` 与 `GET /meta` `finality_n` / `indexer.finality_n` 同源；712 起 `checkpoint.source` 与 `GET /meta` `indexer.checkpoint.source` 同源；713 起 `syncStatus`（`chain_sync.status`）仅 `pending`|`confirmed`|`unknown`，与 `GET /meta` `order_chain_sync_status.status_values` 同源；714 起非 chain_off 最小体根级 `note` 稳定句与 `GET /meta` `order_chain_sync_status.minimal_body_note_stable` 同源；715 起成功体根级 `status` 字面 `ok` 与 `GET /meta` `order_chain_sync_status.success_body_envelope_status` 同源，与 `chain_sync.status` 区分；716 起 `chain_sync` 必有顶层键 `CHAIN_SYNC_REQUIRED_TOP_KEYS` 与 `GET /meta` `chain_sync_required_top_keys` 对读；717 起 `CHAIN_SYNC_ROUTE_PATH_TEMPLATE` / `CHAIN_SYNC_STATUS_METHOD_AND_PATH` 与 `GET /meta` `method_path` / `method_path_contract_717` 对读；718 起 `CHAIN_SYNC_STATUS_HANDLER_CODE` 与 `GET /meta` `order_chain_sync_status.code` / `code_contract_718` 对读；719 起 `CHAIN_SYNC_STATUS_VALUES` 与 `GET /meta` `status_values` / `status_values_contract_719` 对读；720 起 `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS` 与 `GET /meta` `absent_reason_values` / `absent_reason_values_contract_720` 对读；721 起 `CHAIN_SYNC_LAST_EVENT_TOP_KEYS` 与 `GET /meta` `last_event_top_keys` / `last_event_keys_contract_721` 对读；722 起 `event_log_snapshot` 对象顶层键与 `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS` / `GET /meta` `event_log_snapshot_top_keys` / `event_log_snapshot_keys_contract_722` 对读） */
export interface ChainSyncLastEvent {
  state: string;
  updated_at: string;
  escrow_address: string | null;
}

export interface OrderChainSyncState {
  /** `chain_sync.status`；非 chain_off 最小体为字面 `unknown`（709，常与 `projection_backend_unavailable` 同批）；合规响应仅 `pending`|`confirmed`|`unknown`（713） */
  syncStatus: string;
  /** `chain_sync.finality_n`；与 `GET /meta` 根级 `finality_n` 及 `indexer.finality_n` 同源（711） */
  finalityN: number;
  /** `chain_sync.checkpoint`；与 `GET /meta` `indexer.checkpoint` 同源（710）；723：JSON 对象顶层键顺序与 `CHAIN_SYNC_CHECKPOINT_TOP_KEYS` / `GET /meta` `checkpoint_top_keys` 对读 */
  checkpointBlock: number;
  checkpointLog: number;
  /** 712：`chain_sync.checkpoint.source`，`runtime` | `startup_snapshot`（723 键序中第三键 `source` 与之一致；724：取值有序表与 `CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES` / `GET /meta` `checkpoint_source_values` 对读） */
  checkpointSource?: string;
  /** 705：成功体根级 `note`（如非 chain_off 最小体的人读说明）；714：最小体稳定句与 `GET /meta` `minimal_body_note_stable` 同源 */
  chainSyncNote?: string;
  /** 707：成功体根级 `order_id`（与路径参数同 UUID 字符串） */
  chainSyncOrderId?: string;
  /** 708：非 chain_off 最小成功体根级 `requester`（当前会话用户 UUID） */
  chainSyncRequester?: string;
  /** 706：`chain_sync.last_event`（chain_off：订单投影 state / 更新时间 / 托管地址）；721：对象顶层键与 `CHAIN_SYNC_LAST_EVENT_TOP_KEYS` / `GET /meta` `last_event_top_keys` 对读 */
  lastEvent?: ChainSyncLastEvent;
  /** 702：`chain_sync.event_log_snapshot`；722：JSON 对象顶层键顺序与 `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS` / `GET /meta` `event_log_snapshot_top_keys` 对读 */
  eventLogSnapshot?: {
    finality_n_used: number;
    block_number: number;
    log_index: number;
    event_type: string;
    tx_hash?: string | null;
    block_hash?: string | null;
  };
  /** 703：与 `event_log_snapshot` 互斥；机器键 ∈ `CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS`（720 与 `GET /meta` `absent_reason_values` 对读） */
  eventLogSnapshotAbsentReason?: string;
}

/** 715：成功体根级 `status` 字面；与 `crates/api` `CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS` / `GET /meta` `success_body_envelope_status` 对读 */
export const CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS = "ok" as const;

/** 716：`chain_sync` 成功体必有顶层键；与 `orders::CHAIN_SYNC_REQUIRED_TOP_KEYS` / `GET /meta` `order_chain_sync_status.chain_sync_required_top_keys` 对读 */
export const CHAIN_SYNC_REQUIRED_TOP_KEYS = [
  "status",
  "finality_n",
  "checkpoint",
  "last_event",
] as const;

/** 717：Axum 挂载路径模板（`:id` 为 UUID）；与 `orders::CHAIN_SYNC_ROUTE_PATH` / `GET /meta` `method_path_contract_717` 对读 */
export const CHAIN_SYNC_ROUTE_PATH_TEMPLATE = "/api/v1/orders/:id/chain-sync-status";

/** 717：方法与路径字面；与 `orders::CHAIN_SYNC_STATUS_METHOD_AND_PATH` / `GET /meta` `order_chain_sync_status.method_path` 对读 */
export const CHAIN_SYNC_STATUS_METHOD_AND_PATH =
  "GET /api/v1/orders/:id/chain-sync-status" as const;

/** 718：实现文件路径 + 处理器符号；与 `orders::CHAIN_SYNC_STATUS_HANDLER_CODE` / `GET /meta` `order_chain_sync_status.code` 对读 */
export const CHAIN_SYNC_STATUS_HANDLER_CODE =
  "crates/api/src/routes/orders/mod.rs get_order_chain_sync_status" as const;

/** 719：`chain_sync.status` 合法枚举顺序；与 `orders::CHAIN_SYNC_STATUS_VALUES` / `GET /meta` `order_chain_sync_status.status_values` 对读 */
export const CHAIN_SYNC_STATUS_VALUES = ["pending", "confirmed", "unknown"] as const;

/** B-038：将 API `chain_sync.status` 归一为 UI 三分支；未知字面视为 unknown */
export function normalizeChainSyncReadStatus(raw: string): "pending" | "confirmed" | "unknown" {
  const k = raw.trim().toLowerCase();
  if (k === "pending" || k === "confirmed" || k === "unknown") return k;
  return "unknown";
}

/** 720：`event_log_snapshot_absent_reason` 合法机器键顺序；与 `orders::CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS` / `GET /meta` `order_chain_sync_status.absent_reason_values` 对读 */
export const CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS = [
  "no_database",
  "no_chain_context",
  "no_row",
  "read_failed",
  "projection_backend_unavailable",
] as const;

/** 721：chain_off 时 `chain_sync.last_event` 对象顶层键顺序；与 `orders::CHAIN_SYNC_LAST_EVENT_TOP_KEYS` / `GET /meta` `order_chain_sync_status.last_event_top_keys` 对读 */
export const CHAIN_SYNC_LAST_EVENT_TOP_KEYS = [
  "state",
  "updated_at",
  "escrow_address",
] as const;

/** 722：`chain_sync.event_log_snapshot` 对象顶层键顺序；与 `db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS` / `escrow_event_finality_snapshot_to_json` / `GET /meta` `order_chain_sync_status.event_log_snapshot_top_keys` 对读 */
export const CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS = [
  "finality_n_used",
  "block_number",
  "log_index",
  "event_type",
  "tx_hash",
  "block_hash",
] as const;

/** 723：`chain_sync.checkpoint` 对象顶层键顺序；与 `orders::CHAIN_SYNC_CHECKPOINT_TOP_KEYS` / `GET /meta` `order_chain_sync_status.checkpoint_top_keys` 对读 */
export const CHAIN_SYNC_CHECKPOINT_TOP_KEYS = [
  "block_number",
  "log_index",
  "source",
] as const;

/** 724：`chain_sync.checkpoint.source` 合法取值有序表；与 `orders::CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES` / `GET /meta` `order_chain_sync_status.checkpoint_source_values` 对读 */
export const CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES = ["runtime", "startup_snapshot"] as const;

/** 725：`GET /meta` `indexer.finality_discipline.order_chain_sync_status` 对象顶层键顺序；与 `orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS` / `order_chain_sync_status_top_keys` / `order_chain_sync_status_top_keys_contract_725` 对读 */
export const ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS = [
  "method_path",
  "method_path_contract_717",
  "status_values",
  "status_values_contract_719",
  "absent_reason_values",
  "absent_reason_values_contract_720",
  "code",
  "code_contract_718",
  "event_log_snapshot_top_keys",
  "event_log_snapshot_keys_contract_722",
  "optional_event_log_snapshot",
  "optional_event_log_snapshot_absent_reason",
  "last_event_top_keys",
  "last_event_keys_contract_721",
  "checkpoint_top_keys",
  "checkpoint_keys_contract_723",
  "checkpoint_source_values",
  "checkpoint_source_values_contract_724",
  "optional_last_event",
  "success_body_order_id",
  "success_body_envelope_status",
  "chain_sync_required_top_keys",
  "minimal_body_requester",
  "minimal_body_chain_sync_status_unknown",
  "chain_sync_checkpoint",
  "chain_sync_finality_n",
  "chain_sync_checkpoint_source",
  "chain_sync_status_enum",
  "minimal_body_note_stable",
  "order_chain_sync_status_top_keys",
  "order_chain_sync_status_top_keys_contract_725",
  "rule",
] as const;

export function parseOrderChainSyncResponse(raw: unknown): OrderChainSyncState | null {
  const d = raw as {
    status?: string;
    note?: string;
    order_id?: string;
    requester?: string;
    chain_sync?: {
      status?: string;
      finality_n?: number;
      checkpoint?: { block_number?: number; log_index?: number; source?: string };
      last_event?: {
        state?: string;
        updated_at?: string;
        escrow_address?: string | null;
      } | null;
      event_log_snapshot?: {
        finality_n_used?: number;
        block_number?: number;
        log_index?: number;
        event_type?: string;
        tx_hash?: string | null;
        block_hash?: string | null;
      };
      event_log_snapshot_absent_reason?: string;
    };
  };
  if (
    d?.status !== CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS ||
    !d.chain_sync ||
    typeof d.chain_sync !== "object"
  )
    return null;
  const cs = d.chain_sync;
  const syncSt = cs.status;
  if (typeof syncSt !== "string") return null;
  const fn =
    typeof cs.finality_n === "number" && Number.isFinite(cs.finality_n) ? cs.finality_n : 12;
  const cp = cs.checkpoint;
  const cb =
    cp && typeof cp.block_number === "number" && Number.isFinite(cp.block_number)
      ? cp.block_number
      : 0;
  const cli =
    cp && typeof cp.log_index === "number" && Number.isFinite(cp.log_index) ? cp.log_index : 0;
  const cpsrc =
    cp && typeof cp.source === "string" && cp.source.trim() ? cp.source.trim() : undefined;
  let eventLogSnapshot: OrderChainSyncState["eventLogSnapshot"];
  const els = cs.event_log_snapshot;
  if (
    els &&
    typeof els === "object" &&
    typeof els.finality_n_used === "number" &&
    typeof els.block_number === "number" &&
    typeof els.log_index === "number" &&
    typeof els.event_type === "string"
  ) {
    const txH = typeof els.tx_hash === "string" && els.tx_hash.trim() ? els.tx_hash.trim() : undefined;
    const bh =
      typeof els.block_hash === "string" && els.block_hash.trim() ? els.block_hash.trim() : undefined;
    eventLogSnapshot = {
      finality_n_used: els.finality_n_used,
      block_number: els.block_number,
      log_index: els.log_index,
      event_type: els.event_type,
      ...(txH ? { tx_hash: txH } : {}),
      ...(bh ? { block_hash: bh } : {}),
    };
  }
  const absentRaw = cs.event_log_snapshot_absent_reason;
  const eventLogSnapshotAbsentReason =
    typeof absentRaw === "string" && absentRaw.trim() && !eventLogSnapshot
      ? absentRaw.trim()
      : undefined;
  const chainSyncNote =
    typeof d.note === "string" && d.note.trim() ? d.note.trim() : undefined;
  const chainSyncOrderId =
    typeof d.order_id === "string" && d.order_id.trim() ? d.order_id.trim() : undefined;
  const chainSyncRequester =
    typeof d.requester === "string" && d.requester.trim() ? d.requester.trim() : undefined;
  let lastEvent: ChainSyncLastEvent | undefined;
  const le = cs.last_event;
  if (le && typeof le === "object" && !Array.isArray(le)) {
    const st = le.state;
    const ua = le.updated_at;
    if (typeof st === "string" && typeof ua === "string") {
      let escrow: string | null = null;
      const ea = le.escrow_address;
      if (typeof ea === "string" && ea.trim()) escrow = ea.trim();
      else if (ea === null) escrow = null;
      lastEvent = { state: st, updated_at: ua, escrow_address: escrow };
    }
  }
  return {
    syncStatus: syncSt,
    finalityN: fn,
    checkpointBlock: cb,
    checkpointLog: cli,
    ...(cpsrc ? { checkpointSource: cpsrc } : {}),
    eventLogSnapshot,
    ...(eventLogSnapshotAbsentReason ? { eventLogSnapshotAbsentReason } : {}),
    ...(chainSyncNote ? { chainSyncNote } : {}),
    ...(chainSyncOrderId ? { chainSyncOrderId } : {}),
    ...(chainSyncRequester ? { chainSyncRequester } : {}),
    ...(lastEvent ? { lastEvent } : {}),
  };
}
