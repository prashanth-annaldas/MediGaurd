import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Key found: {'YES' if api_key else 'NO'}")
if api_key:
    print(f"Key prefix: {api_key[:10]}...")
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content('ping')
        print(f"Success! Response: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")
else:
    print("No API key found in .env")
