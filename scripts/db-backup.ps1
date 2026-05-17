# RavenSync Database Backup Script
# Exports all MongoDB collections to JSON files using Node.js

param(
    [string]$BackupDir = ".\backups\db"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "db_backup_$timestamp"
$backupPath = Join-Path $BackupDir $backupName

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting RavenSync database backup..." -ForegroundColor Cyan
Write-Host "[INFO] Backup destination: $backupPath" -ForegroundColor White

# Create backup directory
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Write-Host "[INFO] Created backup directory" -ForegroundColor White
}

# Node.js inline export script
$nodeScript = @"
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const backupPath = process.argv[2];
const collections = ['users', 'alerts', 'channels', 'auditlogs', 'announcements', 'messages'];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[INFO] Connected to MongoDB');

  for (const col of collections) {
    try {
      const data = await mongoose.connection.db.collection(col).find({}).toArray();
      const file = path.join(backupPath, col + '.json');
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      console.log('[SUCCESS] Exported ' + col + ': ' + data.length + ' documents');
    } catch (e) {
      console.log('[WARNING] Skipped ' + col + ': ' + e.message);
    }
  }

  // Save backup manifest
  const manifest = { createdAt: new Date().toISOString(), collections, mongoUri: process.env.MONGODB_URI.replace(/:\/\/.*@/, '://***@') };
  fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('[INFO] Manifest saved');

  await mongoose.disconnect();
  console.log('[SUCCESS] Database backup completed');
}

run().catch(e => { console.error('[ERROR] ' + e.message); process.exit(1); });
"@

$tempScript = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\_rs_db_backup_$timestamp.js")
$nodeScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "[INFO] Exporting collections..." -ForegroundColor White

# Run the Node.js export
$result = node $tempScript $backupPath 2>&1
$result | ForEach-Object { Write-Host $_ -ForegroundColor $(if ($_ -match '\[ERROR\]') { 'Red' } elseif ($_ -match '\[WARNING\]') { 'Yellow' } elseif ($_ -match '\[SUCCESS\]') { 'Green' } else { 'White' }) }

Remove-Item $tempScript -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
    # Compress the backup folder
    $zipPath = "$backupPath.zip"
    Compress-Archive -Path "$backupPath\*" -DestinationPath $zipPath -Force
    Remove-Item $backupPath -Recurse -Force

    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
    Write-Host "[SUCCESS] Backup archive: $backupName.zip (${zipSize}KB)" -ForegroundColor Green
    Write-Host "[INFO] Location: $((Resolve-Path $BackupDir).Path)" -ForegroundColor White
    Write-Host "[INFO] To restore: run db-restore.ps1 -BackupFile '$zipPath'" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Backup failed - check MongoDB connection" -ForegroundColor Red
}
