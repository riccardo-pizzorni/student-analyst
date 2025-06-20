@echo off
setlocal

echo 🔧 Risoluzione automatica warning ESLint...

REM Risolve warning variabili non utilizzate nei catch block
powershell -Command "(Get-Content 'backend\src\routes\apiRoutes.ts') -replace 'catch \(error\)', 'catch (_error)' | Set-Content 'backend\src\routes\apiRoutes.ts'"

REM Risolve warning variabili non utilizzate con underscore
powershell -Command "(Get-Content 'backend\src\routes\apiRoutes.ts') -replace 'const \{ symbol \}', 'const { symbol: _symbol }' | Set-Content 'backend\src\routes\apiRoutes.ts'"

REM Applica formattazione Prettier
npx prettier --write backend/src/routes/apiRoutes.ts

echo ✅ Warning ESLint risolti automaticamente!
echo 📝 Esegui 'git add -A && git commit' per salvare le modifiche.

endlocal 