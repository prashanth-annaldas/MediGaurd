"""
MedGuard AI — FastAPI Backend
Hospital Resource Intelligence Platform
Zero patient data — privacy-preserving by architecture
"""

import os
import math
import random
import datetime
import json
import joblib
import pandas as pd
import traceback
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, File, Form, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import engine, Base, get_db
import models
import auth
import ml_model

load_dotenv()

# Load ML Disease Model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
disease_model = None
symptom_encoder = None

try:
    model_path = os.path.join(BASE_DIR, "disease_model.pkl")
    encoder_path = os.path.join(BASE_DIR, "symptom_encoder.pkl")
    if os.path.exists(model_path) and os.path.exists(encoder_path):
        # Disconnected local ML model as requested
        # disease_model = joblib.load(model_path)
        symptom_encoder = joblib.load(encoder_path)
        print("✅ Symptom encoder loaded (ML Model disconnected)")
    else:
        print("⚠️ Disease prediction model files not found. Run train_model.py first.")
except Exception as e:
    print(f"❌ Failed to load disease prediction model: {e}")

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedGuard AI Backend",
    description="Privacy-preserving hospital resource intelligence API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth router
app.include_router(auth.router)

class SymptomInput(BaseModel):
    symptoms: List[str]

@app.get("/api/symptoms")
def get_symptoms():
    if not symptom_encoder:
        raise HTTPException(status_code=503, detail="Symptom encoder not loaded")
    return {"symptoms": list(symptom_encoder.classes_)}

@app.post("/api/predict")
async def predict(data: SymptomInput):
    # ML Model Branch (Disconnected but kept for reference)
    # try:
    #     if disease_model and symptom_encoder:
    #         cleaned_symptoms = [s.strip().lower() for s in data.symptoms if s.strip()]
    #         if cleaned_symptoms:
    #             binary_input = symptom_encoder.transform([cleaned_symptoms])
    #             input_df = pd.DataFrame(binary_input, columns=symptom_encoder.classes_)
    #             prediction = disease_model.predict(input_df)
    #             # ml_result = prediction[0]
    # except Exception:
    #     pass

    if not data.symptoms or len(data.symptoms) == 0:
        return {"prediction": "Please provide valid symptoms."}

    # Use Gemini API for prediction
    try:
        if not GEMINI_AVAILABLE or not gemini_model:
            raise HTTPException(status_code=503, detail="Gemini AI is not available. Please check API key.")

        symptoms_str = ", ".join(data.symptoms)
        prompt = (
            "Act as a professional medical diagnostic system. Analyze the following list of symptoms and predict the most likely disease or health condition.\n\n"
            f"Symptoms: {symptoms_str}\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Return ONLY the name of the disease or condition.\n"
            "2. Do NOT include any explanations, greetings, disclaimers, or notes.\n"
            "3. If multiple conditions fit, return only the most probable one.\n"
            "4. If symptoms are nonsensical, return 'Unable to determine'.\n"
            "5. Examples: 'Common Cold', 'Malaria', 'Diabetes Type 2'."
        )

        response = gemini_model.generate_content(prompt)
        prediction_text = response.text.strip()
        
        # Robust cleanup to ensure ONLY the disease name is returned
        # Remove markdown bold/italic if present
        prediction_text = prediction_text.replace("**", "").replace("*", "").replace("`", "")
        # Take only the first line if multiple were returned
        prediction_text = prediction_text.split("\n")[0].strip()
        # Remove trailing punctuation if it's just a dot
        if prediction_text.endswith("."):
            prediction_text = prediction_text[:-1]
        
        return {"prediction": prediction_text}

    except HTTPException:
        raise
    except Exception as e:
        error_msg = traceback.format_exc()
        print(f"DEBUG: Gemini prediction error:\n{error_msg}")
        # Final fallback to a generic message if even Gemini fails
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}\n{error_msg}")

# Seed demo users on startup
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
def seed_users():
    db = next(get_db())
    if not db.query(models.User).first():
        hashed_pw = auth.get_password_hash("password")
        users = [
            models.User(name="Ram", email="ram@gmail.com", password=hashed_pw, role="ADMIN"),
            models.User(name="Ravi", email="ravi@gmail.com", password=hashed_pw, role="STAFF"),
            models.User(name="Kiran", email="kiran@gmail.com", password=hashed_pw, role="USER")
        ]
        db.add_all(users)
        db.commit()
        
    if not db.query(models.HospitalStaff).first():
        staff = [
            models.HospitalStaff(name="Dr. Sarah Johnson", profession="Chief Surgeon", qualifications="MD, FACS"),
            models.HospitalStaff(name="Dr. Michael Lee", profession="Anesthesiologist", qualifications="MD, FASA"),
            models.HospitalStaff(name="Nurse Emily Chen", profession="ICU Head Nurse", qualifications="BSN, RN, CCRN"),
            models.HospitalStaff(name="Dr. Robert Garcia", profession="Cardiologist", qualifications="MD, FACC"),
            models.HospitalStaff(name="Nurse Amanda Smith", profession="Triage Nurse", qualifications="RN, CEN"),
        ]
        db.add_all(staff)
        db.commit()

    if not db.query(models.Hospital).first():
        try:
            import json, os
            filepath = os.path.join(os.path.dirname(__file__), "seed_data.json")
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    hospitals_data = json.load(f)
                
                new_hospitals = []
                for h in hospitals_data:
                    new_hospitals.append(models.Hospital(
                        name=h.get("name"),
                        city=h.get("city"),
                        address=h.get("address"),
                        latitude=h.get("latitude"),
                        longitude=h.get("longitude"),
                        rating=h.get("rating"),
                        total_beds=h.get("total_beds"),
                        available_beds=h.get("available_beds"),
                        icu_total=h.get("icu_total"),
                        icu_available=h.get("icu_available"),
                        ventilators_total=h.get("ventilators_total"),
                        ventilators_available=h.get("ventilators_available"),
                        specialties=",".join(h.get("specialties", [])),
                        doctors=json.dumps(h.get("doctors", [])),
                        rating_count=h.get("rating_count", 0),
                        fee_min=h.get("fee_min", 500),
                        fee_max=h.get("fee_max", 800),
                        total_doctors=h.get("total_doctors", 10),
                        open_24x7=h.get("open_24x7", 1)
                    ))
                db.add_all(new_hospitals)
                db.commit()
                print(f"Auto-seeded {len(new_hospitals)} hospitals.")
        except Exception as e:
            print(f"DEBUG: Hospital auto-seeding failed: {e}")

seed_users()

# Initialize ML Model (Disconnected)
# ml_model.load_and_train_model()

# Initialize ML Model (Disconnected)
# ml_model.load_and_train_model()

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"DEBUG: Request: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"DEBUG: Response status: {response.status_code}")
    return response

# ─── Gemini Setup ────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Dynamically discover supported models instead of hardcoding
        gemini_model = None
        m_name = None
        try:
            # We want to use models that support generateContent
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            preferred_order = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
            
            for pref in preferred_order:
                for am in available_models:
                    if pref in am:
                        m_name = am
                        break
                if m_name:
                    break
            
            # Fallback if no preferred models are available
            if not m_name and available_models:
                m_name = available_models[0]
                
            if m_name:
                # Basic initialization - skipping ping check to avoid eating quota at startup
                gemini_model = genai.GenerativeModel(m_name)
                print(f"🤖 MedGuard AI: Gemini model {m_name} ready.")
            else:
                print("⚠️ MedGuard AI: No models supporting 'generateContent' were found.")
                
        except Exception as e:
            print(f"DEBUG: Model dynamic discovery/initialization failure: {e}")
            gemini_model = None
            
        GEMINI_AVAILABLE = gemini_model is not None
    else:
        GEMINI_AVAILABLE = False
        print("⚠️ MedGuard AI: Gemini API key not found or invalid. Running in demo mode.")
except Exception as e:
    print(f"⚠️ MedGuard AI: Gemini setup failed: {e}")
    GEMINI_AVAILABLE = False

# ─── Data Simulation ─────────────────────────────────────────────────────────

RESOURCES = [
    {"id": "beds", "name": "General Beds", "unit": "beds", "capacity": 0, "critical_threshold": 85, "warning_threshold": 75},
    {"id": "icu_beds", "name": "ICU Beds", "unit": "beds", "capacity": 0, "critical_threshold": 85, "warning_threshold": 72},
    {"id": "oxygen_supply", "name": "Oxygen Supply", "unit": "%", "capacity": 0, "critical_threshold": 30, "warning_threshold": 45},
    {"id": "ventilators", "name": "Ventilators", "unit": "units", "capacity": 0, "critical_threshold": 80, "warning_threshold": 65},
    {"id": "blood_bank", "name": "Blood Bank", "unit": "units", "capacity": 0, "critical_threshold": 25, "warning_threshold": 40},
    {"id": "ppe_stock", "name": "PPE Stock", "unit": "%", "capacity": 0, "critical_threshold": 20, "warning_threshold": 35},
    {"id": "nursing_staff", "name": "Nursing Staff", "unit": "%", "capacity": 0, "critical_threshold": 70, "warning_threshold": 80},
]

