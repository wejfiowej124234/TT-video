# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 1.03s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=fc54f7bc-20af-42e3-97a7-d463803a71d7 path=/auth/register status=200
[req] x-message-id=808ed043-8667-46f1-a66e-3c3d7f1b0daa path=/auth/register status=200
[req] x-request-id=c0bba4c8-1044-4e96-ad86-01c1135d4048 path=/auth/register status=200
[req] x-message-id=3399338f-ed1f-464d-8b6f-2f055de0eae7 path=/auth/register status=200
[req] x-request-id=6a82d462-6255-4a0d-abca-2989d90bdc1d path=/api/v1/guides status=200
[req] x-message-id=f0d4fd74-fdf2-4b3c-94b4-beb8ff148398 path=/api/v1/guides status=200
[req] x-request-id=e2f8f9cc-b97b-40d4-b430-049bc0bee3ba path=/api/v1/guides/b9985f7a-3225-46ba-bfac-00f8b6797083/stake status=200
[req] x-message-id=960c099a-a5b0-4c61-99e7-7ead602e5ba8 path=/api/v1/guides/b9985f7a-3225-46ba-bfac-00f8b6797083/stake status=200
[req] x-request-id=63919cb3-038f-4bc5-b114-20b64f1bd3d2 path=/api/v1/orders status=200
[req] x-message-id=55fc1388-00e2-43a5-b4dd-036f83bb9671 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=33e28930-0161-47bc-b808-c64476a0f06c order_id=0f064b99-4ce5-4c17-b6cc-bd64dddac957
[req] x-request-id=4fa062f6-10b2-44e7-a6fb-a6ca4825381f path=/api/v1/orders/0f064b99-4ce5-4c17-b6cc-bd64dddac957/itinerary status=200
[req] x-message-id=a5d3a4a2-6d03-4e30-84f6-fb5f6a40cc7e path=/api/v1/orders/0f064b99-4ce5-4c17-b6cc-bd64dddac957/itinerary status=200
[req] x-request-id=df79fff7-adf6-4ea3-a8cb-f667f2cba6ca path=/api/v1/orders/0f064b99-4ce5-4c17-b6cc-bd64dddac957 status=200
[req] x-message-id=a89b7e48-6cd8-4d7d-9a1d-c4d75709da75 path=/api/v1/orders/0f064b99-4ce5-4c17-b6cc-bd64dddac957 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
