@echo off
chcp 65001 >nul
REM TravelTrust 一键重启：终止旧进程 → Docker 数据库 → 编译后端 → 启动后端(8080) → 启动前端(3012)
REM 使用前请确保 Docker Desktop 已启动。从项目根运行: scripts\start-api-with-seed.bat
REM 若需清空数据库卷：启动前执行 set RESET_DOCKER_DB=1（默认保留数据，仅 up -d）
REM 设 SKIP_API_BUILD=1 可跳过编译（仅当确认当前二进制已含 api v1 me、community 路由时）
REM 设 TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 可在启动前端前删除 frontend\.next（修 Image/Turbopack 缓存、404 混用等；每次启动会多几秒）

set "ROOT=%~dp0\.."
cd /d "%ROOT%"

echo ========== TravelTrust 一键重启：数据库 + 后端 + 前端 ==========
echo.

echo Step 1 - SQLx migration prefix check
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-sqlx-migration-prefixes.ps1"
if errorlevel 1 (
    echo 错误：存在重复的迁移版本前缀，请重命名 crates\api\migrations 下冲突的 .sql 文件名。
    pause
    exit /b 1
)

echo Step 2 - Stop old 8080 3012
taskkill /F /IM traveltrust-api.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3012.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
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
echo     请在项目根 .env 设置 DATABASE_URL（与 .env.example 中 Docker 示例一致：库名用户密码均为 traveltrust，端口 5432）
echo     API 启动时会自动执行全部迁移，无需单独运行 sqlx migrate。
ping -n 6 127.0.0.1 >nul

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

echo Step 5 - Start API 8080
start "TravelTrust-API" cmd /k "cd /d "%ROOT%" && set PORT=8080 && set SEED_TEST_ACCOUNTS=1 && cargo run -p traveltrust-api"

echo Step 6 - Wait for API
ping -n 31 127.0.0.1 >nul

echo Step 7 - Start frontend 3012
start "TravelTrust-Frontend" cmd /k "call "%ROOT%\scripts\run-frontend.bat""
cd /d "%ROOT%"

echo.
echo ========== 已启动 ==========
echo 数据库：PostgreSQL 容器 traveltrust-postgres 端口 5432
echo 后端：  http^://localhost^:8080  窗口标题 TravelTrust-API
echo 前端：  http^://localhost^:3012  窗口标题 TravelTrust-Frontend
echo.
echo 登录页 http^://localhost^:3012/auth/login  测试账号 tourist@test.com  密码 Test123!
echo.
echo 请等待前端窗口出现 Ready 后再用浏览器打开登录页。
echo 若打不开或 market 页与静态资源 404：执行 scripts\frontend-clean-dev.bat，或下次启动前 set TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 再运行本脚本
echo.
echo 验证：约 1 分钟后运行 scripts\e2e-verify.bat
echo ============================
pause
