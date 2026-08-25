param(
    [string]$StateRoot = "$env:USERPROFILE\.hyperteams",
    [string]$InstallDir = "",
    [string]$Branch = ""
)

$ErrorActionPreference = "Stop"

if (-not $InstallDir) { $InstallDir = Join-Path $StateRoot "app" }

$DistRepoUrl = if ($env:DIST_REPO_URL) { $env:DIST_REPO_URL } else { "https://github.com/hyperteamsnet/hyperteams.git" }

function Write-Log     { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $args" -ForegroundColor Gray }
function Write-ErrExit { Write-Host "X $args" -ForegroundColor Red; Wait-Close; exit 1 }
function Write-Ok      { Write-Host "+ $args" -ForegroundColor Green }
function Write-Warn    { Write-Host "! $args" -ForegroundColor Yellow }
function Write-Prompt  { Write-Host "? $args" -ForegroundColor Cyan -NoNewline }

$script:HoldDone = $false
function Wait-Close {
    param([string]$Message = "Press Enter to close this window...")
    if ($script:HoldDone) { return }
    $script:HoldDone = $true
    if ($env:HYPERTEAMS_NO_PAUSE -eq "1") { return }
    if (-not [Environment]::UserInteractive) { return }
    try { if ([Console]::IsInputRedirected) { return } } catch { return }
    Write-Host ""
    Write-Host $Message -ForegroundColor DarkGray
    try { $null = Read-Host } catch { }
}

trap {
    Write-Host ""
    Write-Host "X $($_.Exception.Message)" -ForegroundColor Red
    if ($_.InvocationInfo) { Write-Host $_.InvocationInfo.PositionMessage -ForegroundColor DarkGray }
    Wait-Close
    exit 1
}

function Test-TransientWindow {
    try {
        $me = Get-CimInstance Win32_Process -Filter "ProcessId = $PID" -ErrorAction Stop
        $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($me.ParentProcessId)" -ErrorAction Stop
        return ($parent.Name -eq "explorer.exe")
    } catch {
        return $false
    }
}

function Get-DotNetOSArch {
    try { return "$([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)" }
    catch { return "" }
}

function Get-OSArch {
    foreach ($probe in @(
        { $env:PROCESSOR_ARCHITEW6432 },
        { $env:PROCESSOR_ARCHITECTURE },
        { Get-DotNetOSArch }
    )) {
        $raw = ""
        try { $raw = "$(& $probe)" } catch { $raw = "" }
        switch -Regex ($raw) {
            '^(AMD64|x64)$' { return "x64" }
            '^ARM64$'       { return "arm64" }
        }
    }
    return ""
}

$Arch = Get-OSArch

if ([string]::IsNullOrEmpty($Branch)) {
    if ($env:BRANCH) {
        $Branch = $env:BRANCH
    } elseif ($Arch) {
        $Branch = "dist-win32-$Arch"
    } else {
        Write-ErrExit ("Could not detect the architecture (only x64/arm64 Windows is supported). " +
            "PROCESSOR_ARCHITECTURE='$env:PROCESSOR_ARCHITECTURE' " +
            "PROCESSOR_ARCHITEW6432='$env:PROCESSOR_ARCHITEW6432' " +
            "OSArchitecture='$(Get-DotNetOSArch)' - " +
            'Workaround: set $env:BRANCH = "dist-win32-x64" and run again.')
    }
}
Write-Log "This system: Windows $(if ($Arch) { $Arch } else { 'unknown architecture' }) -> branch '$Branch'"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-ErrExit "git is required (it is used to download the artifact). https://git-scm.com/download/win"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-ErrExit "Node.js is required (it runs the app - unlike before, it is no longer bundled in the artifact). Install: https://nodejs.org/ (or: winget install OpenJS.NodeJS.LTS), then check 'node --version'. The required major version is reported at boot."
}
Write-Ok "Required tools OK (git, node $(node --version 2>$null))"

function Get-ClaudeEntry {
    $sources = @(Get-Command claude -All -ErrorAction SilentlyContinue |
        ForEach-Object { $_.Source } | Where-Object { $_ })
    foreach ($s in $sources) {
        if (@(".exe", ".com") -contains [IO.Path]::GetExtension($s).ToLower()) {
            return @{ Path = $s; Usable = $true }
        }
    }
    foreach ($s in $sources) {
        $dir = Split-Path -Parent $s
        $pkg = Join-Path $dir "node_modules\@anthropic-ai\claude-code"
        foreach ($rel in @("bin\claude.exe", "cli.js")) {
            $p = Join-Path $pkg $rel
            if (Test-Path $p) { return @{ Path = $p; Usable = $true } }
        }
        try { $text = Get-Content -Raw -ErrorAction Stop $s } catch { continue }
        foreach ($m in [regex]::Matches($text, '(?i)[^"''\s]+\.(?:m?js|exe|com)\b')) {
            $rel = $m.Value -replace '^%~?dp0%?[\\/]*', '' -replace '^\$basedir[\\/]', ''
            $abs = if ([IO.Path]::IsPathRooted($rel)) { $rel } else { Join-Path $dir $rel }
            if (Test-Path $abs) { return @{ Path = $abs; Usable = $true } }
        }
    }
    if ($sources.Count -gt 0) { return @{ Path = ($sources -join ", "); Usable = $false } }
    return $null
}

