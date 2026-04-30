# B-ESC-004

`cargo test -p traveltrust-api matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.07s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=787e2797-2388-434a-b235-619cc56b9ea1 path=/auth/register status=200
[req] x-message-id=ebd66635-e40e-4951-af2e-b4462df8828a path=/auth/register status=200
[req] x-request-id=7db66153-fd7e-401a-9b2c-3506486c46d7 path=/auth/register status=200
[req] x-message-id=72321f6d-7a18-4793-9a23-78a2c6689bde path=/auth/register status=200
[req] x-request-id=46878c6f-40fe-41c3-afde-86903f4728e3 path=/api/v1/guides status=200
[req] x-message-id=a44224cf-67fd-44e3-86b7-6d365ffd0ef3 path=/api/v1/guides status=200
[req] x-request-id=7730ad06-5c56-40b7-be03-a2ee15a977e2 path=/api/v1/guides/16098656-27bb-47e7-8d70-e96c0bcbc498/stake status=200
[req] x-message-id=007625ed-20c0-45bc-b112-09323484bf18 path=/api/v1/guides/16098656-27bb-47e7-8d70-e96c0bcbc498/stake status=200
[req] x-request-id=ed8a7d24-17a6-40d0-b4ab-9a92f04fa00a path=/api/v1/orders status=200
[req] x-message-id=e4ee3f36-4db7-48cc-8f17-493daaddc5aa path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=b3d20df4-25fb-4ddc-9067-94250f210d4c order_id=be298c75-a739-4132-8ffc-d7bf90d5e7ab
[req] x-request-id=85556d8d-c6f4-4490-b2ad-a70aa3f7cd93 path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/accept status=200
[req] x-message-id=6ff1e454-cd2f-46cf-a017-cbb1976bc793 path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/accept status=200
[req] x-request-id=a737ae57-91f0-49d4-ba51-a39008226ecb path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/mock-pay status=200
[req] x-message-id=d9b2f89a-12d6-4901-bf42-077cc98de084 path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/mock-pay status=200
[req] x-request-id=78c7a73b-04a3-4639-b4e2-5e8cef0b100c path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab status=200
[req] x-message-id=1eab5467-729e-46c7-ad47-dde605713b41 path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab status=200
[req] x-request-id=6444d17e-2e35-4c4a-be14-788a9c4daf8b path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/chain-sync-status status=200
[req] x-message-id=527c9eee-4d54-41ad-aa46-800ca5765dde path=/api/v1/orders/be298c75-a739-4132-8ffc-d7bf90d5e7ab/chain-sync-status status=200

```
E2E: `frontend/e2e/f029-f030-f031-request.spec.ts` — F-029 · mock-pay then GET order chain-sync-status shows escrowed last_event
