@echo off
set "HERE=%~dp0"
call "%HERE%dev/e2e-verify.bat" %*
