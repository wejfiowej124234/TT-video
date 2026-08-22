# Official Product Reality Capture（官网产品现实固化）

**STATUS:** `IN_PROGRESS` · Capture deepen 2026-08-22 · see [Parity Closure](TT-OFFICIAL-FIRST-PARITY-CLOSURE-LATEST.md)  
**Gate stamp:** `OFFICIAL_PRODUCT_REALITY_CAPTURE` = **NOT_YET_PASS**（深度 PARTIAL 仍在；身份/Routes/Admin 已 CAPTURED）  
**Convergence:** [Official-First Full Convergence](TT-OFFICIAL-FIRST-FULL-CONVERGENCE-LATEST.md)  
**Deepen evidence:** [`CAPTURE_DEEPEN_20260822.json`](../../evidence/GO_official_product_reality_capture/CAPTURE_DEEPEN_20260822.json)  
**Plane:** PRODUCT / WEBSITE only — see [Dual Truth Planes](TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md)  
**`TT_PRODUCTION_GO`:** NO_GO  

> Phase 1 answers only: **“官网现在到底是什么？”**  
> Does **not** judge quality. Does **not** rebase Local. Does **not** edit Candidate Web3.

---

## Living pin (seed identity)

| Field | Value |
|-------|-------|
| Pin | TravelTrust Official · OPS-2026.08.20-v9 |
| Web | https://www.web3-ttg.com |
| `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` |
| `build_time` | `2026-08-20T00:51:57Z` |
| Fly image | `registry.fly.io/tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Session bootstrap | v8 |
| API (untouched by www freeze) | `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` |
| Pin SSOT | [TT-OFFICIAL-LIVING-PIN-INDEX-LATEST](TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md) |

---

## Capture layers

| Layer | Content | Status (this wave) |
|-------|---------|-------------------|
| Identity | git SHA / build time / image / digest / release-identity | **PARTIAL** — live `/api/release-identity` matches pin SHA + build_time |
| Routes | Formal product routes HTTP surface | **PARTIAL** — core routes sampled 200 |
| UI | Structure / layout / components | OPEN (needs systematic inventory) |
| API | Production API product behavior | **PARTIAL** — `/meta` build SHA recorded |
| CMS | Formal display data | OPEN |
| Assets | Images / video / CDN | OPEN |
| Auth | Login / session / permissions | OPEN (pin: Header login OWNER_CONFIRMED historically) |
| Admin | Backend real behavior | OPEN |
| Config | Runtime env / feature flags | OPEN |
| i18n | zh/en | OPEN |
| DB | schema / migrations reality | OPEN |
| Release | Registry /meta / release identity | **PARTIAL** |
| Web3 display | LIVE / TARGET / LEGACY labels only | OPEN — **not** Web3 SSOT |

Evidence dir: `evidence/GO_official_product_reality_capture/`

---

## 2026-08-22 observe (read-only)

| Probe | Result |
|-------|--------|
| `GET https://www.web3-ttg.com/api/release-identity` | `git_sha=3e356617…` · `build_time=2026-08-20T00:51:57Z` · `psg_release_version=MAINNET-OFFICIAL-LIVE-PARTIAL` · `attestation_status=ok` |
| Home HTML Next build id | `fnX9UySJrp_w3J4PTApv6` (matches Freeze JSON) |
| Fly response `server` date | `2026-08-20` |
| `GET https://api.web3-ttg.com/meta` | API `git_sha=8df2ab21…` · `deployed_at=2026-08-12T23:44:18Z` · profile `production` |
| Routes sampled | `/` … `/guides` `/me` → **200** · `/admin` → **307** (auth redirect AS-IS) |
| Fly `tt-web-prod` image | `hybrid-live-auth-pin-nontarget-v9-20260820` — **matches pin** |

**Identity match vs Living Pin:** YES (release-identity + Fly image).

---

## Forbidden until Capture PASS

- Local → Official “overwrite” thinking  
- Staging as product master  
- Fixing CMS/UI defects as the main track  
- Rebasing Local Web3 Candidate paths from Official Web3 copy (`WEB3_CANDIDATE_PROTECTED`)  
- Claiming `OFFICIAL_PRODUCT_REALITY_CAPTURE = PASS` without completing open layers above  

---

## Next modules (after Capture → PASS)

1. `M-OFFICIAL-vs-LOCAL`  
2. `M-LOCAL-REBASE` (protect Candidate)  
3. `M-OFFICIAL-vs-STAGING` → `M-STAGING-ALIGN` → `PRODUCT_PARITY_GATE`  
4. Then defect fixes  

**P0 interrupt:** Sepolia ETA Reality waiter.

Machine: [`evidence/GO_official_product_reality_capture/OFFICIAL_PRODUCT_REALITY_CAPTURE_STATUS.json`](../../evidence/GO_official_product_reality_capture/OFFICIAL_PRODUCT_REALITY_CAPTURE_STATUS.json)
