/** Shared helpers for `community.social.*.test.ts`（按行数闸拆片）。 */

export function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

export const COMMUNITY_SOCIAL_TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
export const COMMUNITY_SOCIAL_TEST_CONV_ID = "550e8400-e29b-41d4-a716-446655440001";
export const COMMUNITY_SOCIAL_TEST_POST_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
