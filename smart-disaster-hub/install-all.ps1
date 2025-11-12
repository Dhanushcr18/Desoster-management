# Smart Disaster Hub - Installation Script
# Run this script to install all dependencies

Write-Host "🚀 Installing Smart Disaster Hub Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
Set-Location ".."

Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
Set-Location ".."

Write-Host ""
Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:7" -ForegroundColor White
Write-Host "2. Seed database: cd backend; npm run seed" -ForegroundColor White
Write-Host "3. Start backend: cd backend; npm run dev" -ForegroundColor White
Write-Host "4. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker Compose: docker-compose up --build" -ForegroundColor White
