/** 区块浏览器地址页（质押池 L5 · 与 Escrow 可追溯同源口径） */
export function getExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const a = address.trim();
  if (!a.startsWith("0x")) return undefined;
  if (chainId === 1) return `https://etherscan.io/address/${a}`;
  if (chainId === 137) return `https://polygonscan.com/address/${a}`;
  if (chainId === 80002) return `https://amoy.polygonscan.com/address/${a}`;
  if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${a}`;
  return undefined;
}
