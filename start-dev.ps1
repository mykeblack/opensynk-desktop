# start-dev.ps1

$root = "D:\repos\Opensynk-Dashboard"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\apps\backend'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\apps\web'; npm run dev"
)