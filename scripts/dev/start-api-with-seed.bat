@echo off
chcp 65001 >nul
REM TravelTrust one-click local stack: stop old processes, Docker PG, ABI gates, API, frontend.
REM Run from repo root: scripts\start-api-with-seed.bat  - full env var list: scripts\dev\start-api-with-seed-README.md
REM Key env: RESET_DOCKER_DB=1  SKIP_ABI_GATE=1  TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1  TRAVELTRUST_MANUAL_ACCEPTANCE=1  TRAVELTRUST_CHAIN_ON=1  TRAVELTRUST_MARKET_CLEAN=1
REM DB: default keeps Postgres volume; API auto-migrates; Step 3d probes through 20260613120000 [CMS+Official OPS+Growth+Sprint168+guides P2+public_title+guide_exit_requests]
REM Storage: Step 3e MinIO :19000 persistent volume + merges COMMUNITY_MEDIA_S3_* into root .env when missing

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%"
setlocal EnableDelayedExpansion

if /i "%TRAVELTRUST_UI_HANDOFF%"=="1" call :tt_cfg_ui_handoff
if /i "%TRAVELTRUST_SITE_THEME_V1%"=="1" call :tt_cfg_site_theme_v1
if /i "%TRAVELTRUST_MARKET_CLEAN%"=="1" call :tt_cfg_market_clean
if /i "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" call :tt_cfg_manual_acceptance
if /i "%TRAVELTRUST_MANUAL_QA%"=="1" if /i not "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" set "TRAVELTRUST_OPEN_ADMIN=1"
if /i "%TRAVELTRUST_MANUAL_QA%"=="1" if /i not "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" call :tt_cfg_manual_qa
if /i "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" set "TRAVELTRUST_OPEN_ADMIN=1"
if /i "%TRAVELTRUST_OPEN_ADMIN%"=="1" call :tt_cfg_admin_walkthrough
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" echo     TRAVELTRUST_FRONTEND_ONLY=1 FE-only
goto :tt_cfg_profiles_done

:tt_cfg_ui_handoff
if not defined SKIP_ROUTES_GATE set "SKIP_ROUTES_GATE=1"
if not defined SKIP_AUTH_EMAIL_RESEND_GATE set "SKIP_AUTH_EMAIL_RESEND_GATE=1"
if not defined TRAVELTRUST_PREP_CLEAN set "TRAVELTRUST_PREP_CLEAN=1"
if not defined TRAVELTRUST_CLEAN_FRONTEND_NEXT set "TRAVELTRUST_CLEAN_FRONTEND_NEXT=1"
if not defined TRAVELTRUST_OPEN_TRAVELTRUST set "TRAVELTRUST_OPEN_TRAVELTRUST=1"
if not defined TRAVELTRUST_HOME_VITEST set "TRAVELTRUST_HOME_VITEST=1"
if not defined TRAVELTRUST_COMMUNITY_VITEST set "TRAVELTRUST_COMMUNITY_VITEST=1"
if not defined TRAVELTRUST_WAIT_FE_READY set "TRAVELTRUST_WAIT_FE_READY=1"
echo     TRAVELTRUST_UI_HANDOFF=1
exit /b 0

:tt_cfg_site_theme_v1
if not defined SKIP_ROUTES_GATE set "SKIP_ROUTES_GATE=1"
if not defined SKIP_AUTH_EMAIL_RESEND_GATE set "SKIP_AUTH_EMAIL_RESEND_GATE=1"
if not defined TRAVELTRUST_PREP_CLEAN set "TRAVELTRUST_PREP_CLEAN=1"
if not defined TRAVELTRUST_CLEAN_FRONTEND_NEXT set "TRAVELTRUST_CLEAN_FRONTEND_NEXT=1"
if not defined TRAVELTRUST_SITE_THEME_VITEST set "TRAVELTRUST_SITE_THEME_VITEST=1"
echo     TRAVELTRUST_SITE_THEME_V1=1
exit /b 0

:tt_cfg_admin_walkthrough
if not defined TRAVELTRUST_OPEN_BROWSER set "TRAVELTRUST_OPEN_BROWSER=1"
if not defined TRAVELTRUST_PREP_CLEAN set "TRAVELTRUST_PREP_CLEAN=1"
if not defined TRAVELTRUST_CLEAN_FRONTEND_NEXT set "TRAVELTRUST_CLEAN_FRONTEND_NEXT=1"
if not defined TRAVELTRUST_WAIT_FE_READY set "TRAVELTRUST_WAIT_FE_READY=1"
if not defined TRAVELTRUST_ADMIN_VITEST set "TRAVELTRUST_ADMIN_VITEST=1"
if not defined SKIP_ADMIN_CAPABILITIES_PROBE set "SKIP_ADMIN_CAPABILITIES_PROBE=0"
if not defined SKIP_ADMIN_ROUTES_GATE set "SKIP_ADMIN_ROUTES_GATE=0"
if not defined TRAVELTRUST_POST_START_ABI_CHECK set "TRAVELTRUST_POST_START_ABI_CHECK=1"
echo     TRAVELTRUST_OPEN_ADMIN=1 admin walkthrough profile clean-next + admin vitest + ABI smoke
exit /b 0

:tt_cfg_manual_acceptance
set "TRAVELTRUST_MANUAL_QA=1"
if not defined TRAVELTRUST_OPEN_BROWSER set "TRAVELTRUST_OPEN_BROWSER=1"
if not defined TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE set "TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE=1"
if not defined TRAVELTRUST_ADMIN_LOGIN_RETURN_URL set "TRAVELTRUST_ADMIN_LOGIN_RETURN_URL=/auth/login"
if not defined TRAVELTRUST_VERIFY_SEED_ACCOUNTS set "TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1"
if not defined TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET set "TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1"
if not defined TRAVELTRUST_POST_START_IDENTITY_P2_SMOKE set "TRAVELTRUST_POST_START_IDENTITY_P2_SMOKE=1"
if not defined TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE set "TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE=1"
if not defined TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST set "TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST=1"
echo     TRAVELTRUST_MANUAL_ACCEPTANCE=1 human review: API+ABI+DB+Admin+Identity P2+6o seed tx+6s publish vitest+6b5 seed verify
exit /b 0

:tt_cfg_manual_qa
if not defined TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE set "TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE=1"
if not defined TRAVELTRUST_ADMIN_LOGIN_RETURN_URL set "TRAVELTRUST_ADMIN_LOGIN_RETURN_URL=/admin/operator-guide"
echo     TRAVELTRUST_MANUAL_QA=1 full admin manual check CMS Growth Official + Step 6k smoke
exit /b 0

:tt_cfg_market_clean
if not defined SKIP_POST_START_WEB3_ITINERARY_SMOKE set "SKIP_POST_START_WEB3_ITINERARY_SMOKE=1"
if not defined SKIP_POST_START_ACQUISITION_PD009_SMOKE set "SKIP_POST_START_ACQUISITION_PD009_SMOKE=1"
if not defined SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE set "SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1"
if not defined SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE set "SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1"
if not defined SKIP_POST_START_IDENTITY_P2_SMOKE set "SKIP_POST_START_IDENTITY_P2_SMOKE=1"
if not defined SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE set "SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE=1"
if not defined SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE set "SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1"
if not defined TRAVELTRUST_MARKET_PUBLIC_SURFACE set "TRAVELTRUST_MARKET_PUBLIC_SURFACE=1"
if not defined TRAVELTRUST_PUBLIC_CATALOG_SURFACE set "TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1"
if not defined TRAVELTRUST_MARKET_PUBLIC_SHOWCASE set "TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1"
if not defined TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET set "TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1"
set "DID_RANK_SEED_MARKET_DEMO=0"
echo     TRAVELTRUST_MARKET_CLEAN=1 market UI walkthrough profile + guide@test.com in /market guides list
exit /b 0

:tt_cfg_profiles_done

if not defined TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET set "TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1"
if /i not "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    if not defined TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE set "TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE=1"
    if not defined TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE set "TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1"
    if not defined TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE set "TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE=1"
    if not defined TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE set "TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE=1"
    if not defined TRAVELTRUST_VERIFY_SEED_ACCOUNTS set "TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1"
)

if /i not "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    if not defined TRAVELTRUST_POST_START_ABI_CHECK set "TRAVELTRUST_POST_START_ABI_CHECK=1"
    if not defined TRAVELTRUST_ABI_SYNC_FROM_FORGE set "TRAVELTRUST_ABI_SYNC_FROM_FORGE=1"
    if not defined TRAVELTRUST_COMMUNITY_VITEST set "TRAVELTRUST_COMMUNITY_VITEST=1"
)
if /i "%TRAVELTRUST_POST_START_META_CHECK%"=="1" set "TRAVELTRUST_POST_START_ABI_CHECK=1"

echo ========== TravelTrust one-click: DB + API + frontend ==========
echo.

echo Step 0 - Preflight - Docker / Rust / Node / .env
if /i not "%SKIP_PREFLIGHT%"=="1" (
    if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\preflight-local-stack.ps1" -FrontendOnly
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\preflight-local-stack.ps1"
    )
    if errorlevel 1 (
        echo ERROR preflight failed
        pause
        exit /b 1
    )
) else (
    echo     skipped SKIP_PREFLIGHT=1
)

echo Step 0a - Resolve API / Next ports via resolve-dev-stack-ports.ps1
set "BACKEND_PORT="
set "FRONTEND_PORT="
for /f "tokens=1,2" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\resolve-dev-stack-ports.ps1"') do (
    set "BACKEND_PORT=%%a"
    set "FRONTEND_PORT=%%b"
)
if "!BACKEND_PORT!"=="" (
    echo ERROR: could not resolve API port - check .env PORT / API_PORT / FRONTEND_PORT
    pause
    exit /b 1
)
if "!FRONTEND_PORT!"=="" (
    echo ERROR: could not resolve frontend port
    pause
    exit /b 1
)
echo     ports: API=!BACKEND_PORT!  Next=!FRONTEND_PORT!

