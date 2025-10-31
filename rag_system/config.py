"""
Configuration management for RAG system
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    
    # Azure Deployment Names
    AZURE_EMBEDDING_DEPLOYMENT: str = "text-embedding-ada-002"
    AZURE_LLM_DEPLOYMENT: str = "gpt-35-turbo"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080

    # Paths
    UPLOAD_DIR: str = "uploads"
    VECTOR_DB_DIR: str = "vector_db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
