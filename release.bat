@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Release Script - Kavoshgar 5
echo ========================================
echo.
set /p notes=Release notes: 
if "%notes%"=="" set notes=Update
node make-version.js "%notes%"
if errorlevel 1 goto fail
git add .
git diff --cached --quiet
if errorlevel 1 git commit -m "Release: %notes%"
git push
if errorlevel 1 goto fail
echo.
echo Pushed to GitHub!
pause
exit /b 0
:fail
echo.
echo ERROR: release failed. See messages above.
pause
exit /b 1
