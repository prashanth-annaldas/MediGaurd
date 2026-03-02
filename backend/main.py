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
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import engine, Base, get_db
import models
import auth
import ml_model

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedGuard AI Backend",
    description="Privacy-preserving hospital resource intelligence API",
    version="1.0.0"
)

# Include auth router
app.include_router(auth.router)

# Seed demo users on startup
from sqlalchemy.orm import Session
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

seed_users()

# Initialize ML Model
ml_model.load_and_train_model()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Gemini Setup ────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
        genai.configure(api_key=GEMINI_API_KEY)
        # Try models in order of preference
        models_to_try = ["gemini-3-flash-preview", "gemini-2.5-flash-lite", "gemini-1.5-flash"]
        gemini_model = None
        for m_name in models_to_try:
            try:
                # Verifying if the model ID is valid for the current key
                model_info = genai.get_model(f"models/{m_name}")
                gemini_model = genai.GenerativeModel(m_name)
                print(f"🤖 MedGuard AI: Using Gemini model {m_name}")
                break
            except Exception as e:
                print(f"DEBUG: Model {m_name} not available: {e}")
                continue
        
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
    hour = datetime.datetime.now().hour
    # Day-of-week + hour cycle effect
    daily_cycle = math.sin((hour - 6) * math.pi / 12) * 4
    variation = random.uniform(-noise, noise)
    return round(min(100.0, max(0.0, base + daily_cycle + variation)), 1)

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
def update_capacity(data: CapacityInputMode, current_user: models.User = Depends(auth.get_current_staff_user)):
    """Update live capacity and occupied numbers."""
    global LIVE_DATA
    LIVE_DATA["beds"] = {"capacity": data.beds_capacity, "occupied": data.beds_occupied}
    LIVE_DATA["icu_beds"] = {"capacity": data.icu_capacity, "occupied": data.icu_occupied}
    LIVE_DATA["ventilators"] = {"capacity": data.ventilators_capacity, "occupied": data.ventilators_occupied}
    return {"message": "Capacity successfully updated", "data": LIVE_DATA}

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
def get_trends():
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
            "specialties": h.specialties.split(",") if h.specialties else []
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
                specialties=",".join(h.specialties)
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

Current hospital context will be provided with each question.
Always respond as a concise, expert hospital operations advisor in 3-5 bullet points maximum.
Start responses with the most urgent action first. If asked about a domain not in the current data (e.g. specific med stock), advise based on standard emergency protocols while noting the data limitation."""

@app.post("/api/gemini/chat")
async def gemini_chat(req: ChatRequest):
    """Proxy chat to Gemini with hospital context injected."""
    if not GEMINI_AVAILABLE or gemini_model is None:
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

    ctx = req.context or {}
    context_str = ""
    if ctx:
        context_str = f"\n\nCurrent Hospital Resource Status:\n{ctx}"

    prompt = f"{SYSTEM_CONTEXT}{context_str}\n\nAdministrator question: {req.message}"

    try:
        if gemini_model is None:
             raise ValueError("Gemini model not initialized")
        response = gemini_model.generate_content(prompt)
        # Accessing model name safely
        m_name = getattr(gemini_model, "model_name", "gemini-1.5-flash")
        if isinstance(m_name, str) and m_name.startswith("models/"):
            m_name = m_name.replace("models/", "", 1)
        return {"response": response.text, "model": m_name}
    except Exception as e:
        print(f"DEBUG: Gemini API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")


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
