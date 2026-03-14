import requests
import json

url = "http://localhost:8000/api/predict"
payload = {"symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"]}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
