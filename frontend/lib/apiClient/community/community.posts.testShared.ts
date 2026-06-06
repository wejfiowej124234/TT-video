/** Shared helpers for `community.posts.*.test.ts`（按行数闸拆片）。 */

export function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

export const COMMUNITY_POSTS_TEST_POST_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
