import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

with open("backend/chat_results.txt", "w") as f:
    if api_key:
        genai.configure(api_key=api_key)
        try:
            models = [m for m in genai.list_models()]
            for m in models:
                if 'generateContent' in m.supported_generation_methods:
                    f.write(f"Testing {m.name}...\n")
                    try:
                        chat = genai.GenerativeModel(m.name).start_chat(history=[])
                        res = chat.send_message("hi")
                        f.write(f"SUCCESS: {m.name}\n")
                    except Exception as e:
                        f.write(f"FAILED: {m.name} - {str(e)[:100]}\n")
        except Exception as e:
            f.write(f"List error: {e}\n")
    else:
        f.write("No API key\n")
