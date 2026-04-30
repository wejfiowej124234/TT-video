/**
 * 全局「数据语义层」：单一状态机口径，供列表/详情/会话闸等 UI 分支。
 * kind 优先级约定见 `deriveListDataState`。
 */
export type DataStateKind = "loading" | "success" | "empty" | "error" | "invalid";

export type DataState<T> =
  | { kind: "loading" }
  | { kind: "success"; value: T }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "invalid"; message?: string };

export function dataStateLoading(): DataState<never> {
  return { kind: "loading" };
}

export function dataStateSuccess<T>(value: T): DataState<T> {
  return { kind: "success", value };
}

export function dataStateEmpty(): DataState<never> {
  return { kind: "empty" };
}

export function dataStateError(message: string): DataState<never> {
  return { kind: "error", message };
}

export function dataStateInvalid(message?: string): DataState<never> {
  return { kind: "invalid", message };
}

/** 登录闸：鉴权进行中 / 访客不可见 / 已登录。 */
export function deriveAuthGateDataState(authLoading: boolean, isLoggedIn: boolean): DataState<undefined> {
  if (authLoading) return dataStateLoading();
  if (!isLoggedIn) return dataStateInvalid();
  return dataStateSuccess(undefined);
}

/**
 * 列表主资源：invalid > loading > error > empty > success
 * （invalid 表示路由/参数等「语义不成立」，不应与网络错误混用）
 */
export function deriveListDataState<T>(p: {
  invalid?: boolean;
  invalidMessage?: string | null;
  loading: boolean;
  error: string | null;
  items: readonly T[];
}): DataState<readonly T[]> {
  if (p.invalid) return dataStateInvalid(p.invalidMessage ?? undefined);
  if (p.loading) return dataStateLoading();
  if (p.error) return dataStateError(p.error);
  if (p.items.length === 0) return dataStateEmpty();
  return dataStateSuccess(p.items);
}

export function isDataStateLoading<T>(s: DataState<T>): boolean {
  return s.kind === "loading";
}

export function isDataStateSuccess<T>(s: DataState<T>): s is { kind: "success"; value: T } {
  return s.kind === "success";
}

/** 资料卡「关注 / 粉丝 / 好友 / 帖子获赞（likes-received）」四路聚合后的成功载荷 */
export type CommunitySocialStatsPayload = {
  followingCount: number;
  followersCount: number;
  friendsCount: number;
  likesReceived: number;
  /** 部分接口失败时仍展示已成功接口的计数；UI 可提示降级并触发重试 */
  partialLoad?: boolean;
  /**
   * 获赞接口 HTTP 成功但 `likes_received` 缺失或非数字等；UI 以「—」展示，不冒充 0。
   * 与 `partialLoad` 可同时出现（与网络部分失败叠加）。
   */
  likesReceivedUnknown?: boolean;
  /** `following` / `followers` / `friends` 在 200 下非数组等；UI 以「—」展示，不冒充 0。 */
  followingCountUnknown?: boolean;
  followersCountUnknown?: boolean;
  friendsCountUnknown?: boolean;
};

/**
 * 社区统计条：fatal error → loading → invalid（就绪但契约不满足）→ empty（全 0 且无部分失败）→ success。
 * **部分失败**：`partialFailure` + 至少一路成功时，不以整卡 error 代替；成功值为失败路按 0 计。
 */
export function deriveCommunitySocialStatsDataState(p: {
  statsLoading: boolean;
  /** 所启用查询路全部失败（不得以全 0 冒充成功） */
  statsError: boolean;
  /** 与 `statsError` 互斥：部分路失败、部分路已成功且均已 settle */
  partialFailure?: boolean;
  /** 获赞 JSON 契约不满足（与网络 `partialFailure` 独立，可叠加） */
  likesReceivedUnknown?: boolean;
  /** 关注列表字段非数组等（与 `likesReceivedUnknown` 同源策略） */
  followingCountUnknown?: boolean;
  followersCountUnknown?: boolean;
  friendsCountUnknown?: boolean;
  socialStatsReady: boolean;
  followingCount: number;
  followersCount: number;
  friendsCount: number;
  likesReceived: number;
  errorMessage: string;
  contractInvalidMessage?: string;
  /**
   * 与 `NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST` 对齐：关闭「赞过列表」时不展示获赞数，
   * 亦不将其计入空态/成功聚合（避免「有数无入口」IA 漂移）。
   */
  includeLikesReceivedMetric?: boolean;
}): DataState<CommunitySocialStatsPayload> {
  if (p.statsError) return dataStateError(p.errorMessage);
  if (p.statsLoading) return dataStateLoading();
  if (!p.socialStatsReady) {
    return dataStateInvalid(p.contractInvalidMessage);
  }
  const showLikes = p.includeLikesReceivedMetric !== false;
  const likesUnknown = showLikes && p.likesReceivedUnknown === true;
  const followingUnknown = p.followingCountUnknown === true;
  const followersUnknown = p.followersCountUnknown === true;
  const friendsUnknown = p.friendsCountUnknown === true;
  const socialListUnknown = followingUnknown || followersUnknown || friendsUnknown;
  const partial = p.partialFailure === true || likesUnknown || socialListUnknown;
  const payload: CommunitySocialStatsPayload = {
    followingCount: p.followingCount,
    followersCount: p.followersCount,
    friendsCount: p.friendsCount,
    likesReceived: showLikes ? p.likesReceived : 0,
    ...(partial ? { partialLoad: true as const } : {}),
    ...(likesUnknown ? { likesReceivedUnknown: true as const } : {}),
    ...(followingUnknown ? { followingCountUnknown: true as const } : {}),
    ...(followersUnknown ? { followersCountUnknown: true as const } : {}),
    ...(friendsUnknown ? { friendsCountUnknown: true as const } : {}),
  };
  const coreSum =
    payload.followingCount + payload.followersCount + payload.friendsCount;
  const sum = showLikes ? coreSum + payload.likesReceived : coreSum;
  if (sum === 0 && !partial) return dataStateEmpty();
  return dataStateSuccess(payload);
}
