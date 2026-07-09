# G1 · R-003 宽矩阵 staging

- **release_gate:** GO
- **environment.name:** staging
- **api_base:** https://tt-api-staging.fly.dev
- **validate:** `python scripts/validate-regression-report.py evidence/GO_phase2_testnet_20260526/report.json --require-go` exit 0
- **seed:** Fly PG upsert Hangzhou `production` guides (market-showcase 0314 + pending→active fix); `TRAVELTRUST_AUTH_REGISTER_REQUIRE_CODE=0`
