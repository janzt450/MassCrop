
@echo off
echo ===========================================
echo MassCrop: Deploying to Neocities
echo ===========================================
echo.

if not exist "dist" (
    echo Error: 'dist' folder not found. Please run build.bat first.
    pause
    exit /b
)

echo [1/1] Pushing files to Neocities...
call neocities push dist

echo.
echo Deployment Complete!
echo.
pause
