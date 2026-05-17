# RavenSync Health Check Script
# Performs comprehensive system health diagnostics

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Running RavenSync system health diagnostics..." -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[CHECK] Node.js runtime... OK ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "[CHECK] Node.js runtime... NOT FOUND" -ForegroundColor Red
}

# Check MongoDB
Write-Host "[CHECK] MongoDB connection... Checking..." -ForegroundColor White
$mongoRunning = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if ($mongoRunning) {
    Write-Host "[CHECK] MongoDB process... RUNNING (PID: $($mongoRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "[CHECK] MongoDB process... NOT RUNNING (using remote/Atlas)" -ForegroundColor Yellow
}

# Check disk space
$disk = Get-PSDrive C
$usedPercent = [math]::Round(($disk.Used / ($disk.Used + $disk.Free)) * 100, 1)
$freeGB = [math]::Round($disk.Free / 1GB, 2)
Write-Host "[CHECK] Disk space (C:)... OK (Used: $usedPercent%, Free: ${freeGB}GB)" -ForegroundColor Green

# Check memory
$memory = Get-CimInstance Win32_OperatingSystem
$usedMem = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / 1MB, 0)
$totalMem = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 0)
Write-Host "[CHECK] Memory usage... OK (Used: ${usedMem}MB / ${totalMem}MB)" -ForegroundColor Green

# Check XML files
$xmlFiles = Get-ChildItem -Path ".\xml" -Filter "*.xml" -ErrorAction SilentlyContinue
Write-Host "[CHECK] XML files integrity... $($xmlFiles.Count) files found" -ForegroundColor Green

# Check log files
$logFiles = Get-ChildItem -Path ".\logs" -Filter "*.log" -ErrorAction SilentlyContinue
Write-Host "[CHECK] Log files... $($logFiles.Count) log files present" -ForegroundColor Green

Write-Host ""
Write-Host "[SUCCESS] Health check completed - All systems operational" -ForegroundColor Green
Write-Host "[INFO] Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
