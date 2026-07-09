# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.12s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=6320dfee-5961-4951-83f6-2a893f0990a3 path=/auth/register status=200
[req] x-message-id=490f9aeb-57c8-4929-a680-64954aeb36ef path=/auth/register status=200
[req] x-request-id=1cbafb23-d6ef-4a37-97b6-1fe4a9532e26 path=/auth/register status=200
[req] x-message-id=dc7974af-e9a0-470b-a824-1519bcaee00f path=/auth/register status=200
[req] x-request-id=a37c2469-ca3f-449e-a4e7-1bf299a030cc path=/api/v1/guides status=200
[req] x-message-id=dacf7622-bdb5-405d-9342-70d25f96b19f path=/api/v1/guides status=200
[req] x-request-id=b39d2941-953b-46fd-9a2c-5e4f6c540203 path=/api/v1/guides/5fd81ef5-773b-4cc6-83d1-0c090c1714a6/stake status=200
[req] x-message-id=43d6fb5c-2d4d-413b-9258-52e9d5e361ea path=/api/v1/guides/5fd81ef5-773b-4cc6-83d1-0c090c1714a6/stake status=200
[req] x-request-id=bdcc7db1-237b-4d82-baf3-baffddab6382 path=/api/v1/orders status=200
[req] x-message-id=ef8f1c6b-213c-487a-b631-390c526b5389 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=8e2a25ed-82fe-4fd4-9564-0188a54017b2 order_id=59717edc-deb9-4e09-b5e1-6a2b010a84e0
[req] x-request-id=2dd7ef12-b5b6-4b98-b5da-07073bd3a0e3 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/accept status=200
[req] x-message-id=72fe2ce9-688f-43da-9d22-72549fc431ad path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/accept status=200
[req] x-request-id=9699664d-ed17-4435-83cb-28fed74936d7 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/mock-pay status=200
[req] x-message-id=0e253b15-3676-4782-84a5-b3659ad0fccf path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/mock-pay status=200
[req] x-request-id=970743d3-34be-4c98-ae43-6c67bcfe60e9 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0 status=200
[req] x-message-id=25b430b0-7ad8-4d92-ae1a-53607bde04c4 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0 status=200
[req] x-request-id=fc377f8e-d148-46db-b9d2-25a03a62d464 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/confirm-completion status=200
[req] x-message-id=59fdacf9-f399-42f2-bb10-ba27c09bba6f path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0/confirm-completion status=200
[req] x-request-id=3b0f3d4e-c6d2-498e-b7de-ae3d52615594 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0 status=200
[req] x-message-id=917f594b-3918-4ee7-8d30-c3bcc416af21 path=/api/v1/orders/59717edc-deb9-4e09-b5e1-6a2b010a84e0 status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
