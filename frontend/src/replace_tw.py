import os
import glob
import re

components_dir = r"c:\Users\annal\Documents\MedGaurd-main\frontend\src"

def replace_navy(content):
    # Replace bg-navy-950, bg-navy-900 etc with bg-[var(--bg-primary)] and bg-[var(--bg-secondary)]
    content = re.sub(r'bg-navy-950', r'bg-[var(--bg-primary)]', content)
    content = re.sub(r'bg-navy-900', r'bg-[var(--bg-secondary)]', content)
    content = re.sub(r'bg-navy-800', r'bg-[var(--bg-card)]', content)
    
    # Text navy (if any)
    content = re.sub(r'text-white', r'text-[var(--text-primary)]', content)
    # text-gray-400 -> text-[var(--text-muted)]
    content = re.sub(r'text-gray-400', r'text-[var(--text-muted)]', content)
    return content

for filepath in glob.glob(os.path.join(components_dir, "**/*.jsx"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = replace_navy(content)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
