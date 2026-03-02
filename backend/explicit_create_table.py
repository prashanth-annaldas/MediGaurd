from database import engine
import models
import traceback

print("Attempting to create 'hospitals' table explicitly...")
try:
    models.Hospital.__table__.create(engine)
    print("SUCCESS: 'hospitals' table created.")
except Exception:
    print("FAILED: Explicit creation failed.")
    traceback.print_exc()

import sqlite3
conn = sqlite3.connect("medguard.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(f"Current tables: {cursor.fetchall()}")
conn.close()
