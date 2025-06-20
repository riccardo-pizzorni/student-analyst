@echo off
echo ========================================
echo TEST AUTO-COMMIT E PUSH
echo ========================================
echo.

echo [1/3] Creo un file di test...
echo Test automatico - %date% %time% > test-auto-commit-%random%.txt
echo File creato: test-auto-commit-%random%.txt
echo.

echo [2/3] Verifico lo stato Git...
git status
echo.

echo [3/3] Avvio lo script di auto-commit...
echo Lo script dovrebbe rilevare la modifica entro 2 minuti
echo e fare commit + push automaticamente.
echo.
echo Premi CTRL+C per interrompere il test.
echo.

scripts\auto-commit-with-logging.bat 