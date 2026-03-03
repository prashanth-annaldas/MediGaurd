from sqlalchemy import Column, Integer, String, Float
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
    user_id = Column(Integer, index=True)
    hospital_id = Column(Integer, index=True)
    hospital_name = Column(String)
    specialization = Column(String)
    date = Column(String) # YYYY-MM-DD
    time = Column(String) # HH:MM (24-hour format)
    status = Column(String, default="pending")
    raw_message = Column(String)
    created_at = Column(String)