echo Step 0b - Optional clean before build - TRAVELTRUST_PREP_CLEAN / TRAVELTRUST_CLEAN_TURBO
if /i "%TRAVELTRUST_PREP_CLEAN%"=="1" (
    echo     TRAVELTRUST_PREP_CLEAN=1:frontend\npm run clean ...
    pushd "%ROOT%\frontend"
    if errorlevel 1 (
        echo ERROR: cannot enter frontend directory
        pause
        exit /b 1
    )
    call npm run clean
    if errorlevel 1 (
        echo ERROR: npm run clean failed
        popd
        pause
        exit /b 1
    )
    popd
    if not defined TRAVELTRUST_CLEAN_FRONTEND_NEXT set "TRAVELTRUST_CLEAN_FRONTEND_NEXT=1"
)
if /i "%TRAVELTRUST_CLEAN_TURBO%"=="1" (
    if exist "%ROOT%\frontend\.turbo" (
        echo     TRAVELTRUST_CLEAN_TURBO=1: remove frontend\.turbo
        rmdir /s /q "%ROOT%\frontend\.turbo"
    )
)

if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" goto :tt_fe_only_stack

echo Step 1 - SQLx migration prefix check
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-sqlx-migration-prefixes.ps1"
if errorlevel 1 (
    echo ERROR: SQLx migration prefix check failed - fix duplicate prefixes in crates\api\migrations
    pause
    exit /b 1
)

echo Step 1b - ABI align + gate 55-S13 [protocol ABIs + forge verify + align-api-abi-local.ps1]
if /i "%SKIP_ABI_GATE%"=="1" (
    echo     SKIP SKIP_ABI_GATE=1 [local UI stack; run forge build + scripts\sync-abi-from-forge.ps1 for ABI refresh]
) else (
    if /i "%TRAVELTRUST_ABI_SYNC_FROM_FORGE%"=="1" (
        echo     TRAVELTRUST_ABI_SYNC_FROM_FORGE=1: auto forge export if RegionStewardStakePool / CountryPoolSubVaultsV0 / CountryPoolRedemptionEpochV0 missing or verify-abi-forge drift
    )
    if /i "%TRAVELTRUST_ABI_AUTO_ALIGN%"=="0" (
        echo     TRAVELTRUST_ABI_AUTO_ALIGN=0: 55-S13 check-only, no auto align write
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\align-api-abi-local.ps1" -CheckOnly
    ) else (
        echo Step 1b0 - align-api-abi-local: contracts/abi -^> frontend/dapp/abis + 55-S13 gate
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\align-api-abi-local.ps1"
    )
    if errorlevel 1 (
        if /i "%TRAVELTRUST_ABI_SYNC_FROM_FORGE%"=="1" (
            echo Step 1b-retry - 55-S13 failed, forge sync + align-api-abi-local -FromForge ...
            powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\align-api-abi-local.ps1" -FromForge
        )
        if errorlevel 1 (
            echo FAIL: 55-S13 gate failed; set TRAVELTRUST_ABI_SYNC_FROM_FORGE=1 or run forge build + scripts\sync-abi-from-forge.ps1
            pause
            exit /b 1
        )
    )
)

echo Step 1b2 - Optional forge ABI multiset verify TRAVELTRUST_ABI_FORGE_VERIFY=1 requires Foundry
if /i "%TRAVELTRUST_ABI_FORGE_VERIFY%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-verify-abi-forge.ps1"
    if errorlevel 1 (
        echo FAIL: run-verify-abi-forge failed - install Foundry or unset TRAVELTRUST_ABI_FORGE_VERIFY
        pause
        exit /b 1
    )
) else (
    echo     set TRAVELTRUST_ABI_FORGE_VERIFY=1 to run forge multiset verify [same as start_dev.sh]
)

echo Step 1b3 - page-brief API contract cargo test page_brief_doc_version ia_version=v6
if /i "%SKIP_PAGE_BRIEF_GATE%"=="1" (
    echo     SKIP SKIP_PAGE_BRIEF_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-page-brief-api-gate.ps1"
    if errorlevel 1 (
        echo FAIL: page-brief API gate - sync crates/api/routes/traveltrust_page.rs with frontend/lib/traveltrustPageBrief.ts
        pause
        exit /b 1
    )
)

echo Step 1b4 - frontend wallet-verify routes api.ts vs api/routes.ts steward register step 2
if /i "%SKIP_WALLET_VERIFY_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_WALLET_VERIFY_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-wallet-verify.ps1"
    if errorlevel 1 (
        echo FAIL: lib/api.ts missing meWalletVerify* paths - see frontend/lib/api/routes.ts SSOT
        pause
        exit /b 1
    )
)

echo Step 1b5 - frontend web3 itinerary routes api.ts vs api/routes.ts escrow draft SSOT
if /i "%SKIP_WEB3_ITINERARY_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_WEB3_ITINERARY_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-web3-itinerary.ps1"
    if errorlevel 1 (
        echo FAIL: lib/api.ts vs api/routes.ts web3 itinerary paths - see orderPatchGuide guideAvailability orderConfirmFinalPlan
        pause
        exit /b 1
    )
)

echo Step 1b6 - frontend steward/redemption/governance routes.ts Protocol Convergence P2 SSOT
if /i "%SKIP_STEWARD_PROTOCOL_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_STEWARD_PROTOCOL_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-steward-protocol.ps1"
    if errorlevel 1 (
        echo FAIL: frontend/lib/api/routes.ts missing steward/redemption/state-machines/page-brief paths
        pause
        exit /b 1
    )
)

echo Step 1b7 - frontend community + profile-avatar routes SSOT
if /i "%SKIP_COMMUNITY_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_COMMUNITY_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-community.ps1"
    if errorlevel 1 (
        echo FAIL: frontend api.ts routesCommunity.ts community/profile-avatar paths
        pause
        exit /b 1
    )
)

echo Step 1b8 - frontend me/sessions + security-notifications routes SSOT
if /i "%SKIP_ME_SECURITY_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_ME_SECURITY_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-me-security.ps1"
    if errorlevel 1 (
        echo FAIL: frontend lib/api.ts routes.ts missing meSessions or security-notifications paths
        pause
        exit /b 1
    )
)

echo Step 1b9 - frontend Phase15 identity routes me/wallets + me/role-applications SSOT
if /i "%SKIP_PHASE15_IDENTITY_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_PHASE15_IDENTITY_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-phase15-identity.ps1"
    if errorlevel 1 (
        echo FAIL: frontend lib/api.ts routes.ts missing meWallets or meRoleApplications paths
        pause
        exit /b 1
    )
)

echo Step 1ba - frontend admin console routes api.ts vs routesAdmin* onboarding + capabilities Next proxy + Admin shell
if /i "%SKIP_ADMIN_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_ADMIN_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-admin.ps1"
    if errorlevel 1 (
        echo FAIL: frontend admin routes misaligned - see routesAdminCore routesAdminCommunityPolicies AdminCapabilitiesShell
        pause
        exit /b 1
    )
)

echo Step 1bb - frontend Identity Center P2 profile routes api.ts vs routes.ts SSOT
if /i "%SKIP_IDENTITY_P2_ROUTES_GATE%"=="1" (
    echo     SKIP SKIP_IDENTITY_P2_ROUTES_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\check-frontend-api-routes-identity-p2.ps1"
    if errorlevel 1 (
        echo FAIL: frontend Identity P2 routes misaligned - meGuideProfile meMerchantProfile meRegionStewardProfile meAcquisitionProfile
        pause
        exit /b 1
    )
)

echo Step 1c - HTTP routes gate run-check-04-routes needs Python
if /i "%SKIP_ROUTES_GATE%"=="1" (
    echo     SKIP_ROUTES_GATE=1
) else (
    if /i "%TRAVELTRUST_STRICT_ROUTES_GATE%"=="1" (
        set "STRICT_WARNINGS=1"
        echo     TRAVELTRUST_STRICT_ROUTES_GATE=1 strict 04 routes
    ) else (
        set "STRICT_WARNINGS=0"
        echo     local stack: 04 unlisted routes WARN only not blocking
    )
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-check-04-routes.ps1"
    if errorlevel 1 (
        echo ERROR run-check-04-routes failed - fix routes or set SKIP_ROUTES_GATE=1
        pause
        exit /b 1
    )
)

echo Step 1d - Resend email gate check-auth-email-resend-gate.ps1 [SKIP_AUTH_EMAIL_RESEND_GATE=1 to skip]
if /i "%SKIP_AUTH_EMAIL_RESEND_GATE%"=="1" (
    echo     SKIP SKIP_AUTH_EMAIL_RESEND_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\gates\check-auth-email-resend-gate.ps1"
    if errorlevel 1 (
        echo FAIL: check-auth-email-resend-gate - set TRAVELTRUST_RESEND_* in .env or SKIP_AUTH_EMAIL_RESEND_GATE=1
        pause
        exit /b 1
    )
)

echo Step 2 - Stop old API / frontend on ports !BACKEND_PORT!/!FRONTEND_PORT! traveltrust-api.exe + cargo run -p traveltrust-api
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\stop-api-thorough.ps1" -ApiPort !BACKEND_PORT! -AlsoFrontend -FrontendPort !FRONTEND_PORT!
if errorlevel 1 (
    echo FAIL: stop-api-thorough - close TravelTrust-API cmd window and retry
    pause
    exit /b 1
)
ping -n 3 127.0.0.1 >nul

