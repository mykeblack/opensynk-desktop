param(
  [string]$InstallPath = "C:\OpenSynk"
)

Write-Host "Installing OpenSynk Desktop..."

$appKey = Read-Host "Enter Sunsynk App Key"
$appSecret = Read-Host "Enter Sunsynk App Secret"

New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
Copy-Item -Recurse -Force ".\*" $InstallPath

Set-Location "$InstallPath\apps\backend"

$config = @{
  sunsynk_app_key = $appKey
  sunsynk_app_secret = $appSecret
} | ConvertTo-Json -Depth 3

$config | Set-Content -Encoding UTF8 ".\opensynk.config.json"

python -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

python -m app.db.init_db

Set-Location "$InstallPath\apps\web"
npm install
npm run build

Write-Host "Install complete."
Write-Host "Backend:"
Write-Host "  cd $InstallPath\apps\backend"
Write-Host "  .\.venv\Scripts\Activate.ps1"
Write-Host "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "Frontend:"
Write-Host "  cd $InstallPath\apps\web"
Write-Host "  npm run dev -- --host 0.0.0.0"