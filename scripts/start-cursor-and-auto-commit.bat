@echo off
cd /d "%~dp0\.."

echo Avvio Cursor e Auto-Commit System...
echo.

:: Verifica package.json
if not exist "package.json" (
    echo ERRORE: package.json non trovato!
    echo Assicurati di eseguire questo script dalla directory del progetto.
    pause
    exit /b 1
)

:: Cerca Cursor
set CURSOR_PATH=
if exist "%LOCALAPPDATA%\Programs\cursor\Cursor.exe" (
    set CURSOR_PATH="%LOCALAPPDATA%\Programs\cursor\Cursor.exe"
) else if exist "C:\Program Files\Cursor\Cursor.exe" (
    set CURSOR_PATH="C:\Program Files\Cursor\Cursor.exe"
) else if exist "C:\Users\%USERNAME%\AppData\Local\Programs\cursor\Cursor.exe" (
    set CURSOR_PATH="C:\Users\%USERNAME%\AppData\Local\Programs\cursor\Cursor.exe"
)

if "%CURSOR_PATH%"=="" (
    echo ERRORE: Cursor non trovato!
    echo Installa Cursor da: https://cursor.sh/
    pause
    exit /b 1
)

echo Cursor trovato: %CURSOR_PATH%

:: Verifica script necessari
if not exist "scripts\auto-commit-with-logging.bat" (
    echo ERRORE: auto-commit-with-logging.bat non trovato!
    pause
    exit /b 1
)

:: Avvia Cursor
echo Avvio Cursor...
start "" %CURSOR_PATH%
timeout /t 3 >nul

:: Avvia auto-commit
echo Avvio Auto-Commit System...
start "Auto-Commit" cmd /k "scripts\auto-commit-with-logging.bat"

:: Avvia backup se disponibile
if exist "scripts\backup-cursor-chat.bat" (
    echo Avvio Backup Chat...
    start "Backup Chat" cmd /k "scripts\backup-cursor-chat.bat"
)

:: Avvia monitor se disponibile
:: if exist "scripts\monitor-status.js" (
::     echo Avvio Monitor...
::     start "Monitor" cmd /k "node scripts\monitor-status.js"
:: )

echo.
echo Sistema avviato con successo!
echo - Cursor: Avviato
echo - Auto-Commit: Avviato
echo - Backup Chat: Avviato (se disponibile)
:: echo - Monitor: Avviato (se disponibile)
echo.
echo Le finestre sono state aperte separatamente.
echo Chiudi le finestre per fermare i servizi.
echo.
pause 