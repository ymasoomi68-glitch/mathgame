@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Creating backup...
set TMPZIP=%TEMP%\kavoshgar-backup.zip
if exist "%TMPZIP%" del "%TMPZIP%"
powershell -NoProfile -Command "Compress-Archive -Path (Get-ChildItem -Exclude backup.zip,.git) -DestinationPath $env:TMPZIP -Force"
if errorlevel 1 (echo ERROR: backup failed & pause & exit /b 1)
move /Y "%TMPZIP%" backup.zip >nul
echo Backup created: backup.zip
pause