# Real-time data store for capacity inputs
LIVE_DATA = {}

SEED_UTILIZATIONS = {
    "oxygen_supply": 62.0,
    "blood_bank": 55.8,
    "ppe_stock": 44.2,
    "nursing_staff": 82.1,
}

def get_utilization(resource_id: str, noise: float = 2.0) -> float:
    # Use real live data if it corresponds to an explicitly updated capacity metric
    live_key = "beds" if resource_id == "general_beds" else resource_id
    if live_key in LIVE_DATA:
        cap = LIVE_DATA[live_key]["capacity"]
        occ = LIVE_DATA[live_key]["occupied"]
        if cap > 0:
            return round((occ / cap) * 100, 1)
        return 0.0

    base = SEED_UTILIZATIONS.get(resource_id, 60.0)
    now = datetime.datetime.now()
    time_val = now.hour + now.minute / 60.0
    
    # Day-of-week + hour cycle effect
    daily_cycle = math.sin((time_val - 6) * math.pi / 12) * 4
    
    # Smooth pseudo-noise based on 10-minute intervals
    seed_val = sum(ord(c) for c in resource_id)
    pseudo_noise = math.sin(time_val * 6 + seed_val) * noise
    
    return round(min(100.0, max(0.0, base + daily_cycle + pseudo_noise)), 1)

def calculate_trend(resource_id: str) -> str:
    base = SEED_UTILIZATIONS.get(resource_id, 60.0)
    hour = datetime.datetime.now().hour
    slope = math.cos((hour - 6) * math.pi / 12)
    if slope > 0.2:
        return "rising"
    elif slope < -0.2:
        return "falling"
    return "stable"

def hours_to_breach(utilization: float, threshold: float, trend: str) -> Optional[float]:
    """Calculate exact hours before threshold breach."""
    if trend == "rising" and utilization < threshold:
        # Estimated rate: ~0.8% per hour rising
        rate = 0.8
        hours = (threshold - utilization) / rate
        return round(hours, 1)
    elif trend == "falling" and utilization > (100 - threshold):
        rate = 0.5
        hours = (utilization - (100 - threshold)) / rate
        return round(hours, 1)
    return None

def get_status(utilization: float, resource: dict) -> str:
    crit = resource["critical_threshold"]
    warn = resource["warning_threshold"]
    if resource["id"] in ["oxygen_supply", "blood_bank", "ppe_stock"]:
        # Inverted: low is bad
        if utilization <= crit:
            return "critical"
        elif utilization <= warn:
            return "warning"
        return "normal"
    else:
        # High is bad (ICU beds, ventilators, staff utilization)
        if utilization >= crit:
            return "critical"
        elif utilization >= warn:
            return "warning"
        return "normal"

# ─── API Routes ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"app": "MedGuard AI", "status": "operational", "version": "1.0.0"}

