$body = @{
    tickers = @("AAPL")
    startDate = "2024-01-01"
    endDate = "2024-12-31"
    frequency = "daily"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://student-analyst.onrender.com/api/analysis" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
} 