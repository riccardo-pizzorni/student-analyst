Write-Host "Testing /api/analysis endpoint..." -ForegroundColor Green

$body = @{
    tickers = @("AAPL", "MSFT", "GOOGL")
    startDate = "2024-01-01"
    endDate = "2024-12-31"
    frequency = "daily"
} | ConvertTo-Json

Write-Host "Request body: $body" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://student-analyst.onrender.com/api/analysis" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Test completed." -ForegroundColor Green 