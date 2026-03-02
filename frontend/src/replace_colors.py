import os
import glob

components_dir = r"c:\Users\annal\Documents\MedGaurd-main\frontend\src"
replacements = {
    "'#e2e8f0'": "'var(--text-primary)'",
    "'#94a3b8'": "'var(--text-secondary)'",
    "'#475569'": "'var(--text-muted)'",
    "#e2e8f0": "var(--text-primary)",
    "#94a3b8": "var(--text-secondary)",
    "#475569": "var(--text-muted)"
}

for filepath in glob.glob(os.path.join(components_dir, "**/*.jsx"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
