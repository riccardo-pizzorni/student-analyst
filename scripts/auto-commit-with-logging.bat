@echo off
setlocal enabledelayedexpansion

rem Ottiene il carattere Carriage Return (CR) per sovrascrivere la riga
for /f %%a in ('copy /z "%~f0" nul') do set "cr=%%a"

echo { CICLO AUTO-COMMIT AVVIATO - %date% %time%
echo =================================================================
echo.

:loop
echo.
echo [1/4] Controllo modifiche con 'git status'
git status --porcelain > scripts\temp_git_status.txt
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile controllare lo stato Git
    goto wait
)

findstr /r "^" scripts\temp_git_status.txt >nul
if %errorlevel% equ 0 (
    echo [INFO] Modifiche trovate.
    echo.
    echo =================================================================
    echo [2/4] Eseguo 'git add -A'... (Output del comando qui sotto)
    echo -----------------------------------------------------------------
    git add -A
    if %errorlevel% neq 0 (
        echo [ERRORE] Impossibile aggiungere i file
        goto wait
    )
    echo -----------------------------------------------------------------
    echo.
    echo =================================================================
    echo [3/4] Eseguo 'git commit'... (Output del comando qui sotto)
    echo -----------------------------------------------------------------
    git commit -m "Auto-commit: %date% %time%" --no-verify
    if %errorlevel% neq 0 (
        echo [ERRORE] Il commit e' fallito. Controlla l'output qui sopra.}
        goto wait
    )
    echo -----------------------------------------------------------------
    echo.
    echo [4/4] Commit completato con successo!
    echo =================================================================
) else (
    echo [INFO] Nessuna modifica da committare.
)

:wait
echo.
echo Attendo 120 secondi prima del prossimo controllo...
for /l %%i in (120,-1,1) do (
    set /p "=Countdown: %%i secondi rimanenti... !cr!" <nul
    timeout /t 1 >nul
)
echo.
echo Countdown completato. Procedo con il controllo...

goto loop

endlocal