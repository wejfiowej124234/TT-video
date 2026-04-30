# D-ITN-002

`cargo test -p traveltrust-api matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=c0a35131-1586-4f6e-8d14-baa41a62d65d path=/api/v1/itineraries/custom status=200
[req] x-message-id=d519f463-6d97-4f9e-8f1b-0660520bcb16 path=/api/v1/itineraries/custom status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
