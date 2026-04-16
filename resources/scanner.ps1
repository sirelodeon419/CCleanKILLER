# CCleanKILLER v2 — Scanner & Removal Engine
# Note: Admin is required for removal. Scan works without elevation.
# Data-driven: loads detection rules from rules.json

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("scan", "remove")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [string]$RulesPath,

    [Parameter(Mandatory=$false)]
    [string]$Targets
)

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# ============================================================
# LOAD RULES
# ============================================================

if (-not (Test-Path $RulesPath)) {
    Write-Error "rules.json not found at: $RulesPath"
    exit 1
}

$rulesData = Get-Content -Path $RulesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$rules = $rulesData.rules

# ============================================================
# UTILITY: Expand environment variables in path string
# ============================================================

function Expand-EnvPath {
    param([string]$Path)
    $Path = $Path -replace '%ProgramFiles%', $env:ProgramFiles
    $Path = $Path -replace '%ProgramFiles\(x86\)%', ${env:ProgramFiles(x86)}
    $Path = $Path -replace '%ProgramData%', $env:ProgramData
    $Path = $Path -replace '%AppData%', $env:APPDATA
    $Path = $Path -replace '%LocalAppData%', $env:LOCALAPPDATA
    $Path = $Path -replace '%Temp%', $env:TEMP
    $Path = $Path -replace '%UserProfile%', $env:USERPROFILE
    return $Path
}

# ============================================================
# SCAN
# ============================================================

function Invoke-Scan {
    $results = @()
    $total = $rules.Count
    $i = 0

    foreach ($rule in $rules) {
        $i++
        # Stream progress to stdout — caught by Node.js
        Write-Host "PROGRESS:$i`:$total`:$($rule.name)"

        $found = [ordered]@{
            Id                  = $rule.id
            Name                = $rule.name
            Vendor              = if ($rule.vendor) { $rule.vendor } else { "" }
            Category            = $rule.category
            DetectOnly          = if ($rule.detectOnly) { $true } else { $false }
            Note                = if ($rule.note) { $rule.note } else { $null }
            IsDetected          = $false
            TotalSizeBytes      = [long]0
            FoundPaths          = @()
            FoundRegistryKeys   = @()
            FoundServices       = @()
            FoundScheduledTasks = @()
            FoundStartupEntries = @()
            FoundUninstallEntries = @()
        }

        # --- File paths ---
        foreach ($rawPath in $rule.paths) {
            $path = Expand-EnvPath $rawPath
            if (Test-Path $path) {
                $found.FoundPaths += $path
                try {
                    $size = (Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue |
                             Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
                    if ($size) { $found.TotalSizeBytes += [long]$size }
                } catch {}
            }
        }

        # --- Registry keys ---
        foreach ($regKey in $rule.registryKeys) {
            if (Test-Path $regKey) {
                $found.FoundRegistryKeys += $regKey
            }
        }

        # --- Services ---
        foreach ($svcPattern in $rule.services) {
            $svcs = Get-Service -Name $svcPattern -ErrorAction SilentlyContinue
            foreach ($svc in $svcs) {
                $found.FoundServices += [ordered]@{
                    Name        = $svc.Name
                    DisplayName = $svc.DisplayName
                    Status      = $svc.Status.ToString()
                }
            }
        }

        # --- Scheduled tasks ---
        foreach ($taskPattern in $rule.scheduledTasks) {
            $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue |
                     Where-Object { $_.TaskName -like $taskPattern }
            foreach ($task in $tasks) {
                $found.FoundScheduledTasks += [ordered]@{
                    Name  = $task.TaskName
                    State = $task.State.ToString()
                }
            }
        }

        # --- Startup entries ---
        foreach ($startupName in $rule.startupEntries) {
            $runPaths = @(
                "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
            )
            foreach ($runPath in $runPaths) {
                if (Test-Path $runPath) {
                    $props = Get-ItemProperty -Path $runPath -ErrorAction SilentlyContinue
                    if ($props.PSObject.Properties.Name -contains $startupName) {
                        $found.FoundStartupEntries += [ordered]@{
                            Name     = $startupName
                            Location = $runPath
                            Value    = $props.$startupName
                        }
                    }
                }
            }
        }

        # --- Uninstall entries ---
        $uninstallBases = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
        )
        foreach ($pattern in $rule.uninstallNames) {
            foreach ($base in $uninstallBases) {
                if (Test-Path $base) {
                    Get-ChildItem -Path $base -ErrorAction SilentlyContinue | ForEach-Object {
                        $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
                        if ($props.DisplayName -like $pattern) {
                            $found.FoundUninstallEntries += [ordered]@{
                                DisplayName          = $props.DisplayName
                                UninstallString      = $props.UninstallString
                                QuietUninstallString = $props.QuietUninstallString
                                RegistryPath         = $_.PSPath
                            }
                        }
                    }
                }
            }
        }

        # --- Is detected? ---
        if ($found.FoundPaths.Count -gt 0 -or
            $found.FoundRegistryKeys.Count -gt 0 -or
            $found.FoundServices.Count -gt 0 -or
            $found.FoundScheduledTasks.Count -gt 0 -or
            $found.FoundStartupEntries.Count -gt 0 -or
            $found.FoundUninstallEntries.Count -gt 0) {
            $found.IsDetected = $true
        }

        $results += $found
    }

    # Output final JSON to stdout
    $results | ConvertTo-Json -Depth 10 -Compress
}

