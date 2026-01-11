$files = @(
    "scripts/dev.sh",
    "scripts/download-pocketbase.sh",
    "scripts/clean-migration.sh",
    "Justfile"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file)
        $content = $content.Replace("`r`n", "`n")
        [System.IO.File]::WriteAllText($file, $content)
        Write-Host "Converted $file to LF"
    } else {
        Write-Warning "File not found: $file"
    }
}
