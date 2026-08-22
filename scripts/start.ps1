param(
    [string]$Port = ""
)

$ErrorActionPreference = "Stop"

function Write-Log { Write-Host "[hyperteams] $args" -ForegroundColor Cyan }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor Red; exit 1 }
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location "$scriptDir\.."

Write-Log "Checking the setup..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "Node.js not found. Install it on this system and run again:`n    https://nodejs.org/  (then check 'node --version')"
}

if (-not (Test-Path "server.js")) {
    Write-Error-Custom "server.js is missing — the release package is corrupted."
}
if (-not (Test-Path ".env.local")) {
    Write-Error-Custom ".env.local is missing. Configure it with:`n    node scripts\setup.mjs"
}

Write-Success "Setup looks good"

if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}
if ($PSBoundParameters.ContainsKey('Port')) { $env:CADDY_PORT = $Port }

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Log "Starting HyperTeams..."
Write-Host ""
Write-Log "The dashboard address is printed in the [supervise] lines below."
Write-Host ""
Write-Log "Stop: Ctrl-C"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

& node "$scriptDir\supervise.mjs"
