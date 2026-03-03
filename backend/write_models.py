import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

with open("backend/models_clean.txt", "w", encoding="utf-8") as f:
    if api_key:
        genai.configure(api_key=api_key)
        try:
            models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            f.write(", ".join(models))
        except Exception as e:
            f.write(f"Error: {e}")
    else:
        f.write("No KEY")
