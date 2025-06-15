@echo off
cd ..
:loop
REM Salva lo stato git temporaneo per controllare modifiche
git status --porcelain > scripts/temp_git_status.txt
for /f %%i in (scripts/temp_git_status.txt) do (
    git add -A
    git commit -m "auto-commit"
    git push
    goto aftercommit
)
:aftercommit
REM Cancella il file temporaneo senza warning se non esiste
del scripts/temp_git_status.txt 2>nul
REM Attendi 2 minuti (120 secondi)
timeout /t 120
goto loop 