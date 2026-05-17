# RavenSync Log Cleanup Script
param([int]$DaysToKeep = 30)

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting log cleanup service..." -ForegroundColor Cyan
Write-Host "[INFO] Retention policy: $DaysToKeep days" -ForegroundColor White

$logDir = ".\logs"
$cutoffDate = (Get-Date).AddDays(-$DaysToKeep)
$totalFreed = 0

if (Test-Path $logDir) {
    $oldLogs = Get-ChildItem -Path $logDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
    Write-Host "[INFO] Found $($oldLogs.Count) log files older than $DaysToKeep days" -ForegroundColor White
    foreach ($log in $oldLogs) {
        $size = [math]::Round($log.Length / 1MB, 2)
        $totalFreed += $log.Length
        Remove-Item $log.FullName -Force
        Write-Host "[DELETED] $($log.Name) (${size}MB)" -ForegroundColor Yellow
    }
    $freedMB = [math]::Round($totalFreed / 1MB, 2)
    Write-Host "[SUCCESS] Freed ${freedMB}MB of disk space" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Log directory not found" -ForegroundColor Yellow
}

Write-Host "[SUCCESS] Log cleanup completed" -ForegroundColor Green
