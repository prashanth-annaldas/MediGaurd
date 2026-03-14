import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
output_file = "gemini_generation_test.txt"

with open(output_file, "w") as f:
    try:
        genai.configure(api_key=api_key)
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        f.write(f"First available model: {available_models[0] if available_models else 'None'}\n")
        
        if available_models:
            model_name = available_models[0]
            f.write(f"Testing generation with {model_name}...\n")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Predict a disease for: fever, cough")
            f.write(f"Success! Response: {response.text}\n")
        else:
            f.write("No models supporting generateContent found!\n")
    except Exception as e:
        f.write(f"FAILED: {e}\n")
        import traceback
        f.write(traceback.format_exc())

print(f"Test results written to {output_file}")
