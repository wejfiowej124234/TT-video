# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1150 filtered out; finished in 0.14s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-ada3897541b110f4.exe)
[req] x-request-id=db5e40c8-8c92-4638-9472-e4eb8f64951b path=/api/v1/community/posts status=200
[req] x-message-id=1a9de86c-5112-4d63-a360-c7f2a4a6e40d path=/api/v1/community/posts status=200
[req] x-request-id=8a799c3f-7cf2-4f1a-8867-d1140c464814 path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200
[req] x-message-id=1b4833ba-2721-497d-afa4-758992a2cde1 path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200
[req] x-request-id=f2c9eb3a-1921-446f-9261-472494704ef8 path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200
[req] x-message-id=ad2f0af2-7007-4141-b761-0103783e5437 path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200
[req] x-request-id=de466e7e-db5d-489d-bac2-398ba37f92e3 path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200
[req] x-message-id=da715c62-2ee6-4b03-bf2f-df40df8b8ced path=/api/v1/community/posts/8a3f18fa-2738-4a27-b339-5f5fa7db0b00/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
