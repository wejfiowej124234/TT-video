/** `RegionStewardStakePool` ABI（与 `contracts/abi/RegionStewardStakePool.json` 对拍） */
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
    name: "releaseDelaySeconds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "releaseVestSeconds",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "releasableAmount",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "jurisdiction", type: "bytes2" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "stakes",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "bytes2" },
    ],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "applicationId", type: "bytes32" },
      { name: "stakedAt", type: "uint64" },
      { name: "releaseRequestedAt", type: "uint64" },
      { name: "releasedAmount", type: "uint256" },
      { name: "active", type: "bool" },
    ],
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
  {
    type: "function",
    name: "requestRelease",
    stateMutability: "nonpayable",
    inputs: [{ name: "jurisdiction", type: "bytes2" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimReleased",
    stateMutability: "nonpayable",
    inputs: [{ name: "jurisdiction", type: "bytes2" }],
    outputs: [],
  },
] as const;
