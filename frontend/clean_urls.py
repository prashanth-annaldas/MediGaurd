import os
import glob

files = glob.glob('src/**/*.js', recursive=True) + glob.glob('src/**/*.jsx', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace exactly:
    # ${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}`}
    # With:
    # ${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}
    
    target = "${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}`}"
    replacement = "${import.meta.env.VITE_API_URL || 'https://medigaurd1-fzd9.onrender.com'}"
    
    if target in content:
        new_content = content.replace(target, replacement)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned {file}")
