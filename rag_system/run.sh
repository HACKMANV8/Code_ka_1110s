#!/bin/bash
# Bash script to run the RAG system (for Linux/Mac)

echo "Starting RAG System..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Please create one based on .env.example"
    echo "Copying .env.example to .env..."
    cp .env.example .env
    echo "Please edit .env file and add your OPENAI_API_KEY"
    exit 1
fi

# Run the FastAPI server
echo "Starting FastAPI server on http://localhost:8002"
uvicorn main:app --reload --port 8002 --host 0.0.0.0
