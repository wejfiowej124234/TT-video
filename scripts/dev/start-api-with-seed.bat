@echo off
chcp 65001 >nul
REM TravelTrust 一键重启：终止旧进程；Docker 数据库；编译后端；API 默认 8080；轮询 /health；同步 frontend/.env.local；前端默认 3012（勿在本行使用半角括号，以免 cmd 误解析为语句块）
REM 从项目根运行: scripts\start-api-with-seed.bat
REM 环境变量（可选）：
REM   RESET_DOCKER_DB=1          清空 Postgres 卷后重建（默认保留数据，仅 docker compose up -d）
REM   SKIP_API_BUILD=1           跳过 cargo build（确认二进制已最新时；改 auth/logout 后勿跳过）
REM   SKIP_API_WAIT=1            跳过 wait-for-api.ps1（不轮询 /health）
REM   SKIP_PREFLIGHT=1           跳过 Step 0 预检（不推荐）
REM   SKIP_ABI_GATE=1            跳过 Step 1b 的 55-S13（contracts/abi vs frontend/dapp/abis）；合约/ABI 变更后勿长期跳过
REM   TRAVELTRUST_ABI_FORGE_VERIFY=1  Step 1b2：额外跑 forge multiset（须 Foundry + scripts\dev\run-verify-abi-forge.ps1）
REM   SKIP_ROUTES_GATE=1         跳过 Step 1c 的 run-check-04-routes（须 Python；改 HTTP/前端路由后勿长期跳过）
REM   SKIP_AUTH_EMAIL_RESEND_GATE=1  跳过 Step 1d 的 Resend 出站变量检查（与 gates\check-auth-email-resend-gate.ps1 同源）
REM   SKIP_WAIT_POSTGRES=1       跳过 Step 3b 的 wait-for-postgres（不推荐；仅 Docker 已就绪时应急）
REM   TRAVELTRUST_PREP_CLEAN=1   启动前执行 frontend\npm run clean（删 .next，避免 dev/build 混用 404）
REM   TRAVELTRUST_CLEAN_TURBO=1  同时删除 frontend\.turbo（Turbopack 缓存）
REM   TRAVELTRUST_CLEAN_FRONTEND_NEXT=1  在 Step 8 启动前端窗口内再 clean 一次（与 run-frontend.bat 一致）
REM   WAIT_API_MAX_ATTEMPTS / WAIT_API_INTERVAL_SEC  传给 wait-for-api.ps1（可选）
REM   DATABASE_URL               若已在外部或根目录 .env 中设置，则优先使用；未设置时 API 窗口注入 Docker 默认串（与 docker-compose.yml）
REM 手测前「停进程 + 清缓存 + 可选清库」：先运行 scripts\prepare-local-manual-test.bat（见 scripts\dev\prepare-local-manual-test.ps1）
REM 根 .env：推荐 PORT=8080（与 Next 3012 分离；误写 3012 时预检会 WARN）。本脚本 Step 5 仍对 API 进程强制 PORT=8080（B-445 与 Playwright 契约）。
REM STRICT_SSOT=1 时须配 SSOT_VERSION/CORS_ORIGINS 等，见 .env.example

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%"
setlocal EnableDelayedExpansion

echo ========== TravelTrust 一键重启：数据库 + 后端 + 前端 ==========
echo.

echo Step 0 - Preflight — Docker / Rust / Node / .env 要点
if /i not "%SKIP_PREFLIGHT%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\preflight-local-stack.ps1"
    if errorlevel 1 (
        echo 错误：预检失败。请修正 Docker / 工具链 / 根目录 .env 后重试。
        pause
        exit /b 1
    )
) else (
    echo     已跳过 SKIP_PREFLIGHT=1
)

