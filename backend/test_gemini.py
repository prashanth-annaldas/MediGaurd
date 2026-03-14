import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
output_file = "gemini_models_debug.txt"

with open(output_file, "w") as f:
    f.write(f"API Key start: {api_key[:10]}...\n")
    try:
        genai.configure(api_key=api_key)
        f.write("Listing models:\n")
        models = genai.list_models()
        for m in models:
            f.write(f"- {m.name} (Methods: {m.supported_generation_methods})\n")
        
        f.write("\nTesting 'gemini-pro'...\n")
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Say hello")
        f.write(f"Success! Response: {response.text}\n")
    except Exception as e:
        f.write(f"FAILED: {e}\n")

print(f"Debug info written to {output_file}")
