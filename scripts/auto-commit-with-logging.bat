@echo off
setlocal enabledelayedexpansion

rem Ottiene il carattere Carriage Return (CR) per sovrascrivere la riga
for /f %%a in ('copy /z "%~f0" nul') do set "cr=%%a"

echo { CICLO AUTO-COMMIT E PUSH AVVIATO - %date% %time%
echo =================================================================
echo.

:loop
echo.
echo [1/5] Controllo modifiche con 'git status'
git status --porcelain > scripts\temp_git_status.txt 2>nul
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile controllare lo stato Git
    goto wait
)

rem Controlla se ci sono modifiche reali (escludendo il file temp_git_status.txt stesso)
findstr /v "^ M scripts\\temp_git_status.txt" scripts\temp_git_status.txt >nul
if %errorlevel% equ 0 (
    echo [INFO] Modifiche trovate. Procedo con il commit...
    echo.
    echo =================================================================
    echo [2/5] Eseguo 'git add -A'... (Output del comando qui sotto)
    echo -----------------------------------------------------------------
    git add -A
    if %errorlevel% neq 0 (
        echo [ERRORE] Impossibile aggiungere i file
        goto wait
    )
    echo -----------------------------------------------------------------
    echo.
    echo =================================================================
    echo [3/5] Eseguo 'git commit' con --no-verify per saltare pre-commit hooks...
    echo -----------------------------------------------------------------
    git commit -m "Auto-commit: %date% %time% - Modifiche automatiche" --no-verify
    if %errorlevel% neq 0 (
        echo [ERRORE] Il commit e' fallito. Controlla l'output qui sopra.
        echo [INFO] Potrebbe essere che non ci siano modifiche reali da committare.
        echo [INFO] Verifico se ci sono conflitti o problemi di configurazione...
        git status --porcelain | findstr "^UU" >nul
        if %errorlevel% equ 0 (
            echo [ERRORE] Trovati conflitti di merge! Risolvi manualmente.
        )
        goto wait
    )
    echo -----------------------------------------------------------------
    echo.
    echo [4/5] Commit completato con successo!
    echo =================================================================
    echo.
    echo [5/5] Eseguo 'git push'... (Output del comando qui sotto)
    echo -----------------------------------------------------------------
    git push origin master
    if %errorlevel% neq 0 (
        echo [ERRORE] Il push e' fallito. I commit sono solo locali.
        echo [INFO] Possibili cause: problemi di rete, credenziali, o repository remoto.
        echo [INFO] Riproverò al prossimo ciclo.
    ) else (
        echo -----------------------------------------------------------------
        echo [SUCCESSO] Push completato! Modifiche sincronizzate su GitHub.
        echo [INFO] Commit hash: 
        git rev-parse --short HEAD
    )
    echo =================================================================
) else (
    echo [INFO] Nessuna modifica da committare. Repository pulito.
    echo [INFO] Salto il commit e attendo il prossimo ciclo.
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