# D-ITN-002

`cargo test -p traveltrust-api matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.31s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=649fd0c1-d6f4-45b6-8db4-12704763503c path=/api/v1/itineraries/custom status=200
[req] x-message-id=609b4d93-9546-4ebf-80e0-af48f09f6054 path=/api/v1/itineraries/custom status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
