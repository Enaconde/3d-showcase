# Local static server for the showcase (ES modules need http://, not file://).
param([int]$Port = 8770)
$root = $PSScriptRoot
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript"; ".css" = "text/css"
  ".json" = "application/json"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".webp" = "image/webp"
  ".svg" = "image/svg+xml"; ".hdr" = "application/octet-stream"; ".glb" = "model/gltf-binary"; ".mp4" = "video/mp4"; ".woff2" = "font/woff2"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $name = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    $path = [IO.Path]::GetFullPath((Join-Path $root $name))
    if (Test-Path $path -PathType Container) {
      if (-not $ctx.Request.Url.AbsolutePath.EndsWith("/")) {
        $res.Redirect($ctx.Request.Url.AbsolutePath + "/"); continue
      }
      $path = Join-Path $path "index.html"
    }
    if ((Test-Path $path -PathType Leaf) -and $path.StartsWith($root)) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $type = $types[[IO.Path]::GetExtension($path).ToLower()]
      if ($type) { $res.ContentType = $type }
      $res.Headers.Add("Cache-Control", "no-cache")
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $res.StatusCode = 404 }
  } catch { $res.StatusCode = 500 } finally { $res.Close() }
}
