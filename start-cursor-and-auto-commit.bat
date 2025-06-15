@echo off
start "Cursor" "C:\Users\Filippo Pizzorni\AppData\Local\Programs\cursor\Cursor.exe"
start "Auto Commit & Push" cmd /k "cd /d %~dp0 && auto-commit-push.bat" 