echo Step 3 - Docker engine + Postgres ensure-docker-stack.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-docker-daemon.ps1"
if errorlevel 1 (
    echo ERROR: Docker engine not ready - start Docker Desktop manually or wait for autostart
    pause
    exit /b 1
)
if /i "%RESET_DOCKER_DB%"=="1" (
    echo     RESET_DOCKER_DB=1: docker compose down -v then up
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-docker-stack.ps1" -ResetVolumes
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-docker-stack.ps1"
)
if errorlevel 1 (
    echo ERROR: ensure-docker-stack failed - check docker-compose.yml port 5432
    pause
    exit /b 1
)
echo     Default DATABASE_URL from .env or .env.example: postgres://traveltrust:traveltrust@localhost:5432/traveltrust
echo     If API fails to bind 127.0.0.1, check cargo/.env DATABASE_URL matches Docker Postgres
echo     API runs sqlx migrate on startup when configured
ping -n 3 127.0.0.1 >nul

echo Step 3b - Wait for Postgres ready [docker exec pg_isready]
if /i "%SKIP_WAIT_POSTGRES%"=="1" (
    echo     SKIP SKIP_WAIT_POSTGRES=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\wait-for-postgres.ps1"
    if errorlevel 1 (
        echo FAIL: Postgres not ready - check Docker and container traveltrust-postgres
        pause
        exit /b 1
    )
)

echo Step 3d - Ensure API SQLx migrations align DATABASE_URL schema [through 20260613120000 CMS Official OPS Growth Sprint168 guides P2 guide_exit_requests]
if /i "%SKIP_ENSURE_DB_MIGRATIONS%"=="1" (
    echo     SKIP SKIP_ENSURE_DB_MIGRATIONS=1
) else if /i "%TRAVELTRUST_ENSURE_DB_MIGRATIONS_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-api-db-migrations.ps1" -WarnOnly
    if errorlevel 1 (
        echo WARN: ensure-api-db-migrations failed - continuing
    )
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-api-db-migrations.ps1"
    if errorlevel 1 (
        echo ERROR: ensure-api-db-migrations failed - try RESET_DOCKER_DB=1 or SKIP_ENSURE_DB_MIGRATIONS=1
        pause
        exit /b 1
    )
)

echo Step 3e - Ensure community media MinIO :19000 [persistent volume + bucket + merge COMMUNITY_MEDIA_S3_* into root .env]
if /i "%SKIP_ENSURE_COMMUNITY_MINIO%"=="1" (
    echo     SKIP SKIP_ENSURE_COMMUNITY_MINIO=1
) else if /i "%TRAVELTRUST_ENSURE_COMMUNITY_MINIO_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-community-media-minio.ps1" -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\ensure-community-media-minio.ps1"
    if errorlevel 1 (
        echo ERROR: ensure-community-media-minio failed - docker start traveltrust-community-minio-evidence or set TRAVELTRUST_ENSURE_COMMUNITY_MINIO_WARN=1
        pause
        exit /b 1
    )
)

echo Step 3b4 - Unified Anvil align [FundStack + TTG + env supersede + bytecode verify + frontend sync]
set "ANVIL_ALIGN_RAN=0"
set "ANVIL_ALIGN_AUTO=0"
if /i not "%SKIP_ANVIL_ALIGN%"=="1" (
    if /i "%TRAVELTRUST_ANVIL_ALIGN%"=="1" set "ANVIL_ALIGN_AUTO=1"
    if /i not "%ANVIL_ALIGN_AUTO%"=="1" (
        findstr /C:"BEGIN TT FUNDSTACK ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
        if not errorlevel 1 set "ANVIL_ALIGN_AUTO=1"
    )
    if /i not "%ANVIL_ALIGN_AUTO%"=="1" (
        findstr /C:"BEGIN TT ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
        if not errorlevel 1 set "ANVIL_ALIGN_AUTO=1"
    )
    if /i "%TRAVELTRUST_FUNDSTACK_ANVIL%"=="1" set "ANVIL_ALIGN_AUTO=1"
    if /i "%TRAVELTRUST_TTG_ANVIL%"=="1" set "ANVIL_ALIGN_AUTO=1"
)
if /i "%SKIP_ANVIL_ALIGN%"=="1" (
    echo     SKIP SKIP_ANVIL_ALIGN=1
) else if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else if /i not "%ANVIL_ALIGN_AUTO%"=="1" (
    echo     SKIP no Anvil align profile [run: bash scripts/dev/align-anvil-local-stack.sh or set TRAVELTRUST_ANVIL_ALIGN=1]
) else (
    set "GIT_BASH_OK=0"
    if defined GIT_BASH if exist "%GIT_BASH%" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if "%GIT_BASH_OK%"=="0" (
        echo     WARN: Git Bash not found - skip Step 3b4 align; falling back to Step 3b5/3c
    ) else (
        where forge >nul 2>&1
        if errorlevel 1 (
            echo     WARN: forge not on PATH - skip Step 3b4 align; falling back to Step 3b5/3c
        ) else (
            powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\align-anvil-local-stack.ps1"
            if errorlevel 1 (
                echo     WARN: align-anvil-local-stack failed - falling back to Step 3b5/3c
            ) else (
                set "ANVIL_ALIGN_RAN=1"
                set "TRAVELTRUST_FUNDSTACK_ANVIL=1"
                set "TRAVELTRUST_TTG_ANVIL=1"
                echo     OK Step 3b4 align-anvil-local-stack [3b5/3b6 partial skip]
            )
        )
    )
)

echo Step 3b5 - Local FundStack Anvil deploy [GuideIdentityStaking + Registry + USDC]
if /i "%ANVIL_ALIGN_RAN%"=="1" (
    echo     SKIP done by Step 3b4 align-anvil-local-stack
    goto :tt_after_fundstack_anvil
)
set "FUNDSTACK_ANVIL_AUTO=0"
if /i not "%SKIP_FUNDSTACK_ANVIL%"=="1" (
    if /i not "%TRAVELTRUST_FUNDSTACK_ANVIL%"=="1" (
        findstr /C:"BEGIN TT FUNDSTACK ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
        if not errorlevel 1 (
            echo     AUTO: root .env has TT FUNDSTACK block - enabling Step 3b5 Guide staking contracts
            set "TRAVELTRUST_FUNDSTACK_ANVIL=1"
            set "FUNDSTACK_ANVIL_AUTO=1"
        )
    )
)
if /i not "%TRAVELTRUST_FUNDSTACK_ANVIL%"=="1" (
    echo     SKIP TRAVELTRUST_FUNDSTACK_ANVIL not 1 and no TT FUNDSTACK block - Guide /staking may show no contract
) else if /i "%SKIP_FUNDSTACK_ANVIL%"=="1" (
    echo     SKIP SKIP_FUNDSTACK_ANVIL=1
) else if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP TRAVELTRUST_FRONTEND_ONLY=1
) else (
    set "GIT_BASH_OK=0"
    if defined GIT_BASH if exist "%GIT_BASH%" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if "%GIT_BASH_OK%"=="0" (
        if /i "%FUNDSTACK_ANVIL_AUTO%"=="1" (
            echo     WARN: Git Bash not found - skip auto Step 3b5; Guide staking may 503 until FundStack deploy
            goto :tt_after_fundstack_anvil
        )
        echo ERROR: TRAVELTRUST_FUNDSTACK_ANVIL=1 needs Git for Windows bash.exe or set SKIP_FUNDSTACK_ANVIL=1
        pause
        exit /b 1
    )
    where forge >nul 2>&1
    if errorlevel 1 (
        if /i "%FUNDSTACK_ANVIL_AUTO%"=="1" (
            echo     WARN: forge not on PATH - skip auto Step 3b5
            goto :tt_after_fundstack_anvil
        )
        echo ERROR: TRAVELTRUST_FUNDSTACK_ANVIL=1 needs Foundry forge on PATH
        pause
        exit /b 1
    )
    set "SKIP_ANVIL_STOP=1"
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\deploy-fundstack-anvil-local.ps1" -Apply
    if errorlevel 1 (
        if /i "%FUNDSTACK_ANVIL_AUTO%"=="1" (
            echo     WARN: auto Step 3b5 FundStack deploy failed - continuing
            goto :tt_after_fundstack_anvil
        )
        echo FAIL: deploy-fundstack-anvil-local - see scripts\dev\deploy-fundstack-anvil-local.sh
        pause
        exit /b 1
    )
)
:tt_after_fundstack_anvil

echo Step 3c - Local TTG Anvil deploy TRAVELTRUST_TTG_ANVIL
if /i "%ANVIL_ALIGN_RAN%"=="1" (
    echo     SKIP done by Step 3b4 align-anvil-local-stack
    goto :tt_after_ttg_anvil
)
set "TTG_ANVIL_AUTO=0"
if /i not "%SKIP_TTG_ANVIL%"=="1" (
    if /i not "%TRAVELTRUST_TTG_ANVIL%"=="1" (
        findstr /C:"BEGIN TT ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
        if not errorlevel 1 (
            echo     AUTO: root .env has TT ANVIL block - enabling Step 3c ensure Anvil :8545 + stake pool for post-start stake-status ABI
            set "TRAVELTRUST_TTG_ANVIL=1"
            set "TTG_ANVIL_AUTO=1"
        ) else (
            findstr /C:"BEGIN TT FUNDSTACK ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
            if not errorlevel 1 (
                echo     AUTO: root .env has TT FUNDSTACK block - enabling Step 3c TTG + RegionSteward pool
                set "TRAVELTRUST_TTG_ANVIL=1"
                set "TTG_ANVIL_AUTO=1"
            )
        )
    )
)
if /i not "%TRAVELTRUST_TTG_ANVIL%"=="1" (
    echo     SKIP TRAVELTRUST_TTG_ANVIL not 1 and no TT ANVIL block in .env - see scripts\dev\TTG-ANVIL-LOCAL-README.md
) else if /i "%SKIP_TTG_ANVIL%"=="1" (
    echo     SKIP SKIP_TTG_ANVIL=1
) else if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP TRAVELTRUST_FRONTEND_ONLY=1
) else (
    set "GIT_BASH_OK=0"
    if defined GIT_BASH if exist "%GIT_BASH%" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if "%GIT_BASH_OK%"=="0" (
        if /i "%TTG_ANVIL_AUTO%"=="1" (
            echo     WARN: Git Bash not found - skip auto Step 3c; post-start stake-status may 503 until Anvil deploy
            goto :tt_after_ttg_anvil
        )
        echo ERROR: TRAVELTRUST_TTG_ANVIL=1 needs Git for Windows bash.exe or set GIT_BASH or SKIP_TTG_ANVIL=1
        pause
        exit /b 1
    )
    where forge >nul 2>&1
    if errorlevel 1 (
        if /i "%TTG_ANVIL_AUTO%"=="1" (
            echo     WARN: forge not on PATH - skip auto Step 3c; see scripts\dev\TTG-ANVIL-LOCAL-README.md
            goto :tt_after_ttg_anvil
        )
        echo ERROR: TRAVELTRUST_TTG_ANVIL=1 needs Foundry forge on PATH
        pause
        exit /b 1
    )
    set "SKIP_ANVIL_STOP=1"
    if /i "%TRAVELTRUST_FUNDSTACK_ANVIL%"=="1" set "TTG_ANVIL_FORCE_DEPLOY=1"
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\deploy-ttg-anvil-local.ps1" -Apply
    if errorlevel 1 (
        if /i "%TTG_ANVIL_AUTO%"=="1" (
            echo     WARN: auto Step 3c deploy failed - continuing; ensure Anvil :8545 or set SKIP_TTG_ANVIL=1
            goto :tt_after_ttg_anvil
        )
        echo FAIL: deploy-ttg-anvil-local - see scripts\dev\TTG-ANVIL-LOCAL-README.md
        pause
        exit /b 1
    )
)
:tt_after_ttg_anvil

