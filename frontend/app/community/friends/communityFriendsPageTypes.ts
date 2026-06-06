export type FriendsTab = "following" | "followers" | "friends" | "requests";

export const FRIENDS_TABS: FriendsTab[] = ["following", "followers", "friends", "requests"];

export type CommunityFriendsRequestReceived = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  from_nickname?: string;
  from_avatar_url?: string | null;
  from_role?: string | null;
  from_is_escrow_guide?: boolean | null;
  from_default_wallet?: string | null;
};

export type CommunityFriendsRequestSent = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  to_nickname?: string;
  to_avatar_url?: string | null;
  to_role?: string | null;
  to_is_escrow_guide?: boolean | null;
  to_default_wallet?: string | null;
};
