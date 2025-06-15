@echo off
cd /d "%~dp0"
start "" "C:\Users\filpi\AppData\Local\Programs\cursor\Cursor.exe"
start "" cmd /k "auto-commit-push.bat"
start "" cmd /k "backup-cursor-chat.bat" 