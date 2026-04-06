@echo off
chcp 65001 >nul
REM 仅终止后端与前端进程（不关 Docker）。从项目根运行: scripts\stop-all.bat
set "ROOT=%~dp0\.."
cd /d "%ROOT%"

echo ========== 终止 TravelTrust 后端与前端 ==========
echo.

echo 正在终止 traveltrust-api.exe 与占用 8080/3012 的进程...
taskkill /F /IM traveltrust-api.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3012.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul

ping -n 2 127.0.0.1 >nul
echo [OK] 已终止。数据库（Docker）未动，若需停止请执行: docker compose down
echo.
pause
