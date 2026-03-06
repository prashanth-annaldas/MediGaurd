from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS beds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bed_number TEXT,
            bed_type TEXT DEFAULT 'general',
            hospital_name TEXT,
            is_occupied INTEGER DEFAULT 0,
            patient_name TEXT,
            patient_id INTEGER REFERENCES patients(id),
            admitted_at TEXT,
            qr_code TEXT UNIQUE
        )
    """))
    conn.commit()
    print("beds table created successfully!")

from sqlalchemy import inspect
tables = inspect(engine).get_table_names()
print("All tables:", tables)
print("beds in tables:", "beds" in tables)
