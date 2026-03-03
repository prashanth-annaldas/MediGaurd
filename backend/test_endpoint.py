import requests

try:
    url = "http://localhost:8000/api/gemini/chat"
    payload = {
        "message": "hi",
        "context": None,
        "history": []
    }
    response = requests.post(url, json=payload)
    with open("backend/error_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Status: {response.status_code}\n")
        f.write(f"Body: {response.text}\n")
except Exception as e:
    with open("backend/error_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Failed to connect: {e}\n")
