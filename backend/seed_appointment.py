"""
Seed a test appointment linked to Doctor Sarah Johnson at City Hospital 17.
Run this from the backend/ directory.
"""
import sys, os
sys.path.insert(0, os.getcwd())

import datetime
from database import SessionLocal
import models
import auth

db = SessionLocal()
try:
    # 1. Ensure doctor user exists
    doctor = db.query(models.User).filter(models.User.email == "sarah@gmail.com").first()
    if not doctor:
        doctor = models.User(
            name="Sarah Johnson",
            email="sarah@gmail.com",
            password=auth.get_password_hash("password"),
            role="DOCTOR",
            hospital_name="City Hospital 17"
        )
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        print(f"Created doctor: {doctor.name} ({doctor.email})")
    else:
        print(f"Doctor exists: {doctor.name}")

    # 2. Get a hospital id (use first hospital if exists)
    hospital = db.query(models.Hospital).first()
    hospital_id = hospital.id if hospital else None
    hospital_name = "City Hospital 17"

    # 3. Seed test appointments
    appts_to_add = [
        {
            "user_id": 1,
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "specialization": "Cardiology",
            "doctor_name": "Dr. Sarah Johnson",
            "date": "2026-03-10",
            "time": "09:00",
            "status": "pending",
            "raw_message": "I need a cardiology appointment",
            "patient_name": "Ravi Kumar",
            "patient_phone": "9876543210",
            "created_at": datetime.datetime.utcnow().isoformat() + "Z"
        },
        {
            "user_id": 1,
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "specialization": "Cardiology",
            "doctor_name": "Dr. Sarah Johnson",
            "date": "2026-03-11",
            "time": "14:30",
            "status": "confirmed",
            "raw_message": "Booking for next week",
            "patient_name": "Priya Sharma",
            "patient_phone": "9123456789",
            "created_at": datetime.datetime.utcnow().isoformat() + "Z"
        },
    ]
    
    for a in appts_to_add:
        db.add(models.Appointment(**a))
    db.commit()
    print(f"Seeded {len(appts_to_add)} appointments for Dr. Sarah Johnson at {hospital_name}")
    
    # 3. Verify
    count = db.query(models.Appointment).count()
    print(f"Total appointments in DB: {count}")

finally:
    db.close()
