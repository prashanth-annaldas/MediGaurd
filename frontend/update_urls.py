import os
import glob
import re

files = glob.glob('src/**/*.js', recursive=True) + glob.glob('src/**/*.jsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "http://localhost:8000" in content:
        # Replaces 'http://localhost:8000...' or `http://localhost:8000...`
        # with `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}...`
        new_content = re.sub(
            r"(['`])http://localhost:8000(.*?)\1", 
            r"`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}\2`", 
            content
        )
        
        # Write back if changed
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file}")
