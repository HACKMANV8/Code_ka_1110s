# PowerShell script to run the RAG system

Write-Host "Starting RAG System..." -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Please create one based on .env.example" -ForegroundColor Red
    Write-Host "Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Please edit .env file and add your OPENAI_API_KEY" -ForegroundColor Yellow
    exit 1
}

# Run the FastAPI server
Write-Host "Starting FastAPI server on http://localhost:8002" -ForegroundColor Green
uvicorn main:app --reload --port 8002 --host 0.0.0.0
