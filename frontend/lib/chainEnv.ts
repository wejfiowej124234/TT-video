import type { Chain } from "viem";
import { defineChain } from "viem";
import { mainnet, polygon, polygonAmoy, sepolia } from "viem/chains";

const anvilLocal = defineChain({
  id: 31337,
  name: "Local Anvil",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

/**
 * 与后端 `CHAIN_ID`、`.env.example` 中 `NEXT_PUBLIC_CHAIN_ID` 对齐。
 * 未设置时默认 **137**（Polygon PoS），与顶栏 Wallet 历史行为一致（避免 Escrow 默认 1 与顶栏默认 137 分裂）。
 */
export function getExpectedChainId(): number {
  if (typeof process === "undefined") return 137;
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (raw == null || String(raw).trim() === "") return 137;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 137;
}

/** Wagmi `createConfig` 使用：单链模式，与 `getExpectedChainId()` 一致 */
export function getTargetChain(): Chain {
  const id = getExpectedChainId();
  switch (id) {
    case 1:
      return mainnet;
    case 137:
      return polygon;
    case 80002:
      return polygonAmoy;
    case 11155111:
      return sepolia;
    case 31337:
      return anvilLocal;
    default: {
      const rpc = process.env.NEXT_PUBLIC_RPC_URL?.trim();
      return defineChain({
        id,
        name: `Chain ${id}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: {
            http: [rpc && rpc.length > 0 ? rpc : "http://127.0.0.1:8545"],
          },
        },
      });
    }
  }
}
