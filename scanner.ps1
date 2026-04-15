#Requires -RunAsAdministrator
# CCleanKILLER - Scanner & Remover Engine
# Detects and removes CCleaner and all bundled bloatware

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("scan", "remove")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string[]]$Targets
)

$ErrorActionPreference = "SilentlyContinue"

# ============================================================
# DETECTION DEFINITIONS
# ============================================================

$DetectionTargets = @(
    # --- CCleaner Core ---
    @{
        Id = "ccleaner"
        Name = "CCleaner"
        Category = "Core"
        Paths = @(
            "$env:ProgramFiles\CCleaner",
            "${env:ProgramFiles(x86)}\CCleaner",
            "$env:ProgramData\CCleaner",
            "$env:APPDATA\CCleaner",
            "$env:LOCALAPPDATA\CCleaner"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform\CCleaner",
            "HKCU:\SOFTWARE\Piriform\CCleaner",
            "HKLM:\SOFTWARE\WOW6432Node\Piriform\CCleaner",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\CCleaner",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\CCleaner"
        )
        Services = @("CCleanerPerformanceOptimizerService", "CCleanerUpdateService", "ccleaner_update")
        ScheduledTasks = @("CCleaner Update", "CCleanerSkipUAC*", "CCleaner*")
        StartupEntries = @("CCleaner Smart Cleaning", "CCleaner Monitor")
        UninstallNames = @("CCleaner*")
    },

    # --- CCleaner Browser ---
    @{
        Id = "ccleaner_browser"
        Name = "CCleaner Browser"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\CCleaner Browser",
            "${env:ProgramFiles(x86)}\CCleaner Browser",
            "$env:LOCALAPPDATA\CCleaner Browser",
            "$env:APPDATA\CCleaner Browser"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\CCleaner Browser",
            "HKCU:\SOFTWARE\CCleaner Browser",
            "HKLM:\SOFTWARE\WOW6432Node\CCleaner Browser",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\CCleaner Browser",
            "HKLM:\SOFTWARE\Clients\StartMenuInternet\CCleaner Browser"
        )
        Services = @("CCleanerBrowserUpdate*")
        ScheduledTasks = @("CCleanerBrowser*", "CCleaner Browser*")
        StartupEntries = @()
        UninstallNames = @("CCleaner Browser*")
    },

    # --- CCleaner Cloud ---
    @{
        Id = "ccleaner_cloud"
        Name = "CCleaner Cloud"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\CCleaner Cloud",
            "${env:ProgramFiles(x86)}\CCleaner Cloud",
            "$env:ProgramData\CCleaner Cloud"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform\CCleaner Cloud",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\CCleaner Cloud"
        )
        Services = @("CCleanerCloudAgent")
        ScheduledTasks = @("CCleaner Cloud*")
        StartupEntries = @()
        UninstallNames = @("CCleaner Cloud*")
    },

    # --- Avast Antivirus ---
    @{
        Id = "avast"
        Name = "Avast Free Antivirus"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\Avast Software",
            "${env:ProgramFiles(x86)}\Avast Software",
            "$env:ProgramData\Avast Software",
            "$env:APPDATA\Avast Software",
            "$env:LOCALAPPDATA\Avast Software"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Avast Software",
            "HKLM:\SOFTWARE\AVAST Software",
            "HKLM:\SOFTWARE\WOW6432Node\AVAST Software",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Avast Antivirus"
        )
        Services = @("avast! Antivirus", "AvastSvc", "aswbIDSAgent", "AvastWscReporter")
        ScheduledTasks = @("Avast *", "AvastUpdateTask*")
        StartupEntries = @("AvastUI.exe")
        UninstallNames = @("Avast*Antivirus*", "Avast Free*")
    },

    # --- AVG Antivirus ---
    @{
        Id = "avg"
        Name = "AVG Antivirus"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\AVG",
            "${env:ProgramFiles(x86)}\AVG",
            "$env:ProgramData\AVG",
            "$env:APPDATA\AVG",
            "$env:LOCALAPPDATA\AVG"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\AVG",
            "HKLM:\SOFTWARE\WOW6432Node\AVG",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\AVG Antivirus"
        )
        Services = @("avgwd", "AVGSvc")
        ScheduledTasks = @("AVG *", "AVGUpdateTask*")
        StartupEntries = @("AVGUI.exe")
        UninstallNames = @("AVG*Antivirus*", "AVG Free*")
    },

    # --- Avast Secure Browser ---
    @{
        Id = "avast_browser"
        Name = "Avast Secure Browser"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\Avast Software\Browser",
            "$env:LOCALAPPDATA\AvastBrowser",
            "$env:LOCALAPPDATA\Avast\Browser"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Avast Secure Browser",
            "HKLM:\SOFTWARE\Clients\StartMenuInternet\Avast Secure Browser"
        )
        Services = @("AvastBrowserUpdate*")
        ScheduledTasks = @("AvastBrowser*", "Avast Secure Browser*", "Avast Software Browser*")
        StartupEntries = @()
        UninstallNames = @("Avast Secure Browser*")
    },

    # --- AVG Secure Browser ---
    @{
        Id = "avg_browser"
        Name = "AVG Secure Browser"
        Category = "Bundled"
        Paths = @(
            "$env:ProgramFiles\AVG\Browser",
            "$env:LOCALAPPDATA\AVGBrowser",
            "$env:LOCALAPPDATA\AVG\Browser"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\AVG Secure Browser",
            "HKLM:\SOFTWARE\Clients\StartMenuInternet\AVG Secure Browser"
        )
        Services = @("AVGBrowserUpdate*")
        ScheduledTasks = @("AVGBrowser*", "AVG Secure Browser*")
        StartupEntries = @()
        UninstallNames = @("AVG Secure Browser*")
    },

    # --- Recuva ---
    @{
        Id = "recuva"
        Name = "Recuva"
        Category = "Piriform"
        Paths = @(
            "$env:ProgramFiles\Recuva",
            "${env:ProgramFiles(x86)}\Recuva"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform\Recuva",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Recuva"
        )
        Services = @()
        ScheduledTasks = @()
        StartupEntries = @()
        UninstallNames = @("Recuva*")
    },

    # --- Defraggler ---
    @{
        Id = "defraggler"
        Name = "Defraggler"
        Category = "Piriform"
        Paths = @(
            "$env:ProgramFiles\Defraggler",
            "${env:ProgramFiles(x86)}\Defraggler"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform\Defraggler",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Defraggler"
        )
        Services = @("Defraggler")
        ScheduledTasks = @("Defraggler*")
        StartupEntries = @()
        UninstallNames = @("Defraggler*")
    },

    # --- Speccy ---
    @{
        Id = "speccy"
        Name = "Speccy"
        Category = "Piriform"
        Paths = @(
            "$env:ProgramFiles\Speccy",
            "${env:ProgramFiles(x86)}\Speccy"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform\Speccy",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Speccy"
        )
        Services = @()
        ScheduledTasks = @()
        StartupEntries = @()
        UninstallNames = @("Speccy*")
    },

    # --- Google Chrome (bundled install) ---
    @{
        Id = "chrome_bundled"
        Name = "Google Chrome (CCleaner Bundle)"
        Category = "Offer"
        Paths = @()  # We don't want to delete Chrome files — user may have installed independently
        RegistryKeys = @()
        Services = @()
        ScheduledTasks = @()
        StartupEntries = @()
        UninstallNames = @()
        Note = "Google Chrome may have been installed via CCleaner offer. Only flagged for awareness — not auto-removed."
        DetectOnly = $true
    },

    # --- Google Toolbar ---
    @{
        Id = "google_toolbar"
        Name = "Google Toolbar"
        Category = "Offer"
        Paths = @(
            "$env:ProgramFiles\Google\Google Toolbar",
            "${env:ProgramFiles(x86)}\Google\Google Toolbar"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Google\Google Toolbar",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{18455581-E099-4BA8-BC6B-F34B2F06600C}"
        )
        Services = @("GoogleToolbarNotifier")
        ScheduledTasks = @()
        StartupEntries = @("swg")
        UninstallNames = @("Google Toolbar*")
    },

    # --- Piriform/Gen Digital Telemetry ---
    @{
        Id = "telemetry"
        Name = "CCleaner/Piriform Telemetry"
        Category = "Telemetry"
        Paths = @(
            "$env:ProgramData\Piriform",
            "$env:APPDATA\Piriform"
        )
        RegistryKeys = @(
            "HKLM:\SOFTWARE\Piriform",
            "HKCU:\SOFTWARE\Piriform",
            "HKLM:\SOFTWARE\WOW6432Node\Piriform"
        )
        Services = @()
        ScheduledTasks = @()
        StartupEntries = @()
        UninstallNames = @()
    }
)

