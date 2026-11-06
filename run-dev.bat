@echo off
setlocal
pushd "%~dp0" || exit /b 1

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo Node.js and npm are required. Install Node.js 22 or newer.
    popd
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
    echo Dependencies are missing. Run npm install in this folder first.
    popd
    pause
    exit /b 1
)

call npm.cmd run dev -- %*
set "server_exit=%errorlevel%"
popd
if not "%server_exit%"=="0" pause
endlocal & exit /b %server_exit%
