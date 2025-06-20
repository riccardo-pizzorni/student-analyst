@echo off
chcp 65001 > nul

:loop
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🔄 CICLO AUTO-COMMIT                     ║
echo ║                    📅 %date% %time%                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Imposta LOGFILE
if not exist "logs" mkdir "logs"
set LOGFILE=logs\auto-commit-main.log

echo [%date% %time%] Inizio nuovo ciclo di controllo. >> %LOGFILE%

:: Controlla se ci sono modifiche
git status --porcelain > temp_git_status.txt
set file_size=0
for %%A in (temp_git_status.txt) do set file_size=%%~zA

if %file_size% equ 0 (
    echo [%date% %time%] ⚠️  Nessuna modifica da committare.
    echo [%date% %time%] ⚠️  Nessuna modifica da committare. >> %LOGFILE%
    goto wait
)

echo ✅ Modifiche trovate! Procedo con commit e push...
echo [%date% %time%] ✅ Modifiche trovate! >> %LOGFILE%

:: Esegui test (TEMPORANEAMENTE DISABILITATO)
:: echo 🧪 Esecuzione test...
:: npm test > NUL 2>&1
:: if errorlevel 1 (
::     echo ❌ Test falliti! Il commit e il push verranno saltati.
::     echo [%date% %time%] ❌ Test falliti! Commit saltato. >> %LOGFILE%
::     goto wait
:: )
:: echo [%date% %time%] ✅ Test superati. >> %LOGFILE%

:: Commit e push
echo 🖊️  Aggiungo i file e creo il commit...
git add -A >> %LOGFILE% 2>&1
git commit -m "🔄 Auto-commit: %date% %time%" >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo ❌ Errore durante il commit. Controlla i log.
    echo [%date% %time%] ❌ Errore durante il commit. >> %LOGFILE%
    goto wait
)

echo 🚀 Push delle modifiche in corso...
git push >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo ❌ ERRORE DURANTE IL PUSH! Le modifiche sono state committate ma non inviate.
    echo [%date% %time%] ❌ Errore durante il push. >> %LOGFILE%
    echo.
    echo 📋  ULTIMI MESSAGGI DAL LOG (logs\auto-commit-main.log):
    echo ----------------------------------------------------------------
    powershell -Command "Get-Content logs\auto-commit-main.log -Tail 5"
    echo ----------------------------------------------------------------
    goto wait
)

echo ✅ Commit e push completati con successo!
echo [%date% %time%] ✅ Commit e push completati. >> %LOGFILE%

:wait
echo.
echo ----------------------------------------------------------------
echo ⏰ Attendo 2 minuti prima del prossimo controllo...
echo Per interrompere, chiudere questa finestra.
timeout /t 120 /nobreak > nul
goto loop 