import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"DEBUG: Key found: {'YES' if api_key else 'NO'}")
if api_key:
    genai.configure(api_key=api_key)
    models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    for m in models:
        try:
            print(f"DEBUG: Testing {m}...")
            model = genai.GenerativeModel(m)
            # Health check
            res = model.generate_content("hello", generation_config={"max_output_tokens": 5})
            print(f"DEBUG: {m} SUCCESS: {res.text}")
            break
        except Exception as e:
            print(f"DEBUG: {m} FAILED: {str(e)}")
else:
    print("DEBUG: No API key")
