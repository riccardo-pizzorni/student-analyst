@echo off
:: Configurazione personalizzabile
set CURSOR_USER=%USERNAME%
set SOURCE="C:\Users\%CURSOR_USER%\AppData\Roaming\Cursor"
set BACKUPDIR="%USERPROFILE%\Desktop\CursorChatBackup"
set TEMPDIR="%BACKUPDIR%\temp"
set BACKUP_INTERVAL=3600

:: Crea cartelle se non esistono
if not exist %BACKUPDIR% mkdir %BACKUPDIR%
if not exist %TEMPDIR% mkdir %TEMPDIR%

echo 🔄 Avvio backup automatico chat Cursor per utente: %CURSOR_USER%
echo 📁 Backup ogni %BACKUP_INTERVAL% secondi (1 ora)
echo.

:loop
set DATETIME=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set DATETIME=%DATETIME: =0%
set DEST=%TEMPDIR%\backup_%DATETIME%

echo 📝 Backup in corso: %DATETIME%
xcopy /E /I /Y %SOURCE% %DEST%
powershell Compress-Archive -Path %DEST% -DestinationPath %BACKUPDIR%\backup_%DATETIME%.zip
rmdir /S /Q %DEST%
echo ✅ Backup completato: backup_%DATETIME%.zip

echo ⏰ Attendo %BACKUP_INTERVAL% secondi...
timeout /t %BACKUP_INTERVAL%
goto loop 