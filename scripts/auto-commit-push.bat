@echo off
cd ..
:loop
git status --porcelain > scripts/temp_git_status.txt
for /f %%i in (scripts/temp_git_status.txt) do (
    git add -A
    git commit -m "auto-commit"
    git push
    goto aftercommit
)
:aftercommit
del scripts/temp_git_status.txt
REM Attendi 2 minuti (120 secondi)
timeout /t 120
goto loop 