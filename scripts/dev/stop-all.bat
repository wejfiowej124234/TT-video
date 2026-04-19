@echo off

chcp 65001 >nul

REM 仅终止后端与前端进程（不关 Docker）。从项目根运行: scripts\stop-all.bat

REM 与 start-api-with-seed 对齐：API_PORT、FRONTEND_PORT（默认 8080、3012）

if not defined API_PORT set "API_PORT=8080"

if not defined FRONTEND_PORT set "FRONTEND_PORT=3012"



for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

cd /d "%ROOT%"



echo ========== 终止 TravelTrust 后端与前端 ==========

echo 目标端口 API %API_PORT%  前端 %FRONTEND_PORT%

echo.



echo 正在彻底终止 API（端口 %API_PORT%）与前端（端口 %FRONTEND_PORT%）监听进程...

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev\stop-api-thorough.ps1" -ApiPort %API_PORT% -AlsoFrontend -FrontendPort %FRONTEND_PORT%

ping -n 2 127.0.0.1 >nul

echo [OK] 已终止。数据库（Docker）未动，若需停止请执行: docker compose down

echo.

pause

