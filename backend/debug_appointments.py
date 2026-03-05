import sys
import os

# Add the current directory to sys.path so we can import database, models, etc.
sys.path.append(os.getcwd())

import database
import models
from sqlalchemy import func
import json

db = database.SessionLocal()

class MockUser:
    def __init__(self, id, role, hospital_name, name):
        self.id = id
        self.role = role
        self.hospital_name = hospital_name
        self.name = name

def test_get_appointments():
    # Simulate Sarah Johnson
    current_user = MockUser(id=1, role="DOCTOR", hospital_name="City Hospital 17", name="Sarah Johnson")
    
    print(f"Testing for user: {current_user.name} ({current_user.role}) at {current_user.hospital_name}")
    
    try:
        # Replicate the logic from main.py
        if current_user.hospital_name:
            h_name = current_user.hospital_name.strip()
            print(f"Querying for hospital: '{h_name}'")
            
            # This is the line that might be failing
            query = db.query(models.Appointment).filter(
                func.lower(func.trim(models.Appointment.hospital_name)) == func.lower(func.trim(h_name))
            )
            print("Query constructed. Executing .all()...")
            appts = query.all()
            print(f"Success! Found {len(appts)} appointments.")
            
            for appt in appts:
                print(f" - Appt ID: {appt.id}, Hospital: {appt.hospital_name}, Doctor: {appt.doctor_name}")
                
        else:
            print("User has no hospital name.")
            
    except Exception as e:
        import traceback
        print("\n!!! ERROR DETECTED !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_get_appointments()
    db.close()
