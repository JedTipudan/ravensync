# RavenSync Database Restore Script
# Restores MongoDB collections from a JSON backup created by db-backup.ps1

param(
    [string]$BackupFile = "",
    [string]$BackupDir  = ".\backups\db",
    [switch]$Latest,
    [switch]$Force
)

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] RavenSync Database Restore" -ForegroundColor Cyan

# Resolve which backup to use
if (-not $BackupFile) {
    if ($Latest) {
        $zips = Get-ChildItem -Path $BackupDir -Filter "db_backup_*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        if (-not $zips) { Write-Host "[ERROR] No backup files found in $BackupDir" -ForegroundColor Red; exit 1 }
        $BackupFile = $zips[0].FullName
        Write-Host "[INFO] Using latest backup: $($zips[0].Name)" -ForegroundColor White
    } else {
        # List available backups and let user pick
        $zips = Get-ChildItem -Path $BackupDir -Filter "db_backup_*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        if (-not $zips) { Write-Host "[ERROR] No backup files found in $BackupDir" -ForegroundColor Red; exit 1 }

        Write-Host "[INFO] Available backups:" -ForegroundColor White
        for ($i = 0; $i -lt $zips.Count; $i++) {
            $size = [math]::Round($zips[$i].Length / 1KB, 1)
            Write-Host "  [$i] $($zips[$i].Name) (${size}KB) - $($zips[$i].LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
        }
        $choice = Read-Host "Enter number to restore (default: 0)"
        if ($choice -eq "") { $choice = 0 }
        $BackupFile = $zips[[int]$choice].FullName
        Write-Host "[INFO] Selected: $(Split-Path $BackupFile -Leaf)" -ForegroundColor White
    }
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERROR] Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Safety confirmation unless -Force is passed
if (-not $Force) {
    Write-Host "[WARNING] This will OVERWRITE existing data in the database!" -ForegroundColor Yellow
    $confirm = Read-Host "Type YES to confirm restore"
    if ($confirm -ne "YES") { Write-Host "[INFO] Restore cancelled" -ForegroundColor White; exit 0 }
}

# Extract zip to temp folder
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$extractPath = Join-Path $env:TEMP "rs_restore_$timestamp"
Write-Host "[INFO] Extracting backup archive..." -ForegroundColor White
Expand-Archive -Path $BackupFile -DestinationPath $extractPath -Force

# Check manifest
$manifestFile = Join-Path $extractPath "manifest.json"
if (Test-Path $manifestFile) {
    $manifest = Get-Content $manifestFile | ConvertFrom-Json
    Write-Host "[INFO] Backup created: $($manifest.createdAt)" -ForegroundColor White
}

# Node.js inline restore script
$nodeScript = @"
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const extractPath = process.argv[2];
const jsonFiles = fs.readdirSync(extractPath).filter(f => f.endsWith('.json') && f !== 'manifest.json');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[INFO] Connected to MongoDB');

  for (const file of jsonFiles) {
    const col = path.basename(file, '.json');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(extractPath, file), 'utf8'));
      if (!data.length) { console.log('[INFO] Skipped ' + col + ': empty'); continue; }

      const collection = mongoose.connection.db.collection(col);
      await collection.deleteMany({});

      // Convert string _id back to ObjectId to keep Mongoose compatibility
      const docs = data.map(doc => ({
        ...doc,
        _id: typeof doc._id === 'string' ? new mongoose.Types.ObjectId(doc._id) : doc._id
      }));

      await collection.insertMany(docs, { ordered: false });
      console.log('[SUCCESS] Restored ' + col + ': ' + docs.length + ' documents');
    } catch (e) {
      console.log('[ERROR] Failed ' + col + ': ' + e.message);
    }
  }

  await mongoose.disconnect();
  console.log('[SUCCESS] Restore completed');
}

run().catch(e => { console.error('[ERROR] ' + e.message); process.exit(1); });
"@

$tempScript = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\_rs_db_restore_$timestamp.js")
$nodeScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "[INFO] Restoring collections..." -ForegroundColor White

$result = node $tempScript $extractPath 2>&1
$result | ForEach-Object { Write-Host $_ -ForegroundColor $(if ($_ -match '\[ERROR\]') { 'Red' } elseif ($_ -match '\[WARNING\]') { 'Yellow' } elseif ($_ -match '\[SUCCESS\]') { 'Green' } else { 'White' }) }

# Cleanup
Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
    Write-Host "[SUCCESS] Database restored from: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Green
    Write-Host "[INFO] Restart the RavenSync server to reflect restored data" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Restore encountered errors - check output above" -ForegroundColor Red
}
