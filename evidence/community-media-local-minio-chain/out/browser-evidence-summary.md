# PublishDrawer · MinIO browser evidence (local)

## ① Local browser chain (this run)

- **Next origin**: http://localhost:3012 (matches configured Next base http://localhost:3012; localhost/127.0.0.1 same port accepted).
- **API origin**: http://127.0.0.1:8080
- **Tourist session**: localStorage token length 40; user id 918b1ecf-1032-4067-a031-18c27c95ea60.
- **Feed shell**: data-tt-community-feed-page present; login-for-publish count 0.
- **Publish surface**: helper-openCommunityPublishDrawer.
- **Capabilities (page GET)**: public_video_publish_ready=true, max_video_seconds=180 (see browser-capabilities-from-page.json).
- **Multipart HTTP**: session / parts / PUT / complete / createPost — see browser-multipart-chain.log and browser.har.
- **Feed UI**: post body visible; `<video src>` length 150; **canplay** reached in-browser.
- **Artifacts**: browser.har, browser-console.log, browser-network-api.log, browser-multipart-chain.log, browser-create-post-response.json, screenshots.

## ② Testnet / ③ Production

Not covered by this script. Staging or production PSP, hosts, and matrix must be verified separately.
