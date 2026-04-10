@echo off
chcp 65001 >nul
REM 仅编译 API（修改 CORS 或代码后执行，再重启 API）。从项目根运行: scripts\build-api.bat
set "ROOT=%~dp0\.."
cd /d "%ROOT%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\check-sqlx-migration-prefixes.ps1"
if errorlevel 1 (
    echo 编译已中止：迁移文件名版本前缀重复，请修复 crates\api\migrations。
    pause
    exit /b 1
)
echo 正在编译 traveltrust-api...
cargo build -p traveltrust-api
if errorlevel 1 (
    echo 编译失败。
    pause
    exit /b 1
)
echo [OK] 编译完成。请重启 API：scripts\start-api-with-seed.bat 或 cargo run -p traveltrust-api
pause
