Param(
  [switch]$Tunnel
)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' -and $_.InterfaceAlias -notmatch 'vEthernet'} | Select-Object -First 1 -ExpandProperty IPAddress)
if (!$ip) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1'} | Select-Object -First 1 -ExpandProperty IPAddress)
}
Write-Host "Detected LAN IP: $ip" -ForegroundColor Green

if ($ip) {
  $Env:EXPO_PUBLIC_API_BASE_URL = "http://$ip:8000/api"
  $Env:EXPO_PUBLIC_WEB_URL = "http://$ip:3001/"
}
Start-Process powershell -ArgumentList "-NoProfile -Command cd '$PSScriptRoot\backend'; python -m pip install -r requirements.txt; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command cd '$PSScriptRoot\frontend'; npm install; `$env:HOST='0.0.0.0'; `$env:PORT='3001'; npm start" -WindowStyle Minimized
cd "$PSScriptRoot\mobile-app"
npm install
if ($Tunnel) {
  npx expo start --tunnel
} else {
  npx expo start --lan
}
