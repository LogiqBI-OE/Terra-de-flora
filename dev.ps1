# Arranca backend (FastAPI) y frontend (Vite) en ventanas/pestañas separadas.
# Uso:  .\dev.ps1
$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$env:PYTHONIOENCODING = "utf-8"

Write-Host "→ Arrancando backend en :8000 ..." -ForegroundColor Cyan
$backend = Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\backend'; `$env:PYTHONIOENCODING='utf-8'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
) -PassThru

Write-Host "→ Arrancando frontend en :5173 ..." -ForegroundColor Cyan
$frontend = Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\frontend'; npm run dev"
) -PassThru

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "✅ Listo." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   Backend:  http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "Para detener: cierra las dos ventanas de PowerShell que se abrieron."