echo Step 0a - Resolve API / Next 端口（resolve-dev-stack-ports.ps1，与 _dev_stack_ports.sh / B-445 同源）
set "BACKEND_PORT="
set "FRONTEND_PORT="
for /f "tokens=1,2" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\resolve-dev-stack-ports.ps1"') do (
    set "BACKEND_PORT=%%a"
    set "FRONTEND_PORT=%%b"
)
if "!BACKEND_PORT!"=="" (
    echo 错误：未能解析 API 端口（检查根目录 .env 的 PORT / API_PORT / FRONTEND_PORT）。
    pause
    exit /b 1
)
if "!FRONTEND_PORT!"=="" (
    echo 错误：未能解析前端端口。
    pause
    exit /b 1
)
echo     使用端口：API=!BACKEND_PORT!  Next=!FRONTEND_PORT!

echo Step 0b - Optional clean before build — TRAVELTRUST_PREP_CLEAN / TRAVELTRUST_CLEAN_TURBO
if /i "%TRAVELTRUST_PREP_CLEAN%"=="1" (
    echo     TRAVELTRUST_PREP_CLEAN=1：frontend\npm run clean ...
    pushd "%ROOT%\frontend"
    if errorlevel 1 (
        echo 错误：无法进入 frontend 目录
        pause
        exit /b 1
    )
    call npm run clean
    if errorlevel 1 (
        echo 错误：npm run clean 失败
        popd
        pause
        exit /b 1
    )
    popd
)
if /i "%TRAVELTRUST_CLEAN_TURBO%"=="1" (
    if exist "%ROOT%\frontend\.turbo" (
        echo     TRAVELTRUST_CLEAN_TURBO=1：删除 frontend\.turbo
        rmdir /s /q "%ROOT%\frontend\.turbo"
    )
)

echo Step 1 - SQLx migration prefix check
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-sqlx-migration-prefixes.ps1"
if errorlevel 1 (
    echo 错误：存在重复的迁移版本前缀，请重命名 crates\api\migrations 下冲突的 .sql 文件名。
    pause
    exit /b 1
)

echo Step 1b - ABI gate 55-S13（contracts/abi 与 frontend/dapp/abis 对齐；与 start_dev.sh 同源）
if /i "%SKIP_ABI_GATE%"=="1" (
    echo     已跳过 SKIP_ABI_GATE=1（不推荐；改合约或 ABI 后务必关跳过并重跑）
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-55-s13.ps1"
    if errorlevel 1 (
        echo 错误：55-S13 未通过。请先 forge build + scripts\sync-abi-from-forge.ps1（或 .sh），或临时 set SKIP_ABI_GATE=1（仅应急）。
        pause
        exit /b 1
    )
)

echo Step 1b2 - Optional forge ABI multiset（TRAVELTRUST_ABI_FORGE_VERIFY=1；须 Foundry）
if /i "%TRAVELTRUST_ABI_FORGE_VERIFY%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\run-verify-abi-forge.ps1"
    if errorlevel 1 (
        echo 错误：run-verify-abi-forge 失败。请安装 Foundry 或取消 TRAVELTRUST_ABI_FORGE_VERIFY。
        pause
        exit /b 1
    )
) else (
    echo     未设置 TRAVELTRUST_ABI_FORGE_VERIFY=1，跳过 forge multiset（与 start_dev.sh 同源）
)

echo Step 1c - HTTP 路由表门禁 run-check-04-routes（须 Python；与 enterprise-preflight 同源）
if /i "%SKIP_ROUTES_GATE%"=="1" (
    echo     已跳过 SKIP_ROUTES_GATE=1（不推荐；改 routes 或 04/13-1 后请关跳过）
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\run-check-04-routes.ps1"
    if errorlevel 1 (
        echo 错误：run-check-04-routes 未通过。请安装 Python 并修路由/文档，或临时 set SKIP_ROUTES_GATE=1（仅应急）。
        pause
        exit /b 1
    )
)

