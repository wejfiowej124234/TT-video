/** 治理 tx / 地址 · 区块浏览器（与 stakingBlockExplorer 同源扩展） */
export function getGovernanceExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const a = address.trim();
  if (!a.startsWith("0x")) return undefined;
  if (chainId === 1) return `https://etherscan.io/address/${a}`;
  if (chainId === 137) return `https://polygonscan.com/address/${a}`;
  if (chainId === 80002) return `https://amoy.polygonscan.com/address/${a}`;
  if (chainId === 11155111) return `https://sepolia.etherscan.io/address/${a}`;
  if (chainId === 31337) return undefined;
  return undefined;
}

export function getGovernanceExplorerTxUrl(chainId: number, txHash: string): string | undefined {
  const h = txHash.trim();
  if (!h.startsWith("0x")) return undefined;
  if (chainId === 1) return `https://etherscan.io/tx/${h}`;
  if (chainId === 137) return `https://polygonscan.com/tx/${h}`;
  if (chainId === 80002) return `https://amoy.polygonscan.com/tx/${h}`;
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${h}`;
  if (chainId === 31337) return undefined;
  return undefined;
}