REM Auto chain-on when ¢Ù Anvil managed blocks present (unless user explicitly set TRAVELTRUST_CHAIN_ON=0)
if /i not "%TRAVELTRUST_CHAIN_ON%"=="0" (
    if /i not "%TRAVELTRUST_CHAIN_ON%"=="1" (
        findstr /C:"BEGIN TT FUNDSTACK ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
        if not errorlevel 1 set "TRAVELTRUST_CHAIN_ON=1"
        if /i not "%TRAVELTRUST_CHAIN_ON%"=="1" (
            findstr /C:"BEGIN TT ANVIL LOCAL" "%ROOT%\.env" >nul 2>&1
            if not errorlevel 1 set "TRAVELTRUST_CHAIN_ON=1"
        )
        if /i "%TRAVELTRUST_CHAIN_ON%"=="1" (
            echo     AUTO: TRAVELTRUST_CHAIN_ON=1 [Anvil managed blocks in .env; API uses P3_CHAIN_OFF from block]
        )
    )
)

echo Step 3b6 - FundStack USDC mint + guide DB stake align [Anvil local chain-on]
if /i "%ANVIL_ALIGN_RAN%"=="1" (
    echo     SKIP done by Step 3b4 align-anvil-local-stack
    goto :tt_after_fundstack_mint_align
)
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else if /i "%SKIP_FUNDSTACK_ANVIL%"=="1" (
    echo     SKIP SKIP_FUNDSTACK_ANVIL=1
) else if /i not "%TRAVELTRUST_FUNDSTACK_ANVIL%"=="1" if /i not "%TRAVELTRUST_TTG_ANVIL%"=="1" if /i not "%TRAVELTRUST_CHAIN_ON%"=="1" (
    echo     SKIP no Anvil/FundStack auto profile
) else (
    set "GIT_BASH_OK=0"
    if defined GIT_BASH if exist "%GIT_BASH%" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "GIT_BASH_OK=1"
    if "%GIT_BASH_OK%"=="1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\mint-fundstack-anvil-usdc.ps1"
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-align-guide-stake-db-to-chain-local.ps1"
    ) else (
        echo     WARN: Git Bash missing - skip Step 3b6 USDC mint / guide stake DB align
    )
)
:tt_after_fundstack_mint_align

echo Step 3g - Prune seed tourist cancelled orders from PG before API hydrate [tourist@test.com]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else if /i "%SKIP_PRUNE_TOURIST_SEED_ORDERS_DB%"=="1" (
    echo     SKIP SKIP_PRUNE_TOURIST_SEED_ORDERS_DB=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-prune-tourist-seed-orders-db.ps1" -WarnOnly
)

echo Step 3f - Clear f0e0b101 hangzhou guide slot DB rows before API hydrate [GD/P06 public catalog]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else if /i "%SKIP_CLEAR_HANGZHOU_GUIDE_SLOTS%"=="1" (
    echo     SKIP SKIP_CLEAR_HANGZHOU_GUIDE_SLOTS=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-clear-hangzhou-seed-guide-slots-db.ps1"
    if errorlevel 1 (
        echo     WARN: clear-hangzhou-seed-guide-slots-db failed - GD/P06 calendar may show stale occupied slots
    )
)

echo Step 4 - cargo build API [always rebuild unless SKIP_API_BUILD=1]
if /i "%TRAVELTRUST_API_CLEAN_BUILD%"=="1" (
    echo     TRAVELTRUST_API_CLEAN_BUILD=1: cargo clean -p traveltrust-api
    cargo clean -p traveltrust-api
    if errorlevel 1 (
        echo WARN: cargo clean failed - continuing build
    )
)
if "%SKIP_API_BUILD%"=="1" (
    echo     WARN SKIP_API_BUILD=1 - stale traveltrust-api.exe may miss latest API gates
    echo     SKIP SKIP_API_BUILD=1
) else (
    cargo build -p traveltrust-api
    if errorlevel 1 (
        echo ERROR: cargo build -p traveltrust-api failed
        pause
        exit /b 1
    )
)

if /i "%TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE%"=="1" (
    if /i not "%SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE%"=="1" (
        echo Step 4b - GD-L5 clear f0e0b101 accepted/escrowed DB rows before API hydrate
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-clear-hangzhou-seed-guide-slots-db.ps1"
        if errorlevel 1 (
            echo FAIL: clear-hangzhou-seed-guide-slots-db - see scripts/dev/clear-hangzhou-seed-guide-slots-db.sh
            pause
            exit /b 1
        )
    )
)

echo Step 5 - Start API !BACKEND_PORT! PORT=!BACKEND_PORT! SEED_TEST_ACCOUNTS=1 DATABASE_URL + P3_CHAIN_OFF align local PG/ABI
echo     Hint: local admin uses tourist@test.com super_admin + SuperAdmin console role after Step 6b bootstrap
echo     Hint: TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1 when unset for permissions center local dev
echo     Hint: Step 3e merges COMMUNITY_MEDIA_S3_* into root .env when missing; restart API after first MinIO setup
echo     Hint: community/me profile-avatar local disk: TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1 when unset [F-007 / start-api-for-playwright]
echo     Hint: chain-on / Sepolia E2E set TRAVELTRUST_CHAIN_ON=1 before start [keeps root .env P3_CHAIN_OFF=0]
echo     Hint: auth/logout needs rebuild after API code change - do not use SKIP_API_BUILD=1 until Step 4 built
echo     Port !BACKEND_PORT! must match traveltrust-api.exe; rebuild after API auth/logout changes
echo     Hint: local register/smokes default TRAVELTRUST_EMAIL_TRANSPORT=log + TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1 when unset
echo     Hint: CORS_ORIGINS defaults to localhost:!FRONTEND_PORT! when unset [Next dev + cookie session]
set "TT_API_CHAIN_OFF_ENV="
set "TT_CORS_ENV="
if not defined CORS_ORIGINS (
    set "TT_CORS_ENV=set CORS_ORIGINS=http://127.0.0.1:!FRONTEND_PORT!,http://localhost:!FRONTEND_PORT! ^&^&"
)
set "TT_CATALOG_ENV=set TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 ^&^& set TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=!TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET! ^&^& set TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1 ^&^& set TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1 ^&^&"
if /i "%TRAVELTRUST_CHAIN_ON%"=="1" (
    echo     TRAVELTRUST_CHAIN_ON=1: P3_CHAIN_OFF from root .env [dotenv; Anvil block ok; catalog filter forced on]
    echo     TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=!TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET! [guide@test.com in GET /guides for normal market UI]
    set "TT_API_CHAIN_OFF_ENV=!TT_CATALOG_ENV!"
) else (
    echo     Local chain-off: force P3_CHAIN_OFF=1 + TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 [overrides .env TT ANVIL P3_CHAIN_OFF=0]
    echo     TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=!TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET! [guide@test.com visible in /market?view=guides for tourist hand test]
    set "TT_API_CHAIN_OFF_ENV=set P3_CHAIN_OFF=1 ^&^& !TT_CATALOG_ENV!"
)
if /i not "%TRAVELTRUST_STRICT_API_RATE_LIMIT%"=="1" (
    echo     WARN: API rate limit disabled locally [0]; set TRAVELTRUST_STRICT_API_RATE_LIMIT=1 for production-like limits
)
REM Escape nested && in cmd /k start chain for API window
if /i "%TRAVELTRUST_STRICT_API_RATE_LIMIT%"=="1" (
    start "TravelTrust-API" cmd /k cd /d "%ROOT%" ^&^& if not defined DATABASE_URL set "DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust" ^&^& set "PORT=!BACKEND_PORT!" ^&^& set "SEED_TEST_ACCOUNTS=1" ^&^& if not defined TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT set "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1" ^&^& if not defined DID_RANK_SEED_MARKET_DEMO set "DID_RANK_SEED_MARKET_DEMO=1" ^&^& if not defined TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR set "TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1" ^&^& if not defined TRAVELTRUST_EMAIL_TRANSPORT set "TRAVELTRUST_EMAIL_TRANSPORT=log" ^&^& if not defined TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE set "TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1" ^&^& !TT_CORS_ENV! !TT_API_CHAIN_OFF_ENV! cargo run -p traveltrust-api
) else (
    start "TravelTrust-API" cmd /k cd /d "%ROOT%" ^&^& if not defined DATABASE_URL set "DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust" ^&^& set "PORT=!BACKEND_PORT!" ^&^& set "SEED_TEST_ACCOUNTS=1" ^&^& if not defined TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT set "TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1" ^&^& if not defined DID_RANK_SEED_MARKET_DEMO set "DID_RANK_SEED_MARKET_DEMO=1" ^&^& if not defined TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR set "TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1" ^&^& if not defined TRAVELTRUST_EMAIL_TRANSPORT set "TRAVELTRUST_EMAIL_TRANSPORT=log" ^&^& if not defined TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE set "TRAVELTRUST_AUTH_REGISTER_DEV_CODE_IN_RESPONSE=1" ^&^& !TT_CORS_ENV! !TT_API_CHAIN_OFF_ENV! if not defined API_RATE_LIMIT_PER_MINUTE set "API_RATE_LIMIT_PER_MINUTE=0" ^&^& if not defined CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE set "CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE=0" ^&^& cargo run -p traveltrust-api
)

