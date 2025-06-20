@echo off
setlocal
set "SRC=%USERPROFILE%\AppData\Roaming\Cursor\chat-backup.json"
set "DEST=%~dp0..\evidence\cursor-chat-backup-%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%.json"
if exist "%SRC%" (
  copy "%SRC%" "%DEST%"
  echo Backup eseguito: %DEST%
) else (
  echo File chat non trovato: %SRC%
)
endlocal 