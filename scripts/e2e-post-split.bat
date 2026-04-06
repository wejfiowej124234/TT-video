@echo off
chcp 65001 >nul
REM 48 §12.6 拆分后必跑：健康检查 + /meta + 登录 + /api/v1/me
REM 从项目根运行: scripts\e2e-post-split.bat
set "ROOT=%~dp0\.."
cd /d "%ROOT%"

echo ========== 48 拆分后必跑验证 ==========
echo.

REM 先跑基础 e2e（数据库、8080、3012、登录）
call scripts\e2e-verify.bat
if %errorlevel% neq 0 (
    echo 基础验证未通过，请先启动数据库/后端/前端并重试。
    exit /b 1
)

echo.
echo [5/5] GET /meta ...
curl -sf -o "%TEMP%\e2e_meta.json" -w "%%{http_code}" --connect-timeout 3 http://localhost:8080/meta 2>nul
if %errorlevel% neq 0 (
    echo   失败 /meta 无响应
    exit /b 1
)
echo   OK  /meta 可访问

echo [6/6] POST /auth/login + GET /api/v1/me ...
curl -sf -o "%TEMP%\e2e_login.json" -X POST -H "Content-Type: application/json" -d "{\"email\":\"tourist@test.com\",\"password\":\"Test123!\"}" --connect-timeout 3 http://localhost:8080/auth/login 2>nul
if %errorlevel% neq 0 (
    echo   失败 登录请求失败
    exit /b 1
)
for /f "delims=" %%i in ('powershell -NoProfile -Command "(Get-Content '%TEMP%\e2e_login.json' -Raw | ConvertFrom-Json).user_id" 2^>nul') do set "UID=%%i"
if not defined UID (
    echo   警告 登录返回无 user_id，请确认 SEED_TEST_ACCOUNTS=1 并重启后端
    del "%TEMP%\e2e_login.json" 2>nul
    exit /b 1
)
curl -sf -o "%TEMP%\e2e_me.json" -H "X-User-Id: %UID%" --connect-timeout 3 http://localhost:8080/api/v1/me 2>nul
if %errorlevel% neq 0 (
    echo   失败 /api/v1/me 无响应
    del "%TEMP%\e2e_login.json" 2>nul
    exit /b 1
)
echo   OK  登录 + /api/v1/me 通过

del "%TEMP%\e2e_meta.json" "%TEMP%\e2e_login.json" "%TEMP%\e2e_me.json" 2>nul
echo.
echo ========== 拆分后必跑通过 ==========
echo 可选：按《测试账号与本地联调》§7.2 手工验证订单/证据/争议等路径。
pause
exit /b 0
