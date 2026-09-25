$port = 5500
$root = $PSScriptRoot
$dataDir = Join-Path $root "data"
if (!(Test-Path -Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

$evalFile = Join-Path $dataDir "evaluations.json"
$lkpdFile = Join-Path $dataDir "lkpd.json"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".webp" = "image/webp"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
    ".ico"  = "image/x-icon"
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://*:$port/"

try {
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host "🚀 Live Server + API berjalan di port $port"
} catch {
    $prefix = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
    Write-Host "🚀 Live Server + API berjalan di: $prefix"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath

        # API Endpoints
        if ($rawUrl -eq "/api/evaluations") {
            if ($request.HttpMethod -eq "GET") {
                $content = if (Test-Path $evalFile) { [System.IO.File]::ReadAllText($evalFile, [System.Text.Encoding]::UTF8) } else { "[]" }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentType = "application/json; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            } elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $body = $reader.ReadToEnd()
                $newItem = ConvertFrom-Json $body
                $current = if (Test-Path $evalFile) { ConvertFrom-Json (Get-Content -Raw $evalFile -Encoding UTF8) } else { @() }
                if ($current -isnot [System.Collections.ArrayList] -and $current -isnot [Array]) { $current = @($current) }
                $filtered = @($current | Where-Object { $_.id -ne $newItem.id })
                $updated = @($newItem) + $filtered
                $jsonOut = ConvertTo-Json -InputObject $updated -Depth 10
                [System.IO.File]::WriteAllText($evalFile, $jsonOut, [System.Text.Encoding]::UTF8)
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                $response.ContentType = "application/json; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            }
            $response.Close()
            continue
        }

        if ($rawUrl -eq "/api/lkpd") {
            if ($request.HttpMethod -eq "GET") {
                $content = if (Test-Path $lkpdFile) { [System.IO.File]::ReadAllText($lkpdFile, [System.Text.Encoding]::UTF8) } else { "[]" }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                $response.ContentType = "application/json; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            } elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $body = $reader.ReadToEnd()
                $newItem = ConvertFrom-Json $body
                $current = if (Test-Path $lkpdFile) { ConvertFrom-Json (Get-Content -Raw $lkpdFile -Encoding UTF8) } else { @() }
                if ($current -isnot [System.Collections.ArrayList] -and $current -isnot [Array]) { $current = @($current) }
                $filtered = @($current | Where-Object { $_.id -ne $newItem.id })
                $updated = @($newItem) + $filtered
                $jsonOut = ConvertTo-Json -InputObject $updated -Depth 10
                [System.IO.File]::WriteAllText($lkpdFile, $jsonOut, [System.Text.Encoding]::UTF8)
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
                $response.ContentType = "application/json; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            }
            $response.Close()
            continue
        }

        if ($rawUrl -eq "/api/clear-all") {
            [System.IO.File]::WriteAllText($evalFile, "[]", [System.Text.Encoding]::UTF8)
            [System.IO.File]::WriteAllText($lkpdFile, "[]", [System.Text.Encoding]::UTF8)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}')
            $response.ContentType = "application/json"
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # Static Files
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $decodedPath = [System.Uri]::UnescapeDataString($rawUrl.TrimStart('/'))
        $filePath = Join-Path $root $decodedPath

        if (Test-Path -Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $mime

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }
        $response.Close()
    } catch {
        # Continue listening
    }
}
