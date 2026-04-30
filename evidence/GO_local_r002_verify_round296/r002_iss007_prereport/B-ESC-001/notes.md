# B-ESC-001

`cargo test -p traveltrust-api matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.10s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=85762833-8f7f-40a5-a374-a481f2066bde path=/auth/register status=200
[req] x-message-id=bbdf46a2-1a33-4627-b91a-5f0fc9d42e5b path=/auth/register status=200
[req] x-request-id=a47b0e06-6cfc-4e60-963e-4f690e0d4af6 path=/auth/register status=200
[req] x-message-id=6a81ee8a-b9e5-4330-abf7-814f65bfe959 path=/auth/register status=200
[req] x-request-id=42d82a23-2cc7-4ee0-aac4-2a53b6ce3870 path=/api/v1/guides status=200
[req] x-message-id=dfadd61f-711b-4c5a-9194-6727707d7470 path=/api/v1/guides status=200
[req] x-request-id=8aa498bb-5bb5-41fa-85f5-21b3535a0cb3 path=/api/v1/guides/80ceb94d-1c2f-4d09-aa31-799f242a3f5e/stake status=200
[req] x-message-id=d3178fff-09e3-46da-a7ca-9fb466cfb6c8 path=/api/v1/guides/80ceb94d-1c2f-4d09-aa31-799f242a3f5e/stake status=200
[req] x-request-id=22cfb6f2-ec95-4586-9699-2625ed940b54 path=/api/v1/orders status=200
[req] x-message-id=3c88ab4a-6fca-4e9f-9d24-77204abba530 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=eca42369-f07d-472c-b604-c6903d1420a0 order_id=612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e
[req] x-request-id=eb81e1c7-04ce-4e60-8d63-e926c4ff6edb path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e/accept status=200
[req] x-message-id=bffc96ff-a3dd-4637-aadf-0950a3129276 path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e/accept status=200
[req] x-request-id=7043db4f-6d81-480b-ae5c-68860a218f7a path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e/mock-pay status=200
[req] x-message-id=39d0f67b-9084-49f5-a48a-1e66115eeb0a path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e/mock-pay status=200
[req] x-request-id=39648fcd-0bbe-435c-b4b4-acdb7d7bae5c path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e status=200
[req] x-message-id=e848bf0a-c30f-4dd0-a79c-fc0a0a5e32fa path=/api/v1/orders/612b48a4-ed5c-4ef0-a6ca-8a5eb5289a9e status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · accept then mock-pay leaves order escrowed (GET confirms)
