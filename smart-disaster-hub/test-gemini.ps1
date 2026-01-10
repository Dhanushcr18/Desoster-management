Write-Host "`nTesting Gemini AI Chatbot...`n" -ForegroundColor Yellow

try {
    $body = @{
        message = "What should I do during an earthquake?"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ SUCCESS! Gemini AI is working!`n" -ForegroundColor Green
    Write-Host "Question: What should I do during an earthquake?`n" -ForegroundColor White
    Write-Host "AI Response:" -ForegroundColor Cyan
    Write-Host $response.response -ForegroundColor White
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "`nMake sure the backend server is running:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
}
