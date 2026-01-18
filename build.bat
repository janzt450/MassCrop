
@echo off
setlocal
echo ===========================================
echo MassCrop: Single-Step Production Build
echo ===========================================
echo.

echo [1/2] Syncing dependencies...
call npm install --no-fund --no-audit

echo [2/2] Generating offline bundle...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===========================================
    echo SUCCESS: App ready for deployment!
    echo -------------------------------------------
    echo Your "dist" folder now contains index.html
    echo and an "assets" folder.
    echo.
    echo Upload ALL contents of "dist" to Neocities.
    echo ===========================================
) else (
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERROR: Build failed. Check the error above.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
)

echo.
pause
