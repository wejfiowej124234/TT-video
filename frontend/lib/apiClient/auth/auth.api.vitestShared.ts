/** Vitest 切片共用：`auth/http` 信封用 **`text()`** 解析路径的 **`Response`** 桩。 */
export function mockAuthApiTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}
