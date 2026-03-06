from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="USER")
    hospital_name = Column(String, nullable=True)

class HospitalHistory(Base):
    __tablename__ = "hospital_history"

    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String, index=True)
    city = Column(String)
    year = Column(Integer)
    month = Column(Integer)           # 1-12
    avg_bed_occupancy = Column(Float) # %
    avg_icu_occupancy = Column(Float) # %
    avg_ventilator_util = Column(Float) # %
    avg_daily_admissions = Column(Float)
    shortage_days = Column(Integer)   # days with Resource_Shortage_Flag=1 in month

class HospitalStaff(Base):
    __tablename__ = "hospital_staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    profession = Column(String)
    qualifications = Column(String)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    resource = Column(String)
    resource_id = Column(String)
    severity = Column(String)
    message = Column(String)
    utilization = Column(String) # store as string to be safe with float
    hours_to_breach = Column(String, nullable=True) # string for float/null
    trend = Column(String)
    recommendations = Column(String) # store as JSON string
    created_at = Column(String)
    hospital_name = Column(String, nullable=True)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    city = Column(String, index=True)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    rating = Column(Float)
    total_beds = Column(Integer)
    available_beds = Column(Integer)
    icu_total = Column(Integer)
    icu_available = Column(Integer)
    ventilators_total = Column(Integer)
    ventilators_available = Column(Integer)
    specialties = Column(String) # Comma-separated string
    doctors = Column(String) # JSON serialized list of doctor dicts
    rating_count = Column(Integer)
    fee_min = Column(Integer)
    fee_max = Column(Integer)
    total_doctors = Column(Integer)
    open_24x7 = Column(Integer) # 0 or 1

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), index=True, nullable=True)
    hospital_name = Column(String)
    specialization = Column(String)
    doctor_name = Column(String, nullable=True)
    date = Column(String) # YYYY-MM-DD
    time = Column(String) # HH:MM (24-hour format)
    status = Column(String, default="pending")
    raw_message = Column(String)
    patient_name = Column(String, nullable=True)
    patient_phone = Column(String, nullable=True)
    follow_up_date = Column(String, nullable=True) # YYYY-MM-DD
    created_at = Column(String)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), index=True)
    notes = Column(String, nullable=True)
    follow_up_days = Column(Integer, nullable=True)
    created_at = Column(String)

class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), index=True)
    medicine_name = Column(String)
    dose = Column(String)
    morning = Column(Integer, default=0)   # 0 or 1
    afternoon = Column(Integer, default=0) # 0 or 1
    night = Column(Integer, default=0)     # 0 or 1

class PatientReport(Base):
    __tablename__ = "patient_reports"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), index=True)
    file_path = Column(String)
    uploaded_at = Column(String)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    height = Column(Float, nullable=True)   # cm
    weight = Column(Float, nullable=True)   # kg
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    blood_group = Column(String)
    emergency_contact = Column(String)
    medical_history = Column(String, nullable=True)
    created_at = Column(String)

class Bed(Base):
    __tablename__ = "beds"

    id = Column(Integer, primary_key=True, index=True)
    bed_number = Column(String, index=True)           # e.g. "B-001", "ICU-003"
    bed_type = Column(String, default="general")       # "general", "icu", "ventilator"
    hospital_name = Column(String, index=True)
    is_occupied = Column(Integer, default=0)            # 0 = vacant, 1 = occupied
    patient_name = Column(String, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    admitted_at = Column(String, nullable=True)         # ISO timestamp
    qr_code = Column(String, unique=True, index=True)  # Unique QR identifier

