
import requests
import json

def test_generate_embedding():
    """Test the embedding generation endpoint."""
    url = "http://localhost:8080"
    
    # Test data
    test_data = {
        "text": "Cuidador con 5 años de experiencia en demencia vascular severa, manejando episodios de agitación, asistiendo en alimentación por disfagia, y coordinando con neurólogos para ajuste de medicación antipsicótica."
    }
    
    print("Testing generate_embedding function...")
    print(f"Request: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n Success!")
            print(f"Model Version: {result.get('model_version')}")
            print(f"Dimensions: {result.get('dimensions')}")
            print(f"Embedding length: {len(result.get('embedding', []))}")
            print(f"First 5 values: {result.get('embedding', [])[:5]}")
        else:
            print(f"\n Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n Request failed: {e}")

if __name__ == "__main__":
    test_generate_embedding()

