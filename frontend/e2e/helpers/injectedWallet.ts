import type { Page } from "@playwright/test";

/** 与 wagmi `injected()` 联调：供 Playwright 在浏览器内模拟 EIP-1193（签名返回占位 secp256k1 长度）。 */
export const E2E_MOCK_WALLET_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

const DUMMY_SIG = `0x${"1b".repeat(65)}` as const;

/**
 * 须在 `page.goto` 之前注册。默认链 **137**（与未设置 `NEXT_PUBLIC_CHAIN_ID` 时 `getExpectedChainId()` 一致）。
 */
export function installInjectedEthereumMock(page: Page, chainIdHex: `0x${string}` = "0x89") {
  const addr = E2E_MOCK_WALLET_ADDRESS;
  return page.addInitScript(
    ({ chainIdHex: cid, walletAddr: wa, dummySig: sig }) => {
      const provider = {
        isMetaMask: true,
        selectedAddress: wa,
        request: async (args: { method: string; params?: unknown[] }) => {
          const method = String(args.method);
          switch (method) {
            case "eth_requestAccounts":
            case "eth_accounts":
              return [wa];
            case "eth_chainId":
              return cid;
            case "net_version":
              return String(parseInt(cid, 16));
            case "web3_clientVersion":
              return "MetaMask/e2e-mock";
            case "wallet_requestPermissions":
            case "wallet_getPermissions":
              return [{ parentCapability: "eth_accounts", invoker: "https://example.com" }];
            case "wallet_switchEthereumChain":
            case "wallet_addEthereumChain":
            case "wallet_getCapabilities":
            case "wallet_sendCalls":
              return method === "wallet_getCapabilities" ? {} : null;
            case "eth_signTypedData_v4":
            case "eth_signTypedData":
            case "wallet_signTypedData":
            case "wallet_signTypedData_v4":
              return sig;
            case "personal_sign":
              return sig;
            default:
              return null;
          }
        },
        on: () => provider,
        removeListener: () => {},
        addListener: () => provider,
      };
      (window as unknown as { ethereum?: typeof provider }).ethereum = provider;
    },
    { chainIdHex, walletAddr: addr, dummySig: DUMMY_SIG }
  );
}

/** 顶栏 Wallet → 第一个连接器（本地通常仅 Injected）。 */
export async function connectHeaderInjectedWallet(page: Page) {
  await page.getByRole("button", { name: /连接钱包|Connect wallet/i }).click();
  await page.getByRole("menuitem").first().click();
  /** 与 `WalletStatusMini` 截断一致：`slice(0, 6)`…`slice(-4)` */
  const short = `${E2E_MOCK_WALLET_ADDRESS.slice(0, 6)}…${E2E_MOCK_WALLET_ADDRESS.slice(-4)}`;
  await page.locator("header").getByText(short).waitFor({ state: "visible", timeout: 20_000 });
}
