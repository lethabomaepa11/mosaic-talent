param(
    [switch]$SkipVsCodeTerminals
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSCommandPath

function Invoke-VsCodeCommand {
    param(
        [Parameter(Mandatory = $true)]
        $ShellObject,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    $ShellObject.SendKeys("^+p")
    Start-Sleep -Milliseconds 300
    $ShellObject.SendKeys($Command)
    Start-Sleep -Milliseconds 250
    $ShellObject.SendKeys("{ENTER}")
    Start-Sleep -Milliseconds 450
}

function Open-DevTerminalsInVsCode {
    param(
        [string]$RootPath
    )

    $codeCmd = Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\bin\code.cmd"
    if (-not (Test-Path $codeCmd)) {
        Write-Warning "VS Code CLI not found at '$codeCmd'. Skipping terminal automation."
        return
    }

    & $codeCmd -r $RootPath | Out-Null
    Start-Sleep -Milliseconds 1200

    try {
        $wshell = New-Object -ComObject WScript.Shell
    }
    catch {
        Write-Warning "Could not create COM automation object. Skipping terminal automation."
        return
    }

    $activated = $wshell.AppActivate("Visual Studio Code")
    if (-not $activated) {
        Write-Warning "VS Code window was not detected for terminal automation."
        return
    }

    Start-Sleep -Milliseconds 300

    $targets = @(
        @{ Name = "EntityFrameworkCore"; Path = (Join-Path $RootPath "aspnet-core/src/MosaicTalent.EntityFrameworkCore"); Command = $null },
        @{ Name = "Web.Host";            Path = (Join-Path $RootPath "aspnet-core/src/MosaicTalent.Web.Host");            Command = "dotnet run" },
        @{ Name = "Frontend";            Path = (Join-Path $RootPath "frontend");                                          Command = "npm run dev" }
    )

    foreach ($target in $targets) {
        if (-not (Test-Path $target.Path)) {
            Write-Warning "Skipped missing path ($($target.Name)): $($target.Path)"
            continue
        }

        Invoke-VsCodeCommand -ShellObject $wshell -Command "Terminal: Create New Terminal"
        Start-Sleep -Milliseconds 500

        if ($target.Command) {
            $line = "Set-Location -Path '$($target.Path)'; $($target.Command)"
        } else {
            $line = "Set-Location -Path '$($target.Path)'"
        }

        $wshell.SendKeys($line)
        Start-Sleep -Milliseconds 150
        $wshell.SendKeys("{ENTER}")
        Start-Sleep -Milliseconds 350
    }
}

# Current terminal is assumed to already be at the project root.
Set-Location $projectRoot
Write-Host "Current terminal is at root: $projectRoot"

if (-not $SkipVsCodeTerminals) {
    Write-Host "Opening terminals for EntityFrameworkCore, Web.Host, and Frontend..."
    Open-DevTerminalsInVsCode -RootPath $projectRoot
}