@echo off
chcp 65001 > nul

:loop
cls
echo.
echo =================================================================
echo  CICLO AUTO-COMMIT AVVIATO - %date% %time%
echo =================================================================
echo.

echo.
echo [1/4] Controllo modifiche con 'git status'
git status --porcelain > temp_git_status.txt
set file_size=0
for %%A in (temp_git_status.txt) do set file_size=%%~zA

if %file_size% equ 0 (
    echo.
    echo [INFO] Nessuna modifica trovata.
    goto wait
)

echo [INFO] Modifiche trovate.
echo.
echo =================================================================
echo [2/4] Eseguo 'git add -A'... (Output del comando qui sotto)
echo -----------------------------------------------------------------
git add -A
echo -----------------------------------------------------------------
echo.
echo =================================================================
echo [3/4] Eseguo 'git commit'... (Output del comando qui sotto)
echo -----------------------------------------------------------------
git commit -m "Auto-commit: %date% %time%"
if errorlevel 1 (
    echo.
    echo [ERRORE] Il commit e' fallito. Controlla l'output qui sopra.
    goto wait
)
echo -----------------------------------------------------------------
echo.
echo =================================================================
echo [4/4] Eseguo 'git push'... (Output del comando qui sotto)
echo -----------------------------------------------------------------
git push
if errorlevel 1 (
    echo.
    echo [ERRORE] Il push e' fallito. Controlla l'output qui sopra.
    goto wait
)
echo -----------------------------------------------------------------
echo.
echo [SUCCESSO] Ciclo completato.

:wait
echo.
echo =================================================================
echo  Attendo 2 minuti prima del prossimo ciclo...
echo  (Per interrompere, chiudere questa finestra)
echo =================================================================
timeout /t 120 /nobreak > nul
goto loop