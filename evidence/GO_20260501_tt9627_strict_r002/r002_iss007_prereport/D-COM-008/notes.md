# D-COM-008

`cargo test -p traveltrust-api matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg` exit=0

```

running 1 test
test routes::community::community_feed_like_collect_db_api_tests::matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 1180 filtered out; finished in 0.15s


    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.30s
     Running unittests src\main.rs (target\debug\deps\traveltrust_api-21f06832b8f1b80b.exe)
[req] x-request-id=c23bcd66-9b30-4bc5-b718-6524cc7d4239 path=/api/v1/community/posts status=200
[req] x-message-id=2f3f1229-d765-4cb1-a5a2-0439152e384b path=/api/v1/community/posts status=200
[req] x-request-id=dad53251-2621-4588-873b-eac5ce44c948 path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200
[req] x-message-id=ebb24a64-f782-4321-9953-4868b58d670c path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200
[req] x-request-id=d07836c3-9a6f-4343-89a7-5b477a31731c path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200
[req] x-message-id=b5fbfa62-35bd-4cb2-92a4-4413729a06df path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200
[req] x-request-id=08f964cb-47d3-41dc-b1bb-cf215ac8aa65 path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200
[req] x-message-id=24f8f9d8-eb14-4a14-9502-8763d19b6562 path=/api/v1/community/posts/3c3b5cda-6abe-4e52-a2e9-d6b237f588b5/collect status=200

```
E2E: `frontend/e2e/f015-f016-f017-request.spec.ts` — F-017 · DELETE collect then GET collected_by_me false then POST collect recollect
