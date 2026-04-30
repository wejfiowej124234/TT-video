# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=a4d11011-bbc7-4f8e-bf15-b6816e7b458a path=/api/v1/community/posts status=200
[req] x-message-id=a396b28a-01a6-4365-8430-5e11818f92ae path=/api/v1/community/posts status=200
[req] x-request-id=fb69dde8-049e-41d3-be23-5a9f3b077edb path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200
[req] x-message-id=b39d4bac-3df1-4e9e-9fff-26b3b4630a11 path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200
[req] x-request-id=c7eae781-9d1f-497f-8506-4768f802da49 path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200
[req] x-message-id=2bc0f1d6-adef-4e11-90dd-5c7bf2fa999a path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200
[req] x-request-id=bd105f4c-08b2-4c09-991e-c43afecadbe2 path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200
[req] x-message-id=8cce8adb-5075-43e1-8081-2abafd7f1e33 path=/api/v1/community/posts/fe8d24b3-07a9-4f71-a390-59a1eb373ae9/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
