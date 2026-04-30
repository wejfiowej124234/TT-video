# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.08s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=4a8bbb59-b62c-4d5a-8af8-086b446cb6e4 path=/auth/register status=200
[req] x-message-id=dcb1d7ce-9c37-4430-a497-02620d2b3ed1 path=/auth/register status=200
[req] x-request-id=dd527e39-e076-477a-a801-1744453ba96a path=/auth/register status=200
[req] x-message-id=5a2c53b1-6ef0-490d-81a9-c3b93151ec9e path=/auth/register status=200
[req] x-request-id=8fe82417-d20a-48a0-8681-01bac002bf66 path=/api/v1/guides status=200
[req] x-message-id=b62489d5-3979-44ab-b1ba-b38b800d2e68 path=/api/v1/guides status=200
[req] x-request-id=c11d00af-f274-4446-b1ac-b437f07aa141 path=/api/v1/guides/b6decf81-fbbc-4ab5-9d04-4b299444bd27/stake status=200
[req] x-message-id=f76c86b5-9ce3-459d-b243-8d810c38b044 path=/api/v1/guides/b6decf81-fbbc-4ab5-9d04-4b299444bd27/stake status=200
[req] x-request-id=0b617920-87c1-4914-930b-65dc641f7434 path=/api/v1/orders status=200
[req] x-message-id=87d95315-8132-4056-a422-d589f518955f path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=849c15f5-d08c-4f92-b46c-2bb23afe4c25 order_id=f153d09c-d1ff-44c8-a56a-3a4bbe3f0213
[req] x-request-id=385cf774-f935-48f4-ae3c-e3bdad643660 path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/accept status=200
[req] x-message-id=c1ffb9f5-70ab-45f9-94c2-8d7e086d8d4c path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/accept status=200
[req] x-request-id=a673084a-cd90-4079-90c3-42e0f4f7bd31 path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/mock-pay status=200
[req] x-message-id=c43c91f7-8c1e-4958-a1d5-8ccd09061c8b path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/mock-pay status=200
[req] x-request-id=686d2c3d-4250-43d4-adcd-1128b82bccd5 path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213 status=200
[req] x-message-id=c12d96d4-d17f-4e2c-80b1-007752f6ea99 path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213 status=200
[req] x-request-id=35e74857-dcb7-4fd1-8e7d-ba1232176d64 path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/confirm-completion status=200
[req] x-message-id=df2c97bf-7626-426b-b615-e441a277aa2c path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213/confirm-completion status=200
[req] x-request-id=53144612-4ca6-4f99-a620-7e01a149008c path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213 status=200
[req] x-message-id=12e59089-cfc5-49d7-8aef-2e797c4792be path=/api/v1/orders/f153d09c-d1ff-44c8-a56a-3a4bbe3f0213 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
