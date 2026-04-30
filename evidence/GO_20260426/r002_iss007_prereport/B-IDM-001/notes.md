# B-IDM-001

`cargo test -p traveltrust-api matrix_93_b_idm_001b_f028_trust_growth_ingest_duplicate_x_idempotency_key_identical_body_pg` exit=0

```

running 1 test
test idempotency_http_contract_tests::tests::matrix_93_b_idm_001b_f028_trust_growth_ingest_duplicate_x_idempotency_key_identical_body_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=affed79d-13b6-49b9-bb25-ce66a8d662ed path=/api/v1/trust-growth/ingest status=200
[req] x-message-id=1ee8171f-dd46-4d75-ad7d-91d39ce15b14 path=/api/v1/trust-growth/ingest status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-028 · B-IDM-001 · trust-growth ingest duplicate X-Idempotency-Key identical 200 body
