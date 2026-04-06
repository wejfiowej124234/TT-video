@echo off
chcp 65001 >nul
REM TravelTrust 一键重启：终止旧进程 → Docker 数据库 → 编译后端 → 启动后端(8080) → 启动前端(3012)
REM 使用前请确保 Docker Desktop 已启动。从项目根运行: scripts\start-api-with-seed.bat
REM 设 SKIP_API_BUILD=1 可跳过编译（仅当确认当前二进制已含 /api/v1/me、community 路由时）
REM 设 TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 可在启动前端前删除 frontend\.next（修 Image/Turbopack 缓存、404 混用等；每次启动会多几秒）

set "ROOT=%~dp0\.."
cd /d "%ROOT%"

echo ========== TravelTrust 一键重启：数据库 + 后端 + 前端 ==========
echo.

echo [1/7] 校验 SQLx 迁移文件名版本号唯一（避免 _sqlx_migrations 主键冲突）...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-sqlx-migration-prefixes.ps1"
if errorlevel 1 (
    echo 错误：存在重复的迁移版本前缀，请重命名 crates\api\migrations 下冲突的 .sql 文件名。
    pause
    exit /b 1
)

echo [2/7] 终止已有进程（8080 后端、3012 前端、traveltrust-api）...
taskkill /F /IM traveltrust-api.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3012.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
ping -n 3 127.0.0.1 >nul

echo [3/7] 重启数据库（docker compose down -v 再 up -d）...
docker info >nul 2>&1
if errorlevel 1 (
    echo 错误：Docker 未运行，请先启动 Docker Desktop。
    pause
    exit /b 1
)
docker compose down -v 2>nul
docker compose up -d
if errorlevel 1 (
    echo 错误：docker compose 失败，请检查 docker-compose.yml 与端口 5432。
    pause
    exit /b 1
)
echo     请确保项目根 .env 中已设置 DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
echo     API 启动时会自动执行全部迁移，无需单独运行 sqlx migrate。
ping -n 6 127.0.0.1 >nul

echo [4/7] 编译后端（避免 /api/v1/me、社区接口 404；设 SKIP_API_BUILD=1 可跳过）...
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

echo [5/7] 启动后端（新窗口 TravelTrust-API，端口 8080，SEED_TEST_ACCOUNTS=1）...
start "TravelTrust-API" cmd /k "cd /d "%ROOT%" && set PORT=8080 && set SEED_TEST_ACCOUNTS=1 && cargo run -p traveltrust-api"

echo [6/7] 等待后端就绪（约 30 秒）...
ping -n 31 127.0.0.1 >nul

echo [7/7] 启动前端（新窗口 TravelTrust-Frontend）...
start "TravelTrust-Frontend" cmd /k "call "%ROOT%\scripts\run-frontend.bat""
cd /d "%ROOT%"

echo.
echo ========== 已启动 ==========
echo 数据库：PostgreSQL 容器 traveltrust-postgres 端口 5432
echo 后端：  http^://localhost^:8080  窗口标题 TravelTrust-API
echo 前端：  http^://localhost^:3012  窗口标题 TravelTrust-Frontend
echo.
echo 登录页 http^://localhost^:3012/auth/login  测试账号 tourist@test.com / Test123!
echo.
echo 请等待前端窗口出现 Ready 后再用浏览器打开登录页。
echo 若打不开或 /market 与静态资源 404：执行 scripts\frontend-clean-dev.bat；或下次启动前 set TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 再运行本脚本
echo.
echo 验证：约 1 分钟后运行 scripts\e2e-verify.bat
echo ============================
pause