echo Step 6 - Wait for API /health
if /i "%SKIP_API_WAIT%"=="1" (
    echo     SKIP SKIP_API_WAIT=1 - verify manually: curl http://127.0.0.1:!BACKEND_PORT!/health
    ping -n 5 127.0.0.1 >nul
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\wait-for-api.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo WARN: wait-for-api timed out - check TravelTrust-API window and DATABASE_URL
    )
)

echo Step 6b - POST /auth/seed-test-accounts + promote + bootstrap SuperAdmin console [local admin login]
if /i "%SKIP_POST_SEED_TEST_ACCOUNTS%"=="1" (
    echo     SKIP SKIP_POST_SEED_TEST_ACCOUNTS=1
) else (
    set "POST_SEED_URL=http://127.0.0.1:!BACKEND_PORT!/auth/seed-test-accounts"
    where curl >nul 2>&1
    if not errorlevel 1 (
        curl -sS -o nul -w "     HTTP %%{http_code} POST /auth/seed-test-accounts seed\n" -X POST "!POST_SEED_URL!" -H "Content-Type: application/json" -d "{}" --connect-timeout 10 --max-time 30
        curl -sS -o nul -w "     HTTP %%{http_code} POST /auth/seed-test-accounts promote_admin\n" -X POST "!POST_SEED_URL!" -H "Content-Type: application/json" -d "{\"promote_admin_email\":\"tourist@test.com\"}" --connect-timeout 10 --max-time 30
        if errorlevel 1 (
            echo     WARN: curl seed failed - API still seeds on boot with SEED_TEST_ACCOUNTS=1; retry POST !POST_SEED_URL!
        )
    ) else (
        echo     curl not found - using PowerShell Invoke-WebRequest
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $u=$env:POST_SEED_URL; $r=Invoke-WebRequest -Uri $u -Method Post -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 30; Write-Host ('     HTTP '+[int]$r.StatusCode+' POST /auth/seed-test-accounts seed') } catch { Write-Host ('     WARN: POST seed failed - '+$_.Exception.Message+' - check API window') }; try { $u=$env:POST_SEED_URL; $r=Invoke-WebRequest -Uri $u -Method Post -ContentType 'application/json' -Body '{\"promote_admin_email\":\"tourist@test.com\"}' -UseBasicParsing -TimeoutSec 30; Write-Host ('     HTTP '+[int]$r.StatusCode+' POST /auth/seed-test-accounts promote_admin') } catch { Write-Host ('     WARN: POST promote_admin failed - '+$_.Exception.Message) }"
    )
    set "POST_SEED_URL="
    echo     Step 6b2 - bootstrap super_admin + admin_console_roles SuperAdmin + 2FA policy off
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\bootstrap-local-admin-console.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo     WARN: bootstrap-local-admin-console failed - check Docker PG and Step 3d migrations
    )
    if /i not "%SKIP_ADMIN_CAPABILITIES_PROBE%"=="1" (
        set "TRAVELTRUST_API_BASE=http://127.0.0.1:!BACKEND_PORT!"
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-check-admin-capabilities-route.ps1" -WarnOnly
        set "TRAVELTRUST_API_BASE="
    )
)

echo Step 6b5 - Verify seed login tourist+guide+merchant+provider-did-rank-demo+multi-demo + Hangzhou guides [VERIFY_SEED_ACCOUNTS default on full stack]
if /i "%SKIP_VERIFY_SEED_ACCOUNTS%"=="1" (
    echo     SKIP SKIP_VERIFY_SEED_ACCOUNTS=1
) else if /i not "%TRAVELTRUST_VERIFY_SEED_ACCOUNTS%"=="1" if /i not "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" (
    echo     SKIP set TRAVELTRUST_MANUAL_ACCEPTANCE=1 or TRAVELTRUST_VERIFY_SEED_ACCOUNTS=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\verify-seed-test-accounts-login.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        if /i "%TRAVELTRUST_VERIFY_SEED_ACCOUNTS_STRICT%"=="1" (
            echo FAIL: verify-seed-test-accounts-login - check Step 6b seed and DATABASE_URL hydrate
            pause
            exit /b 1
        ) else (
            echo     WARN: seed login verify failed - retry POST /auth/seed-test-accounts or RESET_DOCKER_DB=1
        )
    )
)

echo Step 6b3 - tourist@test.com order cleanup [draft le 3 in_progress le 2 + PG prune cancelled]
if /i "%SKIP_ENSURE_TOURIST_DRAFT_HEADROOM%"=="1" (
    echo     SKIP SKIP_ENSURE_TOURIST_DRAFT_HEADROOM=1
) else if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-ensure-tourist-itinerary-draft-headroom.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        if /i "%TRAVELTRUST_ENSURE_TOURIST_DRAFT_HEADROOM_STRICT%"=="1" (
            echo FAIL: ensure-tourist-itinerary-draft-headroom - draft cap 20 may block POST /itineraries
            echo     Manual: http://localhost:!FRONTEND_PORT!/orders?state=draft  or restart TravelTrust-API after cargo build
            pause
            exit /b 1
        ) else (
            echo     WARN: draft headroom cleanup incomplete - open /orders?state=draft or re-run start-api-with-seed after API rebuild
        )
    )
)

echo Step 6b4 - GD/P06 public catalog trust-gate seed [POST /auth/seed-trust-gate-e2e + GET /guides/f0e0b101]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
) else if /i "%SKIP_BOOTSTRAP_GD_P06_PUBLIC_CATALOG%"=="1" (
    echo     SKIP SKIP_BOOTSTRAP_GD_P06_PUBLIC_CATALOG=1
) else if /i "%TRAVELTRUST_BOOTSTRAP_GD_P06_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-bootstrap-gd-p06-public-catalog-local.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-bootstrap-gd-p06-public-catalog-local.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: bootstrap-gd-p06-public-catalog - see scripts/dev/bootstrap-gd-p06-public-catalog-local.sh
        pause
        exit /b 1
    )
)

echo Step 6c - Post-start API ABI smoke meta728+807 chain.contracts12 page-brief-v6 steward/redemption guide-exit merchant-listings publish-summary admin CMS-Growth-Official
if /i "%SKIP_POST_START_ABI_CHECK%"=="1" (
    echo     SKIP SKIP_POST_START_ABI_CHECK=1
) else if /i not "%TRAVELTRUST_POST_START_ABI_CHECK%"=="1" (
    echo     SKIP TRAVELTRUST_POST_START_ABI_CHECK=0
) else (
    set "TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=!TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET!"
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\post-start-api-abi-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: post-start-api-abi-smoke meta728 page-brief v6 steward/redemption admin/capabilities totp rbac admin home queues CMS-Growth-Official-x16 public-catalog or wallet verify challenge
        pause
        exit /b 1
    )
)

echo Step 6k - Admin CMS Growth Official OPS smoke [TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE=1 or TRAVELTRUST_OPEN_ADMIN=1 or TRAVELTRUST_MANUAL_QA=1]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_admin_ops_smoke
)
if /i "%SKIP_POST_START_ADMIN_OPS_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_ADMIN_OPS_SMOKE=1
    goto :tt_after_admin_ops_smoke
)
if /i not "%TRAVELTRUST_POST_START_ADMIN_OPS_SMOKE%"=="1" if /i not "%TRAVELTRUST_OPEN_ADMIN%"=="1" if /i not "%TRAVELTRUST_MANUAL_QA%"=="1" (
    echo     SKIP set TRAVELTRUST_OPEN_ADMIN=1 or TRAVELTRUST_MANUAL_QA=1 for Step 6k
    goto :tt_after_admin_ops_smoke
)
if /i "%TRAVELTRUST_POST_START_ADMIN_OPS_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-admin-cms-growth-official-smoke.ps1" -Port !BACKEND_PORT! -FrontendPort !FRONTEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-admin-cms-growth-official-smoke.ps1" -Port !BACKEND_PORT! -FrontendPort !FRONTEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-admin-cms-growth-official-p0-local - see scripts/dev/smoke-admin-cms-growth-official-p0-local.sh
        pause
        exit /b 1
    )
)
:tt_after_admin_ops_smoke

echo Step 6i - Community media API+DB align smoke primary_media_asset_id feed/recommend PG schema MinIO optional
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_community_media_smoke
)
if /i "%SKIP_POST_START_COMMUNITY_MEDIA_ALIGN_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_COMMUNITY_MEDIA_ALIGN_SMOKE=1
    goto :tt_after_community_media_smoke
)
if /i "%TRAVELTRUST_POST_START_COMMUNITY_MEDIA_ALIGN_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-community-media-align-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-community-media-align-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: community media align smoke - feed primary_media_asset_id or PG schema
        pause
        exit /b 1
    )
)
:tt_after_community_media_smoke

echo Step 6g - Market hub public read smoke discover/orders + guides vertical-slice-03
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_market_smoke
)
if /i "%SKIP_POST_START_MARKET_HUB_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_MARKET_HUB_SMOKE=1
    goto :tt_after_market_smoke
)
if /i "%TRAVELTRUST_POST_START_MARKET_HUB_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-market-hub-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-market-hub-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: vertical-slice-03-market-hub-public-smoke - see scripts/gates/vertical-slice-03-market-hub-public-smoke.sh
        pause
        exit /b 1
    )
)
:tt_after_market_smoke

