/** ① Admin 危险写操作 · L5 确认（替代 window.confirm）。 */
export const ADMIN_L5_CONFIRM_DATA_ATTR = "admin-l5-confirm";

export type AdminL5ConfirmRequest = {
  titleKey: string;
  descKey: string;
  descVars?: Record<string, string | number>;
  danger?: boolean;
  confirmLabelKey?: string;
  /** 写后仅失效指定 list scope；省略则全量清空 + 首页队列刷新。 */
  invalidateListScopes?: readonly string[];
  onConfirm: () => void | Promise<void>;
};
