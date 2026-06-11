@echo off
chcp 65001 >nul
REM 仅启动前端（供 start-api-with-seed.bat 调用或单独运行）。
REM npm run dev = run-dev.mjs；默认 Webpack 端口 3012；Turbopack 见 frontend README（dev:turbopack）
REM 若 market 或 _next static 全 404：先执行 scripts\frontend-clean-dev.bat 或 cd frontend ^&^& npm run clean ^&^& npm run dev
REM 或在启动一键脚本前设 TRAVELTRUST_CLEAN_FRONTEND_NEXT=1，本脚本会在 npm run dev 前执行 npm run clean（删 frontend\.next）
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%\frontend"
if exist "E:\Dev\nodejs\npm.cmd" set "PATH=E:\Dev\nodejs;%PATH%"
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 npm。请安装 Node.js 18+ LTS，建议安装到 E:\Dev\nodejs 并勾选 Add to PATH。
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
set "TT_FE_PORT=%TRAVELTRUST_FRONTEND_PORT%"
if not defined TT_FE_PORT set "TT_FE_PORT=%FRONTEND_PORT%"
if not defined TT_FE_PORT set "TT_FE_PORT=3012"
echo [前端] 启动 Next.js（端口 %TT_FE_PORT%）...
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri ('http://127.0.0.1:' + $env:TT_FE_PORT + '/') -TimeoutSec 4; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
    echo [前端] http://localhost:%TT_FE_PORT% 已在运行，跳过重复启动。
    goto :fe_done
)
call npm run dev -- -p %TT_FE_PORT%
if errorlevel 1 (
    powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri ('http://127.0.0.1:' + $env:TT_FE_PORT + '/') -TimeoutSec 4; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        echo [前端] 端口 %TT_FE_PORT% 已被占用，但 Next 可访问 — 使用 http://localhost:%TT_FE_PORT%
        goto :fe_done
    )
)
:fe_done
echo.
echo 若上方有报错，请检查 Node 版本与依赖。按任意键关闭此窗口。
pause
