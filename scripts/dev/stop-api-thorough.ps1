# 彻底终止本机 TravelTrust API（及可选前端）监听，释放端口与 traveltrust-api.exe 文件锁。
# 比纯 netstat+tokens=5 更稳：IPv4/IPv6、区域格式差异下仍按 OwningProcess 杀进程。
#
# 用法（仓库根）：
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/stop-api-thorough.ps1
#   powershell -File scripts/dev/stop-api-thorough.ps1 -ApiPort 8080 -AlsoFrontend -FrontendPort 3012
#
# 若仍提示 exe 被占用：关闭所有「TravelTrust-API」cmd 窗口后再跑；或以管理员 PowerShell 重试。

param(
    [int]$ApiPort = 8080,
    [switch]$AlsoFrontend,
    [switch]$FrontendOnly,
    [int]$FrontendPort = 3012,
    [int]$SettleSeconds = 2
)

$ErrorActionPreference = "SilentlyContinue"

function Stop-ListenersOnPort([int] $Port) {
    $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    foreach ($c in $conns) {
        $procId = [int] $c.OwningProcess
        if ($procId -le 0) { continue }
        try {
            $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
            $name = if ($p) { $p.ProcessName } else { "?" }
            Write-Host "stop-api-thorough: port $Port LISTENING -> Stop-Process -Id $procId ($name)"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
        catch {
            Write-Host "stop-api-thorough: failed to stop PID $procId on port $Port" -ForegroundColor Yellow
        }
    }
}

function Stop-TravelTrustApiRunners {
    Get-Process -Name "traveltrust-api" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "stop-api-thorough: Stop-Process traveltrust-api PID $($_.Id)"
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    & taskkill /F /IM traveltrust-api.exe 2>$null | Out-Null

    # cargo run -p traveltrust-api parent/child can hold the port without traveltrust-api.exe name yet
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -in @('cargo.exe', 'rustc.exe', 'traveltrust-api.exe') -and
            ($_.CommandLine -match 'traveltrust-api')
        } |
        ForEach-Object {
            Write-Host "stop-api-thorough: Stop-Process $($_.Name) PID $($_.ProcessId) [traveltrust-api runner]"
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
}

Write-Host "======== TravelTrust: stop API (thorough) ========"
Write-Host "ApiPort=$ApiPort  AlsoFrontend=$AlsoFrontend  FrontendOnly=$FrontendOnly  FrontendPort=$FrontendPort"

if ($FrontendOnly) {
    Stop-ListenersOnPort $FrontendPort
    Start-Sleep -Seconds $SettleSeconds
    Stop-ListenersOnPort $FrontendPort
    $fs = @(Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue)
    if ($fs.Count -gt 0) {
        Write-Host "stop-api-thorough: WARN — port $FrontendPort still LISTENING:" -ForegroundColor Yellow
        $fs | Format-Table -AutoSize
        exit 1
    }
    Write-Host "stop-api-thorough: OK — frontend port $FrontendPort has no LISTENER." -ForegroundColor Green
    exit 0
}

Stop-TravelTrustApiRunners
Stop-ListenersOnPort $ApiPort
if ($AlsoFrontend) {
    Stop-ListenersOnPort $FrontendPort
}

Start-Sleep -Seconds $SettleSeconds

Stop-TravelTrustApiRunners
Stop-ListenersOnPort $ApiPort
if ($AlsoFrontend) {
    Stop-ListenersOnPort $FrontendPort
}

$still = @(Get-NetTCPConnection -LocalPort $ApiPort -State Listen -ErrorAction SilentlyContinue)
if ($still.Count -gt 0) {
    Write-Host "stop-api-thorough: ERROR — port $ApiPort still LISTENING:" -ForegroundColor Red
    $still | Format-Table -AutoSize
    Write-Host "Try: close any cmd window titled TravelTrust-API, or run this script from an elevated PowerShell." -ForegroundColor Yellow
    exit 1
}

if ($AlsoFrontend) {
    $fs = @(Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue)
    if ($fs.Count -gt 0) {
        Write-Host "stop-api-thorough: WARN — port $FrontendPort still LISTENING (non-fatal for API-only):" -ForegroundColor Yellow
        $fs | Format-Table -AutoSize
    }
}

Write-Host "stop-api-thorough: OK — API port $ApiPort has no LISTENER." -ForegroundColor Green
exit 0
