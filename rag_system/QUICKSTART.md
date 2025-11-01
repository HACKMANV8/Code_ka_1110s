# Quick Start Guide - Upload PDF and Test RAG System

## Step 1: Make sure RAG server is running

In PowerShell terminal (with venv activated):
```powershell
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s\rag_system"
venv\Scripts\Activate.ps1
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete.
```

## Step 2: Upload the PDF (in a NEW terminal)

Open a NEW PowerShell terminal (keep the server running in the first one):
```powershell
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s\rag_system"
venv\Scripts\Activate.ps1
python upload_pdf.py
```

This will:
- ✅ Check if server is running
- ✅ Upload "inheritance unit 3.pdf"
- ✅ Chunk and embed the document
- ✅ Store in FAISS vector database
- ✅ Test with a sample query

## Step 3: Start your Next.js app

In another terminal:
```powershell
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s"
npm run dev
```

## Step 4: Test AI Review

1. Go to http://localhost:3000
2. Login as a student
3. Complete an exam
4. Click "AI Review"
5. The system will now:
   - First try RAG system (context-aware using your PDF)
   - If RAG fails, fall back to Azure OpenAI

## How It Works

```
Student clicks "AI Review"
       ↓
Next.js API Route (/api/exam/ai-review)
       ↓
Tries RAG System (http://localhost:8001/query)
       ↓
RAG searches vector DB for relevant content
       ↓
Azure OpenAI generates answer using retrieved context
       ↓
Returns personalized review to student
```

## Verify RAG is Being Used

Check the browser console or Network tab:
- Look for requests to `/api/exam/ai-review`
- Response should include `"method": "rag"`
- Check for `"sources"` array with relevant chunks

## Troubleshooting

### RAG server not starting
```powershell
# Make sure you're in rag_system folder
cd "C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\Code_ka_1110s\rag_system"

# Activate venv
venv\Scripts\Activate.ps1

# Install dependencies if needed
pip install -r requirements.txt

# Run server
python main.py
```

### PDF upload fails
- Make sure RAG server is running first
- Check the file path in `upload_pdf.py` is correct
- Verify you have the PDF at the specified location

### AI Review still uses Azure OpenAI directly
- Check `.env.local` has `RAG_API_URL=http://localhost:8001`
- Ensure Azure OpenAI chat credentials (`AZURE_OPENAI_CHAT_API_KEY`, `AZURE_OPENAI_CHAT_ENDPOINT`, `AZURE_OPENAI_CHAT_DEPLOYMENT`) and embedding credentials (`AZURE_OPENAI_EMBEDDING_API_KEY`, `AZURE_OPENAI_EMBEDDING_ENDPOINT`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`) are configured in `.env.local`
- Restart Next.js dev server after changing .env
- Check RAG server logs for errors

## What's Next?

1. ✅ Upload more study materials (PDFs, TXT, DOCX)
2. ✅ Test with different student questions
3. ✅ Add admin UI for document uploads
4. ✅ Deploy both services to production

## Files Created/Modified

### New Files:
- `rag_system/upload_pdf.py` - Script to upload PDFs
- `rag_system/vector_db/` - FAISS vector database (auto-created)

### Modified Files:
- `app/api/exam/ai-review/route.ts` - Now uses RAG system
- `.env.local` - Added RAG_API_URL

### RAG System Files (Already Created):
- `rag_system/main.py` - FastAPI server
- `rag_system/rag_engine.py` - RAG logic
- `rag_system/vector_store.py` - FAISS operations
- `rag_system/document_processor.py` - PDF processing
- `rag_system/.env` - Azure OpenAI credentials

Enjoy your RAG-powered AI review system! 🚀
