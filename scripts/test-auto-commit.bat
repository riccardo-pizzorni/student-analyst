@echo off
echo Test Auto-Commit Script
echo ======================
echo.

echo [1/3] Verifico lo stato Git attuale...
git status --porcelain > scripts\temp_git_status.txt 2>nul
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile controllare lo stato Git
    exit /b 1
)

echo [2/3] Controllo se ci sono modifiche reali...
findstr /v "^ M scripts\\temp_git_status.txt" scripts\temp_git_status.txt >nul
if %errorlevel% equ 0 (
    echo [INFO] Modifiche trovate - lo script dovrebbe fare commit
    type scripts\temp_git_status.txt
) else (
    echo [INFO] Nessuna modifica da committare - lo script dovrebbe aspettare
)

echo [3/3] Test completato!
echo.
echo Lo script auto-commit e' configurato correttamente.
echo Ora puoi avviarlo con: scripts\auto-commit-with-logging.bat
echo.
pause 