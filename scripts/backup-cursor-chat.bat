@echo off
set SOURCE="C:\Users\filpi\AppData\Roaming\Cursor"
set BACKUPDIR="%USERPROFILE%\Desktop\CursorChatBackup"

if not exist %BACKUPDIR% mkdir %BACKUPDIR%

:loop
set DATETIME=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set DATETIME=%DATETIME: =0%
set DEST=%BACKUPDIR%\backup_%DATETIME%
xcopy /E /I /Y %SOURCE% %DEST%
timeout /t 300
goto loop 