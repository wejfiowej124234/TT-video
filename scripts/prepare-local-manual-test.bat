@echo off
chcp 65001 >nul
REM 手测前：停服务、清 Next / Turbopack / Playwright 产物、可选清库；详见 scripts\dev\prepare-local-manual-test.ps1
REM 用法（项目根）：
REM   scripts\prepare-local-manual-test.bat
REM   powershell -File scripts\dev\prepare-local-manual-test.ps1 -ResetDockerDb
REM   powershell -File scripts\dev\prepare-local-manual-test.ps1 -NpmInstall
REM（清库、强制 npm install 等请用上一行 PowerShell 传参；cmd 直接传 switch 不稳定。）

set "HERE=%~dp0"
echo.
echo 正在执行 prepare-local-manual-test.ps1（默认：停 8080/3012 + npm run clean + 预检）...
echo 若需清库请加参数，见脚本注释。
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%dev\prepare-local-manual-test.ps1" %*
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
    echo prepare 失败，退出码 %EC%
    pause
    exit /b %EC%
)
echo.
echo 准备完成。下一步：scripts\dev\start-api-with-seed.bat
pause
exit /b 0
