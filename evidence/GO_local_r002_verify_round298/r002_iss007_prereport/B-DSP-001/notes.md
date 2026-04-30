# B-DSP-001

`cargo test -p traveltrust-api matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_accept_mock_pay_itinerary_confirm_db_api_tests::matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.09s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=45e85cf3-2c7e-460f-8e99-5e8be2b50369 path=/auth/register status=200
[req] x-message-id=8eef31ff-7f85-4dab-82c6-52d1793573e2 path=/auth/register status=200
[req] x-request-id=0d25af1a-3ce8-4ea6-b1d7-dceab1534fe5 path=/auth/register status=200
[req] x-message-id=7ee38371-d469-4ec1-b2b0-506e48df78a9 path=/auth/register status=200
[req] x-request-id=0918e8f0-29f8-4d31-873f-74319b1a2ad6 path=/api/v1/guides status=200
[req] x-message-id=ef7bbc3b-f22f-43cf-8e0e-1bd6c74f446f path=/api/v1/guides status=200
[req] x-request-id=c3add172-6fae-4a6b-a37b-f1ec84e3aad2 path=/api/v1/guides/d9384c2d-31ce-426d-af00-d4f903b8836f/stake status=200
[req] x-message-id=c6425872-ae81-44cc-a5ac-91d8a11ee05e path=/api/v1/guides/d9384c2d-31ce-426d-af00-d4f903b8836f/stake status=200
[req] x-request-id=75b3726c-f2f2-4671-a5f8-5a53b9810d33 path=/api/v1/orders status=200
[req] x-message-id=84c841f0-14a2-42dc-a489-0682a7869c1d path=/api/v1/orders status=200
audit_key_write op=order_accept request_id=- user_id=4e8ce254-582d-4352-aea2-e9fc2a6a3b16 order_id=a8223222-9398-4db8-bfa0-19f05ae41e78
[req] x-request-id=7b023da8-8f78-4fc9-81c7-4239e62e5bbf path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/accept status=200
[req] x-message-id=a58fa865-5822-4076-9f15-20def5beed71 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/accept status=200
[req] x-request-id=100f92f4-7fe1-4ce2-99b9-366846e9ef47 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/mock-pay status=200
[req] x-message-id=72bdc1e9-2f71-4f02-9c10-d9d889580770 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/mock-pay status=200
[req] x-request-id=e59b36f6-26ab-42ef-af76-057c3835d633 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78 status=200
[req] x-message-id=10d92740-b26f-46f8-8909-5b2d2880cab1 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78 status=200
[req] x-request-id=93b6ae48-7b82-4a65-8a8f-e83265239f6d path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/dispute status=200
[req] x-message-id=aca26159-a19c-4d9e-bdf7-6a1938db7844 path=/api/v1/orders/a8223222-9398-4db8-bfa0-19f05ae41e78/dispute status=200
[req] x-request-id=95d72a2a-9c7b-4474-a9f7-72d2aeeb7221 path=/api/v1/disputes status=200
[req] x-message-id=9660ec3b-fabd-41ab-84c2-379fd56deb3d path=/api/v1/disputes status=200

```
E2E: `frontend/e2e/f024-f025-f026-request.spec.ts` — F-025 · B-DSP-001 · mock-pay→POST …/dispute→GET /disputes contains row (PG)