# ============================================================
# SCAN FUNCTION
# ============================================================

function Invoke-Scan {
    $results = @()
    
    foreach ($target in $DetectionTargets) {
        $found = @{
            Id = $target.Id
            Name = $target.Name
            Category = $target.Category
            DetectOnly = if ($target.DetectOnly) { $true } else { $false }
            Note = $target.Note
            FoundPaths = @()
            FoundRegistryKeys = @()
            FoundServices = @()
            FoundScheduledTasks = @()
            FoundStartupEntries = @()
            FoundUninstallEntries = @()
            TotalSizeBytes = 0
            IsDetected = $false
        }

        # Check file paths
        foreach ($path in $target.Paths) {
            $expandedPath = $ExecutionContext.InvokeCommand.ExpandString($path)
            if (Test-Path $expandedPath) {
                $found.FoundPaths += $expandedPath
                try {
                    $size = (Get-ChildItem -Path $expandedPath -Recurse -Force -ErrorAction SilentlyContinue | 
                             Measure-Object -Property Length -Sum).Sum
                    $found.TotalSizeBytes += $size
                } catch {}
            }
        }

        # Check registry keys
        foreach ($regKey in $target.RegistryKeys) {
            if (Test-Path $regKey) {
                $found.FoundRegistryKeys += $regKey
            }
        }

        # Check services
        foreach ($svcPattern in $target.Services) {
            $svcs = Get-Service -Name $svcPattern -ErrorAction SilentlyContinue
            foreach ($svc in $svcs) {
                $found.FoundServices += @{
                    Name = $svc.Name
                    DisplayName = $svc.DisplayName
                    Status = $svc.Status.ToString()
                }
            }
        }

        # Check scheduled tasks
        foreach ($taskPattern in $target.ScheduledTasks) {
            $tasks = Get-ScheduledTask | Where-Object { $_.TaskName -like $taskPattern } -ErrorAction SilentlyContinue
            foreach ($task in $tasks) {
                $found.FoundScheduledTasks += @{
                    Name = $task.TaskName
                    State = $task.State.ToString()
                }
            }
        }

        # Check startup entries (Run keys)
        foreach ($startupName in $target.StartupEntries) {
            $runPaths = @(
                "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
            )
            foreach ($runPath in $runPaths) {
                if (Test-Path $runPath) {
                    $props = Get-ItemProperty -Path $runPath -ErrorAction SilentlyContinue
                    if ($props.PSObject.Properties.Name -contains $startupName) {
                        $found.FoundStartupEntries += @{
                            Name = $startupName
                            Location = $runPath
                            Value = $props.$startupName
                        }
                    }
                }
            }
        }

        # Check uninstall entries
        $uninstallPaths = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
        )
        foreach ($pattern in $target.UninstallNames) {
            foreach ($uPath in $uninstallPaths) {
                if (Test-Path $uPath) {
                    Get-ChildItem -Path $uPath -ErrorAction SilentlyContinue | ForEach-Object {
                        $displayName = (Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue).DisplayName
                        if ($displayName -like $pattern) {
                            $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
                            $found.FoundUninstallEntries += @{
                                DisplayName = $displayName
                                UninstallString = $props.UninstallString
                                QuietUninstallString = $props.QuietUninstallString
                                RegistryPath = $_.PSPath
                            }
                        }
                    }
                }
            }
        }

        # Determine if detected
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

    return $results | ConvertTo-Json -Depth 10
}

