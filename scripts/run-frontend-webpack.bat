@echo off
chcp 65001 >nul
REM Webpack dev（会执行 ensure-dev-next，避免与 next build 的 .next 混用）
REM 当 Turbopack 异常时可改用本脚本；端口 3012 与默认 dev 一致
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
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)
echo [前端] 启动 Next.js Webpack dev（端口 3012）...
call npm run dev:webpack
pause
