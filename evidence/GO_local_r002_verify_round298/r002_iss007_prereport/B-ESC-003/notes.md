# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=f124f0bc-4d24-4033-8b47-aa2a4d3fb932 path=/api/v1/orders/037e83a1-8c3e-4aa9-a013-45f4f2a59bbf/reviews status=200
[req] x-message-id=ec41ed8e-6792-4b9c-8542-b8d098ce5595 path=/api/v1/orders/037e83a1-8c3e-4aa9-a013-45f4f2a59bbf/reviews status=200
[req] x-request-id=f7208ca3-7b62-4ed7-9e99-2201894cbe44 path=/api/v1/orders/037e83a1-8c3e-4aa9-a013-45f4f2a59bbf/reviews status=200
[req] x-message-id=e905758f-908d-4dfe-8fa0-9d108d41c940 path=/api/v1/orders/037e83a1-8c3e-4aa9-a013-45f4f2a59bbf/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
