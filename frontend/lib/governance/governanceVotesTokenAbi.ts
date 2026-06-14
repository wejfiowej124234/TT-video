/** `GovernanceVotesToken.getPastVotes` · 与 Governor proposalThreshold 同口径 */
export const governanceVotesTokenAbi = [
  {
    type: "function",
    name: "getPastVotes",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "timepoint", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
