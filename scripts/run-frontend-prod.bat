@echo off
chcp 65001 >nul
REM 生产模式：完整 build 后 next start（ensure-next-start + 端口 3012）
REM 用于验收 / Lighthouse；勿与 npm run dev 共用同一终端会话中的陈旧 .next
set "ROOT=%~dp0\.."
cd /d "%ROOT%\frontend"
if not exist "package.json" (
    echo [错误] 未找到 package.json
    pause
    exit /b 1
)
if not exist "node_modules" (
    call npm install
    if errorlevel 1 exit /b 1
)
echo [前端] npm run build ...
call npm run build
if errorlevel 1 (
    echo [错误] build 失败
    pause
    exit /b 1
)
echo [前端] npm run start（生产，端口 3012）...
call npm run start
pause
