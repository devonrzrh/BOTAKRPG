@echo off
setlocal
set "push_directory=%~dp0"
set "push_option="
set "push_pause=1"
:args
if "%~1"=="" goto start
if /i "%~1"=="--dry-run" (
    set "push_option=--dry-run"
) else if /i "%~1"=="--no-pause" (
    set "push_pause="
) else (
    echo Usage: push-origin.bat [--dry-run] [--no-pause]
    exit /b 1
)
shift
goto args

:start
pushd "%push_directory%" || exit /b 1
where git.exe >nul 2>&1
if errorlevel 1 (
    echo Git is required. Install Git for Windows first.
    goto fail
)
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto fail
git symbolic-ref --quiet HEAD >nul 2>&1
if errorlevel 1 (
    echo No branch is checked out. Switch to a branch first.
    goto fail
)
git remote get-url --push origin >nul 2>&1
if errorlevel 1 (
    echo Remote origin is missing. Configure it before pushing.
    goto fail
)
echo Pushing committed changes on the current branch to origin...
git push %push_option% --set-upstream origin HEAD
set "push_exit=%errorlevel%"
goto finish

:fail
set "push_exit=1"
:finish
popd
if defined push_pause pause
endlocal & exit /b %push_exit%
