# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=d1d674cf-7291-4263-bd5b-e71e0376175f path=/api/v1/orders/b7c1fca3-f002-4ab0-a0db-64ff3f2088bc/reviews status=200
[req] x-message-id=79b6976f-68bd-4ba2-8bef-bf367655238a path=/api/v1/orders/b7c1fca3-f002-4ab0-a0db-64ff3f2088bc/reviews status=200
[req] x-request-id=7c9bc0f3-3644-4727-9ece-e26695ded198 path=/api/v1/orders/b7c1fca3-f002-4ab0-a0db-64ff3f2088bc/reviews status=200
[req] x-message-id=0359dd23-aea1-4506-8328-245f684c2428 path=/api/v1/orders/b7c1fca3-f002-4ab0-a0db-64ff3f2088bc/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
