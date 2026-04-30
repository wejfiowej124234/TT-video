@echo off
REM Run AFTER fully exiting Cursor (check Task Manager for Cursor.exe).
REM Backs up this repo's Cursor workspaceStorage folder so the next open starts clean.
REM The folder name below is a hash of the full workspace path. After you rename or move the
REM repo, this HASH changes: search workspaceStorage subfolders for workspace.json containing your path.

set "ST=%APPDATA%\Cursor\User\workspaceStorage"
set "HASH=1a44e1f1e2682c9aa5fb527db9b1c091"
set "SRC=%ST%\%HASH%"

if not exist "%SRC%" (
  echo No cache folder at "%SRC%" - nothing to do.
  exit /b 0
)

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set TS=%%I
set "DEST=%ST%\%HASH%.bak-%TS%"

echo Renaming:
echo   "%SRC%"
echo   "%DEST%"
ren "%SRC%" "%HASH%.bak-%TS%" || (
  echo FAILED. Close all Cursor windows and end Cursor.exe in Task Manager, then retry.
  exit /b 1
)
echo Done. Open this repository folder in Cursor again.
