# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1208 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.26s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-273a4482d41a62c1.exe)
[req] x-request-id=58097eff-0eb4-427c-81ab-9185871efae1 path=/api/v1/community/posts status=200
[req] x-message-id=f008f84d-38ef-4efe-87e3-9f90c30f4072 path=/api/v1/community/posts status=200
[req] x-request-id=6e68ff00-1c90-4796-9621-4ed297007d38 path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200
[req] x-message-id=dc096659-07d1-4fd6-9f9c-1dfa21ebf967 path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200
[req] x-request-id=dfd619d0-04ed-4ee8-b3c7-748d3008b2b2 path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200
[req] x-message-id=fdf5a611-f7c1-4ec3-9c13-84a440fe79dc path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200
[req] x-request-id=f3445c3b-dcdc-4737-a5b5-9aef02f8c74f path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200
[req] x-message-id=1a032e3c-a509-4cb0-bb44-790faf0e2ab6 path=/api/v1/community/posts/6f2ac2cd-ad44-47b5-ba05-3176ff0a76aa/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
