@echo off
chcp 65001 >nul
REM 07 Phase 4 联调恢复：清除混用的 .next 后启动 Turbopack dev（3012）
REM 适用于 market 404、_next static chunks 大量 404 等 dev 与 build 产物混用场景
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%\frontend"
if exist "E:\Dev\nodejs\npm.cmd" set "PATH=E:\Dev\nodejs;%PATH%"
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 npm。请安装 Node.js 到 E:\Dev\nodejs 或加入 PATH。
    pause
    exit /b 1
)
if not exist "package.json" (
    echo [错误] 未找到 frontend\package.json
    pause
    exit /b 1
)
echo [前端] npm run clean ^&^& npm run dev ...
call npm run clean
if errorlevel 1 exit /b 1
call npm run dev
pause
