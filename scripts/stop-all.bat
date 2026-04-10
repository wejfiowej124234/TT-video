@echo off
set "HERE=%~dp0"
call "%HERE%dev/stop-all.bat" %*
