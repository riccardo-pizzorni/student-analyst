@echo off
:loop
git status --porcelain > temp_git_status.txt
for /f %%i in (temp_git_status.txt) do (
    git add .
    git commit -m "auto-commit"
    git push
    goto aftercommit
)
:aftercommit
del temp_git_status.txt
REM Attendi 2 minuti (120 secondi)
timeout /t 120
goto loop 