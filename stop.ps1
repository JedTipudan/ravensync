# RavenSync — Stop All Services
$root = $PSScriptRoot
Write-Host "Stopping RavenSync Docker services..." -ForegroundColor Yellow
docker compose -f "$root\docker-compose.yml" down
Write-Host "All services stopped." -ForegroundColor Green
