#Requires -RunAsAdministrator
# CCleanKILLER — HTTP Bridge Server
# Bridges the HTML UI with the PowerShell scanner/remover engine

$Title = "CCleanKILLER-Server"
$Host.UI.RawUI.WindowTitle = $Title

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScannerPath = Join-Path $ScriptDir "scanner.ps1"

$Port = 8765
$Prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Prefix)

try {
    $listener.Start()
    Write-Host "[CCleanKILLER Server] Listening on $Prefix" -ForegroundColor Green
} catch {
    Write-Host "[CCleanKILLER Server] Failed to start: $_" -ForegroundColor Red
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS headers for local file access
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $path = $request.Url.AbsolutePath

        switch ($path) {
            "/scan" {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Scan requested" -ForegroundColor Cyan
                $result = & $ScannerPath -Action scan
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($result)
                $response.ContentType = "application/json"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.OutputStream.Close()
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Scan complete" -ForegroundColor Green
            }
            "/remove" {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Remove requested" -ForegroundColor Yellow

                # Read POST body
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $body = $reader.ReadToEnd()
                $reader.Close()

                $data = $body | ConvertFrom-Json
                $targets = $data.targets

                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Targets: $($targets -join ', ')" -ForegroundColor Yellow

                $result = & $ScannerPath -Action remove -Targets $targets
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($result)
                $response.ContentType = "application/json"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.OutputStream.Close()
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Removal complete" -ForegroundColor Green
            }
            "/status" {
                $status = @{ status = "running"; version = "1.0.0" } | ConvertTo-Json
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($status)
                $response.ContentType = "application/json"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.OutputStream.Close()
            }
            default {
                $response.StatusCode = 404
                $msg = '{"error":"Not found"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($msg)
                $response.ContentType = "application/json"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.OutputStream.Close()
            }
        }
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Error: $_" -ForegroundColor Red
    }
}

$listener.Stop()
