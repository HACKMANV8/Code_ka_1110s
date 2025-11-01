# RAG System Setup Instructions

## Prerequisites
- Python 3.9 or higher
- Azure OpenAI account with deployments

## Step-by-Step Setup

### 1. Open PowerShell Terminal
Navigate to the RAG system folder:
```powershell
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s\rag_system"
```

### 2. Create Virtual Environment
```powershell
python -m venv venv
```

### 3. Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

If you get execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Install All Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

**What gets installed:**
- `fastapi` - Web framework for API
- `uvicorn` - ASGI server
- `langchain` - RAG framework
- `langchain-openai` - Azure OpenAI integration
- `langchain-community` - Community integrations
- `faiss-cpu` - Vector database (CPU version)
- `pypdf` - PDF processing
- `python-docx` - Word document processing
- `openai` - Azure OpenAI client
- `pydantic` - Data validation
- `python-dotenv` - Environment variables
- `tiktoken` - Token counting

### 5. Configure Azure OpenAI Credentials

Edit the `.env` file in the `rag_system` folder:

```env
# Chat completions (gpt-4 / gpt-35-turbo etc.)
AZURE_OPENAI_CHAT_API_KEY=your_chat_key
AZURE_OPENAI_CHAT_ENDPOINT=https://your-chat-resource.openai.azure.com/
AZURE_OPENAI_CHAT_API_VERSION=2024-02-15-preview
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4

# Embeddings (text-embedding-ada-002-4 etc.)
AZURE_OPENAI_EMBEDDING_API_KEY=your_embedding_key
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://your-embedding-resource.openai.azure.com/
AZURE_OPENAI_EMBEDDING_API_VERSION=2023-05-15
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002-4

# Legacy single-endpoint fallbacks (optional)
# AZURE_OPENAI_API_KEY=
# AZURE_OPENAI_ENDPOINT=
# AZURE_OPENAI_API_VERSION=
# AZURE_OPENAI_DEPLOYMENT=
```

**How to get Azure credentials:**
1. Go to Azure Portal (portal.azure.com)
2. Navigate to the Azure OpenAI resource that hosts your chat deployment
3. Open **Keys and Endpoint** to copy the key and endpoint
4. Go to **Model deployments** to copy the chat deployment name
5. Repeat the same steps for the resource that hosts your embedding deployment (if different)

### 6. Start the RAG System
```powershell
uvicorn main:app --reload --port 8001
```

Or use the run script:
```powershell
.\run.ps1
```

### 7. Test the System
In a new terminal:
```powershell
# Test health
curl http://localhost:8001/health

# Or use Python test script
python test_api.py
```

## Quick Install Commands (Copy-Paste)

```powershell
# Navigate to folder
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s\rag_system"

# Create and activate venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install everything
pip install --upgrade pip
pip install fastapi==0.109.0 uvicorn[standard]==0.27.0 python-multipart==0.0.6 langchain==0.1.5 langchain-openai==0.0.5 langchain-community==0.0.16 faiss-cpu==1.7.4 pypdf==4.0.1 python-docx==1.1.0 pydantic==2.5.3 pydantic-settings==2.1.0 openai==1.10.0 python-dotenv==1.0.0 aiofiles==23.2.1 tiktoken==0.5.2

# Start server
uvicorn main:app --reload --port 8001
```

## Environment Variables Explained

### RAG System Uses: `rag_system/.env`
This is SEPARATE from your main project's `.env.local`. The RAG system is a standalone FastAPI application that needs its own configuration.

### Main Project Uses: `.env.local` (root folder)
Your Next.js app uses this to know where the RAG API is:
```env
RAG_API_URL=http://localhost:8001
```

**Why separate?**
- RAG system is a Python/FastAPI backend
- Next.js is a Node.js frontend
- They run independently and communicate via HTTP
- Each needs its own environment configuration

## Troubleshooting

### "Module not found" error
```powershell
pip install -r requirements.txt
```

### "Execution policy" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Azure credentials invalid"
- Double-check your Azure OpenAI key and endpoint
- Verify deployment names match exactly
- Ensure API version is correct

### Port 8001 already in use
```powershell
# Kill process on port 8001
netstat -ano | findstr :8001
taskkill /PID <process_id> /F

# Or use different port
uvicorn main:app --reload --port 8002
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure Azure credentials in `.env`
3. ✅ Start RAG system
4. Upload exam materials via `/upload` endpoint
5. Test queries via `/query` endpoint
6. Integrate with Next.js AI review
