import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"VAL_START")
print(f"KEY_ENV: {api_key if api_key else 'NONE'}")
if api_key:
    genai.configure(api_key=api_key)
    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    for m_name in models_to_try:
        try:
            print(f"TRYING: {m_name}")
            model = genai.GenerativeModel(m_name)
            res = model.generate_content("ping", generation_config={"max_output_tokens": 1})
            print(f"SUCCESS: {m_name}")
            break
        except Exception as e:
            print(f"FAIL: {m_name} - {str(e)}")
else:
    print("NO_KEY")
print(f"VAL_END")
