from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta
import random

app = FastAPI()

# ================= CORS =================
origins = [
    "https://medi-gaurd.vercel.app",
    "http://localhost:5173",  # for local testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= LOAD DATA =================
def load_data():
    df = pd.read_csv("hospital_resource_shortage_dataset_1000_rows_cleaned.csv")
    df["Date"] = pd.to_datetime(df["Date"])
    return df

data = load_data()

# ================= REQUEST MODEL =================
class Scenario(BaseModel):
    bed: float
    icu: float
    vent: float
    em: float

# ================= ROOT =================
@app.get("/")
def home():
    return {"message": "Backend running 🚀"}

# ================= TREND =================
@app.get("/trend")
def get_trend():
    trend = []

    for _, row in data.iterrows():
        beds = float(row["Bed_Occupancy_Rate"])
        icu = float(row["ICU_Occupancy_Rate"])

        if "Ventilator_Utilization_Rate" in data.columns:
            vent = float(row["Ventilator_Utilization_Rate"])
        else:
            total = float(row.get("Ventilators_Total", 0))
            available = float(row.get("Ventilators_Available", 0))
            vent = ((total - available) / total) * 100 if total > 0 else 0

        trend.append({
            "day": row["Date"].strftime("%Y-%m-%d"),
            "beds": beds,
            "icu": icu,
            "ventilator": vent
        })

    return trend

# ================= CALCULATE HSI =================
@app.post("/calculate")
def calculate_hsi(data_input: Scenario):
    hsi = (
        0.35 * data_input.bed +
        0.25 * data_input.icu +
        0.20 * data_input.vent +
        0.20 * data_input.em
    )

    return {"hsi": round(hsi, 2)}

# ================= FORECAST =================
@app.get("/forecast")
def forecast():
    last_beds = 70
    last_icu = 65
    last_vent = 60

    future = []

    for i in range(1, 6):
        future_date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")

        beds = min(100, last_beds + random.randint(1, 4))
        icu = min(100, last_icu + random.randint(1, 3))
        ventilator = min(100, last_vent + random.randint(1, 2))

        hsi = round(0.35*beds + 0.25*icu + 0.2*ventilator + 0.2*50, 2)

        if hsi > 85:
            risk = "CRITICAL"
        elif hsi > 70:
            risk = "HIGH"
        else:
            risk = "NORMAL"

        future.append({
            "ds": future_date,
            "beds": beds,
            "icu": icu,
            "ventilator": ventilator,
            "yhat": hsi,
            "Risk_Level": risk
        })

    return future