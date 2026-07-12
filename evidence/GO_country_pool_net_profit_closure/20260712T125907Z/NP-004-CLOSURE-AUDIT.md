# GAP-IDX-NP-004 · Country Pool Net Profit Closure Audit

**Verdict:** PASS
**Phase:** ① local

| Check | Pass | Detail |
|-------|------|--------|
| IDX-np-indexer-module | ✅ | D:\TravelTrust-V1.1\crates\api\src\chain\country_pool_net_profit_indexer.rs |
| DB-np-projection-module | ✅ | D:\TravelTrust-V1.1\crates\api\src\db\country_pool_net_profit.rs |
| DB-np-migration | ✅ | D:\TravelTrust-V1.1\crates\api\migrations\20260712100000_country_pool_net_profit_events.sql |
| API-governance-net-profit | ✅ | D:\TravelTrust-V1.1\crates\api\src\routes\governance\governance_net_profit_ledger.rs |
| API-admin-net-profit | ✅ | D:\TravelTrust-V1.1\crates\api\src\routes\admin\admin_net_profit_ledger_http.rs |
| FE-governance-net-profit-page | ✅ | D:\TravelTrust-V1.1\frontend\app\governance\net-profit-ledger\page.tsx |
| IDX-reconcile-topic0 | ✅ | reconcile.rs event_name_from_topic0 |
| IDX-tick-persist-hook | ✅ | indexer tick NP-004 hook |
| REG-decoder-yaml | ✅ | country-pool-net-profit-v1.yaml |
| TEST-np-indexer-unit | ✅ | cargo test country_pool_net_profit |

## Pipeline
- Contract Event
- Indexer
- Database
- API
- Frontend
- Accounting
- Audit
