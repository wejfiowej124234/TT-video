# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=eade61c7-55ca-4a91-b77b-f64232409001 path=/api/v1/orders/1ac877dd-6e3a-493f-8172-440800acb34b/reviews status=200
[req] x-message-id=991a2c13-1105-49dd-bde3-13249b8ec6dc path=/api/v1/orders/1ac877dd-6e3a-493f-8172-440800acb34b/reviews status=200
[req] x-request-id=a294e3ed-4b86-480a-8059-e67002f4236b path=/api/v1/orders/1ac877dd-6e3a-493f-8172-440800acb34b/reviews status=200
[req] x-message-id=adf81161-f745-4d56-ac8e-de9c7bcc8395 path=/api/v1/orders/1ac877dd-6e3a-493f-8172-440800acb34b/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