echo Step 1d - Resend 出站变量检查（check-auth-email-resend-gate.ps1；SKIP_AUTH_EMAIL_RESEND_GATE=1 跳过）
if /i "%SKIP_AUTH_EMAIL_RESEND_GATE%"=="1" (
    echo     已跳过 SKIP_AUTH_EMAIL_RESEND_GATE=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\gates\check-auth-email-resend-gate.ps1"
    if errorlevel 1 (
        echo 错误：check-auth-email-resend-gate 未通过。配置根 .env 的 TRAVELTRUST_RESEND_* 或 set SKIP_AUTH_EMAIL_RESEND_GATE=1（仅本地应急）。
        pause
        exit /b 1
    )
)

echo Step 2 - Stop old API / frontend（彻底释放 !BACKEND_PORT!/!FRONTEND_PORT! 与 traveltrust-api.exe）
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\stop-api-thorough.ps1" -ApiPort !BACKEND_PORT! -AlsoFrontend -FrontendPort !FRONTEND_PORT!
ping -n 3 127.0.0.1 >nul

echo Step 3 - Docker Postgres up -d
docker info >nul 2>&1
if errorlevel 1 (
    echo 错误：Docker 未运行，请先启动 Docker Desktop。
    pause
    exit /b 1
)
if /i "%RESET_DOCKER_DB%"=="1" (
    echo     警告：RESET_DOCKER_DB=1 将删除 Postgres 数据卷并重建（本地数据清空）
    docker compose down -v 2>nul
)
docker compose up -d
if errorlevel 1 (
    echo 错误：docker compose 失败，请检查 docker-compose.yml 与端口 5432。
    pause
    exit /b 1
)
echo     建议在项目根 .env 设置 DATABASE_URL（与 .env.example：postgres://traveltrust:traveltrust@localhost:5432/traveltrust）
echo     若未设置，下一步启动 API 时将使用 127.0.0.1 同凭证（仅当前窗口），且 cargo 仍会从根 .env 加载（存在则覆盖）。
echo     API 启动时会自动执行全部迁移，无需单独运行 sqlx migrate。
ping -n 3 127.0.0.1 >nul

echo Step 3b - Wait for Postgres ready（docker exec pg_isready）
if /i "%SKIP_WAIT_POSTGRES%"=="1" (
    echo     已跳过 SKIP_WAIT_POSTGRES=1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\wait-for-postgres.ps1"
    if errorlevel 1 (
        echo 错误：Postgres 未就绪。请查看 Docker 日志与容器名 traveltrust-postgres。
        pause
        exit /b 1
    )
)

echo Step 4 - cargo build API
if "%SKIP_API_BUILD%"=="1" (
    echo 已跳过编译（SKIP_API_BUILD=1）
) else (
    cargo build -p traveltrust-api
    if errorlevel 1 (
        echo 错误：后端编译失败，请检查 Rust 环境与代码。
        pause
        exit /b 1
    )
)

echo Step 5 - Start API !BACKEND_PORT!（PORT=!BACKEND_PORT! SEED_TEST_ACCOUNTS=1 DATABASE_URL 默认 Docker Postgres 若当前未定义）
echo     提示：若刚修改 auth/logout 或 session 逻辑，请勿设 SKIP_API_BUILD=1；须以 Step 4 的编译产物启动。
echo     若 !BACKEND_PORT! 上仍是旧 traveltrust-api.exe，POST /auth/logout 可能不删会话 — 先停旧进程再编译再起。
REM 避免 cmd /k "cd /d "%ROOT%" …" 的内层引号截断；用 ^&^& 串联且不在同一对引号内嵌套路径引号
start "TravelTrust-API" cmd /k cd /d "%ROOT%" ^&^& if not defined DATABASE_URL set "DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust" ^&^& set "PORT=!BACKEND_PORT!" ^&^& set "SEED_TEST_ACCOUNTS=1" ^&^& cargo run -p traveltrust-api

