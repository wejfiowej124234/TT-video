# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=06859262-1fb0-4431-b38e-201f5d951ee1 path=/api/v1/orders/76894bf9-33c2-455c-8a6b-0a6d2ab4155b/reviews status=200
[req] x-message-id=939f3579-9033-491b-a066-ffac8a4f59d8 path=/api/v1/orders/76894bf9-33c2-455c-8a6b-0a6d2ab4155b/reviews status=200
[req] x-request-id=d67d1567-78f5-4b00-8a18-e5d9b2298bae path=/api/v1/orders/76894bf9-33c2-455c-8a6b-0a6d2ab4155b/reviews status=200
[req] x-message-id=370d34df-a2be-4377-8e99-953104d3bd58 path=/api/v1/orders/76894bf9-33c2-455c-8a6b-0a6d2ab4155b/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
