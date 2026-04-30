# D-ITN-003

`cargo test -p traveltrust-api matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg` exit=0

```

running 1 test
test routes::f031_f032_f033_app_http_db_api_tests::matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.11s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=5b8176f7-5a58-4ca0-90c7-3a9627500266 path=/api/v1/itineraries/custom/drafts status=200
[req] x-message-id=f0f10a73-9cc0-4310-920c-f34bb420bc2d path=/api/v1/itineraries/custom/drafts status=200
[req] x-request-id=9450a6cf-c596-4859-b01e-06440229f95e path=/api/v1/itineraries/custom/drafts/0b29e8eb-245c-4c47-a4fb-1e2f6ad7bd7d status=200
[req] x-message-id=409a0be4-139d-43f4-a6dc-2b0b53e7dcd7 path=/api/v1/itineraries/custom/drafts/0b29e8eb-245c-4c47-a4fb-1e2f6ad7bd7d status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-033 · POST custom itinerary then draft POST+GET round-trip
