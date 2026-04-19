@echo off
chcp 65001 >nul
REM Webpack dev（会执行 ensure-dev-next，避免与 next build 的 .next 混用）
REM 当 Turbopack 异常时可改用本脚本；端口 3012 与默认 dev 一致
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%\frontend"
if exist "E:\Dev\nodejs\npm.cmd" set "PATH=E:\Dev\nodejs;%PATH%"
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 npm。请安装 Node.js 18+ LTS，建议安装到 E:\Dev\nodejs。
    echo 下载: https://nodejs.org/
    pause
    exit /b 1
)
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
