"""
FastAPI application for RAG system
"""
import os
import shutil
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from document_processor import DocumentProcessor
from vector_store import VectorStore
from rag_engine import RAGEngine
from config import get_settings

settings = get_settings()

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="Exam RAG System",
    description="RAG system for AI-powered exam review",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
document_processor = DocumentProcessor()
vector_store = VectorStore()
rag_engine = RAGEngine(vector_store)


# Request/Response models
class QueryRequest(BaseModel):
    question: str
    session_id: str = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    question: str
    num_sources: int
    error: str = None


class ExplanationRequest(BaseModel):
    question_text: str
    student_answer: str
    correct_answer: str
    is_correct: bool


class UploadResponse(BaseModel):
    message: str
    filename: str
    chunks_added: int
    total_documents: int


class HealthResponse(BaseModel):
    status: str
    document_count: int
    config: dict


# API Endpoints

@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "RAG System API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "upload": "/upload",
            "query": "/query",
            "explain": "/explain",
            "clear": "/clear"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "document_count": vector_store.get_document_count(),
        "config": {
            "embedding_model": settings.EMBEDDING_MODEL,
            "llm_model": settings.LLM_MODEL,
            "chunk_size": settings.CHUNK_SIZE,
            "top_k": settings.TOP_K_RESULTS
        }
    }


@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process a document for the RAG system
    
    Supported formats: PDF, TXT, DOCX
    """
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.txt', '.docx', '.doc']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save uploaded file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        chunks = document_processor.process_file(file_path)
        
        # Add to vector store
        vector_store.add_documents(chunks)
        
        # Clean up uploaded file (optional - keep if you want to store originals)
        if background_tasks:
            background_tasks.add_task(os.remove, file_path)
        
        return {
            "message": "Document uploaded and processed successfully",
            "filename": file.filename,
            "chunks_added": len(chunks),
            "total_documents": vector_store.get_document_count()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a student question
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        result = rag_engine.query(
            question=request.question,
            session_id=request.session_id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/explain", response_model=dict)
async def explain_answer(request: ExplanationRequest):
    """
    Get an enhanced explanation for a specific exam question
    """
    try:
        explanation = rag_engine.get_enhanced_explanation(
            question_text=request.question_text,
            student_answer=request.student_answer,
            correct_answer=request.correct_answer,
            is_correct=request.is_correct
        )
        
        return {
            "explanation": explanation,
            "question": request.question_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")


@app.delete("/clear")
async def clear_vector_store():
    """
    Clear all documents from the vector store
    WARNING: This will delete all processed documents
    """
    try:
        vector_store.clear_index()
        
        return {
            "message": "Vector store cleared successfully",
            "document_count": 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing vector store: {str(e)}")


@app.get("/stats")
async def get_stats():
    """Get statistics about the RAG system"""
    return {
        "document_count": vector_store.get_document_count(),
        "embedding_model": settings.EMBEDDING_MODEL,
        "llm_model": settings.LLM_MODEL,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "top_k_results": settings.TOP_K_RESULTS
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
