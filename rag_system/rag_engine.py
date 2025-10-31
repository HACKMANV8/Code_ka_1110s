"""
RAG (Retrieval Augmented Generation) engine
"""
from typing import Dict, Any, List, Optional
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

    def generate_exam_review(
        self,
        exam_name: str,
        questions: List[Dict[str, Any]],
        answers: Optional[List[Dict[str, Any]]] = None,
        result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive exam review using retrieved context
        """
        try:
            if self.vector_store.get_document_count() == 0:
                return {
                    "answer": (
                        "I don't have any exam materials available to create a review yet. "
                        "Please ask your instructor to upload the relevant study materials."
                    ),
                    "sources": [],
                    "error": "No documents in vector store"
                }

            answers = answers or []
            result = result or {}

            # Map answers by question_id for fast lookup
            answer_map = {
                str(answer.get("question_id")): answer
                for answer in answers
                if answer.get("question_id") is not None
            }

            context_sections: List[str] = []
            sources: List[Dict[str, Any]] = []
            seen_sources = set()

            for idx, question in enumerate(questions or []):
                prompt = (question or {}).get("prompt", "")
                if not prompt:
                    continue

                retrieved_docs = self.vector_store.similarity_search(
                    prompt,
                    k=min(3, settings.TOP_K_RESULTS)
                )

                if not retrieved_docs:
                    continue

                answer = answer_map.get(str(question.get("id")))
                student_answer = "Not answered"
                if answer:
                    if answer.get("selected_options"):
                        student_answer = ", ".join(answer["selected_options"])
                    elif answer.get("text_answer"):
                        student_answer = answer["text_answer"]
                    student_answer = student_answer.strip() or "Not answered"

                correctness = answer.get("is_correct") if answer else None

                chunk_snippets: List[str] = []
                for doc in retrieved_docs:
                    metadata = doc.get("metadata", {})
                    snippet = metadata.get("content", "")[:400]
                    if not snippet:
                        continue

                    chunk_snippets.append(snippet)

                    source_key = (
                        str(question.get("id", idx)),
                        metadata.get("id")
                    )
                    if source_key not in seen_sources:
                        seen_sources.add(source_key)
                        sources.append({
                            "question_id": question.get("id", idx),
                            "chunk_id": metadata.get("id"),
                            "content_preview": snippet,
                            "relevance_score": doc.get("score"),
                        })

                if not chunk_snippets:
                    continue

                correctness_label = (
                    "Correct ✓" if correctness is True
                    else "Incorrect ✗" if correctness is False
                    else "Not graded"
                )

                context_sections.append(
                    f"Question {idx + 1}: {prompt}\n"
                    f"Student Answer: {student_answer}\n"
                    f"Result: {correctness_label}\n"
                    f"Relevant Exam Materials:\n{chr(10).join(chunk_snippets)}"
                )

            if not context_sections:
                return {
                    "answer": (
                        "I couldn't find any relevant context from the uploaded materials to create a detailed review. "
                        "Please upload supporting documents for this exam."
                    ),
                    "sources": [],
                    "error": "No relevant documents found"
                }

            performance_summary = [
                f"Exam: {exam_name or 'Unnamed Exam'}",
                f"Total Questions: {len(questions or [])}",
                f"Correct Answers: {result.get('correct_answers', 'N/A')}",
                f"Wrong Answers: {result.get('wrong_answers', 'N/A')}",
                f"Score: {result.get('marks_obtained', 'N/A')}/{result.get('total_marks', 'N/A')} "
                f"({result.get('percentage', 'N/A')}%)",
                f"Grade: {result.get('grade', 'N/A')}",
                f"Focus Score: {result.get('focus_score', 'N/A')}",
            ]

            system_prompt = (
                "You are an expert educator creating a supportive and actionable exam review for a student. "
                "Use only the provided exam materials when explaining concepts. "
                "Highlight strengths, address misconceptions, and recommend practical next steps."
            )

            user_prompt = (
                f"{chr(10).join(performance_summary)}\n\n"
                "Retrieved Exam Context:\n"
                f"{chr(10).join(context_sections[:20])}\n\n"
                "Please produce a comprehensive review that includes:\n"
                "1. Overall performance summary with strengths and areas for improvement\n"
                "2. Detailed insights for incorrectly answered questions, referencing the provided context\n"
                "3. Targeted study recommendations and resources from the materials\n"
                "4. Encouraging closing message with suggested next steps\n"
                "Format the response using clear markdown headings and bullet points where appropriate."
            )

            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.6,
                max_tokens=1600
            )

            answer = response.choices[0].message.content

            return {
                "answer": answer,
                "sources": sources,
                "question": exam_name,
                "num_sources": len(sources)
            }

        except Exception as e:
            return {
                "answer": "I encountered an error while generating the exam review. Please try again later.",
                "sources": [],
                "error": str(e)
            }
