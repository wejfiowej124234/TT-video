# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.29s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=15ccd6a8-13d0-4b45-8ba1-6cdbe615c996 path=/api/v1/community/posts status=200
[req] x-message-id=fa6a2139-0ad6-4dd8-9607-366a6079c5db path=/api/v1/community/posts status=200
[req] x-request-id=3c33f9c9-7f3b-40ff-a390-396ed1737071 path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200
[req] x-message-id=b5549ff5-74be-4172-b4be-b699757720e0 path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200
[req] x-request-id=110bb629-8ebc-4002-9345-44e67b82e79b path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200
[req] x-message-id=a8e6073c-7590-4dd7-8c25-088ec12618e0 path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200
[req] x-request-id=0cc8cb82-a158-4433-a338-d71d6d515e05 path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200
[req] x-message-id=a14b5a9d-6254-4344-b85f-34d5b5a018af path=/api/v1/community/posts/d96d530e-78bb-470c-ba45-ccc3ffbe0b4e/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
