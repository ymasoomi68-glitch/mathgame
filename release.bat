@echo off 
chcp 65001 >nul 
cd /d "%%~dp0" 
echo ======================================== 
echo   Release Script - Kavoshgar 5 
echo ======================================== 
echo. 
node make-version.js 
echo. 
set /p notes="Release notes (English): " 
git add . 
git commit -m "Release update" 
git push 
echo. 
echo ✅ Pushed to GitHub! 
pause 
