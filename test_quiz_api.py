import requests
import json

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000"

def test_quiz_info_endpoint():
    """Test the quiz info endpoint (no auth required for testing)"""
    print("Testing Quiz Info Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/quiz/info/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_quiz_generation_endpoint():
    """Test the quiz generation endpoint"""
    print("\nTesting Quiz Generation Endpoint...")
    
    # Test data
    test_data = {
        "condition": "dyslexia",
        "num_easy": 2,
        "num_moderate": 1,
        "num_hard": 1
    }
    
    try:
        # This will likely fail due to authentication, but we can see the response
        response = requests.post(
            f"{BASE_URL}/api/quiz/generate/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_quiz_info_endpoint()
    test_quiz_generation_endpoint()
