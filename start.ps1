# RavenSync — Presentation Startup Script
# Usage: Right-click -> Run with PowerShell  OR  .\start.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RavenSync — Starting Services        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker is running
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      Docker is running." -ForegroundColor Green

# 2. Start Docker Compose (Kafka + MongoDB)
Write-Host "[2/4] Starting Kafka + MongoDB via Docker Compose..." -ForegroundColor Yellow
docker compose -f "$root\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Compose failed to start." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      Containers started." -ForegroundColor Green

# 3. Wait for Kafka to be healthy
Write-Host "[3/4] Waiting for Kafka to be ready..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
do {
    Start-Sleep -Seconds 3
    $waited += 3
    $health = docker inspect --format='{{.State.Health.Status}}' ravensync-kafka 2>&1
    Write-Host "      Kafka status: $health ($waited`s elapsed)" -ForegroundColor Gray
} while ($health -ne "healthy" -and $waited -lt $maxWait)

if ($health -ne "healthy") {
    Write-Host "[WARN] Kafka health check timed out — app will use offline queue fallback." -ForegroundColor Yellow
} else {
    Write-Host "      Kafka is healthy." -ForegroundColor Green
}

# 4. Start Node.js backend
Write-Host "[4/4] Starting RavenSync backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RavenSync running at http://localhost:5000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$root\backend"
npm run dev
