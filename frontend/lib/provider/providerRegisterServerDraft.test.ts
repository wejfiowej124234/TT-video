import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { putProviderRegistrationServerDraft } from "./providerRegisterServerDraft";

describe("putProviderRegistrationServerDraft", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends Idempotency-Key on Official PUT (missing_idempotency_key class)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: "ok", draft: { step: 1 } }),
      json: async () => ({ status: "ok", draft: { step: 1 } }),
    });
    await putProviderRegistrationServerDraft({ step: 1, shopName: "x" });
    const init = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as {
      method: string;
      headers: Record<string, string>;
      body: string;
    };
    expect(init.method).toBe("PUT");
    expect(init.headers["Idempotency-Key"]).toBeTruthy();
    expect(init.headers["X-Idempotency-Key"]).toBe(init.headers["Idempotency-Key"]);
    expect(JSON.parse(init.body)).toEqual({ draft: { step: 1, shopName: "x" } });
  });
});