# ============================================================
# REMOVE (streaming — one JSON object per line)
# ============================================================

function Write-Log {
    param([string]$Target, [string]$Action, [string]$Message)
    $entry = [ordered]@{ target = $Target; action = $Action; message = $Message }
    [Console]::WriteLine(($entry | ConvertTo-Json -Compress))
}

function Invoke-Remove {
    param([string[]]$TargetIds)

    # Create restore point before making any changes
    try {
        $null = Checkpoint-Computer -Description "CCleanKILLER — pre-removal snapshot" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        Write-Log "system" "info" "System restore point created successfully"
    } catch {
        Write-Log "system" "info" "Restore point skipped (may already exist within 24h window)"
    }

    foreach ($targetId in $TargetIds) {
        $rule = $rules | Where-Object { $_.id -eq $targetId }
        if (-not $rule) {
            Write-Log $targetId "skip" "Unknown rule ID — skipping"
            continue
        }
        if ($rule.detectOnly) {
            Write-Log $targetId "skip" "Detect-only target — not removed"
            continue
        }

        Write-Log $targetId "start" "Starting removal of $($rule.name)"

        # 1. Kill processes
        foreach ($procName in $rule.processNames) {
            Get-Process -Name $procName -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    $_ | Stop-Process -Force -ErrorAction Stop
                    Write-Log $targetId "process_killed" "Killed process: $($_.Name) (PID $($_.Id))"
                } catch {
                    Write-Log $targetId "error" "Could not kill $($_.Name): $_"
                }
            }
        }

        # 2. Stop and remove services
        foreach ($svcPattern in $rule.services) {
            $svcs = Get-Service -Name $svcPattern -ErrorAction SilentlyContinue
            foreach ($svc in $svcs) {
                try {
                    if ($svc.Status -ne 'Stopped') {
                        Stop-Service -Name $svc.Name -Force -ErrorAction Stop
                        Write-Log $targetId "service_stopped" "Stopped service: $($svc.Name)"
                    }
                    Set-Service -Name $svc.Name -StartupType Disabled -ErrorAction SilentlyContinue
                    & sc.exe delete $svc.Name 2>$null | Out-Null
                    Write-Log $targetId "service_removed" "Removed service: $($svc.Name)"
                } catch {
                    Write-Log $targetId "error" "Failed on service $($svc.Name): $_"
                }
            }
        }

        # 3. Remove scheduled tasks
        foreach ($taskPattern in $rule.scheduledTasks) {
            Get-ScheduledTask -ErrorAction SilentlyContinue |
                Where-Object { $_.TaskName -like $taskPattern } |
                ForEach-Object {
                    try {
                        Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false -ErrorAction Stop
                        Write-Log $targetId "task_removed" "Removed scheduled task: $($_.TaskName)"
                    } catch {
                        Write-Log $targetId "error" "Failed to remove task $($_.TaskName): $_"
                    }
                }
        }

        # 4. Remove startup entries
        foreach ($startupName in $rule.startupEntries) {
            $runPaths = @(
                "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
            )
            foreach ($runPath in $runPaths) {
                if (Test-Path $runPath) {
                    try {
                        Remove-ItemProperty -Path $runPath -Name $startupName -ErrorAction Stop
                        Write-Log $targetId "startup_removed" "Removed startup: $startupName"
                    } catch {}
                }
            }
        }

        # 5. Run uninstallers (quiet)
        $uninstallBases = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
        )
        foreach ($pattern in $rule.uninstallNames) {
            foreach ($base in $uninstallBases) {
                if (-not (Test-Path $base)) { continue }
                Get-ChildItem -Path $base -ErrorAction SilentlyContinue | ForEach-Object {
                    $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
                    if ($props.DisplayName -like $pattern) {
                        $cmd = $props.QuietUninstallString
                        if (-not $cmd) { $cmd = $props.UninstallString }
                        if ($cmd) {
                            # Append silent flags based on installer type
                            $isMsi = $cmd -match '(?i)msiexec'
                            $hasQuietFlag = $cmd -match '(?i)/S\b|/silent|/quiet|/VERYSILENT|/SUPPRESSMSGBOXES|--uninstall|-uninstall|/qn|/qb'
                            if (-not $hasQuietFlag) {
                                if ($isMsi) {
                                    $cmd = $cmd.TrimEnd() + ' /qn /norestart'
                                } else {
                                    # Try InnoSetup-style first (most Piriform tools use InnoSetup)
                                    $cmd = $cmd.TrimEnd() + ' /VERYSILENT /SUPPRESSMSGBOXES /NORESTART'
                                }
                            }
                            Write-Log $targetId "uninstall_attempt" "Running uninstaller for $($props.DisplayName)"
                            try {
                                if ($cmd -match '^"([^"]+)"\s*(.*)$') {
                                    $exe = $matches[1]
                                    $args = $matches[2]
                                    Start-Process -FilePath $exe -ArgumentList $args -Wait -NoNewWindow -ErrorAction Stop
                                } else {
                                    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$cmd`"" -Wait -NoNewWindow -ErrorAction Stop
                                }
                                Write-Log $targetId "uninstall_complete" "Uninstaller finished: $($props.DisplayName)"
                            } catch {
                                Write-Log $targetId "error" "Uninstaller failed: $_"
                            }
                        }
                    }
                }
            }
        }

        # 6. Remove file paths (post-uninstaller cleanup)
        foreach ($rawPath in $rule.paths) {
            $path = Expand-EnvPath $rawPath
            if (Test-Path $path) {
                try {
                    Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
                    Write-Log $targetId "path_removed" "Removed: $path"
                } catch {
                    # Try takeown for stubborn files
                    try {
                        & takeown /f "$path" /r /d y 2>$null | Out-Null
                        & icacls "$path" /grant "Administrators:F" /t 2>$null | Out-Null
                        Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
                        Write-Log $targetId "path_removed" "Force-removed: $path"
                    } catch {
                        Write-Log $targetId "error" "Could not remove: $path"
                    }
                }
            }
        }

        # 7. Remove registry keys
        foreach ($regKey in $rule.registryKeys) {
            if (Test-Path $regKey) {
                try {
                    Remove-Item -Path $regKey -Recurse -Force -ErrorAction Stop
                    Write-Log $targetId "registry_removed" "Removed registry key: $regKey"
                } catch {
                    Write-Log $targetId "error" "Could not remove key: $regKey"
                }
            }
        }

        Write-Log $targetId "complete" "Removal of $($rule.name) complete"
    }
}

# ============================================================
# DISPATCH
# ============================================================

switch ($Action) {
    "scan" {
        Invoke-Scan
    }
    "remove" {
        if (-not $Targets) {
            Write-Error "No targets specified"
            exit 1
        }
        $targetList = $Targets -split ','
        Invoke-Remove -TargetIds $targetList
    }
}
