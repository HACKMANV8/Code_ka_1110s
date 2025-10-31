"""
Script to upload documents to the RAG vector database
"""
import requests
import os

# Configuration
RAG_API_URL = "http://localhost:8001"
PDF_PATH = r"C:\Users\Sujal B\OneDrive\Desktop\HACKMAN\inheritance unit 3.pdf"

def upload_document(file_path):
    """Upload a document to the RAG system"""
    
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found at {file_path}")
        return False
    
    print(f"📤 Uploading: {os.path.basename(file_path)}")
    print(f"   Size: {os.path.getsize(file_path) / 1024:.2f} KB")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'application/pdf')}
            response = requests.post(
                f"{RAG_API_URL}/upload",
                files=files,
                timeout=120  # 2 minutes timeout for large files
            )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Filename: {result['filename']}")
            print(f"   Chunks created: {result['chunks_added']}")
            print(f"   Total documents in DB: {result['total_documents']}")
            return True
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Cannot connect to RAG server at {RAG_API_URL}")
        print("   Make sure the server is running: python main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def check_server():
    """Check if RAG server is running"""
    try:
        response = requests.get(f"{RAG_API_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RAG Server is running")
            print(f"   Documents in database: {data['document_count']}")
            print(f"   Embedding model: {data['config']['embedding_model']}")
            print(f"   LLM model: {data['config']['llm_model']}")
            return True
    except:
        print(f"❌ RAG Server is not running at {RAG_API_URL}")
        print("   Start it with: python main.py")
        return False

def test_query():
    """Test a query after upload"""
    print("\n🧪 Testing query...")
    try:
        response = requests.post(
            f"{RAG_API_URL}/query",
            json={
                "question": "What is inheritance in programming?",
                "session_id": "test_upload"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Query successful!")
            print(f"   Answer: {result['answer'][:200]}...")
            print(f"   Sources used: {result['num_sources']}")
        else:
            print(f"❌ Query failed: {response.text}")
    except Exception as e:
        print(f"❌ Query error: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("RAG System - Document Upload")
    print("=" * 60)
    
    # Check if server is running
    if not check_server():
        exit(1)
    
    print("\n" + "=" * 60)
    
    # Upload the PDF
    if upload_document(PDF_PATH):
        # Test with a query
        test_query()
    
    print("\n" + "=" * 60)
    print("Done! 🎉")
    print("=" * 60)
