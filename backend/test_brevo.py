import os
from dotenv import load_dotenv
import requests

load_dotenv(r'c:\Users\annal\Documents\MedGaurd-main\backend\.env')
API_KEY = os.getenv('BREVO_API_KEY')

print(f"Key loaded: {bool(API_KEY)}, length: {len(API_KEY) if API_KEY else 0}")
print(f"Key preview: {API_KEY[:10]}...{API_KEY[-10:]}" if API_KEY else "No key")

url = 'https://api.brevo.com/v3/smtp/email'
headers = {
    'accept': 'application/json',
    'api-key': API_KEY,
    'content-type': 'application/json'
}
payload = {
    'sender': {'name': 'MedGuard', 'email': 'prashanthannaldas@gmail.com'},
    'to': [{'email': 'prashanthannaldas453@gmail.com', 'name': 'Doc Prashanth'}],
    'subject': 'Test from MedGuard via API',
    'textContent': 'Test Message'
}
try:
    resp = requests.post(url, json=payload, headers=headers)
    print('Status:', resp.status_code)
    print('Response:', resp.text)
except Exception as e:
    print('Error:', e)
