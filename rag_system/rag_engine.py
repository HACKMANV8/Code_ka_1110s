"""
RAG (Retrieval Augmented Generation) engine
"""
from typing import Dict, Any
from openai import AzureOpenAI
from vector_store import VectorStore
from config import get_settings

settings = get_settings()


class RAGEngine:
    """Core RAG engine for question answering"""
    
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.llm_model = settings.AZURE_LLM_DEPLOYMENT
    
    def query(self, question: str, session_id: str = None) -> Dict[str, Any]:
        """
        Query the RAG system with a question
        
        Args:
            question: The student's question
            session_id: Optional session ID for context
            
        Returns:
            Dictionary containing answer and source documents
        """
        try:
            # Check if vector store has documents
            if self.vector_store.get_document_count() == 0:
                return {
                    "answer": "I don't have any exam materials loaded yet. Please ask an administrator to upload the relevant study materials.",
                    "sources": [],
                    "error": "No documents in vector store"
                }
            
            # Retrieve relevant documents
            retrieved_docs = self.vector_store.similarity_search(
                question, 
                k=settings.TOP_K_RESULTS
            )
            
            if not retrieved_docs:
                return {
                    "answer": "I couldn't find relevant information to answer your question. Please try rephrasing or ask about a different topic.",
                    "sources": [],
                    "error": "No relevant documents found"
                }
            
            # Build context from retrieved documents
            context = "\n\n".join([doc['metadata']['content'] for doc in retrieved_docs])
            
            # Build prompt
            system_prompt = """You are an expert educator providing comprehensive, encouraging, and insightful exam reviews to help students learn and improve. 
Use the provided context from exam materials to answer questions accurately and helpfully."""

            user_prompt = f"""Based on the following exam materials, please answer the student's question.

Exam Materials Context:
{context}

Student's Question: {question}

Please provide a clear, educational explanation that:
1. Directly addresses the student's question
2. Uses examples and concepts from the provided materials
3. Is encouraging and supportive in tone
4. Includes any relevant formulas, definitions, or key concepts
5. Suggests areas for further study if relevant"""

            # Generate answer using Azure OpenAI
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            answer = response.choices[0].message.content
            
            # Prepare source information
            sources = []
            for i, doc in enumerate(retrieved_docs):
                source_info = {
                    "chunk_id": doc['metadata'].get('id', i),
                    "content_preview": doc['metadata']['content'][:150] + "...",
                    "relevance_score": doc['score']
                }
                sources.append(source_info)
            
            return {
                "answer": answer,
                "sources": sources,
                "question": question,
                "num_sources": len(sources)
            }
            
        except Exception as e:
            return {
                "answer": "I encountered an error while processing your question. Please try again.",
                "sources": [],
                "error": str(e)
            }
    
    def get_enhanced_explanation(self, 
                                 question_text: str, 
                                 student_answer: str, 
                                 correct_answer: str,
                                 is_correct: bool) -> str:
        """
        Get an enhanced explanation for a specific exam question
        
        Args:
            question_text: The exam question
            student_answer: Student's answer
            correct_answer: The correct answer
            is_correct: Whether the student's answer was correct
            
        Returns:
            Enhanced explanation string
        """
        try:
            # Get relevant context
            retrieved_docs = self.vector_store.similarity_search(question_text, k=3)
            
            if retrieved_docs:
                context = "\n".join([doc['metadata']['content'] for doc in retrieved_docs])
            else:
                context = "No additional context available from exam materials."
            
            # Build prompt for explanation
            prompt = f"""You are an expert educator helping a student understand an exam answer.

Question: {question_text}

Student's Answer: {student_answer}
Correct Answer: {correct_answer}
Result: {"Correct ✓" if is_correct else "Incorrect ✗"}

Context from Exam Materials:
{context}

Please provide a detailed explanation that:
1. Explains why the correct answer is correct
2. If the student was wrong, gently explain the misconception
3. Provides relevant concepts and examples from the exam materials
4. Offers learning tips for understanding this concept better
5. Is encouraging and supportive"""

            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Could not generate enhanced explanation: {str(e)}"
