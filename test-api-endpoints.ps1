Write-Host "Testing backend endpoints on Render..." -ForegroundColor Green

# Test health endpoint
Write-Host "`n1. Testing /health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://student-analyst.onrender.com/health" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api endpoint
Write-Host "`n2. Testing /api endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://student-analyst.onrender.com/api" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test /api/v1 endpoint
Write-Host "`n3. Testing /api/v1 endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://student-analyst.onrender.com/api/v1" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nTesting completed." -ForegroundColor Green 