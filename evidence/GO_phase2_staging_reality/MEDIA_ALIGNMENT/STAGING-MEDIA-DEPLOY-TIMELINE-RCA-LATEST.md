# Staging Media Deploy Timeline RCA

**VERDICT:** `ROOT_CAUSE_CONFIRMED`  
**Batch:** `MEDIA_ALIGNMENT` (independent of Wallet L5)  
**Phase:** ② Staging Runtime（≠ ③ Production GO）

| Item | Value |
|------|-------|
| Root cause (data) | COS rebind 2026-07-17T10:24:40Z → absolute Tigris covers |
| Config debt | Tag 0bbc7adb next.config.js missing Tigris remotePatterns |
| Last good combo | v99 + pre-rebind `/api/v1/uploads/...` |
| First bad exposed | **v100** deployment-01KXR3V7G5GZM3Z9P2VDH9QJ4R |
| First good after fix | **v103** deployment-01KXR9VKWGRAKEZ12HT30QHANT |
| Not | Wallet L5 business code · PSG re-cert · Production GO |
