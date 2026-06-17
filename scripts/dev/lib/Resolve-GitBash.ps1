# Resolve Git for Windows bash.exe — avoid WSL / System32 shims on PATH (non-interactive deploy fails).
function Get-GitBashExe {
    foreach ($key in @('GIT_BASH', 'BASH_EXE')) {
        $v = [Environment]::GetEnvironmentVariable($key)
        if ($v -and (Test-Path -LiteralPath $v)) {
            return (Resolve-Path -LiteralPath $v).Path
        }
    }

    $candidates = @()
    foreach ($root in @(${env:ProgramFiles}, ${env:ProgramFiles(x86)})) {
        if (-not $root) { continue }
        foreach ($sub in @('Git\bin\bash.exe', 'Git\usr\bin\bash.exe')) {
            $candidates += (Join-Path $root $sub)
        }
    }
    $candidates += @(
        'C:\Program Files\Git\bin\bash.exe',
        'C:\Program Files (x86)\Git\bin\bash.exe'
    )

    foreach ($p in $candidates) {
        if ($p -and (Test-Path -LiteralPath $p)) {
            return (Resolve-Path -LiteralPath $p).Path
        }
    }

    $cmd = Get-Command bash -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -match '\\Git\\') {
        return $cmd.Source
    }

    return $null
}
