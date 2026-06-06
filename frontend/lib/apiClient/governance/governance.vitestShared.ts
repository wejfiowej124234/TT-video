export function governanceMockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

export const GOVERNANCE_TEST_PROPOSAL_ID = "00000000-0000-4000-8000-000000000001";
