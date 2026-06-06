/** `RegionStewardStakePool` 最小 ABI（与 `contracts/abi/RegionStewardStakePool.json` 对拍） */
export const regionStewardStakePoolAbi = [
  {
    type: "function",
    name: "ttg",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "minStakeAmount",
    stateMutability: "view",
    inputs: [{ name: "jurisdiction", type: "bytes2" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "hasJurisdictionStake",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "bytes2" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jurisdiction", type: "bytes2" },
      { name: "amount", type: "uint256" },
      { name: "applicationId", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
