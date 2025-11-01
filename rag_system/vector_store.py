"""
FAISS vector store operations with Azure OpenAI embeddings
"""
import os
import json
import numpy as np
from typing import List, Optional, Tuple
import faiss
from openai import AzureOpenAI
from config import get_settings

settings = get_settings()


class VectorStore:
    """Manage FAISS vector store with Azure OpenAI embeddings"""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.embedding_api_key,
            api_version=settings.embedding_api_version,
            azure_endpoint=settings.embedding_endpoint
        )
        
        self.embedding_model = settings.embedding_deployment
        self.index_path = os.path.join(settings.VECTOR_DB_DIR, "faiss_index.bin")
        self.metadata_path = os.path.join(settings.VECTOR_DB_DIR, "metadata.json")
        
        # Create vector_db directory if it doesn't exist
        os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
        
        self.index = None
        self.metadata = []
        
        # Load existing index if available
        self.load_index()
    
    def get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding for text using Azure OpenAI
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            raise Exception(f"Error getting embedding: {str(e)}")
    
    def add_documents(self, chunks: List[dict]) -> None:
        """
        Add document chunks to vector store
        
        Args:
            chunks: List of chunk dictionaries with 'content' field
        """
        if not chunks or len(chunks) == 0:
            raise ValueError("No chunks to add. Document may be empty or failed to process.")
        
        print(f"Adding {len(chunks)} chunks to vector store...")
        
        embeddings = []
        for chunk in chunks:
            print(f"  Embedding chunk {chunk.get('id', 'unknown')}...", end=" ")
            embedding = self.get_embedding(chunk['content'])
            embeddings.append(embedding)
            print("✓")
        
        embeddings_array = np.array(embeddings)
        
        if self.index is None:
            # Create new FAISS index
            self.index = faiss.IndexFlatL2(embeddings_array.shape[1])
        
        # Add embeddings to index
        self.index.add(embeddings_array)
        
        # Store metadata
        for chunk in chunks:
            self.metadata.append({
                'id': chunk.get('id'),
                'content': chunk['content'],
                'length': chunk.get('length', len(chunk['content']))
            })
        
        # Save the updated index
        self.save_index()
    
    def similarity_search(self, query: str, k: int = None) -> List[dict]:
        """
        Search for similar documents
        
        Args:
            query: Search query string
            k: Number of results to return
            
        Returns:
            List of similar chunks
        """
        if self.index is None or len(self.metadata) == 0:
            return []
        
        if k is None:
            k = settings.TOP_K_RESULTS
        
        try:
            # Get query embedding
            query_embedding = self.get_embedding(query)
            query_array = np.array([query_embedding])
            
            # Search
            distances, indices = self.index.search(query_array, min(k, len(self.metadata)))
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.metadata):
                    results.append({
                        'metadata': self.metadata[idx],
                        'distance': float(distances[0][i]),
                        'score': 1 / (1 + float(distances[0][i]))  # Convert distance to similarity
                    })
            
            return results
            
        except Exception as e:
            print(f"Error during search: {str(e)}")
            return []
    
    def save_index(self) -> None:
        """Save FAISS index to disk"""
        if self.index is not None:
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f)
            print(f"Vector store saved")
    
    def load_index(self) -> bool:
        """
        Load FAISS index from disk
        
        Returns:
            True if index was loaded successfully
        """
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                print(f"Vector store loaded ({len(self.metadata)} chunks)")
                return True
        except Exception as e:
            print(f"Could not load existing index: {str(e)}")
        
        return False
    
    def clear_index(self) -> None:
        """Clear the vector store"""
        self.index = None
        self.metadata = []
        
        if os.path.exists(self.index_path):
            os.remove(self.index_path)
        if os.path.exists(self.metadata_path):
            os.remove(self.metadata_path)
        
        print("Vector store cleared")
    
    def get_document_count(self) -> int:
        """Get the number of documents in the vector store"""
        return len(self.metadata)
