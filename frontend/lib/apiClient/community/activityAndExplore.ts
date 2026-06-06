import { apiUrl, routes } from "../../api";
import { defaultHeaders, communityReadOk } from "./internal";

export type CommunityActivityEventRow = {
  kind: string;
  actor_user_id: string;
  actor_nickname?: string | null;
  post_id?: string | null;
  created_at: string;
};

/** GET /api/v1/community/me/notifications — 与 **`…/me/activity`** 同源（v1 互动收件箱） */
export async function getMeNotifications(): Promise<ReturnType<typeof getMeActivity>> {
  const res = await fetch(apiUrl(routes.community.meNotifications), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeNotifications", res)) as Awaited<
    ReturnType<typeof getMeActivity>
  >;
}

/** GET /api/v1/community/me/activity — 获赞汇总 + 近期互动事件 */
export async function getMeActivity(): Promise<{
  status: string;
  likes_received?: number;
  items?: CommunityActivityEventRow[];
  activity_scope?: string;
  note?: string;
}> {
  const res = await fetch(apiUrl(routes.community.meActivity), { headers: defaultHeaders() });
  return (await communityReadOk("community.getMeActivity", res)) as {
    status: string;
    likes_received?: number;
    items?: CommunityActivityEventRow[];
    activity_scope?: string;
    note?: string;
  };
}

export type ExploreDestinationCountRow = {
  destination: string;
  post_count: number;
};

/** GET /api/v1/community/explore/destinations — 公开帖目的地聚合 */
export async function getExploreDestinations(): Promise<{
  status: string;
  destinations?: ExploreDestinationCountRow[];
  catalog?: string;
  note?: string;
}> {
  const res = await fetch(apiUrl(routes.community.exploreDestinations), { headers: defaultHeaders() });
  return (await communityReadOk("community.getExploreDestinations", res)) as {
    status: string;
    destinations?: ExploreDestinationCountRow[];
    catalog?: string;
    note?: string;
  };
}
