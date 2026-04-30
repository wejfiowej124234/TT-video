# D-COM-003

`cargo test -p traveltrust-api matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=3c07e04a-e7bf-45fd-b1ff-984dcb427c32 path=/api/v1/community/posts status=200
[req] x-message-id=b2d5f69c-5672-4556-ac27-b4ebd8f1366a path=/api/v1/community/posts status=200
[req] x-request-id=410bd332-170d-4b2e-9942-d34e20ec3faf path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200
[req] x-message-id=8f58040d-d286-4759-b867-1d63d152bae0 path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200
[req] x-request-id=2a777115-d287-4bd3-ae61-8df4076f1916 path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200
[req] x-message-id=a105ef6f-010d-40a0-930f-a70af8e21b78 path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200
[req] x-request-id=8a887abf-7b26-4923-8e9b-a59ccf2b1940 path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200
[req] x-message-id=0ad462ed-8149-49bc-a5e0-fa688040beeb path=/api/v1/community/posts/e85935be-95a8-4a71-985a-baa54f2274da/like status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-016 · DELETE like then GET liked_by_me false then POST like relike
