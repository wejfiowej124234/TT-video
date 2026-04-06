@echo off
chcp 65001 >nul
REM 仅启动前端（供 start-api-with-seed.bat 调用或单独运行）。
REM npm run dev = run-dev.mjs：Windows 默认 Webpack -p 3012；需 Turbopack 见 frontend README（dev:turbopack）
REM 若 /market 与 /_next/static 全 404：先执行 scripts\frontend-clean-dev.bat 或 cd frontend ^&^& npm run clean ^&^& npm run dev
REM 或在启动一键脚本前设 TRAVELTRUST_CLEAN_FRONTEND_NEXT=1，本脚本会在 npm run dev 前执行 npm run clean（删 frontend\.next）
set "ROOT=%~dp0\.."
cd /d "%ROOT%\frontend"
if not exist "package.json" (
    echo [错误] 未找到 package.json，当前目录：%CD%
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo [前端] 首次运行，正在 npm install...
    call npm install
    if errorlevel 1 (
        echo [错误] npm install 失败，请确认已安装 Node.js 18+
        pause
        exit /b 1
    )
)
if /i "%TRAVELTRUST_CLEAN_FRONTEND_NEXT%"=="1" (
    echo [前端] TRAVELTRUST_CLEAN_FRONTEND_NEXT=1：正在 npm run clean（删除 .next）...
    call npm run clean
    if errorlevel 1 (
        echo [错误] npm run clean 失败
        pause
        exit /b 1
    )
)
echo [前端] 启动 Next.js（端口 3012）...
call npm run dev
echo.
echo 若上方有报错，请检查 Node 版本与依赖。按任意键关闭此窗口。
pause
