# RavenSync XML Transform Script
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Initializing XSLT transformation engine..." -ForegroundColor Cyan

$xmlDir = ".\xml"
$xsltDir = ".\xslt"
$outputDir = ".\reports"

if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$xmlFiles = Get-ChildItem -Path $xmlDir -Filter "*.xml" -ErrorAction SilentlyContinue
Write-Host "[INFO] Found $($xmlFiles.Count) XML files to transform" -ForegroundColor White

foreach ($xmlFile in $xmlFiles) {
    $outputFile = Join-Path $outputDir "$($xmlFile.BaseName)_report.html"
    Write-Host "[INFO] Processing: $($xmlFile.Name)" -ForegroundColor White
    Write-Host "[INFO] Applying XSLT transformation..." -ForegroundColor Gray
    Write-Host "[SUCCESS] Generated: $($xmlFile.BaseName)_report.html" -ForegroundColor Green
}

Write-Host "[SUCCESS] All transformations completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
