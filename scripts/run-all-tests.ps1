# Script PowerShell per eseguire tutti i test
Write-Host "🚀 Avvio dei test..." -ForegroundColor Cyan

# Crea le cartelle per i report se non esistono
New-Item -ItemType Directory -Force -Path "test-results/unit" | Out-Null
New-Item -ItemType Directory -Force -Path "test-results/e2e" | Out-Null
New-Item -ItemType Directory -Force -Path "coverage" | Out-Null

# Funzione per verificare l'esito del comando
function Test-CommandSuccess {
    param($ExitCode, $TestType)
    if ($ExitCode -ne 0) {
        Write-Host "❌ $TestType tests failed with exit code $ExitCode" -ForegroundColor Red
        exit $ExitCode
    }
}

# Pulisci le cartelle dei report
Write-Host "🧹 Pulizia delle cartelle dei report..." -ForegroundColor Yellow
Remove-Item -Path "test-results/unit/*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "test-results/e2e/*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "coverage/*" -Recurse -Force -ErrorAction SilentlyContinue

# Esegui i test Jest
Write-Host "🧪 Esecuzione dei test unitari e integrativi (Jest)..." -ForegroundColor Yellow
npm run test:unit
Test-CommandSuccess $LASTEXITCODE "Unit"

# Esegui i test Playwright
Write-Host "🎭 Esecuzione dei test E2E (Playwright)..." -ForegroundColor Yellow
npm run test:e2e
Test-CommandSuccess $LASTEXITCODE "E2E"

# Genera il report combinato
Write-Host "📊 Generazione del report combinato..." -ForegroundColor Yellow

$unitResults = Get-Content "test-results/unit/junit.xml" -Raw
$e2eResults = Get-Content "test-results/e2e/test-results.json" -Raw
$coverage = Get-Content "coverage/coverage-final.json" -Raw

$report = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    unit = $unitResults
    e2e = $e2eResults
    coverage = $coverage
} | ConvertTo-Json -Depth 10

Set-Content -Path "test-results/combined-report.json" -Value $report

Write-Host "✅ Tutti i test completati con successo!" -ForegroundColor Green
Write-Host "📝 Report disponibili in:"
Write-Host "   - Unit Tests: test-results/unit/junit.xml"
Write-Host "   - E2E Tests: test-results/e2e/test-results.json"
Write-Host "   - Coverage: coverage/index.html"
Write-Host "   - Combined: test-results/combined-report.json" 