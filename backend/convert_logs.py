import os

log_file = "backend_logs.txt"
output_file = "backend_logs_utf8.txt"

if os.path.exists(log_file):
    try:
        # Read as UTF-16LE
        with open(log_file, "r", encoding="utf-16le") as f:
            content = f.read()
        # Write as UTF-8
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Successfully converted {log_file} to {output_file}")
    except Exception as e:
        print(f"Failed to convert: {e}")
else:
    print(f"{log_file} not found")