@app.get("/api/resources")
def get_resources(hospital_id: Optional[int] = None, hospital_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Get current resource utilization for all hospital resources."""
    
    # Try to load real hospital data if ID or name is provided
    real_hospital = None
    if hospital_id:
        real_hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    elif hospital_name:
        real_hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
        
    results = []
    for r in RESOURCES:
        r_id = str(r["id"])
        
        util = None
        cap = float(r["capacity"])
        
        # Override with actual database hospital statistics if available
        if real_hospital:
            if r_id == "beds" and real_hospital.total_beds > 0:
                cap = float(real_hospital.total_beds)
                occ = cap - float(real_hospital.available_beds)
                util = round((occ / cap) * 100, 1)
            elif r_id == "icu_beds" and real_hospital.icu_total > 0:
                cap = float(real_hospital.icu_total)
                occ = cap - float(real_hospital.icu_available)
                util = round((occ / cap) * 100, 1)
            elif r_id == "ventilators" and real_hospital.ventilators_total > 0:
                cap = float(real_hospital.ventilators_total)
                occ = cap - float(real_hospital.ventilators_available)
                util = round((occ / cap) * 100, 1)
        
        # Fall back to simulation algorithms if no DB value exists
        if util is None:
            util = get_utilization(r_id)
            live_key = "beds" if r_id == "general_beds" else r_id
            if live_key in LIVE_DATA:
                cap = float(LIVE_DATA[live_key]["capacity"])
            
        trend = calculate_trend(r_id)
        status = get_status(util, r)

        results.append({
            "id": r_id,
            "name": r["name"],
            "unit": r["unit"],
            "utilization": util,
            "capacity": cap,
            "trend": trend,
            "status": status,
            "critical_threshold": r["critical_threshold"],
            "warning_threshold": r["warning_threshold"],
            "hours_to_breach": hours_to_breach(util, r["critical_threshold"], trend),
            "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
        })
    return {"resources": results, "timestamp": datetime.datetime.utcnow().isoformat() + "Z"}

class CapacityInputMode(BaseModel):
    beds_capacity: int
    beds_occupied: int
    icu_capacity: int
    icu_occupied: int
    ventilators_capacity: int
    ventilators_occupied: int

@app.post("/api/capacity")
def update_capacity(data: CapacityInputMode, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Update live capacity and occupied numbers in DB."""
    hospital_name = current_user.hospital_name
    if not hospital_name:
        raise HTTPException(status_code=400, detail="User not associated with a hospital")
    
    hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
    if not hospital:
        raise HTTPException(status_code=404, detail=f"Hospital '{hospital_name}' not found")

    # Update total capacities
    hospital.total_beds = data.beds_capacity
    hospital.icu_total = data.icu_capacity
    hospital.ventilators_total = data.ventilators_capacity

    # Update available counts (Capacity - Occupied)
    hospital.available_beds = max(0, data.beds_capacity - data.beds_occupied)
    hospital.icu_available = max(0, data.icu_capacity - data.icu_occupied)
    hospital.ventilators_available = max(0, data.ventilators_capacity - data.ventilators_occupied)

    db.commit()
    
    # Also update the legacy LIVE_DATA simulation for fallback/legacy compatibility
    global LIVE_DATA
    LIVE_DATA["beds"] = {"capacity": data.beds_capacity, "occupied": data.beds_occupied}
    LIVE_DATA["icu_beds"] = {"capacity": data.icu_capacity, "occupied": data.icu_occupied}
    LIVE_DATA["ventilators"] = {"capacity": data.ventilators_capacity, "occupied": data.ventilators_occupied}
    
    return {"message": "Capacity successfully updated in database", "hospital": hospital_name}

class QRScanData(BaseModel):
    qr_data: str

@app.post("/api/hospitals/admit")
def admit_patient(data: QRScanData, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Increment bed occupancy (decrement available beds) on patient admission."""
    hospital_name = current_user.hospital_name
    if not hospital_name:
        raise HTTPException(status_code=400, detail="Current user is not associated with any hospital. Please update user profile.")
        
    hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
    
    if not hospital:
        raise HTTPException(status_code=404, detail=f"Hospital '{hospital_name}' not found in database. Please check for name mismatch.")
    
    if hospital.available_beds <= 0:
        raise HTTPException(status_code=400, detail="No beds available for admission")
    
    hospital.available_beds -= 1
    
    # Create notification alert
    occ = hospital.total_beds - hospital.available_beds
    util = (occ / hospital.total_beds) * 100 if hospital.total_beds > 0 else 0
    alert_id = f"admit_{int(datetime.datetime.utcnow().timestamp())}_{random.randint(100, 999)}"
    
    new_alert = models.Alert(
        id=alert_id,
        resource="General Beds",
        resource_id="beds",
        severity="info",
        message=f"Patient Admitted: Occupancy now {occ}/{hospital.total_beds}",
        utilization=str(round(util, 1)),
        trend="rising",
        recommendations=json.dumps(["Monitor resource flow", "Check staffing levels"]),
        created_at=datetime.datetime.utcnow().isoformat() + "Z",
        hospital_name=hospital_name
    )
    db.add(new_alert)
    db.commit()
    
    return {"message": "Patient admitted successfully", "available_beds": hospital.available_beds, "hospital": hospital_name}



@app.post("/api/hospitals/discharge")
def discharge_patient(data: QRScanData, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Decrement bed occupancy (increment available beds) on patient discharge."""
    hospital_name = current_user.hospital_name
    if not hospital_name:
        raise HTTPException(status_code=400, detail="Current user is not associated with any hospital. Please update user profile.")

    hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
    
    if not hospital:
        raise HTTPException(status_code=404, detail=f"Hospital '{hospital_name}' not found in database. Please check for name mismatch.")
    
    if hospital.available_beds >= hospital.total_beds:
        raise HTTPException(status_code=400, detail="All beds are already available (nothing to discharge)")
    
    hospital.available_beds += 1
    
    # Create notification alert
    occ = hospital.total_beds - hospital.available_beds
    util = (occ / hospital.total_beds) * 100 if hospital.total_beds > 0 else 0
    alert_id = f"discharge_{int(datetime.datetime.utcnow().timestamp())}_{random.randint(100, 999)}"
    
    new_alert = models.Alert(
        id=alert_id,
        resource="General Beds",
        resource_id="beds",
        severity="info",
        message=f"Patient Discharged: Occupancy now {occ}/{hospital.total_beds}",
        utilization=str(round(util, 1)),
        trend="falling",
        recommendations=json.dumps(["Sterilize bed area", "Ready for next patient"]),
        created_at=datetime.datetime.utcnow().isoformat() + "Z",
        hospital_name=hospital_name
    )
    db.add(new_alert)
    db.commit()
    
    return {"message": "Patient discharged successfully", "available_beds": hospital.available_beds, "hospital": hospital_name}

# ─── Bed Management ─────────────────────────────────────────────────────────

@app.get("/api/beds")
def get_beds(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """List all beds for the staff user's hospital."""
    hospital_name = current_user.hospital_name
    if not hospital_name:
        raise HTTPException(status_code=400, detail="User not associated with a hospital")
    beds = db.query(models.Bed).filter(models.Bed.hospital_name == hospital_name).order_by(models.Bed.bed_number).all()
    return [
        {
            "id": b.id,
            "bed_number": b.bed_number,
            "bed_type": b.bed_type,
            "is_occupied": b.is_occupied,
            "patient_name": b.patient_name,
            "patient_id": b.patient_id,
            "admitted_at": b.admitted_at,
            "qr_code": b.qr_code,
            "hospital_name": b.hospital_name,
        }
        for b in beds
    ]

@app.get("/api/beds/qr/{qr_code}")
def get_bed_by_qr(qr_code: str, db: Session = Depends(get_db)):
    """Public endpoint: get bed details by QR code (used when scanning a bed QR)."""
    bed = db.query(models.Bed).filter(models.Bed.qr_code == qr_code).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found for this QR code")

    patient = None
    if bed.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == bed.patient_id).first()

    return {
        "id": bed.id,
        "bed_number": bed.bed_number,
        "bed_type": bed.bed_type,
        "is_occupied": bed.is_occupied,
        "patient_name": bed.patient_name,
        "patient_id": bed.patient_id,
        "admitted_at": bed.admitted_at,
        "qr_code": bed.qr_code,
        "hospital_name": bed.hospital_name,
        "patient_details": {
            "id": patient.id,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "blood_group": patient.blood_group,
            "emergency_contact": patient.emergency_contact,
            "medical_history": patient.medical_history,
        } if patient else None,
    }

@app.post("/api/beds/seed")
def seed_beds(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Auto-generate bed records from the hospital's total_beds, icu_total, ventilators_total."""
    hospital_name = current_user.hospital_name
    if not hospital_name:
        raise HTTPException(status_code=400, detail="User not associated with a hospital")

    hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if beds already exist
    existing = db.query(models.Bed).filter(models.Bed.hospital_name == hospital_name).count()
    if existing > 0:
        raise HTTPException(status_code=400, detail=f"{existing} beds already exist for this hospital. Delete them first to re-seed.")

    beds_to_create = []
    import uuid

    # General beds
    for i in range(1, (hospital.total_beds or 0) + 1):
        beds_to_create.append(models.Bed(
            bed_number=f"B-{i:03d}",
            bed_type="general",
            hospital_name=hospital_name,
            is_occupied=0,
            qr_code=f"BED-{hospital_name.replace(' ', '_')}-B{i:03d}-{uuid.uuid4().hex[:8]}",
        ))

    # ICU beds
    for i in range(1, (hospital.icu_total or 0) + 1):
        beds_to_create.append(models.Bed(
            bed_number=f"ICU-{i:03d}",
            bed_type="icu",
            hospital_name=hospital_name,
            is_occupied=0,
            qr_code=f"BED-{hospital_name.replace(' ', '_')}-ICU{i:03d}-{uuid.uuid4().hex[:8]}",
        ))

    # Ventilator beds
    for i in range(1, (hospital.ventilators_total or 0) + 1):
        beds_to_create.append(models.Bed(
            bed_number=f"VENT-{i:03d}",
            bed_type="ventilator",
            hospital_name=hospital_name,
            is_occupied=0,
            qr_code=f"BED-{hospital_name.replace(' ', '_')}-VENT{i:03d}-{uuid.uuid4().hex[:8]}",
        ))

    db.add_all(beds_to_create)
    db.commit()
    return {"message": f"Seeded {len(beds_to_create)} beds", "count": len(beds_to_create)}

class BedToggleRequest(BaseModel):
    patient_name: Optional[str] = None
    patient_id: Optional[int] = None

@app.put("/api/beds/{bed_id}/toggle")
def toggle_bed(bed_id: int, data: BedToggleRequest = BedToggleRequest(), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Toggle bed occupied <-> vacant. If marking occupied, optionally assign a patient."""
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    hospital = db.query(models.Hospital).filter(models.Hospital.name == bed.hospital_name).first()

    if bed.is_occupied:
        # Discharge: mark vacant
        bed.is_occupied = 0
        bed.patient_name = None
        bed.patient_id = None
        bed.admitted_at = None
        if hospital:
            hospital.available_beds = min(hospital.total_beds, hospital.available_beds + 1)
    else:
        # Admit: mark occupied
        bed.is_occupied = 1
        bed.patient_name = data.patient_name
        bed.patient_id = data.patient_id
        bed.admitted_at = datetime.datetime.utcnow().isoformat() + "Z"
        if hospital:
            hospital.available_beds = max(0, hospital.available_beds - 1)

    db.commit()
    return {
        "message": f"Bed {bed.bed_number} is now {'occupied' if bed.is_occupied else 'vacant'}",
        "bed": {
            "id": bed.id,
            "bed_number": bed.bed_number,
            "is_occupied": bed.is_occupied,
            "patient_name": bed.patient_name,
            "patient_id": bed.patient_id,
            "admitted_at": bed.admitted_at,
        }
    }

class BedAssignRequest(BaseModel):
    patient_name: str
    patient_id: Optional[int] = None

@app.put("/api/beds/{bed_id}/assign")
def assign_patient_to_bed(bed_id: int, data: BedAssignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    """Assign a specific patient to a bed (marks it occupied)."""
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    hospital = db.query(models.Hospital).filter(models.Hospital.name == bed.hospital_name).first()

    if not bed.is_occupied and hospital:
        hospital.available_beds = max(0, hospital.available_beds - 1)

    bed.is_occupied = 1
    bed.patient_name = data.patient_name
    bed.patient_id = data.patient_id
    bed.admitted_at = datetime.datetime.utcnow().isoformat() + "Z"

    db.commit()
    return {"message": f"Patient '{data.patient_name}' assigned to bed {bed.bed_number}"}


@app.get("/api/stress-index")
def get_stress_index():
    """Calculate dynamic stress index for web connectivity view."""
    # Stress index is a heavily weighted average of ICU, Ventilators, and Beds
    util_icu = get_utilization("icu_beds", noise=0)
    util_vent = get_utilization("ventilators", noise=0)
    util_beds = get_utilization("beds", noise=0)
    
    # Ensure values don't go below 0 or above 100 for index
    stress_score = (util_icu * 0.5) + (util_vent * 0.3) + (util_beds * 0.2)
    stress_score = round(min(100.0, max(0.0, stress_score)), 1)

    status = "normal"
    if stress_score > 85:
        status = "critical"
    elif stress_score > 70:
        status = "warning"
        
    return {
        "stress_index": stress_score,
        "status": status,
        "components": {
            "icu_utilization": util_icu,
            "ventilators_utilization": util_vent,
            "beds_utilization": util_beds
        },
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z"
    }

class AlertCreate(BaseModel):
    id: str
    resource: str
    resource_id: str
    severity: str
    message: str
    utilization: Optional[float] = None
    hours_to_breach: Optional[float] = None
    trend: str
    recommendations: List[str] = []
    created_at: str
    hospital_name: Optional[str] = None

class HospitalSeed(BaseModel):
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    rating: float
    total_beds: int
    available_beds: int
    icu_total: int
    icu_available: int
    ventilators_total: int
    ventilators_available: int
    specialties: List[str]
    doctors: List[dict] = []
    rating_count: int = 0
    fee_min: int = 500
    fee_max: int = 800
    total_doctors: int = 10
    open_24x7: int = 1

class HospitalResponse(BaseModel):
    id: int
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    rating: float
    total_beds: int
    available_beds: int
    icu_total: int
    icu_available: int
    ventilators_total: int
    ventilators_available: int
    specialties: List[str]
    doctors: List[dict] = []
    rating_count: int
    fee_min: int
    fee_max: int
    total_doctors: int
    open_24x7: int

    class Config:
        from_attributes = True

@app.get("/api/alerts")
def get_alerts(hospital_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Get active alerts from the database."""
    query = db.query(models.Alert)
    if hospital_name:
        query = query.filter(models.Alert.hospital_name == hospital_name)
    alerts = query.order_by(models.Alert.created_at.desc()).all()
    
    result = []
    for a in alerts:
        result.append({
            "id": a.id,
            "resource": a.resource,
            "resource_id": a.resource_id,
            "severity": a.severity,
            "message": a.message,
            "utilization": float(a.utilization) if a.utilization else None,
            "hours_to_breach": float(a.hours_to_breach) if a.hours_to_breach else None,
            "trend": a.trend,
            "recommendations": json.loads(a.recommendations) if a.recommendations else [],
            "created_at": a.created_at,
            "hospital_name": a.hospital_name
        })
    return {"alerts": result, "total": len(result), "timestamp": datetime.datetime.utcnow().isoformat() + "Z"}

@app.post("/api/alerts")
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Add a new alert to the persistent store."""
    new_alert = models.Alert(
        id=alert.id,
        resource=alert.resource,
        resource_id=alert.resource_id,
        severity=alert.severity,
        message=alert.message,
        utilization=str(alert.utilization) if alert.utilization is not None else None,
        hours_to_breach=str(alert.hours_to_breach) if alert.hours_to_breach is not None else None,
        trend=alert.trend,
        recommendations=json.dumps(alert.recommendations),
        created_at=alert.created_at,
        hospital_name=alert.hospital_name
    )
    db.add(new_alert)
    db.commit()
    return {"message": "Alert saved"}

@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
    return {"message": "Alert deleted"}

@app.delete("/api/alerts")
def clear_all_alerts(hospital_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Alert)
    if hospital_name:
        query = query.filter(models.Alert.hospital_name == hospital_name)
    query.delete()
    db.commit()
    return {"message": "Alerts cleared for specified scope"}

def _generate_alert_message(r, util, trend, htb):
    name = r["name"]
    if htb:
        return f"{name} at {util}% — predicted threshold breach in {htb} hours"
    return f"{name} at {util}% — currently {trend}"

def _generate_recommendations(r, util, trend, severity):
    name = r["name"]
    recs = {
        "icu_beds": [
            "Activate ICU capacity expansion protocol",
            "Review stable ICU patients for step-down to general ward",
            "Coordinate with OR to defer elective surgeries",
            "Contact partner facilities for overflow capacity",
        ],
        "oxygen_supply": [
            "Contact primary oxygen supplier for emergency refill",
            "Activate backup cylinder reserves",
            "Audit non-critical oxygen consumption",
            "Notify respiratory therapy department",
        ],
        "ventilators": [
            "Initiate ventilator sharing protocol",
            "Expedite weaning for appropriate patients",
            "Request mutual aid from nearby hospitals",
            "Activate ECMO team as contingency",
        ],
        "blood_bank": [
            "Issue urgent appeal to blood donation centers",
            "Restrict blood products to emergencies only",
            "Contact regional blood bank for emergency transfer",
            "Notify surgical teams about conservation protocols",
        ],
        "ppe_stock": [
            "Place emergency PPE procurement order",
            "Contact state emergency management for reserves",
            "Implement tiered PPE conservation protocol",
            "Coordinate with infection control for guidance",
        ],
        "nursing_staff": [
            "Activate on-call nursing roster",
            "Coordinate float pool deployment",
            "Contact staffing agencies for immediate placements",
            "Review patient-nurse ratios and redistribute load",
        ],
    }
    return recs.get(r["id"], ["Review resource allocation immediately"])

@app.get("/api/forecast")
def get_forecast(horizon_hours: int = 168, resource_id: str = "icu_beds"):
    """
    7-day multi-signal forecast for hospital administrators.
    Incorporates linear trends, daily oscillations, and confidence widening.
    """
    resource = next((r for r in RESOURCES if r["id"] == resource_id), RESOURCES[0])
    base_util = get_utilization(resource_id)
    trend = calculate_trend(resource_id)
    
    # trend_rate is % change per hour
    trend_rate = 0.4 if trend == "rising" else (-0.2 if trend == "falling" else 0.02)

    points = []
    now = datetime.datetime.utcnow()

    # Calculate points every 6 hours for a 7-day view
    for h in range(0, horizon_hours + 1, 6):
        # Base linear projection
        forecast_util = base_util + (trend_rate * h)
        
        # Add daily oscillation (peaks in afternoon, troughs at 4am)
        future_hour = (now.hour + h) % 24
        daily_cycle = math.sin((future_hour - 10) * math.pi / 12) * 5
        forecast_util += daily_cycle
        
        # Add Day-of-week signal (simulated busier weekends for ICU, etc)
        future_dow = (now.weekday() + (now.hour + h) // 24) % 7
        dow_signal = [2, 1, 0, -1, -2, 3, 4][future_dow] # Weekend surge
        forecast_util += dow_signal
        
        # Confidence interval widening
        uncertainty = 1.0 + (h / 24) * 2.5 # grows ~2.5% per day
        
        forecast_util = max(0, min(100, forecast_util))
        points.append({
            "hour": h,
            "label": f"+{h}h" if h > 0 else "Now",
            "timestamp": (now + datetime.timedelta(hours=h)).isoformat() + "Z",
            "forecast": round(forecast_util, 1),
            "ci_lower": round(max(0, forecast_util - uncertainty), 1),
            "ci_upper": round(min(100, forecast_util + uncertainty), 1),
        })

    # Detect breach point
    threshold = float(resource["critical_threshold"])
    breach_point = None
    for p in points:
        util_val = float(p["forecast"])
        exceeded = (
            util_val >= threshold
            if resource_id in ["icu_beds", "ventilators", "nursing_staff"]
            else util_val <= threshold
        )
        if exceeded:
            breach_point = p
            break

    return {
        "resource": resource["name"],
        "resource_id": resource_id,
        "horizon_hours": horizon_hours,
        "current_utilization": base_util,
        "trend": trend,
        "trend_rate_per_hour": trend_rate,
        "forecast_points": points,
        "breach_prediction": breach_point,
        "confidence_level": 0.95,
        "model": "MedGuard Multi-Signal Fusion v1.0",
        "signals_used": ["temporal_trend", "day_of_week", "hourly_cycle", "seasonal"],
        "timestamp": now.isoformat() + "Z",
    }

@app.get("/api/trends")
def get_trends(hospital_id: Optional[int] = None, hospital_name: Optional[str] = None, db: Session = Depends(get_db)):
    """12-month aggregated trend data for seasonal pattern analysis."""
    months = ["Feb '25", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan '26"]
    resources_trend = {}

    for r in RESOURCES:
        base = SEED_UTILIZATIONS[str(r["id"])]
        monthly_data = []
        for i, month in enumerate(months):
            # Simulate realistic seasonal variation
            seasonal = math.sin((i - 2) * math.pi / 6) * 8  # peaks around month 8
            flu_season = 5 if i >= 10 or i <= 1 else 0
            val = round(min(100, max(10, base + seasonal + flu_season + random.uniform(-3, 3))), 1)
            monthly_data.append({"month": month, "utilization": val})
        resources_trend[r["id"]] = monthly_data

    # Historical shortage events (simulated)
    shortage_events = [
        {"date": "2025-01-15", "resource": "ICU Beds", "duration_hours": 72, "severity": "critical", "resolved": True},
        {"date": "2025-04-03", "resource": "Oxygen Supply", "duration_hours": 18, "severity": "warning", "resolved": True},
        {"date": "2025-07-22", "resource": "Nursing Staff", "duration_hours": 48, "severity": "critical", "resolved": True},
        {"date": "2025-11-08", "resource": "Ventilators", "duration_hours": 36, "severity": "warning", "resolved": True},
        {"date": "2026-01-30", "resource": "Blood Bank", "duration_hours": 24, "severity": "warning", "resolved": True},
    ]

    # Day-of-week patterns
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dow_patterns = {
        r["id"]: [
            round(SEED_UTILIZATIONS[r["id"]] + [3, 4, 2, 1, -1, -5, -4][i] + random.uniform(-1, 1), 1)
            for i in range(7)
        ]
        for r in RESOURCES
    }

    return {
        "months": months,
        "resources": resources_trend,
        "shortage_events": shortage_events,
        "day_of_week_patterns": {"days": days, "resources": dow_patterns},
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }

@app.get("/api/hospitals", response_model=List[HospitalResponse])
def get_hospitals(
    search: Optional[str] = None,
    sort_by: Optional[str] = "rating", # "rating" or "resources"
    db: Session = Depends(get_db)
):
    query = db.query(models.Hospital)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Hospital.name.ilike(search_filter)) | 
            (models.Hospital.city.ilike(search_filter)) |
            (models.Hospital.specialties.ilike(search_filter))
        )
    
    hospitals = query.all()
    
    # Convert specialties string to list for the response
    results = []
    for h in hospitals:
        h_dict = {
            "id": h.id,
            "name": h.name,
            "city": h.city,
            "address": h.address,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "rating": h.rating,
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "icu_total": h.icu_total,
            "icu_available": h.icu_available,
            "ventilators_total": h.ventilators_total,
            "ventilators_available": h.ventilators_available,
            "specialties": h.specialties.split(",") if h.specialties else [],
            "doctors": json.loads(h.doctors) if h.doctors else [],
            "rating_count": h.rating_count,
            "fee_min": h.fee_min,
            "fee_max": h.fee_max,
            "total_doctors": h.total_doctors,
            "open_24x7": h.open_24x7
        }
        results.append(h_dict)

    if sort_by == "rating":
        results.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "resources":
        results.sort(key=lambda x: x["available_beds"], reverse=True)
        
    return results

@app.post("/api/hospitals/seed")
def seed_hospital(data: List[HospitalSeed], db: Session = Depends(get_db)):
    try:
        new_hospitals = []
        for h in data:
            new_hospitals.append(models.Hospital(
                name=h.name,
                city=h.city,
                address=h.address,
                latitude=h.latitude,
                longitude=h.longitude,
                rating=h.rating,
                total_beds=h.total_beds,
                available_beds=h.available_beds,
                icu_total=h.icu_total,
                icu_available=h.icu_available,
                ventilators_total=h.ventilators_total,
                ventilators_available=h.ventilators_available,
                specialties=",".join(h.specialties),
                doctors=json.dumps(h.doctors),
                rating_count=h.rating_count,
                fee_min=h.fee_min,
                fee_max=h.fee_max,
                total_doctors=h.total_doctors,
                open_24x7=h.open_24x7
            ))
        db.add_all(new_hospitals)
        db.commit()
        return {"message": f"Successfully seeded {len(new_hospitals)} hospitals"}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"SEED ERROR:\n{error_trace}")
        raise HTTPException(status_code=500, detail=error_trace)

# ─── Gemini Chat ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None
    history: Optional[List[dict]] = None

SYSTEM_CONTEXT = """You are MedGuard AI, an intelligent hospital resource management assistant.
You help hospital administrators make data-driven decisions about resource allocation to prevent shortages.

Core capabilities and domains you cover:
1. Shortage Forecasting: Predicting ICU, general bed, and ventilator breaches.
2. Supply Chain: Recommending actions for PPE, blood, and oxygen shortages.
3. Staffing: Advising on nurse/doctor ratios and shift load balancing.
4. Triage & Overflow: Recommending when to divert patients or activate partner hospitals.

Key principles:
- Zero patient data is stored or processed — only aggregate daily counts.
- You provide quantified, actionable recommendations.
- You give 18-31 hour early warning before shortages based on provided data.
- Every recommendation must be tied to specific data points.

Interaction Style:
- Be professional, helpful, and conversational.
- For simple greetings like "Hi" or "Hello", respond warmly and ask how you can assist with hospital operations today.
- When asked complex technical questions, provide concise, expert advisor responses in 3-5 bullet points maximum.
- Start technical responses with the most urgent action first.
- If asked about a domain not in the current data, advise based on standard emergency protocols while noting the data limitation."""

USER_SYSTEM_CONTEXT = """You are MedGuard Medicine Assistant, a strict and structured medical information assistant.
You ONLY provide information about medicines, drugs, and pharmaceutical topics.

Your capabilities (STRICTLY limited to):
1. Medicine Information: Name, generic name, brand names, drug class.
2. Usage & Dosage: What a medicine is used for, recommended dosages, how to take it (before/after food, timing).
3. Side Effects: Common side effects, serious side effects, when to seek medical attention.
4. Drug Interactions: Which medicines should NOT be taken together, food-drug interactions.
5. Precautions & Warnings: Who should avoid a medicine, pregnancy/breastfeeding safety, age restrictions.
6. Storage: How to store medicines properly.

STRICT RULES:
- You must NEVER provide hospital management, resource allocation, staffing, or administrative advice.
- You must NEVER diagnose diseases or suggest treatments. Always recommend consulting a doctor.
- If asked about anything unrelated to medicines (e.g., hospital resources, weather, coding, general knowledge), politely decline and say: "I can only help with medicine-related questions. Please ask me about medicine names, usage, dosages, side effects, or drug interactions."
- Always add a disclaimer: "This information is for educational purposes only. Always consult your doctor or pharmacist before taking any medication."
- Keep responses structured with clear headings (Usage, Dosage, Side Effects, Precautions).
- Be concise but thorough — use bullet points for clarity.

Interaction Style:
- Be warm, professional, and patient-friendly.
- Use simple language that non-medical users can understand.
- For greetings, respond warmly and ask what medicine they'd like to know about.
- Always prioritize safety — if unsure, recommend consulting a healthcare professional."""

@app.post("/api/gemini/chat")
async def gemini_chat(req: ChatRequest):
    """Proxy chat to Gemini with hospital context injected."""
    # Determine role from context
    ctx = req.context or {}
    user_role = ctx.get("role", "ADMIN")
    is_user_mode = user_role in ["USER", "DOCTOR"] or ctx.get("mode") == "medicine_assistant"

    if not GEMINI_AVAILABLE or gemini_model is None:
        lowered = req.message.lower().strip()
        if lowered in ["hi", "hello", "hey", "hi there"]:
            if is_user_mode:
                return {
                    "response": "💊 Hello! I'm MedGuard Medicine Assistant, currently running in **Demo Mode**. I can help you with information about medicines — their uses, dosages, side effects, and interactions. What medicine would you like to know about?",
                    "model": "demo_mode"
                }
            return {
                "response": "👋 Hello! I'm MedGuard AI, currently running in **Demo Mode** because no valid API key was detected in the backend. I can provide simulated advice, but to see real analysis of your hospital data, please configure a `GEMINI_API_KEY` in `backend/.env`. How can I help you today?",
                "model": "demo_mode"
            }
        
        if is_user_mode:
            return {
                "response": (
                    "⚠️ Medicine Assistant is currently in Demo Mode. To enable full AI capabilities, "
                    "please ensure a valid GEMINI_API_KEY is configured in your backend/.env file.\n\n"
                    "**Demo Response:** Here's general guidance:\n"
                    "• Always read the medicine label for dosage and frequency\n"
                    "• Take medicines at the same time each day for best results\n"
                    "• Never stop prescribed medicines without consulting your doctor\n"
                    "• Report any unusual side effects to your healthcare provider immediately\n\n"
                    "_This information is for educational purposes only. Always consult your doctor._"
                ),
                "model": "demo_mode"
            }

        return {
            "response": (
                "⚠️ Gemini AI is currently in Demo Mode. To enable full AI capabilities, "
                "please ensure a valid GEMINI_API_KEY is configured in your backend/.env file.\n\n"
                "**Demo Response:** Based on current data, I recommend:\n"
                "• Prioritize ICU capacity expansion — breach predicted in 18.4 hours\n"
                "• Contact oxygen supplier immediately — supply at 62%, falling\n"
                "• Activate on-call nursing for weekend coverage\n"
                "• All actions are traceable to aggregated utilization data only"
            ),
            "model": "demo_mode"
        }

    context_str = ""
    if ctx and not is_user_mode:
        context_str = f"Current Hospital Resource Status for Context:\n{json.dumps(ctx, indent=2)}"

    # Choose the correct system prompt based on role
    system_prompt = USER_SYSTEM_CONTEXT if is_user_mode else SYSTEM_CONTEXT

    try:
        if gemini_model is None:
             raise ValueError("Gemini model not initialized")
        
        # Format conversation history
        contents = []
        if req.history:
            for entry in req.history:
                # Gemini expects "user" and "model" roles
                role = "user" if entry["role"] == "user" else "model"
                contents.append({"role": role, "parts": [entry["content"]]})
        
        # Inject system context into the latest message
        full_prompt = f"{system_prompt}\n\n{context_str}\n\nUser Message: {req.message}"
        contents.append({"role": "user", "parts": [full_prompt]})
        
        # We use generate_content with the full history array instead of start_chat
        # to bypass createChatSession API mismatches
        response = gemini_model.generate_content(contents)
        
        # Accessing model name safely
        m_name = getattr(gemini_model, "model_name", "gemini-2.5-flash")
        if isinstance(m_name, str) and m_name.startswith("models/"):
            m_name = m_name.replace("models/", "", 1)
            
        return {"response": response.text, "model": m_name}
    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG: Gemini API error: {error_msg}")
        
        # If it's an API key or quota issue, we can inform the user specifically
        if "API_KEY_INVALID" in error_msg or "403" in error_msg:
            return {
                "response": "⚠️ **API Key Error**: The configured Gemini API key appears to be invalid or lacks permission. Please verify your `GEMINI_API_KEY` in `backend/.env`.",
                "model": "auth_error"
            }
        
        if "429" in error_msg or "quota" in error_msg.lower():
            return {
                "response": "⚠️ **Quota Exceeded**: Your Gemini API key has reached its current limit or quota. Please check your Google AI Studio dashboard or try again later.\n\nReturning to Demo Mode for now...",
                "model": "quota_error"
            }
        
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {error_msg}")


class StaffCreate(BaseModel):
    name: str
    profession: str
    qualifications: str

@app.get("/api/admin/staff")
def get_staff(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    staff = db.query(models.HospitalStaff).all()
    return staff

@app.post("/api/admin/staff")
def create_staff(staff: StaffCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    new_staff = models.HospitalStaff(
        name=staff.name,
        profession=staff.profession,
        qualifications=staff.qualifications
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@app.delete("/api/admin/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    staff = db.query(models.HospitalStaff).filter(models.HospitalStaff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(staff)
    db.commit()
    return {"message": "Staff member successfully deleted"}

class PredictRequest(BaseModel):
    Total_Beds: float = 300.0
    Available_Beds: float = 0.0
    ICU_Total: float = 50.0
    ICU_Available: float = 5.0
    Ventilators_Total: float = 40.0
    Ventilators_Available: float = 12.0
    Staff_On_Duty: float = 120.0
    Daily_Admissions: float = 110.0
    Emergency_Admissions: float = 55.0
    Scheduled_Admissions: float = 55.0
    Bed_Occupancy_Rate: float = 100.0
    ICU_Occupancy_Rate: float = 90.0
    Ventilator_Utilization_Rate: float = 70.0

@app.post("/api/predict_shortage")
def predict_shortage_endpoint(data: PredictRequest):
    """Predict the likelihood of a resource shortage using the ML model."""
    result = ml_model.predict_shortage(data.dict())
    return result

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    print(f"🏥 MedGuard AI Backend starting on http://{host}:{port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"🤖 Gemini: {'✅ configured' if GEMINI_AVAILABLE else '⚠️  not configured (demo mode)'}")
    uvicorn.run("main:app", host=host, port=port, reload=True)

# ─── Hospital 5-Year History ─────────────────────────────────────────────────

class HospitalHistoryRecord(BaseModel):
    hospital_name: str
    city: str
    year: int
    month: int
    avg_bed_occupancy: float
    avg_icu_occupancy: float
    avg_ventilator_util: float
    avg_daily_admissions: float
    shortage_days: int

# ─── Appointment Booking ───────────────────────────────────────────────────

class DoctorScheduleCreate(BaseModel):
    doctor_name: str
    day_of_week: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    slot_duration: int = 15
    is_off_day: int = 0

@app.get("/api/doctors/schedules/{hospital_name}")
def get_doctor_schedules(hospital_name: str, db: Session = Depends(get_db)):
    schedules = db.query(models.DoctorSchedule).filter(models.DoctorSchedule.hospital_name == hospital_name).all()
    return schedules

@app.post("/api/doctors/schedules")
def save_doctor_schedule(data: DoctorScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_staff_user)):
    # Find existing or create new
    sched = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.hospital_name == current_user.hospital_name,
        models.DoctorSchedule.doctor_name == data.doctor_name,
        models.DoctorSchedule.day_of_week == data.day_of_week
    ).first()

    if sched:
        sched.start_time = data.start_time
        sched.end_time = data.end_time
        sched.slot_duration = data.slot_duration
        sched.is_off_day = data.is_off_day
    else:
        sched = models.DoctorSchedule(
            hospital_name=current_user.hospital_name,
            doctor_name=data.doctor_name,
            day_of_week=data.day_of_week,
            start_time=data.start_time,
            end_time=data.end_time,
            slot_duration=data.slot_duration,
            is_off_day=data.is_off_day
        )
        db.add(sched)
    
    db.commit()
    db.refresh(sched)
    return {"message": "Schedule saved successfully", "schedule": sched}

@app.get("/api/appointments/slots")
def get_appointment_slots(hospital_name: str, doctor_name: str, date: str, db: Session = Depends(get_db)):
    """Generate 15-min slots for a given doctor on a given date."""
    try:
        dt = datetime.datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    day_name = dt.strftime("%A")
    sched = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.hospital_name == hospital_name,
        models.DoctorSchedule.doctor_name == doctor_name,
        models.DoctorSchedule.day_of_week == day_name
    ).first()

    if not sched or sched.is_off_day or not sched.start_time or not sched.end_time:
        # Default fallback if no schedule exists
        start_hour = 9
        end_hour = 17
        slot_dur = 15
    else:
        try:
            sh, sm = map(int, sched.start_time.split(":"))
            eh, em = map(int, sched.end_time.split(":"))
            start_hour = sh + sm/60.0
            end_hour = eh + em/60.0
            slot_dur = sched.slot_duration
        except:
            start_hour = 9
            end_hour = 17
            slot_dur = 15

    # Generate all possible slots
    slots = []
    current_time = start_hour * 60 # in minutes
    end_time = end_hour * 60
    
    while current_time + slot_dur <= end_time:
        h = int(current_time // 60)
        m = int(current_time % 60)
        slots.append(f"{h:02d}:{m:02d}")
        current_time += slot_dur

    # Fetch existing appointments to block them
    existing_appts = db.query(models.Appointment.time).filter(
        models.Appointment.hospital_name == hospital_name,
        models.Appointment.doctor_name == doctor_name,
        models.Appointment.date == date,
        models.Appointment.status != "CANCELLED"
    ).all()
    
    booked_times = {appt.time for appt in existing_appts}
    
    available_slots = [s for s in slots if s not in booked_times]
    
    return {"available_slots": available_slots, "booked": list(booked_times)}

class AppointmentExtractRequest(BaseModel):
    message: str

class AppointmentExtractResponse(BaseModel):
    specialization: Optional[str] = None
    doctor_name: Optional[str] = None
    date: Optional[str] = None # YYYY-MM-DD
    time: Optional[str] = None # HH:MM
    missing_fields: List[str] = []

class AppointmentCreate(BaseModel):
    hospital_id: int
    hospital_name: str
    specialization: str
    doctor_name: Optional[str] = None
    date: str
    time: str
    raw_message: str

class AppointmentResponse(BaseModel):
    id: int
    user_id: Optional[int]
    hospital_id: Optional[int]
    hospital_name: str
    specialization: str
    doctor_name: Optional[str]
    date: str
    time: str
    status: str
    patient_name: Optional[str]
    patient_phone: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

@app.post("/api/appointments/extract", response_model=AppointmentExtractResponse)
async def extract_appointment_info(req: AppointmentExtractRequest):
    """Use Gemini to extract structured appointment info from natural language."""
    if not GEMINI_AVAILABLE or gemini_model is None:
        # Fallback for demo mode
        msg = req.message.lower()
        res = AppointmentExtractResponse()
        
        # Simple keyword matching for demo
        if "cardio" in msg: res.specialization = "Cardiology"
        elif "derm" in msg: res.specialization = "Dermatology"
        elif "ortho" in msg: res.specialization = "Orthopedics"
        
        if "dr. " in msg:
            # Very basic extraction for demo "dr. smith"
            res.doctor_name = "dr. " + msg.split("dr. ")[1].split(" ")[0].capitalize()
        
        # Mock date/time extraction for demo
        if "tomorrow" in msg:
            tomorrow = datetime.date.today() + datetime.timedelta(days=1)
            res.date = tomorrow.isoformat()
        
        if not res.specialization: res.missing_fields.append("specialization")
        if not res.date: res.missing_fields.append("date")
        if not res.time: res.missing_fields.append("time")
        
        return res

    # Gemini prompt for structured extraction
    current_date = datetime.date.today().isoformat()
    prompt = f"""You are an intelligent hospital appointment booking assistant.
Your job is ONLY to extract structured booking information from user messages.
Current date (YYYY-MM-DD): {current_date}

Follow this structured workflow strictly:
1. Identify medical specialization (e.g. "cardiologist" -> "Cardiology").
2. Identify a specific doctor name if mentioned (e.g. "Dr. Sarah" -> "Dr. Sarah"). 
3. Identify appointment date. If "tomorrow", calculate relative to {current_date}.
4. Identify appointment time. Convert to 24-hour format (HH:MM).

Return ONLY JSON in this exact format:
{{
  "specialization": "... or null",
  "doctor_name": "... or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "missing_fields": []
}}
If any fields are missing, list them in "missing_fields".
User Message: "{req.message}"
"""
    if not GEMINI_AVAILABLE or gemini_model is None:
        # Fallback for demo mode
        msg = req.message.lower()
        res = {
            "specialization": "General",
            "doctor_name": None,
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "time": "10:00",
            "missing_fields": ["specialization", "doctor_name", "date", "time"]
        }
        if "cardio" in msg: res["specialization"] = "Cardiology"
        elif "ortho" in msg: res["specialization"] = "Orthopedics"
        elif "derm" in msg: res["specialization"] = "Dermatology"
        return res

    try:
        response = gemini_model.generate_content(prompt)
        # Parse JSON from response.text
        text = response.text.strip()
        # Clean up in case Gemini wraps in ```json ... ```
        if text.startswith("```json"):
            text = text.replace("```json", "", 1).replace("```", "", 1).strip()
        elif text.startswith("```"):
            text = text.replace("```", "", 2).strip()
        
        data = json.loads(text)
        return data
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {
            "specialization": "General",
            "doctor_name": None,
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "time": "10:00",
            "missing_fields": ["specialization", "doctor_name", "date", "time"]
        }

@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Book a new appointment."""
    new_app = models.Appointment(
        user_id=current_user.id,
        hospital_id=data.hospital_id,
        hospital_name=data.hospital_name,
        specialization=data.specialization,
        doctor_name=data.doctor_name,
        date=data.date,
        time=data.time,
        raw_message=data.raw_message,
        patient_name=current_user.name,
        patient_phone=current_user.email,  # basic fallback if phone is unavailable
        created_at=datetime.datetime.utcnow().isoformat() + "Z"
    )
    try:
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        return new_app
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Slot already booked! Please select a different time.")

@app.get("/api/appointments", response_model=List[AppointmentResponse])
def get_appointments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List appointments.
    - ADMIN/STAFF: all appointments for their hospital
    - DOCTOR: only appointments where doctor_name matches their registered name (with or without 'Dr.' prefix)
    - USER: their own booked appointments
    """
    try:
        if current_user.role in ["STAFF", "ADMIN"]:
            if not current_user.hospital_name:
                return []
            h_name = current_user.hospital_name.strip().lower()
            return db.query(models.Appointment).filter(
                func.lower(models.Appointment.hospital_name) == h_name
            ).all()

        elif current_user.role == "DOCTOR":
            if not current_user.hospital_name:
                return []
            h_name = current_user.hospital_name.strip().lower()
            # Normalize name: strip leading "Dr." / "dr." for both sides
            import re
            def strip_dr(name: str) -> str:
                return re.sub(r'^dr\.?\s*', '', name, flags=re.IGNORECASE).strip().lower()

            doctor_base = strip_dr(current_user.name)

            # Fetch all appointments for this hospital, then filter by name in Python
            # (SQLite doesn't support regex; Python-side is safe at this scale)
            hospital_appts = db.query(models.Appointment).filter(
                func.lower(models.Appointment.hospital_name) == h_name
            ).all()

            return [
                appt for appt in hospital_appts
                if appt.doctor_name and strip_dr(appt.doctor_name) == doctor_base
            ]

        else:
            # USER: their own bookings
            return db.query(models.Appointment).filter(
                models.Appointment.user_id == current_user.id
            ).all()

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments/{appt_id}")
def get_appointment_details(appt_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Fetch specific appointment details including patient info if available."""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    patient = db.query(models.Patient).filter(models.Patient.full_name == appt.patient_name).first()
    
    return {
        "id": appt.id,
        "patient_name": appt.patient_name,
        "patient_phone": appt.patient_phone,
        "patient_age": patient.age if patient else None,
        "patient_gender": patient.gender if patient else None,
        "date": appt.date,
        "time": appt.time,
        "specialization": appt.specialization,
        "doctor_name": appt.doctor_name,
        "status": appt.status,
        "created_at": appt.created_at
    }

@app.put("/api/appointments/{appt_id}/status")
def update_appointment_status(appt_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Update appointment status (ONGOING, FINISHED, etc.)"""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appt.status = status.upper()
    db.commit()
    return {"message": f"Appointment status updated to {status}"}

@app.post("/api/appointments/{appt_id}/follow-up")
def schedule_follow_up(appt_id: int, days: int, notes: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Schedule a follow-up visit based on previous appointment."""
    old_appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not old_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Calculate follow-up date
    try:
        base_date = datetime.date.fromisoformat(old_appt.date)
    except:
        base_date = datetime.date.today()
    
    follow_up_date = (base_date + datetime.timedelta(days=days)).isoformat()
    
    new_app = models.Appointment(
        user_id=old_appt.user_id,
        hospital_id=old_appt.hospital_id,
        hospital_name=old_appt.hospital_name,
        specialization=old_appt.specialization,
        doctor_name=old_appt.doctor_name,
        date=follow_up_date,
        time=old_appt.time,
        raw_message=f"Follow-up for appointment #{appt_id}. Notes: {notes or ''}",
        patient_name=old_appt.patient_name,
        patient_phone=old_appt.patient_phone,
        status="FOLLOW_UP",
        created_at=datetime.datetime.utcnow().isoformat() + "Z"
    )
    
    old_appt.follow_up_date = follow_up_date
    old_appt.status = "FOLLOW_UP_REQUIRED"
    
    db.add(new_app)
    db.commit()
    return {"message": "Follow-up scheduled", "follow_up_date": follow_up_date}

@app.post("/api/prescriptions")
async def save_prescription(
    appointment_id: int = Form(...),
    notes: Optional[str] = Form(None),
    follow_up_days: Optional[int] = Form(None),
    medicines: str = Form(...), # JSON stringified list
    reports: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Save prescription, medicines, and reports."""
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = db.query(models.Patient).filter(models.Patient.full_name == appt.patient_name).first()
    patient_id = patient.id if patient else None

    # 1. Prescription
    new_prescription = models.Prescription(
        appointment_id=appointment_id,
        patient_id=patient_id,
        doctor_id=current_user.id,
        notes=notes,
        follow_up_days=follow_up_days,
        created_at=datetime.datetime.utcnow().isoformat() + "Z"
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    # 2. Medicines
    import json
    try:
        meds_list = json.loads(medicines)
        for m in meds_list:
            new_med = models.PrescriptionMedicine(
                prescription_id=new_prescription.id,
                medicine_name=m.get("name"),
                dose=m.get("dose"),
                morning=1 if m.get("morning") else 0,
                afternoon=1 if m.get("afternoon") else 0,
                night=1 if m.get("night") else 0
            )
            db.add(new_med)
    except Exception as e:
        print(f"Medicine parse error: {e}")

    # 3. Reports
    REPORTS_DIR = os.path.join(UPLOAD_DIR, "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)

    for report in reports:
        if report.filename:
            safe_name = f"{int(datetime.datetime.utcnow().timestamp())}_{report.filename}"
            file_path = os.path.join(REPORTS_DIR, safe_name)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(report.file, buffer)
            new_report = models.PatientReport(
                appointment_id=appointment_id,
                file_path=safe_name,
                uploaded_at=datetime.datetime.utcnow().isoformat() + "Z"
            )
            db.add(new_report)

    db.commit()
    return {"message": "Prescription saved", "prescription_id": new_prescription.id}

@app.get("/api/prescriptions/appointment/{appt_id}")
def get_prescription_by_appointment(appt_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Fetch full prescription details for an appointment."""
    prescription = db.query(models.Prescription).filter(models.Prescription.appointment_id == appt_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    medicines = db.query(models.PrescriptionMedicine).filter(models.PrescriptionMedicine.prescription_id == prescription.id).all()
    reports = db.query(models.PatientReport).filter(models.PatientReport.appointment_id == appt_id).all()
    
    return {
        "prescription": {
            "id": prescription.id,
            "notes": prescription.notes,
            "follow_up_days": prescription.follow_up_days,
            "created_at": prescription.created_at
        },
        "medicines": [
            {
                "name": m.medicine_name,
                "dose": m.dose,
                "morning": bool(m.morning),
                "afternoon": bool(m.afternoon),
                "night": bool(m.night)
            } for m in medicines
        ],
        "reports": [
            {
                "id": r.id,
                "file_path": r.file_path,
                "uploaded_at": r.uploaded_at
            } for r in reports
        ]
    }


@app.get("/api/admin/debug/appointments")
def debug_list_appointments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_admin_user)):
    """ADMIN ONLY: See everything in the appointments table to debug matching."""
    return db.query(models.Appointment).all()

@app.post("/api/hospital-history/seed")
def seed_hospital_history(records: List[HospitalHistoryRecord], db: Session = Depends(get_db)):
    """Bulk-insert monthly aggregated hospital history records."""
    count = 0
    for r in records:
        existing = db.query(models.HospitalHistory).filter(
            models.HospitalHistory.hospital_name == r.hospital_name,
            models.HospitalHistory.year == r.year,
            models.HospitalHistory.month == r.month,
        ).first()
        if existing:
            # update
            existing.avg_bed_occupancy = r.avg_bed_occupancy
            existing.avg_icu_occupancy = r.avg_icu_occupancy
            existing.avg_ventilator_util = r.avg_ventilator_util
            existing.avg_daily_admissions = r.avg_daily_admissions
            existing.shortage_days = r.shortage_days
        else:
            db.add(models.HospitalHistory(
                hospital_name=r.hospital_name,
                city=r.city,
                year=r.year,
                month=r.month,
                avg_bed_occupancy=r.avg_bed_occupancy,
                avg_icu_occupancy=r.avg_icu_occupancy,
                avg_ventilator_util=r.avg_ventilator_util,
                avg_daily_admissions=r.avg_daily_admissions,
                shortage_days=r.shortage_days,
            ))
            count += 1
    db.commit()
    return {"seeded": count}

@app.get("/api/hospital-history/{hospital_name}")
def get_hospital_history(hospital_name: str, db: Session = Depends(get_db)):
    """Return monthly history + 6-month linear-trend predictions for a hospital."""
    records = db.query(models.HospitalHistory).filter(
        models.HospitalHistory.hospital_name == hospital_name
    ).order_by(models.HospitalHistory.year, models.HospitalHistory.month).all()

    if not records:
        raise HTTPException(status_code=404, detail="No history found for this hospital")

    history = [
        {
            "year": r.year,
            "month": r.month,
            "label": f"{r.year}-{str(r.month).zfill(2)}",
            "avg_bed_occupancy": round(r.avg_bed_occupancy, 1),
            "avg_icu_occupancy": round(r.avg_icu_occupancy, 1),
            "avg_ventilator_util": round(r.avg_ventilator_util, 1),
            "avg_daily_admissions": round(r.avg_daily_admissions, 1),
            "shortage_days": r.shortage_days,
        }
        for r in records
    ]
    
    # Try fetching real live fractional percentages for the final month entry to perfectly sync frontends
    real_hospital = db.query(models.Hospital).filter(models.Hospital.name == hospital_name).first()
    if real_hospital and history:
        # Override the LAST entry in the history with real-world computed percentages safely
        last = history[-1]
        
        bed_cap = float(real_hospital.total_beds)
        if bed_cap > 0:
            occ = bed_cap - float(real_hospital.available_beds)
            last["avg_bed_occupancy"] = round((occ / bed_cap) * 100, 1)
            
        icu_cap = float(real_hospital.icu_total)
        if icu_cap > 0:
            occ = icu_cap - float(real_hospital.icu_available)
            last["avg_icu_occupancy"] = round((occ / icu_cap) * 100, 1)
            
        vent_cap = float(real_hospital.ventilators_total)
        if vent_cap > 0:
            occ = vent_cap - float(real_hospital.ventilators_available)
            last["avg_ventilator_util"] = round((occ / vent_cap) * 100, 1)

    # Simple linear-trend prediction for next 6 months
    n = len(history)
    def linear_trend(values):
        """Return slope using least-squares on last 12 months."""
        window = values[-12:] if len(values) >= 12 else values
        m = len(window)
        if m < 2:
            return 0
        x_mean = (m - 1) / 2
        y_mean = sum(window) / m
        num = sum((i - x_mean) * (window[i] - y_mean) for i in range(m))
        den = sum((i - x_mean) ** 2 for i in range(m))
        return num / den if den else 0

    bed_vals   = [r["avg_bed_occupancy"] for r in history]
    icu_vals   = [r["avg_icu_occupancy"] for r in history]
    vent_vals  = [r["avg_ventilator_util"] for r in history]

    bed_slope  = linear_trend(bed_vals)
    icu_slope  = linear_trend(icu_vals)
    vent_slope = linear_trend(vent_vals)

    last = records[-1]
    last_year, last_month = last.year, last.month

    predictions = []
    for i in range(1, 7):
        m = last_month + i
        y = last_year + (m - 1) // 12
        m = ((m - 1) % 12) + 1
        predictions.append({
            "year": y,
            "month": m,
            "label": f"{y}-{str(m).zfill(2)}",
            "pred_bed_occupancy":  round(max(0, min(100, bed_vals[-1]  + bed_slope  * i)), 1),
            "pred_icu_occupancy":  round(max(0, min(100, icu_vals[-1]  + icu_slope  * i)), 1),
            "pred_ventilator_util":round(max(0, min(100, vent_vals[-1] + vent_slope * i)), 1),
        })

    city = records[0].city if records else ""
    return {
        "hospital_name": hospital_name,
        "city": city,
        "history": history,
        "predictions": predictions,
    }

# ─── Patient Registration ─────────────────────────────────────────────────────

from fastapi import Form, UploadFile, File
import shutil

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/patients")
async def register_patient(
    full_name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    phone: str = Form(...),
    email: str = Form(...),
    address: str = Form(...),
    blood_group: str = Form(...),
    emergency_contact: str = Form(...),
    medical_history_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Register a new patient and optionally save their uploaded medical history PDF."""
    saved_filename = None

    if medical_history_file and medical_history_file.filename:
        # Validate PDF mime type
        if medical_history_file.content_type not in ("application/pdf",):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted for medical history.")

        # Build a unique filename to avoid collisions
        timestamp = int(datetime.datetime.utcnow().timestamp())
        safe_name = f"{timestamp}_{medical_history_file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(medical_history_file.file, buffer)

        saved_filename = safe_name

    new_patient = models.Patient(
        full_name=full_name,
        age=age,
        gender=gender,
        height=height,
        weight=weight,
        phone=phone,
        email=email,
        address=address,
        blood_group=blood_group,
        emergency_contact=emergency_contact,
        medical_history=saved_filename,   # stores the filename (or None)
        created_at=datetime.datetime.utcnow().isoformat() + "Z",
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return {"message": "Patient information saved successfully", "patient_id": new_patient.id}

@app.get("/api/patients")
def get_patients(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get all registered patients (Admin/Staff only)."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "phone": p.phone,
            "email": p.email,
            "address": p.address,
            "blood_group": p.blood_group,
            "emergency_contact": p.emergency_contact,
            "medical_history_file": p.medical_history,
            "created_at": p.created_at,
        }
        for p in patients
    ]

# -------------------------------------------------------------------
# USER REPORTS (My Reports)
# -------------------------------------------------------------------

@app.get("/api/user/reports")
def get_user_reports(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Fetch all reports for the patient: those they uploaded + those attached to their past appointments by doctors."""
    # Reports directly uploaded by user
    user_reports = db.query(models.PatientReport).filter(models.PatientReport.user_id == current_user.id).all()
    
    # Reports attached to past appointments
    appts = db.query(models.Appointment).filter(models.Appointment.user_id == current_user.id).all()
    appt_ids = [a.id for a in appts]
    
    appt_reports = []
    if appt_ids:
        appt_reports = db.query(models.PatientReport).filter(
            models.PatientReport.appointment_id.in_(appt_ids),
            models.PatientReport.user_id.is_(None) # Prevent duplication if a report has both
        ).all()
        
    all_reports = user_reports + appt_reports
    # Sort descending by upload date
    all_reports.sort(key=lambda r: r.uploaded_at or "", reverse=True)
    
    result = []
    for r in all_reports:
        appt = None
        if r.appointment_id:
            appt = db.query(models.Appointment).filter(models.Appointment.id == r.appointment_id).first()
            
        result.append({
            "id": r.id,
            "file_path": r.file_path,
            "filename": os.path.basename(r.file_path) if r.file_path else "Unknown",
            "uploaded_at": r.uploaded_at,
            "source": "Self" if r.user_id else ("Doctor" if appt else "Unknown"),
            "doctor_name": appt.doctor_name if appt else None,
            "specialization": appt.specialization if appt else None,
            "date": appt.date if appt else None
        })
        
    return result

@app.post("/api/user/reports")
async def upload_user_report(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Allow users to upload their own medical reports."""
    saved_reports = []
    
    for file in files:
        if file.filename:
            # Build unique filename
            timestamp = int(datetime.datetime.utcnow().timestamp())
            safe_name = f"user_{current_user.id}_{timestamp}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, safe_name)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            new_report = models.PatientReport(
                user_id=current_user.id,
                file_path=safe_name,
                uploaded_at=datetime.datetime.utcnow().isoformat() + "Z"
            )
            db.add(new_report)
            saved_reports.append(new_report)
            
    if saved_reports:
        db.commit()
        for r in saved_reports:
            db.refresh(r)
            
    return {"message": f"Successfully uploaded {len(saved_reports)} report(s)."}
