@echo off
chcp 65001 >nul
REM 彻底停本机 API（默认 8080），释放 traveltrust-api.exe。可选同时清前端口。
REM 用法：项目根执行  scripts\stop-api-thorough.bat
REM 可选：scripts\stop-api-thorough.bat -ApiPort 18080
REM       scripts\stop-api-thorough.bat -AlsoFrontend

set "HERE=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%dev\stop-api-thorough.ps1" %*
