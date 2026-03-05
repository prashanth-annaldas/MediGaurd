"""
Migration script: adds missing columns to existing appointments table.
Run from backend/ directory.
"""
import sys, os
sys.path.insert(0, os.getcwd())
from database import engine

migration_stmts = [
    "ALTER TABLE appointments ADD COLUMN doctor_name TEXT",
    "ALTER TABLE appointments ADD COLUMN patient_name TEXT",
    "ALTER TABLE appointments ADD COLUMN patient_phone TEXT",
]

with engine.connect() as conn:
    for stmt in migration_stmts:
        try:
            conn.execute(stmt)
            print(f"OK: {stmt}")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print(f"SKIP (already exists): {stmt}")
            else:
                print(f"ERROR: {stmt} — {e}")
    conn.commit()
    print("Migration complete.")
