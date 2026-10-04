# Requires Administrator privileges
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  RebootMind - Configuring Windows Defender Firewall      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rules = @(
    @{ Name = "RebootMind-Backend-8000"; DisplayName = "RebootMind Backend Server (Port 8000)"; Port = 8000 },
    @{ Name = "RebootMind-Frontend-3000"; DisplayName = "RebootMind Web Frontend (Port 3000)"; Port = 3000 }
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "This script requires Administrator privileges to configure firewall rules."
    Write-Warning "Please right click PowerShell and select 'Run as Administrator', then execute this script again."
    Write-Host ""
    Write-Host "Manual command to run in Admin PowerShell:" -ForegroundColor Yellow
    Write-Host "netsh advfirewall firewall add rule name=`"RebootMind-8000`" dir=in action=allow protocol=TCP localport=8000 profile=private,domain" -ForegroundColor White
    Write-Host "netsh advfirewall firewall add rule name=`"RebootMind-3000`" dir=in action=allow protocol=TCP localport=3000 profile=private,domain" -ForegroundColor White
    exit 1
}

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -Name $r.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        try {
            New-NetFirewallRule -Name $r.Name `
                                -DisplayName $r.DisplayName `
                                -Direction Inbound `
                                -LocalPort $r.Port `
                                -Protocol TCP `
                                -Action Allow `
                                -Profile Private,Domain | Out-Null
            Write-Host "  [OK] Created inbound firewall rule for Port $($r.Port)" -ForegroundColor Green
        } catch {
            Write-Error "Failed to create rule for Port $($r.Port): $_"
        }
    } else {
        Write-Host "  [INFO] Firewall rule already exists for Port $($r.Port)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Firewall configuration complete! Other devices on this Wi-Fi can now connect." -ForegroundColor Green
