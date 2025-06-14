@echo off
:loop
git add .
git commit -m "Auto-commit"
git push
timeout /t 300
goto loop 