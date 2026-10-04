param(
    [switch]$Local,
    [switch]$NoBuild,
    [switch]$ShowInfoOnly
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  RebootMind - Multi-Device Local Area Network Starter    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Detect active LAN IPv4 address (prioritizing the adapter with a default gateway)
$activeGateway = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue |
    Sort-Object RouteMetric |
    Select-Object -First 1

$lanIp = $null

if ($activeGateway) {
    $ipObj = Get-NetIPAddress -InterfaceIndex $activeGateway.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notmatch "^127\.|^169\.254\." } |
        Select-Object -First 1
    if ($ipObj) {
        $lanIp = $ipObj.IPAddress
    }
}

if (-not $lanIp) {
    # Fallback to any non-loopback IPv4 address
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.InterfaceAlias -notmatch "Loopback|vEthernet|VirtualBox|VMware|WSL" -and
            $_.IPAddress -notmatch "^127\.|^169\.254\."
        } |
        Select-Object -First 1
    if ($ipObj) {
        $lanIp = $ipObj.IPAddress
    }
}

if (-not $lanIp) {
    $lanIp = "127.0.0.1"
    Write-Warning "Could not detect an active Wi-Fi / Ethernet LAN IP. Using 127.0.0.1"
} else {
    Write-Host "  [+] Detected Wi-Fi / LAN IP: " -NoNewline -ForegroundColor Gray
    Write-Host "$lanIp" -ForegroundColor Green
}

# 2. Update .env with HOST_LAN_IP so Docker containers and backend can read it
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath
    if ($content -match "^HOST_LAN_IP=") {
        $content = $content -replace "^HOST_LAN_IP=.*", "HOST_LAN_IP=$lanIp"
    } else {
        $content += "`nHOST_LAN_IP=$lanIp"
    }
    Set-Content -Path $envPath -Value $content
} else {
    Set-Content -Path $envPath -Value "HOST_LAN_IP=$lanIp`nBACKEND_PORT=8000`n"
}

Write-Host ""
Write-Host "  [>] Connect Android Phone App or other devices on this Wi-Fi to:" -ForegroundColor Yellow
Write-Host "      Server Address : http://${lanIp}:8000" -ForegroundColor White
Write-Host "      Web App Browser: http://${lanIp}:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Tip: If your phone cannot connect, run 'scripts\open-firewall.ps1' as Admin" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

if ($ShowInfoOnly) {
    exit 0
}

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")

if ($Local) {
    Write-Host "Starting local Python backend on 0.0.0.0:8000..." -ForegroundColor Green
    $backendPath = Join-Path $rootPath "backend"
    Set-Location $backendPath
    $env:HOST_LAN_IP = $lanIp
    python -m uvicorn mad_app.main:socket_app --host 0.0.0.0 --port 8000 --reload
} else {
    Write-Host "Starting Docker Compose services..." -ForegroundColor Green
    Set-Location $rootPath
    if ($NoBuild) {
        docker compose up
    } else {
        docker compose up --build
    }
}
