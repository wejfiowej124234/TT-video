import type { ApiPostInput } from "./communityFeedMappers";

/** Shared `ApiPostInput` for `communityFeedMappers.*.test.ts` slices. */
export const COMMUNITY_MAPPERS_TEST_API_POST_BASE: ApiPostInput = {
  id: "p1",
  user_id: "00000000-0000-4000-8000-000000000001",
  body: "hello",
  post_type: "text",
  tags: [],
  media_urls: [],
  created_at: "2026-04-20T12:00:00Z",
};
