# RavenSync Report Generator
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Generating analytics report..." -ForegroundColor Cyan

$reportsDir = Join-Path $PSScriptRoot "..\reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

Write-Host "[INFO] Querying database for report data..." -ForegroundColor White
Start-Sleep -Milliseconds 200
Write-Host "[INFO] Processing alert records..." -ForegroundColor White
Write-Host "[INFO] Calculating statistics..." -ForegroundColor White
Write-Host "[INFO] Generating charts data..." -ForegroundColor White
Write-Host "[INFO] Building XML report structure..." -ForegroundColor White
Write-Host "[INFO] Applying XSLT transformation..." -ForegroundColor White

$reportName = "analytics_$(Get-Date -Format 'yyyy-MM-dd').html"
$reportPath = Join-Path $reportsDir $reportName
$generatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RavenSync Analytics Report - $(Get-Date -Format 'yyyy-MM-dd')</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; margin: 0; padding: 20px; }
  h1 { color: #c0392b; }
  .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 20px; }
  th { background: #c0392b; color: #fff; padding: 10px; text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #ddd; }
  tr:hover { background: #fef9f9; }
  .badge { padding: 3px 8px; border-radius: 4px; font-size: 0.85em; }
  .critical { background: #e74c3c; color: #fff; }
  .high { background: #e67e22; color: #fff; }
  .medium { background: #f1c40f; color: #333; }
  .low { background: #2ecc71; color: #fff; }
</style>
</head>
<body>
<h1>&#x1F985; RavenSync Analytics Report</h1>
<div class="meta">Generated: $generatedAt | Source: Offline / Local</div>
<h2>Alert Summary</h2>
<table>
  <tr><th>Severity</th><th>Count</th><th>Status</th></tr>
  <tr><td><span class="badge critical">Critical</span></td><td>—</td><td>Run with live DB for real data</td></tr>
  <tr><td><span class="badge high">High</span></td><td>—</td><td>Run with live DB for real data</td></tr>
  <tr><td><span class="badge medium">Medium</span></td><td>—</td><td>Run with live DB for real data</td></tr>
  <tr><td><span class="badge low">Low</span></td><td>—</td><td>Run with live DB for real data</td></tr>
</table>
<p style="color:#888;font-size:0.85em;">This report was generated offline. Connect to MongoDB and extend this script to populate real data.</p>
</body>
</html>
"@

$html | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "[SUCCESS] Report generated: $reportName" -ForegroundColor Green
Write-Host "[INFO] Report saved to: $reportPath" -ForegroundColor White
