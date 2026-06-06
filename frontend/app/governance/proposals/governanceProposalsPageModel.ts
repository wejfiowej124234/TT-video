export type GovernanceProposalsPageItem = { id?: string; title?: string; [key: string]: unknown };

export type GovernanceProposalsPageRes = {
  status?: string;
  items?: unknown;
  note?: string;
  data_source?: string;
  chain_id?: number;
};
