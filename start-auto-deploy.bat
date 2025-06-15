@echo off
title Auto-Deploy Process
color 0A

echo ===================================
echo    Avvio Processo Auto-Deploy
echo ===================================
echo.
echo Il processo di auto-deploy sta partendo...
echo Questo terminale deve rimanere aperto!
echo.
echo Premi CTRL+C per fermare il processo
echo.
echo ===================================
echo.

cd %~dp0
cd scripts/automation
npm install
npm start

pause 