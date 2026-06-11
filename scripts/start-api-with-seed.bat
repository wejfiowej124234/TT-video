@echo off
chcp 65001 >nul
set "HERE=%~dp0"
cd /d "%HERE%.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%dev\normalize-start-api-bat.ps1" >nul 2>&1
call "%HERE%dev\start-api-with-seed.bat" %*
set "TT_EXIT=%ERRORLEVEL%"
if not "%TT_EXIT%"=="0" pause
exit /b %TT_EXIT%
