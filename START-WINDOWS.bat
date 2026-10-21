@echo off
cd /d "%~dp0"
echo Installing packages (first run only)...
if not exist node_modules call npm install
echo Building the website and starting the server...
call npm run app
pause
