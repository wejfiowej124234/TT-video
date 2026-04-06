/**
 * EVM 地址在列表/卡片中的缩写展示（完整地址由调用方放在 title 等）。
 * 与 OrderCard、我的订单列表一致：前 8 + … + 后 6。
 */
export function shortEvmAddress(addr: string, head = 8, tail = 6): string {
  const a = addr.trim();
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
