function Invoke-RepoGitBash {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [switch]$WarnOnly
    )

    $ErrorActionPreference = "Stop"
    . (Join-Path $PSScriptRoot "Resolve-GitBash.ps1")

    $bash = Get-GitBashExe
    if (-not $bash) {
        $msg = "Git Bash not found (install Git for Windows or set GIT_BASH)"
        if ($WarnOnly) {
            Write-Host "WARN: $msg" -ForegroundColor Yellow
            return
        }
        throw $msg
    }

    $root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    $rootUnix = ($root -replace '\\', '/')
    $full = "cd '$rootUnix' && $Command"

    $proc = Start-Process -FilePath $bash -ArgumentList @('-lc', $full) -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) {
        if ($WarnOnly) {
            Write-Host "WARN: git-bash command exit $($proc.ExitCode) (continuing)" -ForegroundColor Yellow
            return
        }
        throw "git-bash command failed exit $($proc.ExitCode)"
    }
}
