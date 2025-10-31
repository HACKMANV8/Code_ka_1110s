"""
Simple test script for RAG API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8001"


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_upload(file_path):
    """Test document upload"""
    print(f"\n=== Testing Upload: {file_path} ===")
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{BASE_URL}/upload", files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_query(question):
    """Test query endpoint"""
    print(f"\n=== Testing Query: {question} ===")
    payload = {
        "question": question,
        "session_id": "test_session_123"
    }
    response = requests.post(
        f"{BASE_URL}/query",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Answer: {result.get('answer', 'N/A')}")
    print(f"Number of sources: {result.get('num_sources', 0)}")


def test_stats():
    """Test stats endpoint"""
    print("\n=== Testing Stats Endpoint ===")
    response = requests.get(f"{BASE_URL}/stats")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


if __name__ == "__main__":
    print("RAG System API Test")
    print("=" * 50)
    
    try:
        # Test health
        test_health()
        
        # Test stats
        test_stats()
        
        # Uncomment to test upload (provide actual file path)
        # test_upload("path/to/your/test_document.pdf")
        
        # Test query
        test_query("Can you explain the main concepts covered in the exam?")
        
    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to API server.")
        print("Make sure the server is running: python main.py")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
