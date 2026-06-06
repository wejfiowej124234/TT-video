/** GET /meta 在 ① 本地 API 未起时的最小可渲染快照（非生产 SSOT） */
export const META_DEV_FALLBACK: Record<string, unknown> = {
  status: "ok",
  build: {
    git_sha: "dev-fallback",
    deployed_at: null,
  },
  chain: {
    contracts: {},
  },
  orders: {
    order_mock_pay_enabled: false,
  },
  _dev_fallback: true,
};

export function isMetaDevFallback(meta: Record<string, unknown> | null): boolean {
  return meta?._dev_fallback === true;
}
