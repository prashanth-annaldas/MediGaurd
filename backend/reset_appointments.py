"""
Reset and recreate the appointments table using the current SQLAlchemy models.
Then seed a few test appointments for Dr. Sarah Johnson.

Run from backend/ directory.
"""
import sys, os
sys.path.insert(0, os.getcwd())

from sqlalchemy import text
from database import engine, Base, SessionLocal
import models

# Drop and recreate the appointments table
print("Dropping appointments table...")
try:
    models.Appointment.__table__.drop(engine, checkfirst=True)
    print("Dropped.")
except Exception as e:
    print(f"Drop error (may not exist): {e}")

print("Creating appointments table with full schema...")
models.Appointment.__table__.create(engine)
print("Created.")

# Seed test appointments
import datetime
db = SessionLocal()
try:
    appts = [
        models.Appointment(
            user_id=1,
            hospital_name="City Hospital 17",
            specialization="Cardiology",
            doctor_name="Dr. Sarah Johnson",
            date="2026-03-10",
            time="09:00",
            status="pending",
            raw_message="Need a cardiology checkup",
            patient_name="Ravi Kumar",
            patient_phone="9876543210",
            created_at=datetime.datetime.utcnow().isoformat() + "Z"
        ),
        models.Appointment(
            user_id=1,
            hospital_name="City Hospital 17",
            specialization="General Medicine",
            doctor_name="Dr. Sarah Johnson",
            date="2026-03-11",
            time="14:30",
            status="confirmed",
            raw_message="Follow-up appointment",
            patient_name="Priya Sharma",
            patient_phone="9123456789",
            created_at=datetime.datetime.utcnow().isoformat() + "Z"
        ),
        models.Appointment(
            user_id=2,
            hospital_name="City Hospital 17",
            specialization="Orthopedics",
            doctor_name="Dr. Sarah Johnson",
            date="2026-03-12",
            time="11:00",
            status="pending",
            raw_message="Knee pain consultation",
            patient_name="Arun Nair",
            patient_phone="8765432100",
            created_at=datetime.datetime.utcnow().isoformat() + "Z"
        ),
    ]
    db.add_all(appts)
    db.commit()
    count = db.query(models.Appointment).count()
    print(f"Seeded {len(appts)} appointments. Total in DB: {count}")
finally:
    db.close()
