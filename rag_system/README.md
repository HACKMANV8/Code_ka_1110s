# RAG System for AI Review

This is a Retrieval Augmented Generation (RAG) system for providing contextual AI reviews to students based on exam materials.

## Architecture

- **Vector Store**: FAISS (Facebook AI Similarity Search)
- **Embeddings**: OpenAI Ada-002
- **LLM**: OpenAI GPT-4 or GPT-3.5-turbo
- **Backend**: FastAPI (Python)
- **Document Processing**: LangChain

## Features

1. **Admin**: Upload exam-related documents (PDFs, text files, etc.)
2. **Processing**: Automatic chunking and embedding generation
3. **Storage**: FAISS vector database for fast similarity search
4. **Query**: Student questions are matched against relevant context
5. **Response**: LLM generates answers using retrieved context

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```
OPENAI_API_KEY=your_openai_api_key
```

3. Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8001
```

## API Endpoints

- `POST /upload` - Upload and process documents
- `POST /query` - Query the RAG system
- `GET /health` - Health check
- `DELETE /clear` - Clear vector store

## Directory Structure

```
rag_system/
├── main.py              # FastAPI application
├── rag_engine.py        # RAG core logic
├── document_processor.py # Document chunking
├── vector_store.py      # FAISS operations
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
├── .env.example         # Example env file
├── uploads/             # Temporary upload folder
└── vector_db/           # FAISS index storage
```
