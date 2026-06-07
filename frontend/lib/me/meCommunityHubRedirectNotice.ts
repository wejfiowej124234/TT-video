export const ME_COMMUNITY_HUB_REDIRECT_NOTICE_SESSION = "tt_me_community_hub_redirect_notice";
export const ME_COMMUNITY_HUB_REDIRECT_NOTICE_DISMISSED = "tt_me_community_hub_redirect_notice_dismissed";

export function markMeCommunityHubRedirectNoticePending(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_DISMISSED) === "1") return;
    window.sessionStorage.setItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_SESSION, "1");
  } catch {
    /* noop */
  }
}

export function consumeMeCommunityHubRedirectNoticePending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_DISMISSED) === "1") return false;
    const pending = window.sessionStorage.getItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_SESSION) === "1";
    if (pending) window.sessionStorage.removeItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_SESSION);
    return pending;
  } catch {
    return false;
  }
}

export function dismissMeCommunityHubRedirectNotice(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_DISMISSED, "1");
    window.sessionStorage.removeItem(ME_COMMUNITY_HUB_REDIRECT_NOTICE_SESSION);
  } catch {
    /* noop */
  }
}
