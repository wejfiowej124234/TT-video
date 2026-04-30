# B-TRN-003

`cargo test -p traveltrust-api matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=ee4f54ae-87a6-45b6-936e-f687ced796bf path=/auth/register status=200
[req] x-message-id=ccd70083-8f32-49b4-80dc-1f077f869297 path=/auth/register status=200
[req] x-request-id=43ac15c5-8bcb-4d62-9a6b-4fd92c32c424 path=/auth/register status=200
[req] x-message-id=fa321aae-cb68-469d-adab-2113143b5a03 path=/auth/register status=200
[req] x-request-id=0bb56727-8337-4aab-b039-9cceb4beab32 path=/api/v1/guides status=200
[req] x-message-id=aacaf5b9-5d58-4b80-b54e-01feb5847c63 path=/api/v1/guides status=200
[req] x-request-id=cb38c4b8-64ce-43b9-8614-b033f96b55bc path=/api/v1/guides/78f1de94-73f6-40fc-a893-3dcb5d9bff75/stake status=200
[req] x-message-id=dd68d6fc-1b82-4339-abba-cee95c049684 path=/api/v1/guides/78f1de94-73f6-40fc-a893-3dcb5d9bff75/stake status=200
[req] x-request-id=b87da98f-0507-4f89-8178-98eaaf1ff842 path=/api/v1/orders status=200
[req] x-message-id=4af5289d-78e3-421c-9bf6-d5a5d2a4ab55 path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=5736e278-5f8b-415c-8945-6eb4bafa66fd order_id=a4a1bd18-2137-4610-8721-2697d5beabb8
[req] x-request-id=76de2adf-189b-4e16-845d-ea28a92e281f path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/accept status=200
[req] x-message-id=4e63f2d2-2372-4c26-8419-e157676655f9 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/accept status=200
[req] x-request-id=d8b3627b-6e27-4a46-936e-a5f00aad9d9f path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/mock-pay status=200
[req] x-message-id=ed7d7099-d3b2-45cf-af7a-ca7a8e151c09 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/mock-pay status=200
[req] x-request-id=ab958755-ed45-4212-ac69-ddc38290ca42 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8 status=200
[req] x-message-id=2c311dde-e252-4147-80e0-87534d2b91b4 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8 status=200
[req] x-request-id=016fc3dc-98b7-43d4-9dcd-2bce1570e590 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/dispute status=200
[req] x-message-id=b844564a-208f-40cf-9f83-60828b1edb86 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8/dispute status=200
[req] x-request-id=b1e702e6-fb39-47e2-bfd5-98d05cb5d8e3 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8 status=200
[req] x-message-id=e59475c3-ea51-4253-b99c-8a6577f59674 path=/api/v1/orders/a4a1bd18-2137-4610-8721-2697d5beabb8 status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · escrowed order open dispute then GET list and detail
