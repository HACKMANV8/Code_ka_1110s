"""
Document processing and chunking utilities
"""
import os
from typing import List
from PyPDF2 import PdfReader
from config import get_settings

settings = get_settings()


class DocumentProcessor:
    """Process and chunk documents for RAG system"""
    
    def __init__(self):
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
    
    def load_document(self, file_path: str) -> List[str]:
        """
        Load document based on file extension
        
        Args:
            file_path: Path to the document file
            
        Returns:
            List of text content
        """
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension == '.pdf':
                return self._load_pdf(file_path)
            elif file_extension == '.txt':
                return self._load_txt(file_path)
            elif file_extension in ['.docx', '.doc']:
                return self._load_docx(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
        except Exception as e:
            raise Exception(f"Error loading document: {str(e)}")
    
    def _load_pdf(self, file_path: str) -> List[str]:
        """Load PDF file"""
        text_content = []
        try:
            pdf_reader = PdfReader(file_path)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
            return text_content
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
    
    def _load_txt(self, file_path: str) -> List[str]:
        """Load text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return [content]
        except Exception as e:
            raise Exception(f"Error reading TXT: {str(e)}")
    
    def _load_docx(self, file_path: str) -> List[str]:
        """Load DOCX file"""
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            return paragraphs
        except Exception as e:
            raise Exception(f"Error reading DOCX: {str(e)}")
    
    def chunk_text(self, texts: List[str]) -> List[dict]:
        """
        Split texts into chunks
        
        Args:
            texts: List of text content
            
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        chunk_id = 0
        
        for text in texts:
            # Split by paragraphs first
            paragraphs = text.split('\n\n')
            
            current_chunk = ""
            for paragraph in paragraphs:
                # Check if adding this paragraph exceeds chunk size
                if len(current_chunk) + len(paragraph) < self.chunk_size:
                    current_chunk += paragraph + "\n\n"
                else:
                    # Save current chunk and start new one
                    if current_chunk.strip():
                        chunks.append({
                            'id': chunk_id,
                            'content': current_chunk.strip(),
                            'length': len(current_chunk)
                        })
                        chunk_id += 1
                    
                    # Start new chunk with overlap
                    overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else ""
                    current_chunk = overlap_text + paragraph + "\n\n"
            
            # Add remaining chunk
            if current_chunk.strip():
                chunks.append({
                    'id': chunk_id,
                    'content': current_chunk.strip(),
                    'length': len(current_chunk)
                })
                chunk_id += 1
        
        return chunks
    
    def process_file(self, file_path: str) -> List[dict]:
        """
        Complete pipeline: load and chunk document
        
        Args:
            file_path: Path to the document file
            
        Returns:
            List of chunk dictionaries
        """
        texts = self.load_document(file_path)
        chunks = self.chunk_text(texts)
        return chunks
