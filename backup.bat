@echo off 
chcp 65001 >nul 
cd /d "%%~dp0" 
echo Creating backup... 
powershell -Command "Compress-Archive -Path * -DestinationPath 'backup.zip' -Force" 
echo ✅ Backup created: backup.zip 
pause 
