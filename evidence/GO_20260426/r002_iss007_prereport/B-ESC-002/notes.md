# B-ESC-002

`cargo test -p traveltrust-api matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.71s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=d49c289c-da6e-4d38-80f2-d2e7762037ac path=/auth/register status=200
[req] x-message-id=2afdead2-c741-4264-847a-44cf9d6cbffc path=/auth/register status=200
[req] x-request-id=f19d3c9a-ef32-45d2-b562-d996575bd146 path=/auth/register status=200
[req] x-message-id=ef324d2d-c96b-4a7d-af0d-4043e12d76da path=/auth/register status=200
[req] x-request-id=b4dfcc1a-8fd6-4e1f-ad11-d282aca4ae58 path=/api/v1/guides status=200
[req] x-message-id=753bd47f-70da-43d3-83c3-504e793aadfc path=/api/v1/guides status=200
[req] x-request-id=536ce179-a1ce-46ba-8495-86f6156f4b92 path=/api/v1/guides/321bbae2-e2c7-426c-a423-37894840597c/stake status=200
[req] x-message-id=57dae68a-e9d3-4d05-8e37-54058852172a path=/api/v1/guides/321bbae2-e2c7-426c-a423-37894840597c/stake status=200
[req] x-request-id=f1926a82-135c-43b7-bc99-e568df7b6a55 path=/api/v1/orders status=200
[req] x-message-id=19ceaeaa-a9da-40e5-b1dd-a697ebb9f2b4 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=0dcd1099-1853-49b8-bc39-1de2b3a183a0 order_id=9a76efd1-0d5a-4594-b0da-1dc130c04aad
[req] x-request-id=5a6457bd-2dd3-4cea-a16e-4f9cb2401e7d path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/accept status=200
[req] x-message-id=8c145e62-06a2-4e8f-942a-13a0008cabde path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/accept status=200
[req] x-request-id=06169ab6-eb8a-4b27-a0b8-a3fcb5f20ce3 path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/mock-pay status=200
[req] x-message-id=af83a2ff-c3ac-46c3-af4d-2da69336c4be path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/mock-pay status=200
[req] x-request-id=8b68288c-2498-45e2-8784-5f711dfe6cd2 path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad status=200
[req] x-message-id=4b03b5ca-a318-4911-be40-68a9886ce3c7 path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad status=200
[req] x-request-id=6a532ba9-aee5-4bef-a199-a6b0e269df17 path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/confirm-completion status=200
[req] x-message-id=a054cf33-9585-402d-8b8e-20c82db9d1fe path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad/confirm-completion status=200
[req] x-request-id=b5a460b7-9bbc-43f1-8465-8ff30ffd5fe9 path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad status=200
[req] x-message-id=e543288f-c1b0-441e-acfe-c6656f7ce5bf path=/api/v1/orders/9a76efd1-0d5a-4594-b0da-1dc130c04aad status=200

```
E2E: `frontend/e2e/f007-f010-f032-request.spec.ts` — F-010 · mock-pay then guide POST confirm-completion leaves order completed (GET confirms)
