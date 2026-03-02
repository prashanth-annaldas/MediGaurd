import sqlite3
import os

db_path = "medguard.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE alerts ADD COLUMN hospital_name VARCHAR;")
    print("Added hospital_name to alerts.")
except sqlite3.OperationalError as e:
    print(f"Column might already exist: {e}")

conn.commit()
conn.close()