echo Step 6 - Wait for API /health
if /i "%SKIP_API_WAIT%"=="1" (
    echo     已跳过（SKIP_API_WAIT=1）；仍建议浏览器或 curl 确认 http://127.0.0.1:!BACKEND_PORT!/health
    ping -n 5 127.0.0.1 >nul
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\wait-for-api.ps1" -Port !BACKEND_PORT!
    if errorlevel 1 (
        echo 警告：wait-for-api 超时；请查看「TravelTrust-API」窗口日志（迁移失败、端口占用、DATABASE_URL 等）。
    )
)

echo Step 7 - Sync frontend\.env.local NEXT_PUBLIC_* from root .env
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\sync-frontend-env-local-from-root.ps1" -ApiListenPort !BACKEND_PORT!
if errorlevel 1 (
    echo 警告：sync-frontend-env-local 失败；请检查根目录 .env 与 frontend\.env.local（可手动运行 scripts\dev\sync-frontend-env-local-from-root.ps1）
)

echo Step 8 - Start frontend !FRONTEND_PORT!（FRONTEND_PORT / TRAVELTRUST_FRONTEND_PORT 传入 run-dev.mjs）
start "TravelTrust-Frontend" cmd /k cd /d "%ROOT%" ^&^& set "FRONTEND_PORT=!FRONTEND_PORT!" ^&^& set "TRAVELTRUST_FRONTEND_PORT=!FRONTEND_PORT!" ^&^& call "%ROOT%\scripts\run-frontend.bat"
cd /d "%ROOT%"

echo.
echo ========== 已启动 ==========
echo 数据库：PostgreSQL 容器 traveltrust-postgres 端口 5432
echo 后端：  http://127.0.0.1:!BACKEND_PORT!  （健康检查 GET /health）
echo 前端：  http://localhost:!FRONTEND_PORT!  窗口标题 TravelTrust-Frontend
echo.
echo API 路由提示（与当前 crates\api 一致）：
echo   认证为 REST：POST /auth/register 、POST /auth/login （非 /api/v1/auth/*）
echo   业务 JSON：GET /api/v1/me 、GET /api/v1/discover/orders 、GET /api/v1/guides 等
echo   DID 榜公开 JSON：GET /api/v1/did-rank/travelers^|guides^|itineraries?period=week^|month^|all （guides 可加 sort=weighted^|reviews）
echo.
echo 登录页 http://localhost:!FRONTEND_PORT!/auth/login
echo 种子账号（SEED_TEST_ACCOUNTS=1）：tourist@test.com / guide@test.com  密码 Test123!
echo 自注册：http://localhost:!FRONTEND_PORT!/auth/register  （与烟测 bash scripts/smoke-ab-core-chain.sh 一致）
echo.
echo 多重身份 / 安全 / 申请（手测入口，须先登录）：
echo   身份入口  http://localhost:!FRONTEND_PORT!/me/identities
echo   入驻与支付  http://localhost:!FRONTEND_PORT!/me/onboarding
echo   会话与安全通知  http://localhost:!FRONTEND_PORT!/me/security
echo   向导申请（钱包/DID）  http://localhost:!FRONTEND_PORT!/guide/register
echo.
echo 手测页面（登录后或无鉴权公开页）：
echo   自由市场  http://localhost:!FRONTEND_PORT!/market
echo   DID 排行榜  http://localhost:!FRONTEND_PORT!/did-rank
echo   旅行收购脊签  http://localhost:!FRONTEND_PORT!/did-rank?board=acquisition
echo.
echo 请等待前端窗口出现 Ready 后再用浏览器打开登录页。
echo 若打不开或 market 静态 404：scripts\prepare-local-manual-test.bat 或 set TRAVELTRUST_PREP_CLEAN=1 后重跑本脚本
echo.
echo 文档：docs\测试账号与本地联调.md  ·  全链烟测：bash scripts/smoke-ab-core-chain.sh
echo 可选：scripts\e2e-verify.bat  ·  前端单测：cd frontend ^&^& npm test
echo ============================
pause