echo Step 6h - Acquisition PD-009 API smoke publish-bond listing mock-pay GET /me trust
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_acquisition_smoke
)
if /i "%SKIP_POST_START_ACQUISITION_PD009_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_ACQUISITION_PD009_SMOKE=1
    goto :tt_after_acquisition_smoke
)
if /i "%TRAVELTRUST_POST_START_ACQUISITION_PD009_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-acquisition-pd009-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-acquisition-pd009-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-acquisition-pd009-local - see scripts/dev/smoke-acquisition-pd009-local.sh
        pause
        exit /b 1
    )
)
:tt_after_acquisition_smoke

echo Step 6n - Identity Center P2 settings API smoke [guide merchant steward acquisition profile GET/PATCH]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_identity_p2_smoke
)
if /i "%SKIP_POST_START_IDENTITY_P2_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_IDENTITY_P2_SMOKE=1
    goto :tt_after_identity_p2_smoke
)
if /i "%TRAVELTRUST_POST_START_IDENTITY_P2_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-identity-p2-settings-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-identity-p2-settings-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-identity-p2-settings-local - see scripts/dev/smoke-identity-p2-settings-local.sh
        pause
        exit /b 1
    )
)
:tt_after_identity_p2_smoke

echo Step 6o - Chain B seed tourist+guide full transaction smoke [TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE=1 or MANUAL_ACCEPTANCE]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_seed_transaction_smoke
)
if /i "%SKIP_POST_START_SEED_TRANSACTION_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_SEED_TRANSACTION_SMOKE=1
    goto :tt_after_seed_transaction_smoke
)
if /i not "%TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE%"=="1" if /i not "%TRAVELTRUST_MANUAL_ACCEPTANCE%"=="1" (
    echo     SKIP set TRAVELTRUST_MANUAL_ACCEPTANCE=1 or TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE=1
    goto :tt_after_seed_transaction_smoke
)
if /i "%TRAVELTRUST_POST_START_SEED_TRANSACTION_SMOKE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-seed-transaction-smoke.ps1" -Port !BACKEND_PORT! -FrontendPort !FRONTEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-seed-transaction-smoke.ps1" -Port !BACKEND_PORT! -FrontendPort !FRONTEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-seed-tourist-guide-transaction-local - see scripts/dev/smoke-seed-tourist-guide-transaction-local.sh
        pause
        exit /b 1
    )
)
:tt_after_seed_transaction_smoke

echo Step 6p - L3 multi-identity closure smoke multi-demo four-track [TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE=1 default]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_l3_multi_identity_smoke
)
if /i "%SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_L3_MULTI_IDENTITY_SMOKE=1
    goto :tt_after_l3_multi_identity_smoke
)
if /i not "%TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE%"=="1" (
    echo     SKIP TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_SMOKE=0
    goto :tt_after_l3_multi_identity_smoke
)
if /i "%TRAVELTRUST_POST_START_L3_MULTI_IDENTITY_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-l3-multi-identity-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-l3-multi-identity-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-multi-identity-closure-local - see scripts/dev/smoke-multi-identity-closure-local.sh
        pause
        exit /b 1
    )
)
:tt_after_l3_multi_identity_smoke

echo Step 6q - GWB-L5 guide workbench vitest+API guide-exit-status [TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1 default]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_guide_workbench_smoke
)
if /i "%SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_GUIDE_WORKBENCH_L5_SMOKE=1
    goto :tt_after_guide_workbench_smoke
)
if /i not "%TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE%"=="1" (
    echo     SKIP TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE=0
    goto :tt_after_guide_workbench_smoke
)
if /i "%TRAVELTRUST_POST_START_GUIDE_WORKBENCH_L5_SMOKE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-guide-workbench-l5-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-guide-workbench-l5-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-guide-workbench-l5-local - see scripts/dev/smoke-guide-workbench-l5-local.sh
        pause
        exit /b 1
    )
)
:tt_after_guide_workbench_smoke

echo Step 6r - PWB-L5 provider workbench vitest+API merchant-listings [TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE=1 default]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_provider_workbench_smoke
)
if /i "%SKIP_POST_START_PROVIDER_WORKBENCH_L5_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_PROVIDER_WORKBENCH_L5_SMOKE=1
    goto :tt_after_provider_workbench_smoke
)
if /i not "%TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE%"=="1" (
    echo     SKIP TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE=0
    goto :tt_after_provider_workbench_smoke
)
if /i "%TRAVELTRUST_POST_START_PROVIDER_WORKBENCH_L5_SMOKE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-provider-workbench-l5-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-provider-workbench-l5-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-provider-workbench-l5-local - see scripts/dev/smoke-provider-workbench-l5-local.sh
        pause
        exit /b 1
    )
)
:tt_after_provider_workbench_smoke

echo Step 6s - Publish Hub L5 seed+API+vitest multi-demo [TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE=1 default]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_publish_hub_smoke
)
if /i "%SKIP_POST_START_PUBLISH_HUB_L5_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_PUBLISH_HUB_L5_SMOKE=1
    goto :tt_after_publish_hub_smoke
)
if /i not "%TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE%"=="1" (
    echo     SKIP TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE=0
    goto :tt_after_publish_hub_smoke
)
if /i "%TRAVELTRUST_POST_START_PUBLISH_HUB_L5_SMOKE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-publish-hub-l5-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-publish-hub-l5-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-publish-hub-post-start-local - see scripts/dev/smoke-publish-hub-post-start-local.sh
        pause
        exit /b 1
    )
)
:tt_after_publish_hub_smoke

echo Step 6l - GD-L5 guide detail booking smoke tourist@test.com [TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1 to enable]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_guide_detail_booking_smoke
)
if /i not "%TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE%"=="1" (
    echo     SKIP set TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1 for smoke-guide-detail-booking-local
    goto :tt_after_guide_detail_booking_smoke
)
if /i "%SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1
    goto :tt_after_guide_detail_booking_smoke
)
if /i "%TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-guide-detail-booking-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-guide-detail-booking-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-guide-detail-booking-local - see scripts/dev/smoke-guide-detail-booking-local.sh
        pause
        exit /b 1
    )
)
:tt_after_guide_detail_booking_smoke

echo Step 6m - itinerary-date-as-source busy-guide API smoke [TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1 to enable]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_itinerary_date_as_source_smoke
)
if /i not "%TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE%"=="1" (
    echo     SKIP set TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1 for smoke-itinerary-date-as-source-busy-guide-local
    goto :tt_after_itinerary_date_as_source_smoke
)
if /i "%SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1
    goto :tt_after_itinerary_date_as_source_smoke
)
if /i "%TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-itinerary-date-as-source-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-itinerary-date-as-source-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-itinerary-date-as-source-busy-guide-local - see scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh
        pause
        exit /b 1
    )
)
:tt_after_itinerary_date_as_source_smoke

echo Step 6j - Phase15 identity demo smoke provider+steward+guide [TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1 to enable]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_phase15_smoke
)
if /i not "%TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE%"=="1" (
    echo     SKIP set TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1 for smoke-phase15-identity-demo-local
    goto :tt_after_phase15_smoke
)
if /i "%SKIP_POST_START_PHASE15_IDENTITY_SMOKE%"=="1" (
    echo     SKIP SKIP_POST_START_PHASE15_IDENTITY_SMOKE=1
    goto :tt_after_phase15_smoke
)
if /i "%TRAVELTRUST_POST_START_PHASE15_IDENTITY_WARN%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-phase15-identity-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-phase15-identity-smoke.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo FAIL: smoke-phase15-identity-demo-local - see scripts/dev/smoke-phase15-identity-demo-local.sh
        pause
        exit /b 1
    )
)
:tt_after_phase15_smoke

echo Step 6f - Web3 itinerary post-start API smoke [6d escrow bind+reassign + 6e landing no-guide]
if /i "%TRAVELTRUST_FRONTEND_ONLY%"=="1" (
    echo     SKIP FE-only TRAVELTRUST_FRONTEND_ONLY=1
    goto :tt_after_web3_smoke
)
set "TT_RUN_ESCROW=1"
set "TT_RUN_LANDING=1"
if /i "%SKIP_POST_START_ESCROW_BIND_SMOKE%"=="1" set "TT_RUN_ESCROW=0"
if /i "%SKIP_POST_START_LANDING_ITINERARY_SMOKE%"=="1" set "TT_RUN_LANDING=0"
if /i "%SKIP_POST_START_WEB3_ITINERARY_SMOKE%"=="1" (
    echo     SKIP_POST_START_WEB3_ITINERARY_SMOKE=1
    goto :tt_after_web3_smoke
)
if "!TT_RUN_ESCROW!"=="0" if "!TT_RUN_LANDING!"=="0" (
    echo     SKIP both escrow bind and landing itinerary smokes
    goto :tt_after_web3_smoke
)
set "TT_WEB3_WARN=0"
if /i "%TRAVELTRUST_POST_START_WEB3_ITINERARY_WARN%"=="1" set "TT_WEB3_WARN=1"
if /i "%TRAVELTRUST_POST_START_ESCROW_BIND_WARN%"=="1" set "TT_WEB3_WARN=1"
if /i "%TRAVELTRUST_POST_START_LANDING_ITINERARY_WARN%"=="1" set "TT_WEB3_WARN=1"
if "!TT_RUN_ESCROW!"=="1" if "!TT_RUN_LANDING!"=="1" (
    if "!TT_WEB3_WARN!"=="1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-web3-itinerary-full-chain-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-web3-itinerary-full-chain-smoke.ps1" -Port !BACKEND_PORT!
        if errorlevel 1 (
            echo FAIL: smoke-web3-itinerary-full-chain-local - see scripts\dev\smoke-web3-itinerary-full-chain-local.sh
            pause
            exit /b 1
        )
    )
    goto :tt_after_web3_smoke
)
if "!TT_RUN_ESCROW!"=="1" (
    echo Step 6d - Escrow draft: create no guide, PATCH bind, reassign smoke only
    if /i "%TRAVELTRUST_POST_START_ESCROW_BIND_WARN%"=="1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-escrow-bind-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-escrow-bind-smoke.ps1" -Port !BACKEND_PORT!
        if errorlevel 1 (
            echo FAIL: smoke-escrow-draft-guide-bind-local
            pause
            exit /b 1
        )
    )
)
if "!TT_RUN_LANDING!"=="1" (
    echo Step 6e - Landing Hero itinerary smoke only
    if /i "%TRAVELTRUST_POST_START_LANDING_ITINERARY_WARN%"=="1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-landing-itinerary-smoke.ps1" -Port !BACKEND_PORT! -WarnOnly
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-post-start-landing-itinerary-smoke.ps1" -Port !BACKEND_PORT!
        if errorlevel 1 (
            echo FAIL: smoke-landing-itinerary-flow-local
            pause
            exit /b 1
        )
    )
)
:tt_after_web3_smoke