$claude = Get-ClaudeEntry
if ($claude -and $claude.Usable) {
    Write-Ok "Claude Code OK"
} elseif ($claude) {
    Write-Warn "Claude Code is on PATH, but not in a form this dashboard can execute."
    Write-Log  "  Found: $($claude.Path)"
    Write-Log  "  Even if 'claude' works in a terminal (the shell runs the .cmd for you), the app"
    Write-Log  "  spawns it without a shell, so it needs a native executable."
    Write-Log  "  Fix (native install): irm https://claude.ai/install.ps1 | iex"
    Write-Log  "  Diagnose: claude doctor"
} else {
    Write-Warn "Claude Code (claude) not found - without it the dashboard starts but no task will run."
    Write-Log "  Install: irm https://claude.ai/install.ps1 | iex"
    Write-Log "           (with winget: winget install Anthropic.ClaudeCode)"
    Write-Log "  Sign in: run 'claude' once in a terminal and log in (subscription or API key)."
    Write-Log "  Verify:  once 'claude --version' works you are ready (auth reuses that login)."
}

Write-Host ""

$Preserve = @("data.db", "data.db-wal", "data.db-shm", ".env.local", "previews.map")
$RestoreFrom = ""

if (Test-Path (Join-Path $StateRoot "server.js")) {
    Write-Log "Old layout detected - moving the installation to $InstallDir"

    $oldPtyd = "*" + (Join-Path $StateRoot "scripts\ptyd.mjs") + "*"
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like $oldPtyd } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    foreach ($d in @("app", "run", "logs")) {
        New-Item -ItemType Directory -Force -Path (Join-Path $StateRoot $d) | Out-Null
    }

    Get-ChildItem -Path $StateRoot -Filter "ptyd-*" -File -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
    foreach ($m in @(@("whisperd.json", "run"), @("whisperd.log", "logs"))) {
        $src = Join-Path $StateRoot $m[0]
        if (Test-Path $src) { Move-Item $src -Destination (Join-Path $StateRoot $m[1]) -Force }
    }

    $keep = @("app", "run", "models", "logs", "shim.json")
    Get-ChildItem -Path $StateRoot -Force | Where-Object { $keep -notcontains $_.Name } | ForEach-Object {
        Move-Item $_.FullName -Destination $InstallDir -Force
    }
    Write-Ok "Migration done - models and logs were left in place"
}

Write-Log "Install directory: $InstallDir"
if (Test-Path $InstallDir) {
    Write-Log "  ! Reinstalling deletes this directory. The DB and settings are backed up and restored automatically."
    Write-Log "    (Stop it first if it is running - backing up mid-write can produce an inconsistent copy.)"
    Write-Prompt "Delete the existing installation and reinstall? (y/N): "
    $answer = Read-Host
    if ($answer -match '^[Yy]$') {
        try {
            $ptydPat = "*" + (Join-Path $InstallDir "scripts\ptyd.mjs") + "*"
            Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -like $ptydPat } |
                ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        } catch { }

        $RestoreFrom = "$InstallDir.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $RestoreFrom -Force | Out-Null
        foreach ($f in $Preserve) {
            $src = Join-Path $InstallDir $f
            if (Test-Path $src) { Copy-Item $src -Destination $RestoreFrom -Force }
        }
        $cf = Join-Path $InstallDir "cloudflared"
        if (Test-Path $cf) { Copy-Item $cf -Destination $RestoreFrom -Recurse -Force }
        Write-Ok "Data backed up: $RestoreFrom"

        $here = (Get-Location).ProviderPath
        if ($here -eq $InstallDir -or $here.StartsWith($InstallDir + [IO.Path]::DirectorySeparatorChar)) {
            Set-Location $env:USERPROFILE
        }
        try {
            Remove-Item -Recurse -Force $InstallDir
        } catch {
            Write-ErrExit @"
Could not delete the existing installation: $InstallDir
- Make sure no other window is inside this folder ('cd ~' there, then retry).
- If HyperTeams is running, stop it - ptyd holds files in this folder.
- The backup is still there: $RestoreFrom
- To install elsewhere instead of deleting, pass another location:
    iex "& { `$(irm <install script URL>) } -InstallDir C:\hyperteams"
"@
        }
    } else {
        Write-Log "  Keeping the existing installation"
    }
}

Write-Host ""

