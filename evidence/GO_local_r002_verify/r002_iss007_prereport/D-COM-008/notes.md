# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.13s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=590f0513-1367-4e13-be9f-07cc4e37c464 path=/api/v1/community/posts status=200
[req] x-message-id=c7d24fb5-ee7c-41ca-91f8-dc7ac3061d6d path=/api/v1/community/posts status=200
[req] x-request-id=94b98a43-1e30-4b6d-8bea-59d08cd4036e path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200
[req] x-message-id=720d7489-4f87-4014-b078-553f677147c4 path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200
[req] x-request-id=bbb85741-2c22-4cf1-9610-94e25eac5d3a path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200
[req] x-message-id=8f0fc1f1-3e5c-4f9c-a562-0a10a9041e8f path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200
[req] x-request-id=02d5939f-6a49-425c-b698-2a9419a1cd97 path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200
[req] x-message-id=a0842578-8bdb-4145-9137-86d1a6f0efe8 path=/api/v1/community/posts/ec4d8944-4775-4801-ae49-e89f6088ff35/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
