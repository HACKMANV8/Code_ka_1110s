# RAG System Integration Guide

## Overview

This guide explains how to integrate the RAG (Retrieval Augmented Generation) system with the existing exam platform for AI-powered student reviews.

## Architecture

```
┌─────────────────┐
│   Admin Panel   │ ─── Upload Exam Materials ───┐
└─────────────────┘                              │
                                                 ▼
                                    ┌──────────────────────┐
                                    │   RAG System (8001)  │
                                    │  - Document Upload   │
┌─────────────────┐                 │  - Chunking          │
│  Student Review │ ─── Query ───▶  │  - FAISS Vector DB   │
└─────────────────┘                 │  - OpenAI Embeddings │
                                    │  - LLM Response      │
                                    └──────────────────────┘
```

## Setup Steps

### 1. Set up RAG System Backend

```powershell
# Navigate to RAG system folder
cd rag_system

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file and add your OPENAI_API_KEY
```

### 2. Configure OpenAI API Key

Add your OpenAI API key to both:
- `rag_system/.env` - for the RAG backend
- Root `.env.local` - for Next.js frontend

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### 3. Start RAG System

```powershell
cd rag_system
.\run.ps1
```

Or manually:
```powershell
uvicorn main:app --reload --port 8001
```

The API will be available at: `http://localhost:8001`

### 4. Upload Exam Materials (Admin)

Admin can upload study materials via API:

```bash
curl -X POST "http://localhost:8001/upload" \
  -F "file=@exam_material.pdf"
```

Or use the test script:
```python
python test_api.py
```

### 5. Update Next.js AI Review Endpoint

Modify `app/api/exam/ai-review/route.ts` to call RAG system:

```typescript
// Instead of direct Gemini API call
const response = await fetch(`${process.env.RAG_API_URL}/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: studentQuestion,
    session_id: session_id
  })
});

const data = await response.json();
// Use data.answer and data.sources
```

## API Endpoints

### RAG System (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and stats |
| `/upload` | POST | Upload exam material |
| `/query` | POST | Query RAG for answer |
| `/explain` | POST | Get detailed explanation |
| `/clear` | DELETE | Clear vector database |
| `/stats` | GET | Get system statistics |

### Example Query Request

```json
POST /query
{
  "question": "Can you explain what binary search is?",
  "session_id": "exam_session_123"
}
```

### Example Response

```json
{
  "answer": "Binary search is an efficient algorithm...",
  "sources": [
    {
      "chunk_id": 5,
      "source": "exam_material.pdf",
      "relevance_score": 0.92,
      "preview": "Binary search requires sorted array..."
    }
  ],
  "question": "Can you explain what binary search is?",
  "num_sources": 3
}
```

## Integration Workflow

### For Admin:
1. Create exam in admin panel (existing flow)
2. Upload related study materials to RAG system
   - Use POST `/upload` with PDF/TXT/DOCX files
   - Materials are chunked and embedded automatically
   - Stored in FAISS vector database

### For Students:
1. Complete exam (existing flow)
2. Request AI review (existing flow)
3. **NEW**: Backend queries RAG system with student questions
4. RAG system:
   - Finds relevant context from uploaded materials
   - Uses OpenAI LLM to generate contextual answer
   - Returns answer with source references
5. Student receives enhanced, context-aware review

## Database Schema (No changes needed)

The current schema works as-is. RAG system is completely separate:
- FAISS stores vectors locally in `rag_system/vector_db/`
- No changes to Supabase tables required
- Can link by `exam_id` if needed later

## Environment Variables Summary

### Root `.env.local` (Next.js)
```env
RAG_API_URL=http://localhost:8001
NEXT_PUBLIC_RAG_API_URL=http://localhost:8001
OPENAI_API_KEY=sk-your-key
```

### `rag_system/.env` (FastAPI)
```env
OPENAI_API_KEY=sk-your-key
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-3.5-turbo
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

## Testing

### 1. Test RAG System Health
```bash
curl http://localhost:8001/health
```

### 2. Upload Test Document
```bash
cd rag_system
python test_api.py
```

### 3. Test Query
```bash
curl -X POST "http://localhost:8001/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is a stack?"}'
```

## Cost Considerations

**OpenAI API Usage:**
- Embeddings (ada-002): ~$0.0001 per 1K tokens
- LLM (gpt-3.5-turbo): ~$0.002 per 1K tokens
- Example: 100 queries/day ≈ $1-2/month

**FAISS:**
- Free, runs locally
- No server costs
- Fast in-memory search

## Future Enhancements

1. **Multi-exam support**: Link vector DB collections to specific exams
2. **Admin UI**: Build upload interface in admin panel
3. **Cache responses**: Store common Q&A pairs
4. **Analytics**: Track which topics students ask about most
5. **Hybrid search**: Combine vector + keyword search
6. **Chat history**: Support multi-turn conversations

## Troubleshooting

### RAG system won't start
- Check Python version (3.9+)
- Verify OPENAI_API_KEY is set
- Install dependencies: `pip install -r requirements.txt`

### "No documents in vector store" error
- Upload at least one document via `/upload`
- Check `vector_db/` folder exists

### Poor answer quality
- Upload more comprehensive study materials
- Increase TOP_K_RESULTS in .env
- Try gpt-4 instead of gpt-3.5-turbo

### Connection refused
- Ensure RAG system is running on port 8001
- Check firewall settings
- Verify RAG_API_URL in .env.local

## Next Steps

1. ✅ Set up RAG system backend
2. ⏳ Add OpenAI API key to `.env` files
3. ⏳ Start RAG system: `.\run.ps1`
4. ⏳ Upload sample exam material
5. ⏳ Test query endpoint
6. ⏳ Integrate with Next.js AI review route
7. ⏳ Add admin upload UI
8. ⏳ Deploy to production

## Support

For issues or questions, refer to:
- `rag_system/README.md` - System documentation
- `test_api.py` - Example usage
- OpenAI docs: https://platform.openai.com/docs
- LangChain docs: https://python.langchain.com/
