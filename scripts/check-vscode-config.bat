@echo off
REM Script di verifica configurazione VS Code sicura
REM Controlla che non sia presente la sezione problematica explorer.fileNesting.patterns

echo.
echo ================================
echo  VS Code Configuration Check
echo ================================
echo.

REM Verifica esistenza file settings.json
if not exist ".vscode\settings.json" (
    echo ❌ File .vscode\settings.json non trovato
    echo    Configurazione VS Code non presente
    echo.
    pause
    exit /b 1
)

echo ✅ File .vscode\settings.json trovato
echo.

REM Controlla presenza sezione problematica
findstr /C:"explorer.fileNesting.patterns" ".vscode\settings.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ⚠️  ATTENZIONE: SEZIONE PROBLEMATICA TROVATA!
    echo.
    echo 🚨 La sezione "explorer.fileNesting.patterns" è presente
    echo    in .vscode\settings.json e può causare problemi critici:
    echo.
    echo    - VS Code non riconosce la cartella come workspace
    echo    - Messaggio: "The file is not displayed in the text editor because it is a directory"
    echo    - Explorer non funziona correttamente
    echo.
    echo 🛠️  AZIONE RICHIESTA:
    echo    1. Aprire .vscode\settings.json
    echo    2. Rimuovere completamente la sezione "explorer.fileNesting.patterns"
    echo    3. Salvare il file
    echo    4. Riavviare VS Code
    echo.
    echo 📖 Per dettagli completi vedere:
    echo    docs\configuration\VSCODE_WORKSPACE_CRITICAL_FIX.md
    echo.
    pause
    exit /b 1
)

echo ✅ Configurazione VS Code SICURA
echo    Nessuna sezione problematica trovata
echo.

REM Verifica funzionalità base file nesting (sicure)
findstr /C:"explorer.fileNesting.enabled" ".vscode\settings.json" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ File nesting base attivo (sicuro)
) else (
    echo ℹ️  File nesting base non configurato
)

echo.
echo 🎯 Configurazione verificata con successo!
echo    Il workspace dovrebbe funzionare correttamente
echo.

REM Verifica dimensione file (configurazioni troppo grandi possono essere problematiche)
for %%A in (".vscode\settings.json") do set filesize=%%~zA
if %filesize% gtr 10240 (
    echo.
    echo ⚠️  Configurazione molto grande (>10KB)
    echo    Considerare ottimizzazione se ci sono problemi di performance
    echo.
)

REM Backup automatico se non esiste
if not exist ".vscode\settings.json.backup" (
    echo.
    echo 💾 Creazione backup automatico...
    copy ".vscode\settings.json" ".vscode\settings.json.backup" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Backup creato: .vscode\settings.json.backup
    ) else (
        echo ❌ Errore nella creazione del backup
    )
    echo.
)

echo ================================
echo  Verifica completata
echo ================================
echo.
pause 