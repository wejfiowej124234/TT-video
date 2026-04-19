@echo off

chcp 65001 >nul

REM 端到端验证：数据库、后端、前端是否通畅。从项目根运行: scripts\e2e-verify.bat

REM 与 start-api-with-seed / start_dev 对齐：API_PORT、FRONTEND_PORT（默认 8080、3012）

if not defined API_PORT set "API_PORT=8080"

if not defined FRONTEND_PORT set "FRONTEND_PORT=3012"



for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

cd /d "%ROOT%"



echo ========== TravelTrust 端到端验证 ==========

echo 检查 API 端口 %API_PORT%  前端端口 %FRONTEND_PORT%

echo.



set OK=0

set FAIL=0



REM 1) Docker 容器（不用 findstr /x 匹配整行，避免编码或格式差异误判）

echo Step 1 - Postgres

docker ps -q -f "name=traveltrust-postgres" 2>nul | findstr /r "." >nul 2>&1

if %errorlevel% equ 0 (

    echo   OK  容器 traveltrust-postgres 在运行

    set /a OK+=1

) else (

    echo   失败 容器未运行，请执行: docker compose up -d

    set /a FAIL+=1

)



REM 2) 后端

echo Step 2 - API %API_PORT%

netstat -ano 2>nul | findstr ":%API_PORT%.*LISTENING" >nul 2>&1

if %errorlevel% neq 0 (

    echo   失败 端口 %API_PORT% 未监听，请先启动后端（scripts\start-api-with-seed.bat 或 cargo run -p traveltrust-api）

    set /a FAIL+=1

) else (

    curl -sf -o nul -w "" --connect-timeout 3 http://127.0.0.1:%API_PORT%/health 2>nul

    if %errorlevel% neq 0 (

        echo   失败 %API_PORT% 在监听但 health 接口无响应

        set /a FAIL+=1

    ) else (

        echo   OK  127.0.0.1:%API_PORT% health 可访问

        set /a OK+=1

    )

)



REM 3) 前端

echo Step 3 - Frontend %FRONTEND_PORT%

netstat -ano 2>nul | findstr ":%FRONTEND_PORT%.*LISTENING" >nul 2>&1

if %errorlevel% neq 0 (

    echo   失败 端口 %FRONTEND_PORT% 未监听，请先启动前端（scripts\run-frontend.bat 或 cd frontend ^&^& npm run dev）

    set /a FAIL+=1

) else (

    curl -sf -o nul -w "" --connect-timeout 5 http://127.0.0.1:%FRONTEND_PORT%/ 2>nul

    if %errorlevel% neq 0 (

        echo   失败 %FRONTEND_PORT% 在监听但根路径无响应

        set /a FAIL+=1

    ) else (

        echo   OK  http://127.0.0.1:%FRONTEND_PORT% 可访问

        set /a OK+=1

    )

    curl -sf -o nul -w "" --connect-timeout 5 http://127.0.0.1:%FRONTEND_PORT%/market 2>nul

    if %errorlevel% neq 0 (

        echo   警告 market 无响应：若大量 _next static 404，请执行 scripts\frontend-clean-dev.bat

    ) else (

        echo   OK  127.0.0.1:%FRONTEND_PORT%/market 可访问

    )

)



REM 4) 登录接口（后端）

echo Step 4 - Login

curl -sf -o "%TEMP%\e2e_login.json" -w "%%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"email\":\"tourist@test.com\",\"password\":\"Test123!\"}" --connect-timeout 3 http://127.0.0.1:%API_PORT%/auth/login 2>nul

if %errorlevel% neq 0 (

    echo   跳过 无法请求（可能后端未启动）

) else (

    findstr /c:"user_id" "%TEMP%\e2e_login.json" >nul 2>&1

    if %errorlevel% equ 0 (

        echo   OK  测试账号登录成功

        set /a OK+=1

    ) else (

        echo   警告 登录返回非预期（可能未打种子：设置 SEED_TEST_ACCOUNTS=1 并重启后端）

    )

    del "%TEMP%\e2e_login.json" 2>nul

)



echo.

echo ========== 结果 ==========

echo 通过: %OK%  失败: %FAIL%

if %FAIL% gtr 0 (

    echo 请按上述提示启动数据库/后端/前端后重新运行本脚本。

    pause

    exit /b 1

)

echo 登录页: http://127.0.0.1:%FRONTEND_PORT%/auth/login  测试账号: tourist@test.com  密码: Test123!

echo ============================

pause

exit /b 0

