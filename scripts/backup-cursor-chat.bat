@echo off
set SOURCE="C:\Users\filpi\AppData\Roaming\Cursor"
set BACKUPDIR="%USERPROFILE%\Desktop\CursorChatBackup"
set TEMPDIR="%BACKUPDIR%\temp"

if not exist %BACKUPDIR% mkdir %BACKUPDIR%
if not exist %TEMPDIR% mkdir %TEMPDIR%

:loop
set DATETIME=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set DATETIME=%DATETIME: =0%
set DEST=%TEMPDIR%\backup_%DATETIME%
xcopy /E /I /Y %SOURCE% %DEST%
powershell Compress-Archive -Path %DEST% -DestinationPath %BACKUPDIR%\backup_%DATETIME%.zip
rmdir /S /Q %DEST%
REM Attendi 20 minuti (1200 secondi)
timeout /t 1200
goto loop 