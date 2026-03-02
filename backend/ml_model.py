import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

MODEL = None
FEATURES = [
    "Total_Beds", "Available_Beds", "ICU_Total", "ICU_Available",
    "Ventilators_Total", "Ventilators_Available", "Staff_On_Duty",
    "Daily_Admissions", "Emergency_Admissions", "Scheduled_Admissions",
    "Bed_Occupancy_Rate", "ICU_Occupancy_Rate", "Ventilator_Utilization_Rate"
]

def load_and_train_model():
    global MODEL
    # Ensure raw string for Windows path
    csv_path = r"c:\Users\annal\Downloads\hospital_resource_shortage_dataset_1000_rows_cleaned.csv"
    if not os.path.exists(csv_path):
        print(f"Dataset not found at {csv_path}")
        return False
        
    try:
        df = pd.read_csv(csv_path)
        # Drop rows with missing values
        df = df.dropna(subset=FEATURES + ["Resource_Shortage_Flag"])
        
        X = df[FEATURES]
        y = df["Resource_Shortage_Flag"]
        
        MODEL = RandomForestClassifier(n_estimators=100, random_state=42)
        MODEL.fit(X, y)
        print("MedGuard ML Model: Integrated and trained successfully.")
        return True
    except Exception as e:
        print(f"MedGuard ML Model Error: {e}")
        return False

def predict_shortage(data: dict):
    if MODEL is None:
        # Fallback if model failed to load
        return {"shortage_predicted": False, "shortage_probability": 0.0, "status": "model_not_loaded"}
        
    try:
        df = pd.DataFrame([data])
        # Reindex just to be safe if some columns are omitted but handle gracefully
        missing_cols = [col for col in FEATURES if col not in df.columns]
        for c in missing_cols:
            df[c] = 0 # Impute missing columns
        
        df = df[FEATURES]
        prediction = MODEL.predict(df)[0]
        probability = MODEL.predict_proba(df)[0][1]
        
        return {
            "shortage_predicted": bool(prediction),
            "shortage_probability": float(probability),
            "status": "success"
        }
    except Exception as e:
        return {"shortage_predicted": False, "shortage_probability": 0.0, "status": f"error: {str(e)}"}
