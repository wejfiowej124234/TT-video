/**
 * 社区「帖子获赞总数」展示偏好：仅浏览器 localStorage（①②③ 同源；无后端字段、无环境分叉）。
 * 开启时前端不请求 `GET …/community/me/likes-received`，与 `isCommunityMeLikesListEnabled()` 组合使用。
 */

export const COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY = "traveltrust_community_hide_likes_received_metric_v1";

/** 同页 / 跨标签同步用（`storage` 事件不覆盖当前标签写入） */
export const COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT = "traveltrust:community-hide-likes-metric-changed";

export function readHideLikesReceivedMetric(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHideLikesReceivedMetric(hidden: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (hidden) {
      window.localStorage.setItem(COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY, "1");
    } else {
      window.localStorage.removeItem(COMMUNITY_HIDE_LIKES_RECEIVED_METRIC_LS_KEY);
    }
    window.dispatchEvent(new Event(COMMUNITY_HIDE_LIKES_METRIC_CHANGED_EVENT));
  } catch {
    /* quota / private mode */
  }
}

/**
 * 是否与 Me / 活动中心 / 消息·活动 **同源**调用 `GET …/community/me/likes-received`
 *（构建期赞过列表开 ∧ 用户未勾选本机隐藏）。前后端环境一致时 ①②③ 同结论。
 */
export function isCommunityMeLikesReceivedFetchEnabled(
  likesListFeatureEnabled: boolean,
  hideLikesReceivedMetric: boolean,
): boolean {
  return likesListFeatureEnabled && !hideLikesReceivedMetric;
}

/**
 * 构建期赞过能力开且用户勾选本机隐藏：活动中心 / 消息·活动 **`likesMetricSuppressed`** 与 `isCommunityMeLikesReceivedFetchEnabled` 对偶（非「配置关闭」态）。
 */
export function isCommunityMeLikesReceivedMetricUserHiddenOnDevice(
  likesListFeatureEnabled: boolean,
  hideLikesReceivedMetric: boolean,
): boolean {
  return likesListFeatureEnabled && hideLikesReceivedMetric;
}
