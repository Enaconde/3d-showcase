# Re-take preview images for the showcase cards. Run while serve.ps1 is running.
# Usage: powershell -ExecutionPolicy Bypass -File capture-previews.ps1 [demo names...]
param([string[]]$Demos = @())
$root = $PSScriptRoot
if (-not $Demos) { $Demos = Get-ChildItem "$root\demos" -Directory | ForEach-Object Name }
$browser = @("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$profile = Join-Path $env:TEMP "showcase-capture-profile"
$out = Join-Path $root "previews"; New-Item -ItemType Directory -Force $out | Out-Null
Add-Type -AssemblyName System.Drawing
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq "image/jpeg"
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]84)

foreach ($d in $Demos) {
  $png = Join-Path $env:TEMP "showcase-$d.png"
  Start-Process -FilePath $browser -Wait -WindowStyle Hidden -ArgumentList "--headless=new", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--hide-scrollbars", "--user-data-dir=$profile", "--window-size=1600,1000",
    "--virtual-time-budget=6000", "--screenshot=$png", "http://localhost:8770/demos/$d/?capture=1"
  # Downscale to 1280x800 JPG for fast loading as a 3D texture
  $src = [System.Drawing.Image]::FromFile($png)
  $dst = New-Object System.Drawing.Bitmap 1280, 800
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = "HighQualityBicubic"; $g.DrawImage($src, 0, 0, 1280, 800)
  $dst.Save((Join-Path $out "$d.jpg"), $jpeg, $params)
  $g.Dispose(); $dst.Dispose(); $src.Dispose(); Remove-Item $png
  Write-Host "captured $d"
}
