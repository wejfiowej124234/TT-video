/** `TravelTrustGovernor` 写/读片段（与 `contracts/abi/TravelTrustGovernor.json` 对拍） */
export const travelTrustGovernorAbi = [
  {
    type: "function",
    name: "castVote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "uint8" },
    ],
    outputs: [{ name: "weight", type: "uint256" }],
  },
  {
    type: "function",
    name: "propose",
    stateMutability: "nonpayable",
    inputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "proposalId", type: "uint256" }],
  },
  {
    type: "function",
    name: "proposalThresholdVotes",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "state",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "queue",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "opId", type: "bytes32" }],
  },
  {
    type: "function",
    name: "execute",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancel",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getProposalActions",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "targets", type: "address[]" },
      { name: "values", type: "uint256[]" },
      { name: "calldatas", type: "bytes[]" },
    ],
  },
] as const;

/** Governor `castVote` support：0 Against · 1 For · 2 Abstain */
export type GovernanceCastVoteSupport = 0 | 1 | 2;

export function governanceCastVoteSupportFromChoice(choice: "yes" | "no" | "abstain"): GovernanceCastVoteSupport {
  if (choice === "yes") return 1;
  if (choice === "no") return 0;
  return 2;
}
