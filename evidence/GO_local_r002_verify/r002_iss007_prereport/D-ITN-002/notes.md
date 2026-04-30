# D-ITN-002

`cargo test -p traveltrust-api matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=8c54f42b-3139-4a49-9373-efed76579e8e path=/api/v1/itineraries/custom status=200
[req] x-message-id=3cc4c10c-5110-46dd-a31b-ea94786129b0 path=/api/v1/itineraries/custom status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
