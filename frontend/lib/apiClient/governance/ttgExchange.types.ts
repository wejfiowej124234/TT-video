/** `GET /api/v1/governance/ttg-exchange/quote` — 与 `crates/api/routes/governance/ttg_exchange_quote.rs` 同源 */

export type TtgExchangePayStable = "USDC";

export type TtgExchangeQuoteResponse = {
  status: "ok";
  schema_version: number;
  pair_type: "stablecoin_to_governance_token";
  pay_stable: TtgExchangePayStable;
  receive_symbol: "TTG";
  receive_token_role: "governance";
  pay_amount?: string | null;
  receive_amount: string | null;
  rate: string | null;
  rate_unit?: "USDC_per_TTG";
  reference_price_cny_per_ttg?: number;
  fdv_cny?: number;
  expires_at: string;
  escrow_settlement: {
    allowed_pay_stablecoins: TtgExchangePayStable[];
    default_pay_stable: TtgExchangePayStable;
    rule: string;
  };
  meta: {
    implementation_status: string;
    execute_path: string | null;
    valuation_anchor_id?: string;
    doc?: string;
    phase?: string;
  };
};
