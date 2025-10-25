try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/debug/diag-email" -Method Get -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    $json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Request failed with status: $($_.Exception.Response.StatusCode)"
    if ($_.ErrorDetails.Message) {
        $json = $_.ErrorDetails.Message | ConvertFrom-Json
        $json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "Error: $_"
    }
}
