# B-ORD-004

`cargo test -p traveltrust-api matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg` exit=0

```

running 1 test
test routes::orders::tests::orders_create_list_set_escrow_address_db_api_tests::matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 1.06s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=3701b25d-1b5d-4065-8178-9cbafb4d369e path=/auth/register status=200
[req] x-message-id=4c45e827-e40a-4d95-b69b-59a933570d65 path=/auth/register status=200
[req] x-request-id=8aa21ff7-9845-43c7-859c-cf9ca2f62cde path=/auth/register status=200
[req] x-message-id=338f6b04-2926-42e2-95f8-2824daaa67fb path=/auth/register status=200
[req] x-request-id=5a169976-bb29-4515-a9bd-35f075f5fe13 path=/api/v1/guides status=200
[req] x-message-id=3eaee1b3-54a2-42cd-94e9-9eb96c9e2750 path=/api/v1/guides status=200
[req] x-request-id=29d24559-03f2-4d5d-a81f-54ae802b5b98 path=/api/v1/guides/2542dbd2-19f1-43c4-ad04-341365bcfce1/stake status=200
[req] x-message-id=f8965a81-fdf7-4474-8c86-288b3de7c126 path=/api/v1/guides/2542dbd2-19f1-43c4-ad04-341365bcfce1/stake status=200
[req] x-request-id=044092e4-abef-48e8-8bf9-5cbbe4d1e73e path=/api/v1/orders status=200
[req] x-message-id=78e0d586-4ef8-440d-852c-632eac9e9076 path=/api/v1/orders status=200
audit_key_write op=patch_order_itinerary request_id=- user_id=82ebce11-63bb-496d-bc3f-8e9d8de4e771 order_id=4c8652ff-7b60-4397-8b6f-a4fac858cd58
[req] x-request-id=eed26749-2cbe-43af-97fe-924d540a36e6 path=/api/v1/orders/4c8652ff-7b60-4397-8b6f-a4fac858cd58/itinerary status=200
[req] x-message-id=c0f9dc4e-666c-4b1a-983c-19b58095237d path=/api/v1/orders/4c8652ff-7b60-4397-8b6f-a4fac858cd58/itinerary status=200
[req] x-request-id=ccd6f72a-327b-40a9-81bc-812d108e5719 path=/api/v1/orders/4c8652ff-7b60-4397-8b6f-a4fac858cd58 status=200
[req] x-message-id=1a305a33-570d-4142-bb82-4c0448afd5fa path=/api/v1/orders/4c8652ff-7b60-4397-8b6f-a4fac858cd58 status=200

```
E2E: `frontend/e2e/orders-b-domain-request.spec.ts` — F-008 · B-ORD-004 · PATCH …/orders/:id/itinerary then GET detail reflects
