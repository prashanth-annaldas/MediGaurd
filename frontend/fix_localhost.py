import os
import glob

files = glob.glob('src/**/*.js', recursive=True) + glob.glob('src/**/*.jsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "localhost:8000" in content:
        new_content = content.replace("'http://localhost:8000'", "'https://medigaurd1-fzd9.onrender.com'").replace('"http://localhost:8000"', '"https://medigaurd1-fzd9.onrender.com"')
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file}")
