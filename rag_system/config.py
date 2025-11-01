from __future__ import annotations

"""
Configuration management for RAG system
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Azure OpenAI (legacy single-endpoint configuration)
    AZURE_OPENAI_API_KEY: str | None = None
    AZURE_OPENAI_ENDPOINT: str | None = None
    AZURE_OPENAI_API_VERSION: str | None = None

    # Azure OpenAI - chat completions
    AZURE_OPENAI_CHAT_API_KEY: str | None = None
    AZURE_OPENAI_CHAT_ENDPOINT: str | None = None
    AZURE_OPENAI_CHAT_API_VERSION: str | None = None
    AZURE_OPENAI_CHAT_DEPLOYMENT: str | None = None
    
    # Azure OpenAI - embeddings
    AZURE_OPENAI_EMBEDDING_API_KEY: str | None = None
    AZURE_OPENAI_EMBEDDING_ENDPOINT: str | None = None
    AZURE_OPENAI_EMBEDDING_API_VERSION: str | None = None
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str | None = None
    
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

    @property
    def chat_api_key(self) -> str:
        key = self.AZURE_OPENAI_CHAT_API_KEY or self.AZURE_OPENAI_API_KEY
        if not key:
            raise ValueError("Azure OpenAI chat API key not configured.")
        return key

    @property
    def chat_endpoint(self) -> str:
        endpoint = self.AZURE_OPENAI_CHAT_ENDPOINT or self.AZURE_OPENAI_ENDPOINT
        if not endpoint:
            raise ValueError("Azure OpenAI chat endpoint not configured.")
        return endpoint

    @property
    def chat_api_version(self) -> str:
        return (
            self.AZURE_OPENAI_CHAT_API_VERSION
            or self.AZURE_OPENAI_API_VERSION
            or "2024-02-15-preview"
        )

    @property
    def embedding_api_key(self) -> str:
        key = (
            self.AZURE_OPENAI_EMBEDDING_API_KEY
            or self.AZURE_OPENAI_API_KEY
            or self.AZURE_OPENAI_CHAT_API_KEY
        )
        if not key:
            raise ValueError("Azure OpenAI embedding API key not configured.")
        return key

    @property
    def embedding_endpoint(self) -> str:
        endpoint = (
            self.AZURE_OPENAI_EMBEDDING_ENDPOINT
            or self.AZURE_OPENAI_ENDPOINT
            or self.AZURE_OPENAI_CHAT_ENDPOINT
        )
        if not endpoint:
            raise ValueError("Azure OpenAI embedding endpoint not configured.")
        return endpoint

    @property
    def embedding_api_version(self) -> str:
        return (
            self.AZURE_OPENAI_EMBEDDING_API_VERSION
            or self.AZURE_OPENAI_API_VERSION
            or self.AZURE_OPENAI_CHAT_API_VERSION
            or "2024-02-15-preview"
        )

    @property
    def chat_deployment(self) -> str:
        deployment = self.AZURE_OPENAI_CHAT_DEPLOYMENT or self.AZURE_LLM_DEPLOYMENT
        if not deployment:
            raise ValueError("Azure OpenAI chat deployment not configured.")
        return deployment

    @property
    def embedding_deployment(self) -> str:
        deployment = self.AZURE_OPENAI_EMBEDDING_DEPLOYMENT or self.AZURE_EMBEDDING_DEPLOYMENT
        if not deployment:
            raise ValueError("Azure OpenAI embedding deployment not configured.")
        return deployment


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
