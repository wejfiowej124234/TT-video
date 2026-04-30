# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=2ffddb2f-4d30-4cca-af80-16a238cd130f path=/api/v1/orders/cb927a12-19d4-4a17-ae73-7afca0e49bec/reviews status=200
[req] x-message-id=00e35e35-b58b-4d00-a8b4-62c9f102fb61 path=/api/v1/orders/cb927a12-19d4-4a17-ae73-7afca0e49bec/reviews status=200
[req] x-request-id=5173ad12-9b54-4006-a4d6-7e8b6ea9bcad path=/api/v1/orders/cb927a12-19d4-4a17-ae73-7afca0e49bec/reviews status=200
[req] x-message-id=0d059d1b-d873-43f1-b0d5-e1d75d45b4bb path=/api/v1/orders/cb927a12-19d4-4a17-ae73-7afca0e49bec/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
