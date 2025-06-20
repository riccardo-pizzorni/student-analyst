@echo off
setlocal

REM Avvia Cursor (modifica il percorso se necessario)
start "Cursor" "C:\Users\%USERNAME%\AppData\Local\Programs\Cursor\Cursor.exe"

REM Avvia auto-commit con countdown
start "Auto-Commit" cmd /c "%~dp0auto-commit-with-logging.bat"

REM Avvia backup chat
start "Backup Chat" cmd /c "%~dp0backup-cursor-chat.bat"

REM Avvia monitoraggio (Node.js richiesto)
start "Monitor" cmd /c "node %~dp0monitor-status.js"

endlocal

echo.
echo Sistema avviato con successo!
echo - Cursor: Avviato
echo - Auto-Commit: Avviato
echo - Backup Chat: Avviato (se disponibile)
echo - Monitor: Avviato (se disponibile)
echo.
echo Le finestre sono state aperte separatamente.
echo Chiudi le finestre per fermare i servizi.
echo.
pause 