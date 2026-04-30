# B-ESC-003

`cargo test -p traveltrust-api matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::review_submit_db_pool_idempotent_contract::matrix_93_b_esc_003c_f027_tourist_first_review_then_get_list_contains_comment_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=bdbbbbeb-c5b0-4663-9e18-e29492a3ce25 path=/api/v1/orders/8531e7ba-b0f1-42ce-97c2-49237fbdd597/reviews status=200
[req] x-message-id=ae40056b-1ade-46f8-a2e4-b1a64bd40feb path=/api/v1/orders/8531e7ba-b0f1-42ce-97c2-49237fbdd597/reviews status=200
[req] x-request-id=17999b6c-7289-4562-8933-6474a2751694 path=/api/v1/orders/8531e7ba-b0f1-42ce-97c2-49237fbdd597/reviews status=200
[req] x-message-id=d0825faf-da57-4e6c-b36a-ea3b061cad75 path=/api/v1/orders/8531e7ba-b0f1-42ce-97c2-49237fbdd597/reviews status=200

```
E2E: `frontend/e2e/f027-f028-f033-request.spec.ts` — F-027 · completed order POST review then GET lists comment
