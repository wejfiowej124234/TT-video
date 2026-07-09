# publish-entry diagnostic checklist

- **page URL**: `http://localhost:3012/community`
- **page origin**: `http://localhost:3012` — **matches PLAYWRIGHT_BASE_URL origin (http://localhost:3012)**: yes
- **same origin as default API (http://127.0.0.1:8080)** (suspect wrong tab / API HTML): no
- **localStorage session token length**: 40
- **localStorage traveltrust_user_id**: 918b1ecf-1032-4067-a031-18c27c95ea60
- **window.__TT_PUBLIC_SKIP_ME_FETCH**: `(empty)`
- **document.documentElement.lang**: `zh-CN`
- **viewport (inner)**: 1280x720
- **data-tt-community-feed-page="1"** (main feed shell): count **1**
- **data-tt-community-login-for-publish="1"** (login-to-publish modal): count **0** (expect **0** when session is accepted as logged-in)
- **data-testid community-feed-publish-entry** (scoped under feed / global): **1** / **1**
- **data-testid community-feed-publish-fab**: count **0**

## counts

```json
{
  "feedPage": 1,
  "loginForPublish": 0,
  "publishEntryScoped": 1,
  "publishEntryGlobal": 1,
  "publishFab": 0
}
```

## layout probes (first matching selector in document)

```json
{
  "lang": "zh-CN",
  "viewport": {
    "w": 1280,
    "h": 720
  },
  "entry": {
    "present": true,
    "display": "flex",
    "visibility": "visible",
    "opacity": "1",
    "rect": {
      "w": 76,
      "h": 36,
      "top": 321,
      "left": 82
    }
  },
  "fab": {
    "present": false
  }
}
```

## responsive / layout (source-of-truth in repo)

- **`CommunityFeedMainPublishWideEntry`**: `className="… block w-full"` — **no** `hidden` / `md:` breakpoint that removes the wide row.
- **`CommunityFeedMainPageChrome` FAB**: fixed `bottom-24`; **not** `hidden md:flex` — FAB is intended at all widths.
- **ActionGateChecklist**: used in **PublishDrawer** footer only; it does not remove feed publish controls.