if (-not (Test-Path $InstallDir)) {
    Write-Log "Downloading the artifact ($Branch)..."
    $cloneUrl = $DistRepoUrl
    $env:GIT_TERMINAL_PROMPT = "0"
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & git clone --depth 1 --branch $Branch $cloneUrl $InstallDir 2>&1 | Where-Object { $_ -notmatch "^hint:" } | ForEach-Object { Write-Host $_ }
    $cloneExit = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    $cloneUrl = $null
    if ($cloneExit -ne 0) {
        Write-ErrExit @"
Download failed - check the following:
- your internet connection
- whether the branch for this OS, '$Branch', exists in the dist repository
  (it may not have been packaged/published for this OS yet)
  See the README for how to build from source instead.
"@
    }
    Write-Ok "Download complete"
}

Set-Location $InstallDir

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& git remote set-url origin $DistRepoUrl 2>$null
$ErrorActionPreference = $prevEap

Write-Host ""

if (-not (Test-Path "server.js")) { Write-ErrExit "server.js is missing - this branch is not an artifact, or it is corrupted." }
if (-not (Test-Path ".node-requirement.json")) { Write-Warn ".node-requirement.json is missing - this may be an old artifact (the Node version check will be skipped)." }
Write-Ok "Artifact verified"

foreach ($d in @("bin", "scripts", ".")) {
    $dir = Join-Path $InstallDir $d
    if (-not (Test-Path $dir)) { continue }
    Get-ChildItem -LiteralPath $dir -File -ErrorAction SilentlyContinue |
        Where-Object { @(".exe", ".cmd", ".bat", ".ps1", ".msi") -contains $_.Extension.ToLower() } |
        ForEach-Object { try { Unblock-File -LiteralPath $_.FullName -ErrorAction SilentlyContinue } catch { } }
}

foreach ($n in @("bin\caddy.exe", "bin\cloudflared.exe")) {
    if (Test-Path (Join-Path $InstallDir $n)) { continue }
    Write-Warn "$n is missing - remote access (tunnel) will not work (local use is unaffected)."
    Write-Log  "  Security software may have quarantined it. Check the protection history of"
    Write-Log  "  Windows Security (Defender) or your antivirus, restore the file, and allow this folder:"
    Write-Log  "    Add-MpPreference -ExclusionPath `"$InstallDir`"   (run PowerShell as administrator)"
}

Write-Host ""

if ($RestoreFrom -and (Test-Path $RestoreFrom)) {
    foreach ($f in $Preserve) {
        $src = Join-Path $RestoreFrom $f
        if (Test-Path $src) { Copy-Item $src -Destination $InstallDir -Force }
    }
    $cfBak = Join-Path $RestoreFrom "cloudflared"
    if (Test-Path $cfBak) { Copy-Item $cfBak -Destination $InstallDir -Recurse -Force }
    Write-Ok "Data restored (DB and settings kept)"
    Write-Log "  The backup was left in place: $RestoreFrom"
    Write-Host ""
}

if (-not (Test-Path ".env.local")) {
    Write-Log "Initial configuration is required. Starting the interactive setup..."
    & node "scripts\setup.mjs"
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Setup was skipped - run it yourself later:"
        Write-Log  "    node `"$InstallDir\scripts\setup.mjs`""
    }
} else {
    Write-Log ".env.local found - keeping the existing configuration"
}

Write-Host ""

$ShimOk = $false
$ShimBinDir = ""
try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $ShimBinDir = (& node "$InstallDir\scripts\cli.mjs" install-shim | Select-Object -Last 1)
    $ErrorActionPreference = $prevEap
    if ($LASTEXITCODE -eq 0 -and $ShimBinDir) {
        $ShimOk = $true
        $env:Path = "$env:Path;$ShimBinDir"
    } else {
        Write-Warn "Could not register the global command - use the full path to run it."
    }
} catch {
    $ErrorActionPreference = "Stop"
    Write-Warn "Could not register the global command - use the full path to run it."
}

Write-Host ""

Write-Ok "Installation complete!"
Write-Log ""
if ($ShimOk) {
    Write-Log "Start:"
    Write-Log "  hyperteams"
    Write-Log ""
    Write-Log "(In other terminal windows, open a new one before using it.)"
    Write-Log ""
    Write-Log "To reconfigure:"
    Write-Log "  hyperteams setup"
    Write-Log ""
    Write-Log "To upgrade later:"
    Write-Log "  hyperteams upgrade"
    Write-Log ""
    Write-Log "To uninstall:"
    Write-Log "  hyperteams uninstall"
    Write-Log ""
}
if (-not $ShimOk) {
    Write-Log "Start:"
    Write-Log "  & `"$InstallDir\scripts\start.bat`""
    Write-Log ""
}
Write-Log "To pass a port or domain as arguments:"
Write-Log "  powershell -ExecutionPolicy Bypass -File `"$InstallDir\scripts\start.ps1`" -Port 9000"
if (-not $ShimOk) {
    Write-Log ""
    Write-Log "To reconfigure:"
    Write-Log "  node `"$InstallDir\scripts\setup.mjs`""
}

if (Test-TransientWindow) { Wait-Close }
