export type GovernanceDelegateGetResponse = {
  status?: string;
  authenticated?: boolean;
  delegate_to?: string | null;
  request_id?: string;
  data_source?: string;
  note?: string;
};

export type GovernanceDelegateWriteResponse = {
  status?: string;
  delegate_to?: string | null;
  request_id?: string;
  tx_hash?: string | null;
  implementation_note?: string;
  /** POST：与已有委托目标相同时为 true */
  idempotent?: boolean;
};
