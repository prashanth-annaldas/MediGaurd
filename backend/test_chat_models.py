import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro"]
    for m in models:
        try:
            print(f"Testing {m} for chat...")
            model = genai.GenerativeModel(m)
            chat = model.start_chat(history=[])
            res = chat.send_message("hi")
            print(f"SUCCESS {m}: {res.text}")
        except Exception as e:
            print(f"FAILED {m}: {e}")