goto :tt_after_api_stack

:tt_fe_only_stack
echo Step 2 - Stop old frontend !FRONTEND_PORT! FE-only
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\stop-api-thorough.ps1" -FrontendOnly -FrontendPort !FRONTEND_PORT!
ping -n 2 127.0.0.1 >nul

:tt_after_api_stack
echo Step 7 - Sync frontend\.env.local NEXT_PUBLIC_* from root .env
if /i "%SKIP_FRONTEND_ENV_SYNC%"=="1" (
    echo     SKIP SKIP_FRONTEND_ENV_SYNC=1 - sync NEXT_PUBLIC_API_BASE_URL manually for port !BACKEND_PORT!
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\sync-frontend-env-local-from-root.ps1" -ApiListenPort !BACKEND_PORT!
    if errorlevel 1 (
        echo WARN: sync-frontend-env-local failed - check .env and frontend\.env.local or run scripts\dev\sync-frontend-env-local-from-root.ps1
    )
)

if /i "%TRAVELTRUST_HOME_VITEST%"=="1" (
    echo Step 7b - traveltrust-home modular vitest [TRAVELTRUST_HOME_VITEST=1]
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-traveltrust-home-vitest.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

if /i "%TRAVELTRUST_SITE_THEME_VITEST%"=="1" (
    echo Step 7c - Site theme V1 vitest SSOT bundle site-theme-v1-d10-machine
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-site-theme-v1-vitest.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

if /i "%TRAVELTRUST_COMMUNITY_VITEST%"=="1" (
    echo Step 7d - Community PostDetail drawer vitest [TRAVELTRUST_COMMUNITY_VITEST=1]
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-community-drawer-vitest.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

if /i "%TRAVELTRUST_COMMUNITY_ME_VITEST%"=="1" (
    echo Step 7e - Community profile + account-nav contract vitest [TRAVELTRUST_COMMUNITY_ME_VITEST=1]
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-community-me-l5-vitest.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

if /i "%TRAVELTRUST_ADMIN_VITEST%"=="1" (
    echo Step 7f - Admin L5 vitest union [TRAVELTRUST_ADMIN_VITEST=1]
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-admin-l5-vitest.ps1"
    if errorlevel 1 (
        pause
        exit /b 1
    )
)

echo Step 8 - Start frontend !FRONTEND_PORT!
if defined TRAVELTRUST_CLEAN_FRONTEND_NEXT set "_TT_CLEAN_FE=1"
start "TravelTrust-Frontend" cmd /k cd /d "%ROOT%" ^&^& set "FRONTEND_PORT=!FRONTEND_PORT!" ^&^& set "TRAVELTRUST_FRONTEND_PORT=!FRONTEND_PORT!" ^&^& set "TRAVELTRUST_CLEAN_FRONTEND_NEXT=!_TT_CLEAN_FE!" ^&^& call "%ROOT%\scripts\run-frontend.bat"
set "_TT_CLEAN_FE="
cd /d "%ROOT%"
echo     Opened window TravelTrust-Frontend - wait for Ready on http://localhost:!FRONTEND_PORT!
ping -n 2 127.0.0.1 >nul

if /i "%TRAVELTRUST_WAIT_FE_READY%"=="1" (
    set "TT_FE_WAIT_PATH=/"
    if /i "%TRAVELTRUST_OPEN_TRAVELTRUST%"=="1" set "TT_FE_WAIT_PATH=/traveltrust"
    if /i "%TRAVELTRUST_OPEN_ADMIN%"=="1" set "TT_FE_WAIT_PATH=/admin"
    if not "!TRAVELTRUST_ADMIN_LOGIN_RETURN_URL!"=="" set "TT_FE_WAIT_PATH=!TRAVELTRUST_ADMIN_LOGIN_RETURN_URL!"
    echo Step 8b - Wait for Next Ready !TT_FE_WAIT_PATH! on port !FRONTEND_PORT!
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\wait-for-frontend-ready.ps1" -Port !FRONTEND_PORT! -Path !TT_FE_WAIT_PATH!
    if errorlevel 1 (
        echo WARN: wait-for-frontend timed out - check TravelTrust-Frontend window or run npm run doctor:3012
    )
    set "TT_FE_WAIT_PATH="
)

echo.
echo ========== TravelTrust local stack ready ==========
echo DB:     PostgreSQL docker traveltrust-postgres port 5432
echo API:    http://127.0.0.1:!BACKEND_PORT!  GET /health  GET /meta
echo Next:   http://localhost:!FRONTEND_PORT!  window TravelTrust-Frontend
echo.
echo --- Quick UI walkthrough (Phase 1 local only) ---
echo   Auth: /auth/login  /auth/register
echo   Admin hub: http://localhost:!FRONTEND_PORT!/admin
echo     Login: http://localhost:!FRONTEND_PORT!/auth/login?returnUrl=/admin
echo     Account: tourist@test.com  password Test123!  users.role super_admin  console_role_70 SuperAdmin
echo     Pages: /admin/operator-guide  /admin/content/countries  /admin/official  /admin/community/reports
echo     CMS Growth Official smoke Step 6k: TRAVELTRUST_OPEN_ADMIN=1 or TRAVELTRUST_MANUAL_QA=1
echo     Manual QA preset: TRAVELTRUST_MANUAL_QA=1 opens returnUrl=/admin/operator-guide
echo     Step 6b bootstrap: super_admin + admin_console_roles + admin_2fa_policy enforced off
echo     API: GET /api/v1/admin/capabilities  GET /api/v1/admin/metrics/home-overview  GET /api/v1/admin/onboarding/entitlements
echo     probe: bash scripts/dev/check-admin-capabilities-route.sh
echo     FE: AdminHomeQueuesProvider + AdminSessionCookieSync + public tt-session-cookie-bootstrap.js
echo   Community profile: http://localhost:!FRONTEND_PORT!/community/me  avatar/bio/edit here
echo     Content preview rows + travel data link; password/logout via header menu or /me/settings
echo   Meta: http://localhost:!FRONTEND_PORT!/meta  expect 200 JSON
echo   Community feed + publish: http://localhost:!FRONTEND_PORT!/community  or  ^?publish=1
echo     Demo posts (showcase badge): comments local-only; real UGC posts sync when logged in
echo     Video publish needs MinIO Step 3e; banner shows when storage not ready
echo   Market: http://localhost:!FRONTEND_PORT!/market
echo   Itinerary-first main chain Phase 1 local [frozen ESCROW-P03-P06-GD-MAIN-CHAIN-FREEZE.md]:
echo     P03 accept - P04 bilateral - P05 confirm-final-plan - P06 mock-pay - GD /guides calendar
echo     Public catalog guide: f0e0b101-0001-4001-8001-000000000001 tg_guide_main@trustgate-e2e.local
echo     Step 6b4 seeds trust-gate; exception flows: bash scripts/dev/record-escrow-p03-p06-exception-flows-evidence.sh
echo     1 create itinerary - Landing / or market custom - no guide_id on create
echo     2 select guide - Escrow shows select-guide prompt - /market?view=guides^&bindGuideToOrder=ORDER_UUID - pick guide@test.com Hangzhou [TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1 default]
echo     3 confirm plan / pay - after guide assigned
echo   Itinerary-date-as-source frozen ITINERARY-DATE-AS-SOURCE-PHASE1-FREEZE.md - busy guide PATCH 409 + market filter
echo   Home Landing Hero: http://localhost:!FRONTEND_PORT!/  AI generate itinerary step 1
echo     Draft cap 20 per user - cleanup tab: http://localhost:!FRONTEND_PORT!/orders?state=draft
echo     Step 3g+6b3 prune/cleanup tourist@test.com orders draft le3 - SKIP_ENSURE_TOURIST_DRAFT_HEADROOM=1 to skip
echo   Escrow step2: http://localhost:!FRONTEND_PORT!/escrow/ORDER_ID  expect select-guide prompt when no guide
echo   Market step2 normal UI: http://localhost:!FRONTEND_PORT!/market?view=guides^&bindGuideToOrder=ORDER_UUID  city=Hangzhou pick guide@test.com
echo   Orders list: http://localhost:!FRONTEND_PORT!/orders
echo   Acquisition PD-009: http://localhost:!FRONTEND_PORT!/market/acquisition
echo   DID rank: http://localhost:!FRONTEND_PORT!/did-rank  board=acquisition: ^?board=acquisition
echo   UI/UX/i18n/a11y checklist: docs\spec\96-13-UI-UX-i18n-a11y-*.md
echo.
echo API smoke paths (crates/api):
echo   Auth REST: POST /auth/register  POST /auth/login  then /api/v1/auth/*
echo   JSON: GET /api/v1/me  GET /api/v1/me/wallets  GET /api/v1/me/role-applications
echo   JSON: GET /api/v1/me/sessions  GET /api/v1/me/security-notifications
echo   JSON: GET /api/v1/admin/capabilities  GET /api/v1/admin/rbac/route-matrix
echo   JSON: GET /api/v1/admin/metrics/home-overview  GET /api/v1/admin/onboarding/entitlements
echo   JSON: GET /api/v1/admin/content/countries  publish-queue  revisions  catalog/geo-validation
echo   JSON: GET /api/v1/admin/growth/referral-codes  reward-ledger  analytics/overview  early-bird/stages  airdrop-campaigns  anti-fraud/rules  anti-fraud/scan-runs
echo   JSON: GET /api/v1/admin/official/accounts  official/guides  itinerary-templates  cold-start/campaigns  country-market/launches
echo   JSON: GET /api/v1/admin/security/totp/status
echo   JSON: GET /api/v1/discover/orders  GET /api/v1/guides  GET /api/v1/guides/:id/availability Bearer 200
echo   JSON: PATCH /api/v1/orders/:id/guide  busy guide 409 guide_has_active_order
echo   DID rank: GET /api/v1/did-rank/travelers^|guides^|itineraries^?period=week^|month^|all
echo.
echo Login: http://localhost:!FRONTEND_PORT!/auth/login
echo.
echo --- Manual acceptance test accounts [SEED_TEST_ACCOUNTS=1] ---
echo   Tourist  email: tourist@test.com              password: Test123!   role: tourist
echo   Guide    email: guide@test.com                password: Test123!   role: guide [Hangzhou walking+culture]
echo   Merchant email: merchant@test.com             password: Test123!   role: merchant [/provider workbench]
echo   DID rank email: provider-did-rank-demo@test.com password: Test123!   role: merchant [DID rank demo listing]
echo   Multi    email: multi-demo@test.com           password: Test123!   role: multi [identities + publish hub]
echo   Admin    same tourist@test.com               SuperAdmin after Step 6b2 [/admin]
echo   Preset:  set TRAVELTRUST_MANUAL_ACCEPTANCE=1  then scripts\start-api-with-seed.bat
echo   Chain B: tourist@test.com picks guide@test.com in /market guides UI [default TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1]
echo   Chain A public catalog: tg_guide_main@trustgate-e2e.local [Step 6b4 GD/P06; do not mix with Chain B orders]
echo   Disable seed guide in market list only: set TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0 before start
echo --- end test accounts ---
echo.
echo Admin local: tourist@test.com super_admin + console_role_70 SuperAdmin after Step 6b2
echo Admin walkthrough preset: set TRAVELTRUST_OPEN_ADMIN=1 before start-api-with-seed
echo Admin manual QA preset: set TRAVELTRUST_MANUAL_QA=1  first run or schema drift: set RESET_DOCKER_DB=1
echo Admin hard refresh: root layout loads public/tt-dev-chunk-recovery.js for stale .next chunks
echo Register: http://localhost:!FRONTEND_PORT!/auth/register  smoke: bash scripts/smoke-ab-core-chain.sh
echo.
echo Onboarding / roles:
echo   Identities:  http://localhost:!FRONTEND_PORT!/me/identities  roles/onboarding hub
echo   Community profile: http://localhost:!FRONTEND_PORT!/community/me  social identity + edit
echo   Onboarding:  http://localhost:!FRONTEND_PORT!/me/onboarding
echo   Settings hub: http://localhost:!FRONTEND_PORT!/me/settings  privacy/likes hide toggle
echo   Security:    http://localhost:!FRONTEND_PORT!/me/security  sessions: ^?focus=sessions
echo   Guide workbench: http://localhost:!FRONTEND_PORT!/guide  orders: /orders?hat=guide
echo   Provider workbench: http://localhost:!FRONTEND_PORT!/provider  orders: /orders?hat=merchant
echo   Guide reg:   http://localhost:!FRONTEND_PORT!/guide/register
echo   Steward:     http://localhost:!FRONTEND_PORT!/steward/register  step2 wallet verify
if /i "%TRAVELTRUST_TTG_ANVIL%"=="1" (
    echo   TTG Anvil 31337: Step 3c deployed MockERC20 + stake pool - mint: bash scripts/dev/mint-ttg-anvil-local.sh 0xWallet
    echo   Doc: scripts\dev\TTG-ANVIL-LOCAL-README.md
)
echo.
echo More routes:
echo   Market hub: http://localhost:!FRONTEND_PORT!/market
echo   DID rank:   http://localhost:!FRONTEND_PORT!/did-rank
echo   Acquisition board: http://localhost:!FRONTEND_PORT!/did-rank?board=acquisition
echo.
echo Playwright (API+PG): cd frontend ^&^& npm run e2e:market-community
echo   Community Phase1 evidence: bash scripts/evidence/run-community-phase1-local-evidence.sh
echo   Community drawer vitest Step 7d: TRAVELTRUST_COMMUNITY_VITEST=1 (default on full stack)
echo   TT-LOCAL gate: docs\runbook\TT-LOCAL-CI-DELIVERY-GATE-001.md section 2.1
echo.
echo If Next stuck: wait for Ready in TravelTrust-Frontend window
echo If market 404: scripts\prepare-local-manual-test.bat or TRAVELTRUST_PREP_CLEAN=1
echo.
echo Web3 itinerary API smoke: Step 6f full chain no-guide create + bind + reassign or SKIP_* partial
echo Acquisition PD-009 API smoke: Step 6h smoke-acquisition-pd009-local or SKIP_POST_START_ACQUISITION_PD009_SMOKE=1
echo GD-L5 guide detail booking: TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1 Step 4b+6l or bash scripts/dev/record-guide-detail-l5-booking-evidence.sh
echo Itinerary-date-as-source busy-guide: TRAVELTRUST_POST_START_ITINERARY_DATE_AS_SOURCE_SMOKE=1 Step 6m or bash scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh
echo Itinerary-date-as-source evidence: bash scripts/dev/record-itinerary-date-as-source-evidence.sh
echo Guide availability 429: default API_RATE_LIMIT_PER_MINUTE=0; FE guideAvailabilityClient cache+debounce on market bind
echo Phase15 identity smoke: TRAVELTRUST_POST_START_PHASE15_IDENTITY_SMOKE=1 Step 6j or bash scripts/dev/smoke-phase15-identity-demo-local.sh
echo Identity P2 settings smoke: Step 6n smoke-identity-p2-settings-local default on full stack or SKIP_POST_START_IDENTITY_P2_SMOKE=1
echo Identity P2 vitest: cd frontend ^&^& npm run test -- meIdentityP2Settings meIdentitiesUiFreeze meIdentitiesPage --run
echo Escrow bind+reassign: bash scripts/dev/smoke-escrow-draft-guide-bind-local.sh
echo Landing no-guide publish: bash scripts/dev/smoke-landing-itinerary-flow-local.sh
echo Escrow L5 vitest: bash scripts/dev/run-web3-itinerary-l5-green.sh
echo GD/P06 main chain evidence: bash scripts/dev/record-escrow-gd-p06-public-catalog-evidence.sh
echo P03-P06 exception flows: bash scripts/dev/record-escrow-p03-p06-exception-flows-evidence.sh
echo Admin L5 vitest: bash scripts/dev/run-admin-l5-green.sh  verify: bash scripts/dev/verify-admin-audit-closure.sh
echo Admin CMS Growth Official smoke: bash scripts/dev/smoke-admin-cms-growth-official-p0-local.sh
echo Admin RBAC matrix: bash scripts/dev/smoke-admin-rbac-matrix-local.sh  needs DATABASE_URL + psql
echo Me settings L5: bash scripts/dev/smoke-me-settings-local.sh  API up PLAYWRIGHT_REUSE_API_SERVER=1
echo Community-me L5 vitest: TRAVELTRUST_COMMUNITY_ME_VITEST=1 Step 7e  or  bash scripts/dev/run-community-me-l5-green.sh
echo Account nav smoke: bash scripts/dev/smoke-account-nav-local.sh
echo Docs: docs\spec\00-doc-index.md  smoke-ab: bash scripts/smoke-ab-core-chain.sh
echo E2E: scripts\e2e-verify.bat  unit: cd frontend ^&^& npm test
echo Internal API: set INTERNAL_API_SECRET in .env before curl /api/v1/internal/* see .env.example
echo Runbook: docs\runbook\TT-9618-onboarding-local-testnet.md
echo Rate limit 429 on /admin: default API_RATE_LIMIT_PER_MINUTE=0 locally; production-like: TRAVELTRUST_STRICT_API_RATE_LIMIT=1
echo Open browser: TRAVELTRUST_OPEN_BROWSER=1  post-start ABI smoke default TRAVELTRUST_POST_START_ABI_CHECK=1
echo ============================
if /i "%TRAVELTRUST_OPEN_BROWSER%"=="1" (
    if /i "%TRAVELTRUST_OPEN_ADMIN%"=="1" (
        if not defined TRAVELTRUST_ADMIN_LOGIN_RETURN_URL set "TRAVELTRUST_ADMIN_LOGIN_RETURN_URL=/admin"
        echo TRAVELTRUST_OPEN_ADMIN=1: opening admin login returnUrl=!TRAVELTRUST_ADMIN_LOGIN_RETURN_URL!
        start "" "http://localhost:!FRONTEND_PORT!/auth/login?returnUrl=!TRAVELTRUST_ADMIN_LOGIN_RETURN_URL!"
    ) else if /i "%TRAVELTRUST_OPEN_TRAVELTRUST%"=="1" (
        echo TRAVELTRUST_OPEN_BROWSER=1: opening http://localhost:!FRONTEND_PORT!/traveltrust
        start "" "http://localhost:!FRONTEND_PORT!/traveltrust"
    ) else (
        echo TRAVELTRUST_OPEN_BROWSER=1: opening login page
        start "" "http://localhost:!FRONTEND_PORT!/auth/login"
    )
)
if /i not "%NO_PAUSE%"=="1" pause
