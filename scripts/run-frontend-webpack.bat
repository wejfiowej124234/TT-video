@echo off
set "HERE=%~dp0"
call "%HERE%dev/run-frontend-webpack.bat" %*
