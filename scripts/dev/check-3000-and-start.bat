@echo off
chcp 65001 >nul
REM 检查端口 3012 是否在监听；若没有则启动前端（Turbopack dev）。
REM 从项目根运行: scripts\check-3000-and-start.bat（文件名保留兼容，端口为 3012）
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
cd /d "%ROOT%"

echo 正在检查端口 3012...
netstat -ano | findstr ":3012.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 端口 3012 已在监听，前端应已运行。
    echo 请直接打开: http://localhost:3012/auth/login
    echo.
    pause
    exit /b 0
)

echo [提示] 端口 3012 未监听，前端未启动。正在启动前端...
start "TravelTrust-Frontend" cmd /k "call "%ROOT%\scripts\run-frontend.bat""
cd /d "%ROOT%"
echo.
echo 已在新窗口启动前端。请等待出现 "Ready on http://localhost:3012" 后，
echo 在浏览器打开: http://localhost:3012/auth/login
echo.
pause