# ============================================================
# REMOVE FUNCTION
# ============================================================

function Invoke-Remove {
    param([string[]]$TargetIds)
    
    $log = @()
    
    foreach ($targetId in $TargetIds) {
        $target = $DetectionTargets | Where-Object { $_.Id -eq $targetId }
        if (-not $target) {
            $log += @{ Target = $targetId; Action = "skip"; Message = "Unknown target ID" }
            continue
        }

        if ($target.DetectOnly) {
            $log += @{ Target = $targetId; Action = "skip"; Message = "Detect-only target, skipping" }
            continue
        }

        $log += @{ Target = $targetId; Action = "start"; Message = "Beginning removal of $($target.Name)" }

        # 1. Stop and remove services
        foreach ($svcPattern in $target.Services) {
            $svcs = Get-Service -Name $svcPattern -ErrorAction SilentlyContinue
            foreach ($svc in $svcs) {
                try {
                    if ($svc.Status -ne 'Stopped') {
                        Stop-Service -Name $svc.Name -Force -ErrorAction Stop
                        $log += @{ Target = $targetId; Action = "service_stopped"; Message = "Stopped service: $($svc.Name)" }
                    }
                    # Disable the service
                    Set-Service -Name $svc.Name -StartupType Disabled -ErrorAction SilentlyContinue
                    # Remove using sc.exe
                    & sc.exe delete $svc.Name 2>$null
                    $log += @{ Target = $targetId; Action = "service_removed"; Message = "Removed service: $($svc.Name)" }
                } catch {
                    $log += @{ Target = $targetId; Action = "error"; Message = "Failed to stop/remove service $($svc.Name): $_" }
                }
            }
        }

        # 2. Kill related processes
        $processNames = @()
        switch ($targetId) {
            "ccleaner" { $processNames = @("CCleaner*", "CCleanerPerformanceOptimizer*") }
            "ccleaner_browser" { $processNames = @("CCleanerBrowser*") }
            "avast" { $processNames = @("AvastUI*", "AvastSvc*", "aswEngSrv*", "aswidsagent*") }
            "avg" { $processNames = @("AVGUI*", "AVGSvc*") }
            "avast_browser" { $processNames = @("AvastBrowser*") }
            "avg_browser" { $processNames = @("AVGBrowser*") }
        }
        foreach ($procPattern in $processNames) {
            Get-Process -Name $procPattern -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    $_ | Stop-Process -Force -ErrorAction Stop
                    $log += @{ Target = $targetId; Action = "process_killed"; Message = "Killed process: $($_.Name)" }
                } catch {
                    $log += @{ Target = $targetId; Action = "error"; Message = "Failed to kill process $($_.Name): $_" }
                }
            }
        }

        # 3. Try quiet uninstall first
        $uninstallPaths = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
        )
        foreach ($pattern in $target.UninstallNames) {
            foreach ($uPath in $uninstallPaths) {
                if (Test-Path $uPath) {
                    Get-ChildItem -Path $uPath -ErrorAction SilentlyContinue | ForEach-Object {
                        $displayName = (Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue).DisplayName
                        if ($displayName -like $pattern) {
                            $props = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
                            $uninstallCmd = $props.QuietUninstallString
                            if (-not $uninstallCmd) { $uninstallCmd = $props.UninstallString }
                            if ($uninstallCmd) {
                                try {
                                    # Add silent flags if not present
                                    if ($uninstallCmd -notmatch '/S|/silent|/quiet|--uninstall') {
                                        $uninstallCmd += " /S"
                                    }
                                    $log += @{ Target = $targetId; Action = "uninstall_attempt"; Message = "Running uninstaller: $uninstallCmd" }
                                    Start-Process -FilePath "cmd.exe" -ArgumentList "/c $uninstallCmd" -Wait -NoNewWindow -ErrorAction Stop
                                    $log += @{ Target = $targetId; Action = "uninstall_complete"; Message = "Uninstaller finished for $displayName" }
                                } catch {
                                    $log += @{ Target = $targetId; Action = "error"; Message = "Uninstaller failed for $displayName`: $_" }
                                }
                            }
                        }
                    }
                }
            }
        }

        # 4. Remove scheduled tasks
        foreach ($taskPattern in $target.ScheduledTasks) {
            Get-ScheduledTask | Where-Object { $_.TaskName -like $taskPattern } -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    Unregister-ScheduledTask -TaskName $_.TaskName -Confirm:$false -ErrorAction Stop
                    $log += @{ Target = $targetId; Action = "task_removed"; Message = "Removed scheduled task: $($_.TaskName)" }
                } catch {
                    $log += @{ Target = $targetId; Action = "error"; Message = "Failed to remove task $($_.TaskName): $_" }
                }
            }
        }

        # 5. Remove startup entries
        foreach ($startupName in $target.StartupEntries) {
            $runPaths = @(
                "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
                "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"
            )
            foreach ($runPath in $runPaths) {
                if (Test-Path $runPath) {
                    try {
                        Remove-ItemProperty -Path $runPath -Name $startupName -ErrorAction Stop
                        $log += @{ Target = $targetId; Action = "startup_removed"; Message = "Removed startup entry: $startupName from $runPath" }
                    } catch {}
                }
            }
        }

        # 6. Remove file paths
        foreach ($path in $target.Paths) {
            $expandedPath = $ExecutionContext.InvokeCommand.ExpandString($path)
            if (Test-Path $expandedPath) {
                try {
                    Remove-Item -Path $expandedPath -Recurse -Force -ErrorAction Stop
                    $log += @{ Target = $targetId; Action = "path_removed"; Message = "Removed: $expandedPath" }
                } catch {
                    # Try with takeown
                    try {
                        & takeown /f "$expandedPath" /r /d y 2>$null
                        & icacls "$expandedPath" /grant administrators:F /t 2>$null
                        Remove-Item -Path $expandedPath -Recurse -Force -ErrorAction Stop
                        $log += @{ Target = $targetId; Action = "path_removed"; Message = "Force-removed: $expandedPath" }
                    } catch {
                        $log += @{ Target = $targetId; Action = "error"; Message = "Failed to remove path $expandedPath`: $_" }
                    }
                }
            }
        }

        # 7. Remove registry keys
        foreach ($regKey in $target.RegistryKeys) {
            if (Test-Path $regKey) {
                try {
                    Remove-Item -Path $regKey -Recurse -Force -ErrorAction Stop
                    $log += @{ Target = $targetId; Action = "registry_removed"; Message = "Removed registry key: $regKey" }
                } catch {
                    $log += @{ Target = $targetId; Action = "error"; Message = "Failed to remove registry key $regKey`: $_" }
                }
            }
        }

        $log += @{ Target = $targetId; Action = "complete"; Message = "Removal of $($target.Name) complete" }
    }

    return $log | ConvertTo-Json -Depth 5
}

# ============================================================
# MAIN EXECUTION
# ============================================================

switch ($Action) {
    "scan" {
        Invoke-Scan
    }
    "remove" {
        if (-not $Targets -or $Targets.Count -eq 0) {
            Write-Error "No targets specified for removal"
            exit 1
        }
        Invoke-Remove -TargetIds $Targets
    }
}
