@echo off
setlocal

cd /d "%~dp0\.."

echo [hyperteams] checking setup...

set "HT_NODE=%~dp0..\..\runtime\node"
if exist "%HT_NODE%\node.exe" set "PATH=%HT_NODE%;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
    echo.>&2
    echo [hyperteams] X Node.js not found. Install it, then run again:>&2
    echo [hyperteams]   https://nodejs.org/  ^(check with 'node --version'^)>&2
    echo.>&2
    pause
    exit /b 1
)

if not exist "server.js" (
    echo.>&2
    echo [hyperteams] X server.js not found - release package is damaged.>&2
    echo.>&2
    pause
    exit /b 1
)

if not exist ".env.local" (
    echo.>&2
    echo [hyperteams] X .env.local not found. Run setup first:>&2
    echo [hyperteams]   node scripts\setup.mjs>&2
    echo.>&2
    pause
    exit /b 1
)

echo [hyperteams] + setup ok
echo.
echo ================================================================
echo [hyperteams] Starting HyperTeams...
echo [hyperteams] The dashboard URL is printed below by [supervise].
echo [hyperteams] Stop: Ctrl-C (or close this window)
echo ================================================================
echo.

node "%CD%\scripts\supervise.mjs"

if errorlevel 1 (
    echo.
    echo [hyperteams] Exited with an error - see the messages above.
    pause
)
