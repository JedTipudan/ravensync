# RavenSync XML Backup Script
# Backs up all XML data files to a timestamped archive

param(
    [string]$BackupDir = ".\backups",
    [string]$XmlDir = ".\xml"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "xml_backup_$timestamp"
$backupPath = Join-Path $BackupDir $backupName

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting XML backup process..." -ForegroundColor Cyan
Write-Host "[INFO] Scanning XML directory: $XmlDir" -ForegroundColor White

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[INFO] Created backup directory: $BackupDir" -ForegroundColor White
}

$xmlFiles = Get-ChildItem -Path $XmlDir -Filter "*.xml" -ErrorAction SilentlyContinue
$fileCount = if ($xmlFiles) { $xmlFiles.Count } else { 0 }

Write-Host "[INFO] Found $fileCount XML files" -ForegroundColor White

if ($fileCount -gt 0) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    foreach ($file in $xmlFiles) {
        Copy-Item $file.FullName -Destination $backupPath
        Write-Host "[INFO] Backed up: $($file.Name) ($([math]::Round($file.Length/1KB, 1))KB)" -ForegroundColor Gray
    }
    Compress-Archive -Path "$backupPath\*" -DestinationPath "$backupPath.zip" -Force
    Remove-Item $backupPath -Recurse -Force
    Write-Host "[SUCCESS] Backup archive created: $backupName.zip" -ForegroundColor Green
} else {
    Write-Host "[WARNING] No XML files found to backup" -ForegroundColor Yellow
}

Write-Host "[SUCCESS] XML backup completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
