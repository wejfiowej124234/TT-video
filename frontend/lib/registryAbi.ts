/** TravelTrust Registry.sol 最小只读 ABI；须与 `contracts/abi/Registry.json` 语义一致（改合约后同步 JSON + 本常量，并跑 `scripts/check-55-s13.sh`） */
export const registryAbi = [
  {
    type: "function",
    name: "isApproved",
    stateMutability: "view",
    inputs: [{ name: "guide", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "guideApproval",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "approved", type: "bool" },
      { name: "tier", type: "uint8" },
      { name: "expiry", type: "uint256" },
    ],
  },
] as const;
