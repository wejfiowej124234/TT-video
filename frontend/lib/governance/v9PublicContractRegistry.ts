/**
 * V9 Official Public Contract Registry (FE read-only · Phase1 Mainnet).
 * SSOT: docs/github-official ACTIVE Contract Registry · Design Lock DL_R1.
 * Status: DEPLOYED_PENDING_CUTOVER — not Fully Active · public sale window not open.
 * Do not hand-write these addresses elsewhere.
 */

export const V9_PUBLIC_DEPLOY_STATUS = "DEPLOYED_PENDING_CUTOVER" as const;
export const V9_PUBLIC_MAINNET_CHAIN_ID = 1 as const;

export const V9_PUBLIC_CONTRACTS = {
  ttg: "0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9",
  soloTimelock: "0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f",
  projectPool: "0x7B21b421981A3B61cc08c8E22D4fd690E457Df37",
  countryFeeRouter: "0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970",
  vault: "0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C",
  market: "0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b",
  governor: "0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c",
  roleStake: "0xf6A1Fb4435E463117a666818611F49D03F91E7A7",
  keepEscrowFactory: "0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6",
  keepSettlementRouter: "0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372",
  usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
} as const;

/** Forbidden in ACTIVE UI disclosure */
export const V9_LEGACY_DO_NOT_USE_AS_ACTIVE = {
  safe: "0x96491",
  keepTimelock: "0x50F0",
  p4Cap: "0xfB906",
} as const;

export type V9PublicContractRole = keyof typeof V9_PUBLIC_CONTRACTS;
